import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./authHelpers";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) return null;

    const storyIdentity = await ctx.db
      .query("storyIdentities")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!storyIdentity) return null;

    const experiences = await ctx.db
      .query("experiences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const pillars = await ctx.db
      .query("storyPillars")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      ...storyIdentity,
      experiences,
      pillars,
    };
  },
});

// CRUD for experiences
export const addExperience = mutation({
  args: {
    name: v.string(),
    tags: v.array(v.string()),
    description: v.optional(v.string()),
    storyPillar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    return await ctx.db.insert("experiences", {
      userId,
      name: args.name,
      tags: args.tags,
      description: args.description,
      storyPillar: args.storyPillar,
    });
  },
});

export const updateExperience = mutation({
  args: {
    id: v.id("experiences"),
    name: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    storyPillar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getUserId(ctx);
    const { id, ...updates } = args;
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filtered[key] = value;
      }
    }
    await ctx.db.patch(id, filtered);
  },
});

export const removeExperience = mutation({
  args: { id: v.id("experiences") },
  handler: async (ctx, args) => {
    await getUserId(ctx);
    await ctx.db.delete(args.id);
  },
});

// CRUD for pillars
export const addPillar = mutation({
  args: {
    theme: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    return await ctx.db.insert("storyPillars", {
      userId,
      theme: args.theme,
      description: args.description,
    });
  },
});

export const updatePillar = mutation({
  args: {
    id: v.id("storyPillars"),
    theme: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getUserId(ctx);
    const { id, ...updates } = args;
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filtered[key] = value;
      }
    }
    await ctx.db.patch(id, filtered);
  },
});

export const removePillar = mutation({
  args: { id: v.id("storyPillars") },
  handler: async (ctx, args) => {
    await getUserId(ctx);
    await ctx.db.delete(args.id);
  },
});

// Update story identity fields
export const updateIdentity = mutation({
  args: {
    voiceTone: v.optional(v.string()),
    voiceStyle: v.optional(v.string()),
    writingReminders: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const identity = await ctx.db
      .query("storyIdentities")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!identity) throw new Error("No story identity found");

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }
    await ctx.db.patch(identity._id, updates);
  },
});
