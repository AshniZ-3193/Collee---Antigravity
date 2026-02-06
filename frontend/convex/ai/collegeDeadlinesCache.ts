import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const getCached = query({
  args: {
    collegeName: v.string(),
    applicationYear: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cachedCollegeDeadlines")
      .withIndex("by_college_year", (q) =>
        q.eq("collegeName", args.collegeName).eq("applicationYear", args.applicationYear)
      )
      .unique();
  },
});

export const listAll = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 1000, 1), 5000);
    const docs = await ctx.db.query("cachedCollegeDeadlines").collect();
    return docs.slice(0, limit);
  },
});

export const saveCache = mutation({
  args: {
    collegeName: v.string(),
    applicationYear: v.string(),
    applicationTypes: v.array(
      v.object({
        label: v.string(),
        deadline: v.string(),
        value: v.optional(v.string()),
      })
    ),
    cachedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("cachedCollegeDeadlines")
      .withIndex("by_college_year", (q) =>
        q.eq("collegeName", args.collegeName).eq("applicationYear", args.applicationYear)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return await ctx.db.insert("cachedCollegeDeadlines", args);
  },
});
