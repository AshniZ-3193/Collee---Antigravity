"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import OpenAI from "openai";
import { STORY_IDENTITY_SYSTEM_PROMPT } from "./prompts";

export const generate = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get user
    const user = await ctx.runQuery(api.users.getByToken, {
      tokenIdentifier: identity.tokenIdentifier,
    });
    if (!user) throw new Error("User not found");

    // Get profile
    const profile = await ctx.runQuery(api.userProfile.get);
    if (!profile) throw new Error("No profile found - complete onboarding first");

    // Build context
    const userContext = `
ACTIVITIES & COMMITMENTS:
${profile.activitiesText || "Not provided"}

ACADEMIC INTERESTS:
Primary: ${profile.primaryInterests?.join(", ") || "Not provided"}
Secondary: ${profile.secondaryInterest || "Not provided"}

HOW THEY THINK:
Orientation: ${profile.orientation?.join(", ") || "Not provided"}
Motivation: ${profile.motivation?.join(", ") || "Not provided"}
Story Preference: ${profile.storyPreference?.join(", ") || "Not provided"}
Social Role: ${profile.socialRole?.join(", ") || "Not provided"}

WRITING TONE: ${profile.writingTone || "Not provided"}

IDENTITY:
Aspects: ${profile.identityAspects?.join(", ") || "Not provided"}
Handling: ${profile.identityHandling || "Not provided"}

REFLECTION:
${profile.reflection || "Not provided"}
    `.trim();

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2-mini",
      messages: [
        { role: "system", content: STORY_IDENTITY_SYSTEM_PROMPT },
        { role: "user", content: userContext },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) throw new Error("No response from AI");

    const result = JSON.parse(responseText);

    // Save story identity
    await ctx.runMutation(api.ai.generateStoryIdentity.saveResults, {
      userId: user._id,
      angle: result.angle,
      distinct: result.distinct,
      voiceTone: result.voice?.tone || "Authentic",
      voiceStyle: result.voice?.style || "",
      cautions: result.cautions || [],
      writingReminders: result.writingReminders || [],
      pillars: result.pillars || [],
      experiences: result.experiences || [],
    });

    return result;
  },
});

export const saveResults = action({
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
    // Use internal mutations to save data
    await ctx.runMutation(api.ai.generateStoryIdentity.saveIdentityData, {
      userId: args.userId,
      angle: args.angle,
      distinct: args.distinct,
      voiceTone: args.voiceTone,
      voiceStyle: args.voiceStyle,
      cautions: args.cautions,
      writingReminders: args.writingReminders,
      pillars: args.pillars,
      experiences: args.experiences,
    });
  },
});

import { mutation } from "../_generated/server";

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
