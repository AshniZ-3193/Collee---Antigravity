"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { ESSAY_FEEDBACK_SYSTEM_PROMPT } from "./prompts";
import { getAuthenticatedUser, createOpenAIClient, AI_MODEL } from "./aiHelpers";
import { stripRichTextFormatting } from "../richTextHelpers";

export const generate = action({
  args: {
    essayId: v.id("essays"),
    feedbackType: v.string(), // 'overall' | 'opening' | 'structure' | 'voice' | 'specificity'
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Get essay and prompt
    const essay = await ctx.runQuery(api.essays.get, { essayId: args.essayId });
    if (!essay) throw new Error("Essay not found");
    const colleges = await ctx.runQuery(api.colleges.list, { userId: user._id });
    const promptMatch = colleges
      ?.flatMap((college: any) =>
        (college.prompts || []).map((prompt: any) => ({
          ...prompt,
          collegeName: college.name,
        }))
      )
      .find((prompt: any) => prompt._id === essay.promptId);

    const storyIdentity = await ctx.runQuery(api.storyIdentity.get, {
      userId: user._id,
    });
    const plainEssayContent = stripRichTextFormatting(essay.content || "");

    const context = `
ESSAY CONTENT:
${plainEssayContent}

PROMPT (anchor all feedback to this exact prompt):
${promptMatch?.text || "N/A"}

WORD LIMIT:
${promptMatch?.wordCountMax ?? "N/A"}

COLLEGE:
${promptMatch?.collegeName || "N/A"}

FEEDBACK TYPE REQUESTED: ${args.feedbackType}

STUDENT'S VOICE PROFILE:
Tone: ${storyIdentity?.voiceTone || "N/A"}
Style: ${storyIdentity?.voiceStyle || "N/A"}
Writing Reminders: ${storyIdentity?.writingReminders?.join("; ") || "N/A"}

STUDENT'S STORY ANGLE: ${storyIdentity?.angle || "N/A"}
    `.trim();

    const openai = createOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: ESSAY_FEEDBACK_SYSTEM_PROMPT },
        { role: "user", content: context },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
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
