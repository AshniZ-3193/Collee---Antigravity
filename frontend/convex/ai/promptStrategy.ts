import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const saveStrategy = mutation({
  args: {
    userId: v.id("users"),
    promptId: v.id("prompts"),
    approach: v.string(),
    experienceMatches: v.array(v.object({
      experienceId: v.id("experiences"),
      experienceName: v.string(),
      matchStrength: v.string(),
      whyItFits: v.string(),
      framingTips: v.array(v.string()),
      caution: v.optional(v.string()),
      startWith: v.optional(v.string()),
      focusOn: v.optional(v.string()),
      avoidFocus: v.optional(v.string()),
      starterSentences: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    // Delete existing strategy for this prompt
    const existing = await ctx.db
      .query("promptStrategies")
      .withIndex("by_prompt", (q) => q.eq("promptId", args.promptId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return await ctx.db.insert("promptStrategies", args);
  },
});

export const getForPrompt = query({
  args: { promptId: v.id("prompts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("promptStrategies")
      .withIndex("by_prompt", (q) => q.eq("promptId", args.promptId))
      .unique();
  },
});
