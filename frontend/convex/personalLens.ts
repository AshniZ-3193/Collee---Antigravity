import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./authHelpers";

export const list = query({
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
      .query("personalLensNotes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    content: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    return await ctx.db.insert("personalLensNotes", {
      userId,
      content: args.content,
      category: args.category,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("personalLensNotes"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await getUserId(ctx);
    await ctx.db.patch(args.id, { content: args.content });
  },
});

export const remove = mutation({
  args: { id: v.id("personalLensNotes") },
  handler: async (ctx, args) => {
    await getUserId(ctx);
    await ctx.db.delete(args.id);
  },
});
