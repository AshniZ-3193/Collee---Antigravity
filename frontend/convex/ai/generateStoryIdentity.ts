"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { STORY_IDENTITY_SYSTEM_PROMPT } from "./prompts";
import { getAuthenticatedUser, createOpenAIClient, AI_MODEL } from "./aiHelpers";

export const generate = action({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    // Get profile
    const profile = await ctx.runQuery(api.userProfile.get, {
      userId: user._id,
    });
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
Handling Preferences:
${profile.identityHandling?.map((h: { aspect: string; handling: string }) => `- ${h.aspect}: ${h.handling}`).join("\n") || "Not provided"}

REFLECTION:
${profile.reflection || "Not provided"}
    `.trim();

    const openai = createOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
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

    // Save story identity using saveResults action first
    await ctx.runAction(api.ai.generateStoryIdentity.saveResults, {
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
    // Use separate non-Node.js file for the mutation
    await ctx.runMutation(api.ai.storyIdentityData.saveIdentityData, {
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
