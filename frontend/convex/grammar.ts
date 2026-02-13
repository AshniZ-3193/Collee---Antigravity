import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./authHelpers";

const dialectValidator = v.union(
  v.literal("American"),
  v.literal("British"),
  v.literal("Australian"),
  v.literal("Canadian"),
  v.literal("Indian"),
);

export const getPreferences = query({
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

    return await ctx.db
      .query("grammarPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

export const addToDictionary = mutation({
  args: { word: v.string() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db
      .query("grammarPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      if (existing.customDictionary.includes(args.word)) return;
      await ctx.db.patch(existing._id, {
        customDictionary: [...existing.customDictionary, args.word],
      });
    } else {
      await ctx.db.insert("grammarPreferences", {
        userId,
        customDictionary: [args.word],
        ignoredRules: [],
        ignoredLintHashes: [],
      });
    }
  },
});

export const removeFromDictionary = mutation({
  args: { word: v.string() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db
      .query("grammarPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        customDictionary: existing.customDictionary.filter((w) => w !== args.word),
      });
    }
  },
});

export const ignoreRule = mutation({
  args: { rule: v.string() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db
      .query("grammarPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      if (existing.ignoredRules.includes(args.rule)) return;
      await ctx.db.patch(existing._id, {
        ignoredRules: [...existing.ignoredRules, args.rule],
      });
    } else {
      await ctx.db.insert("grammarPreferences", {
        userId,
        customDictionary: [],
        ignoredRules: [args.rule],
        ignoredLintHashes: [],
      });
    }
  },
});

export const ignoreLintHash = mutation({
  args: { hash: v.string() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db
      .query("grammarPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      const existingHashes = existing.ignoredLintHashes ?? [];
      if (existingHashes.includes(args.hash)) return;
      await ctx.db.patch(existing._id, {
        ignoredLintHashes: [...existingHashes, args.hash],
      });
      return;
    }

    await ctx.db.insert("grammarPreferences", {
      userId,
      customDictionary: [],
      ignoredRules: [],
      ignoredLintHashes: [args.hash],
    });
  },
});

export const updateSettings = mutation({
  args: {
    dialect: v.optional(dialectValidator),
    lintConfigJson: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db
      .query("grammarPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const patch: { dialect?: string; lintConfigJson?: string } = {};
    if (args.dialect !== undefined) {
      patch.dialect = args.dialect;
    }
    if (args.lintConfigJson !== undefined) {
      patch.lintConfigJson = args.lintConfigJson;
    }

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return;
    }

    await ctx.db.insert("grammarPreferences", {
      userId,
      customDictionary: [],
      ignoredRules: [],
      ignoredLintHashes: [],
      ...patch,
    });
  },
});
