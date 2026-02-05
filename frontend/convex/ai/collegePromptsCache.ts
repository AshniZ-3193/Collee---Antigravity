import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const getCached = query({
  args: {
    collegeName: v.string(),
    applicationYear: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cachedCollegePrompts")
      .withIndex("by_college_year", (q) =>
        q.eq("collegeName", args.collegeName).eq("applicationYear", args.applicationYear)
      )
      .unique();
  },
});

export const saveCache = mutation({
  args: {
    collegeName: v.string(),
    applicationYear: v.string(),
    prompts: v.array(v.object({
      text: v.string(),
      wordCountMax: v.number(),
      isOptional: v.boolean(),
      promptType: v.optional(v.string()),
      targetProgram: v.optional(v.string()),
      relevantMajors: v.optional(v.array(v.string())),
    })),
    cachedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Remove old cache for this college/year
    const existing = await ctx.db
      .query("cachedCollegePrompts")
      .withIndex("by_college_year", (q) =>
        q.eq("collegeName", args.collegeName).eq("applicationYear", args.applicationYear)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return await ctx.db.insert("cachedCollegePrompts", args);
  },
});
