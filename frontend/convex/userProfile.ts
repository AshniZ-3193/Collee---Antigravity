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

    return await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

export const saveOnboardingStep = mutation({
  args: {
    activitiesText: v.optional(v.string()),
    primaryInterests: v.optional(v.array(v.string())),
    secondaryInterest: v.optional(v.string()),
    orientation: v.optional(v.array(v.string())),
    motivation: v.optional(v.array(v.string())),
    storyPreference: v.optional(v.array(v.string())),
    socialRole: v.optional(v.array(v.string())),
    writingTone: v.optional(v.string()),
    identityAspects: v.optional(v.array(v.string())),
    identityHandling: v.optional(v.string()),
    reflection: v.optional(v.string()),
    onboardingComplete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    // Filter out undefined values
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      return await ctx.db.insert("userProfiles", {
        userId,
        ...updates,
      } as any);
    }
  },
});
