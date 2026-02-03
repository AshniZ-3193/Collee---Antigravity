"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import OpenAI from "openai";
import { ESSAY_FEEDBACK_SYSTEM_PROMPT } from "./prompts";

export const generate = action({
  args: {
    essayId: v.id("essays"),
    feedbackType: v.string(), // 'overall' | 'opening' | 'structure' | 'voice' | 'specificity'
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.runQuery(api.users.getByToken, {
      tokenIdentifier: identity.tokenIdentifier,
    });
    if (!user) throw new Error("User not found");

    // Get essay and prompt
    const essay = await ctx.runQuery(api.essays.get, { essayId: args.essayId });
    if (!essay) throw new Error("Essay not found");

    const storyIdentity = await ctx.runQuery(api.storyIdentity.get, {
      userId: user._id,
    });

    const context = `
ESSAY CONTENT:
${essay.content}

FEEDBACK TYPE REQUESTED: ${args.feedbackType}

STUDENT'S VOICE PROFILE:
Tone: ${storyIdentity?.voiceTone || "N/A"}
Style: ${storyIdentity?.voiceStyle || "N/A"}
Writing Reminders: ${storyIdentity?.writingReminders?.join("; ") || "N/A"}

STUDENT'S STORY ANGLE: ${storyIdentity?.angle || "N/A"}
    `.trim();

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        { role: "system", content: ESSAY_FEEDBACK_SYSTEM_PROMPT },
        { role: "user", content: context },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) throw new Error("No response from AI");

    const result = JSON.parse(responseText);

    // Save feedback
    await ctx.runMutation(api.ai.essayFeedback.saveFeedback, {
      userId: user._id,
      essayId: args.essayId,
      feedbackType: args.feedbackType,
      feedback: responseText,
      timestamp: Date.now(),
    });

    return result;
  },
});
