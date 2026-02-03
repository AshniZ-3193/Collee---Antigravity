import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const saveSuggestion = mutation({
  args: {
    userId: v.id("users"),
    promptId: v.id("prompts"),
    experienceName: v.string(),
    storyPillar: v.optional(v.string()),
    matchStrength: v.string(),
    whyItFitsThisPrompt: v.string(),
    framingGuidance: v.array(v.string()),
    startWith: v.optional(v.string()),
    focusOn: v.optional(v.string()),
    avoidFocus: v.optional(v.string()),
    starterSentences: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("storySuggestions", args);
  },
});
