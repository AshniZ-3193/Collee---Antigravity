"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { PROMPT_STRATEGY_SYSTEM_PROMPT } from "./prompts";
import { getAuthenticatedUser, createOpenAIClient, AI_MODEL, getUserNotesContext } from "./aiHelpers";

export const generate = action({
  args: {
    promptId: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const storyIdentity = await ctx.runQuery(api.storyIdentity.get, {
      userId: user._id,
    });
    const notesContext = await getUserNotesContext(ctx, user._id);
    const colleges = await ctx.runQuery(api.colleges.list, {
      userId: user._id,
    });

    // Find the prompt
    const allPrompts = colleges?.flatMap((c: any) => c.prompts) || [];
    const currentPrompt = allPrompts.find((p: any) => p._id === args.promptId);
    if (!currentPrompt) throw new Error("Prompt not found");

    const context = `
ESSAY PROMPT: ${currentPrompt.text}

STUDENT'S EXPERIENCES:
${storyIdentity?.experiences?.map((e: any) => `- ${e.name} (ID: ${e._id}, tags: ${e.tags.join(", ")})`).join("\n") || "None"}

STORY PILLARS:
${storyIdentity?.pillars?.map((p: any) => `- ${p.theme}: ${p.description || ""}`).join("\n") || "None"}

VOICE PROFILE:
Tone: ${storyIdentity?.voiceTone || "N/A"}
Style: ${storyIdentity?.voiceStyle || "N/A"}

USER NOTES CONTEXT:
${notesContext}
    `.trim();

    const openai = createOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: PROMPT_STRATEGY_SYSTEM_PROMPT },
        { role: "user", content: context },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) throw new Error("No response from AI");

    const result = JSON.parse(responseText);

    // Map experience names to IDs where possible
    const experienceMatches = (result.experienceMatches || []).map((match: any) => {
      const exp = storyIdentity?.experiences?.find(
        (e: any) => e._id === match.experienceId || e.name === match.experienceName
      );
      return {
        experienceId: exp?._id || match.experienceId,
        experienceName: match.experienceName || exp?.name || "Unknown",
        matchStrength: match.matchStrength || "moderate",
        whyItFits: match.whyItFits || "",
        framingTips: match.framingTips || [],
        caution: match.caution,
        startWith: match.startWith,
        focusOn: match.focusOn,
        avoidFocus: match.avoidFocus,
        starterSentences: match.starterSentences,
      };
    });

    // Save strategy using the separate promptStrategy file
    await ctx.runMutation(api.ai.promptStrategy.saveStrategy, {
      userId: user._id,
      promptId: args.promptId,
      approach: result.approach || "",
      experienceMatches,
    });

    return result;
  },
});
