import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./authHelpers";
import { extractThemes } from "./experienceBankHelpers";

export const getUsages = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) return [];

    return await ctx.db
      .query("experienceUsages")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const addUsage = mutation({
  args: {
    experienceId: v.id("experiences"),
    essayId: v.id("essays"),
    collegeId: v.id("colleges"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    return await ctx.db.insert("experienceUsages", {
      userId,
      experienceId: args.experienceId,
      essayId: args.essayId,
      collegeId: args.collegeId,
    });
  },
});

export const removeUsage = mutation({
  args: { id: v.id("experienceUsages") },
  handler: async (ctx, args) => {
    await getUserId(ctx);
    await ctx.db.delete(args.id);
  },
});

export const getExcerpts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) return [];

    return await ctx.db
      .query("essayExcerpts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const getReuseSuggestions = query({
  args: { essayId: v.id("essays") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) return [];

    const targetEssay = await ctx.db.get(args.essayId);
    if (!targetEssay || targetEssay.userId !== user._id) return [];

    const targetPrompt = await ctx.db.get(targetEssay.promptId);
    const targetPromptType = targetPrompt?.promptType;
    const targetThemes = new Set(
      extractThemes(`${targetPrompt?.text ?? ""} ${targetPromptType ?? ""}`)
    );
    if (targetPromptType) targetThemes.add(targetPromptType);
    const normalizedTargetThemes = new Set(
      Array.from(targetThemes).map((theme) => theme.toLowerCase())
    );

    const excerpts = await ctx.db
      .query("essayExcerpts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const otherExcerpts = excerpts.filter(
      (excerpt) => excerpt.essayId !== args.essayId
    );

    const essayIds = Array.from(
      new Set(otherExcerpts.map((excerpt) => excerpt.essayId))
    );
    const essays = await Promise.all(essayIds.map((id) => ctx.db.get(id)));
    const essayMap = new Map(
      essays.filter(Boolean).map((essay) => [essay!._id, essay!])
    );

    const collegeIds = Array.from(
      new Set(essays.filter(Boolean).map((essay) => essay!.collegeId))
    );
    const colleges = await Promise.all(collegeIds.map((id) => ctx.db.get(id)));
    const collegeMap = new Map(
      colleges.filter(Boolean).map((college) => [college!._id, college!])
    );

    const promptIds = Array.from(
      new Set(essays.filter(Boolean).map((essay) => essay!.promptId))
    );
    const prompts = await Promise.all(promptIds.map((id) => ctx.db.get(id)));
    const promptMap = new Map(
      prompts.filter(Boolean).map((prompt) => [prompt!._id, prompt!])
    );

    const suggestions = otherExcerpts
      .map((excerpt) => {
        const sourceEssay = essayMap.get(excerpt.essayId);
        if (!sourceEssay) return null;
        if (sourceEssay.collegeId === targetEssay.collegeId) return null;

        const overlapThemes = excerpt.themes.filter((theme) =>
          normalizedTargetThemes.has(theme.toLowerCase())
        );
        const matchesSamePromptType =
          !!targetPromptType && excerpt.promptType === targetPromptType;
        if (!matchesSamePromptType && overlapThemes.length === 0) return null;

        const sourceCollege = collegeMap.get(sourceEssay.collegeId);
        const sourcePrompt = promptMap.get(sourceEssay.promptId);
        const sourceEssayTitle = sourcePrompt?.text
          ? sourcePrompt.text.length > 60
            ? `${sourcePrompt.text.substring(0, 60)}...`
            : sourcePrompt.text
          : "Essay";

        return {
          excerptId: excerpt._id,
          excerpt: excerpt.excerpt,
          themes: excerpt.themes,
          promptType: excerpt.promptType,
          overlapThemes,
          matchesSamePromptType,
          sourceEssayId: sourceEssay._id,
          sourceCollegeId: sourceEssay.collegeId,
          sourceCollegeName: sourceCollege?.name ?? "Unknown College",
          sourceEssayTitle,
        };
      })
      .filter(Boolean);

    suggestions.sort((a, b) => {
      if (!a || !b) return 0;
      if (a.matchesSamePromptType && !b.matchesSamePromptType) return -1;
      if (!a.matchesSamePromptType && b.matchesSamePromptType) return 1;
      if (a.overlapThemes.length !== b.overlapThemes.length) {
        return b.overlapThemes.length - a.overlapThemes.length;
      }
      return 0;
    });

    return suggestions;
  },
});

export const addExcerpt = mutation({
  args: {
    essayId: v.id("essays"),
    collegeId: v.id("colleges"),
    excerpt: v.string(),
    themes: v.array(v.string()),
    promptType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    return await ctx.db.insert("essayExcerpts", {
      userId,
      essayId: args.essayId,
      collegeId: args.collegeId,
      excerpt: args.excerpt,
      themes: args.themes,
      promptType: args.promptType,
    });
  },
});
