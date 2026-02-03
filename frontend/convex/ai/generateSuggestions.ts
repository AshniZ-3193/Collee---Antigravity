"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { SUGGESTION_SYSTEM_PROMPT } from "./prompts";
import { getAuthenticatedUser, createOpenAIClient, AI_MODEL } from "./aiHelpers";

export const generate = action({
  args: {
    promptId: v.id("prompts"),
    essayContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Gather full user context
    const profile = await ctx.runQuery(api.userProfile.get, {
      userId: user._id,
    });
    const storyIdentity = await ctx.runQuery(api.storyIdentity.get, {
      userId: user._id,
    });
    const lensNotes = await ctx.runQuery(api.personalLens.list, {
      userId: user._id,
    });
    const colleges = await ctx.runQuery(api.colleges.list, {
      userId: user._id,
    });

    // Build context string
    const context = `
STUDENT PROFILE:
${profile ? `
Activities: ${profile.activitiesText || "N/A"}
Interests: ${profile.primaryInterests?.join(", ") || "N/A"}
Writing Tone: ${profile.writingTone || "N/A"}
` : "No profile"}

STORY IDENTITY:
${storyIdentity ? `
Angle: ${storyIdentity.angle}
Distinct: ${storyIdentity.distinct}
Voice: ${storyIdentity.voiceTone} - ${storyIdentity.voiceStyle}
` : "No story identity"}

EXPERIENCES:
${storyIdentity?.experiences?.map((e: any) => `- ${e.name} (tags: ${e.tags.join(", ")})`).join("\n") || "None"}

STORY PILLARS:
${storyIdentity?.pillars?.map((p: any) => `- ${p.theme}`).join("\n") || "None"}

PERSONAL LENS NOTES:
${lensNotes?.map((n: any) => `- [${n.category}] ${n.content}`).join("\n") || "None"}

OTHER ESSAYS (for overlap awareness):
${colleges?.flatMap((c: any) =>
  c.prompts
    .filter((p: any) => p.essay?.content && p.essay.content.length > 50)
    .map((p: any) => `- ${c.name}: "${p.text.substring(0, 80)}..." (${p.essay.wordCount} words)`)
).join("\n") || "None written yet"}
    `.trim();

    // Get the specific prompt text
    const allPrompts = colleges?.flatMap((c: any) => c.prompts) || [];
    const currentPrompt = allPrompts.find((p: any) => p._id === args.promptId);
    const promptText = currentPrompt?.text || "General essay prompt";

    const openai = createOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: SUGGESTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: `ESSAY PROMPT: ${promptText}\n\nCURRENT ESSAY CONTENT: ${args.essayContent || "(not started)"}\n\n${context}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) throw new Error("No response from AI");

    const result = JSON.parse(responseText);

    // Save suggestions to database (using separate non-Node.js file)
    const suggestions = result.suggestions || [];
    for (const suggestion of suggestions) {
      await ctx.runMutation(api.ai.suggestions.saveSuggestion, {
        userId: user._id,
        promptId: args.promptId,
        experienceName: suggestion.experienceName || "General",
        storyPillar: suggestion.storyPillar,
        matchStrength: suggestion.matchStrength || "moderate",
        whyItFitsThisPrompt: suggestion.whyItFitsThisPrompt || "",
        framingGuidance: suggestion.framingGuidance || [],
        startWith: suggestion.startWith,
        focusOn: suggestion.focusOn,
        avoidFocus: suggestion.avoidFocus,
        starterSentences: suggestion.starterSentences,
      });
    }

    return result;
  },
});
