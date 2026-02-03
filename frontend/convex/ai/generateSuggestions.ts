"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import OpenAI from "openai";
import { SUGGESTION_SYSTEM_PROMPT } from "./prompts";

export const generate = action({
  args: {
    promptId: v.id("prompts"),
    essayContent: v.optional(v.string()),
  },
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.runQuery(api.users.getByToken, {
      tokenIdentifier: identity.tokenIdentifier,
    });
    if (!user) throw new Error("User not found");

    // Gather full user context
    const profile = await ctx.runQuery(api.userProfile.get);
    const storyIdentity = await ctx.runQuery(api.storyIdentity.get);
    const lensNotes = await ctx.runQuery(api.personalLens.list);
    const colleges = await ctx.runQuery(api.colleges.list);

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
    const currentPrompt = allPrompts.find((p: any) => p._id === ctx._args.promptId);
    const promptText = currentPrompt?.text || "General essay prompt";

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2-mini",
      messages: [
        { role: "system", content: SUGGESTION_SYSTEM_PROMPT },
        {
          role: "user",
          content: `ESSAY PROMPT: ${promptText}\n\nCURRENT ESSAY CONTENT: ${ctx._args.essayContent || "(not started)"}\n\n${context}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) throw new Error("No response from AI");

    const result = JSON.parse(responseText);

    // Save suggestions to database
    const suggestions = result.suggestions || [];
    for (const suggestion of suggestions) {
      await ctx.runMutation(api.ai.generateSuggestions.saveSuggestion, {
        userId: user._id,
        promptId: ctx._args.promptId,
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

import { mutation } from "../_generated/server";

export const saveSuggestion = mutation({
  args: {
    userId: v.id("users"),
    promptId: v.id("prompts"),
    experienceName: v.string(),
    storyPillar: v.optional(v.string()),
    matchStrength: v.string(),
    whyItFitsThisPrompt: v.string(),
    framingGuidance: v.array(v.string()),
    startWith: v.optional(v.string()),
    focusOn: v.optional(v.string()),
    avoidFocus: v.optional(v.string()),
    starterSentences: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("storySuggestions", args);
  },
});
