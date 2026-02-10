import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./authHelpers";

export const list = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let userId = args.userId;

    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return [];

      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();
      if (!user) return [];

      userId = user._id;
    }

    const colleges = await ctx.db
      .query("colleges")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // For each college, fetch prompts and essays
    const result = await Promise.all(
      colleges.map(async (college) => {
        const prompts = await ctx.db
          .query("prompts")
          .withIndex("by_college", (q) => q.eq("collegeId", college._id))
          .collect();

        const promptsWithEssays = await Promise.all(
          prompts.map(async (prompt) => {
            const essay = await ctx.db
              .query("essays")
              .withIndex("by_prompt", (q) => q.eq("promptId", prompt._id))
              .unique();

            return {
              ...prompt,
              essay: essay ?? {
                _id: null,
                content: "",
                status: "not-started",
                wordCount: 0,
                lastUpdated: Date.now(),
              },
            };
          })
        );

        return {
          ...college,
          prompts: promptsWithEssays,
        };
      })
    );

    return result;
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    schoolSlug: v.optional(v.string()),
    applicationType: v.optional(v.string()),
    deadline: v.optional(v.string()),
    sourceQualityStatus: v.optional(v.string()),
    sourceQualityScore: v.optional(v.number()),
    sourceVerifiedAt: v.optional(v.number()),
    prompts: v.array(
      v.object({
        text: v.string(),
        wordCountMax: v.number(),
        isOptional: v.boolean(),
        promptType: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    // Create college
    const collegeId = await ctx.db.insert("colleges", {
      userId,
      name: args.name,
      schoolSlug: args.schoolSlug,
      applicationType: args.applicationType,
      deadline: args.deadline,
      sourceQualityStatus: args.sourceQualityStatus,
      sourceQualityScore: args.sourceQualityScore,
      sourceVerifiedAt: args.sourceVerifiedAt,
    });

    // Create prompts and empty essays
    for (const prompt of args.prompts) {
      const promptId = await ctx.db.insert("prompts", {
        userId,
        collegeId,
        text: prompt.text,
        wordCountMax: prompt.wordCountMax,
        isOptional: prompt.isOptional,
        promptType: prompt.promptType,
      });

      await ctx.db.insert("essays", {
        userId,
        promptId,
        collegeId,
        content: "",
        status: "not-started",
        wordCount: 0,
        lastUpdated: Date.now(),
        syncGeneration: 0,
      });
    }

    return collegeId;
  },
});

export const remove = mutation({
  args: { id: v.id("colleges") },
  handler: async (ctx, args) => {
    await getUserId(ctx);

    // Delete all essays for this college
    const essays = await ctx.db
      .query("essays")
      .withIndex("by_college", (q) => q.eq("collegeId", args.id))
      .collect();
    for (const essay of essays) {
      // Delete versions
      const versions = await ctx.db
        .query("essayVersions")
        .withIndex("by_essay", (q) => q.eq("essayId", essay._id))
        .collect();
      for (const version of versions) {
        await ctx.db.delete(version._id);
      }
      // Delete excerpts
      const excerpts = await ctx.db
        .query("essayExcerpts")
        .withIndex("by_essay", (q) => q.eq("essayId", essay._id))
        .collect();
      for (const excerpt of excerpts) {
        await ctx.db.delete(excerpt._id);
      }
      // Delete experience usages
      const usages = await ctx.db
        .query("experienceUsages")
        .withIndex("by_essay", (q) => q.eq("essayId", essay._id))
        .collect();
      for (const usage of usages) {
        await ctx.db.delete(usage._id);
      }
      // Delete feedback
      const feedback = await ctx.db
        .query("essayFeedback")
        .withIndex("by_essay", (q) => q.eq("essayId", essay._id))
        .collect();
      for (const fb of feedback) {
        await ctx.db.delete(fb._id);
      }
      await ctx.db.delete(essay._id);
    }

    // Delete prompts
    const prompts = await ctx.db
      .query("prompts")
      .withIndex("by_college", (q) => q.eq("collegeId", args.id))
      .collect();
    for (const prompt of prompts) {
      // Delete strategies
      const strategies = await ctx.db
        .query("promptStrategies")
        .withIndex("by_prompt", (q) => q.eq("promptId", prompt._id))
        .collect();
      for (const strategy of strategies) {
        await ctx.db.delete(strategy._id);
      }
      // Delete suggestions
      const suggestions = await ctx.db
        .query("storySuggestions")
        .withIndex("by_prompt", (q) => q.eq("promptId", prompt._id))
        .collect();
      for (const suggestion of suggestions) {
        await ctx.db.delete(suggestion._id);
      }
      await ctx.db.delete(prompt._id);
    }

    // Delete college
    await ctx.db.delete(args.id);
  },
});

export const updatePrompt = mutation({
  args: {
    promptId: v.id("prompts"),
    text: v.string(),
    wordCountMax: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    const prompt = await ctx.db.get(args.promptId);
    if (!prompt || prompt.userId !== userId) {
      throw new Error("Prompt not found");
    }

    const nextText = args.text.trim();
    const nextWordLimit = Math.max(50, Math.floor(args.wordCountMax));
    if (!nextText) {
      throw new Error("Prompt text is required");
    }

    await ctx.db.patch(args.promptId, {
      text: nextText,
      wordCountMax: nextWordLimit,
    });

    const essay = await ctx.db
      .query("essays")
      .withIndex("by_prompt", (q) => q.eq("promptId", args.promptId))
      .unique();

    if (essay) {
      let status: "not-started" | "in-progress" | "complete" = "in-progress";
      if (essay.wordCount === 0) {
        status = "not-started";
      } else if (essay.wordCount >= nextWordLimit * 0.9) {
        status = "complete";
      }

      if (status !== essay.status) {
        await ctx.db.patch(essay._id, {
          status,
          lastUpdated: Date.now(),
        });
      }
    }

    const existingStrategy = await ctx.db
      .query("promptStrategies")
      .withIndex("by_prompt", (q) => q.eq("promptId", args.promptId))
      .unique();
    if (existingStrategy) {
      await ctx.db.delete(existingStrategy._id);
    }

    return { success: true };
  },
});
