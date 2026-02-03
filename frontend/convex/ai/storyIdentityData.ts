import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const saveIdentityData = mutation({
  args: {
    userId: v.id("users"),
    angle: v.string(),
    distinct: v.string(),
    voiceTone: v.string(),
    voiceStyle: v.string(),
    cautions: v.array(v.string()),
    writingReminders: v.array(v.string()),
    pillars: v.array(v.object({
      theme: v.string(),
      description: v.optional(v.string()),
    })),
    experiences: v.array(v.object({
      name: v.string(),
      tags: v.array(v.string()),
      description: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Delete existing story identity, experiences, pillars for this user
    const existingIdentity = await ctx.db
      .query("storyIdentities")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (existingIdentity) {
      await ctx.db.delete(existingIdentity._id);
    }

    const existingExperiences = await ctx.db
      .query("experiences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const exp of existingExperiences) {
      await ctx.db.delete(exp._id);
    }

    const existingPillars = await ctx.db
      .query("storyPillars")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const pillar of existingPillars) {
      await ctx.db.delete(pillar._id);
    }

    // Insert new story identity
    await ctx.db.insert("storyIdentities", {
      userId: args.userId,
      angle: args.angle,
      distinct: args.distinct,
      voiceTone: args.voiceTone,
      voiceStyle: args.voiceStyle,
      cautions: args.cautions,
      writingReminders: args.writingReminders,
    });

    // Insert experiences
    for (const exp of args.experiences) {
      await ctx.db.insert("experiences", {
        userId: args.userId,
        name: exp.name,
        tags: exp.tags,
        description: exp.description,
      });
    }

    // Insert pillars
    for (const pillar of args.pillars) {
      await ctx.db.insert("storyPillars", {
        userId: args.userId,
        theme: pillar.theme,
        description: pillar.description,
      });
    }
  },
});
