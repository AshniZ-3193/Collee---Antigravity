import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const saveFeedback = mutation({
  args: {
    userId: v.id("users"),
    essayId: v.id("essays"),
    feedbackType: v.string(),
    feedback: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("essayFeedback", args);
  },
});

export const getForEssay = query({
  args: { essayId: v.id("essays") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("essayFeedback")
      .withIndex("by_essay", (q) => q.eq("essayId", args.essayId))
      .order("desc")
      .collect();
  },
});
