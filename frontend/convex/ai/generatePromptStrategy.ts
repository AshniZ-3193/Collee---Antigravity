"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import OpenAI from "openai";
import { PROMPT_STRATEGY_SYSTEM_PROMPT } from "./prompts";

export const generate = action({
  args: {
    promptId: v.id("prompts"),
  },
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.runQuery(api.users.getByToken, {
      tokenIdentifier: identity.tokenIdentifier,
    });
    if (!user) throw new Error("User not found");

    const storyIdentity = await ctx.runQuery(api.storyIdentity.get);
    const colleges = await ctx.runQuery(api.colleges.list);

    // Find the prompt
    const allPrompts = colleges?.flatMap((c: any) => c.prompts) || [];
    const currentPrompt = allPrompts.find((p: any) => p._id === ctx._args.promptId);
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
    `.trim();

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2-mini",
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

    // Save strategy
    await ctx.runMutation(api.ai.generatePromptStrategy.saveStrategy, {
      userId: user._id,
      promptId: ctx._args.promptId,
      approach: result.approach || "",
      experienceMatches,
    });

    return result;
  },
});

import { mutation, query } from "../_generated/server";

export const saveStrategy = mutation({
  args: {
    userId: v.id("users"),
    promptId: v.id("prompts"),
    approach: v.string(),
    experienceMatches: v.array(v.object({
      experienceId: v.id("experiences"),
      experienceName: v.string(),
      matchStrength: v.string(),
      whyItFits: v.string(),
      framingTips: v.array(v.string()),
      caution: v.optional(v.string()),
      startWith: v.optional(v.string()),
      focusOn: v.optional(v.string()),
      avoidFocus: v.optional(v.string()),
      starterSentences: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    // Delete existing strategy for this prompt
    const existing = await ctx.db
      .query("promptStrategies")
      .withIndex("by_prompt", (q) => q.eq("promptId", args.promptId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return await ctx.db.insert("promptStrategies", args);
  },
});

export const getForPrompt = query({
  args: { promptId: v.id("prompts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("promptStrategies")
      .withIndex("by_prompt", (q) => q.eq("promptId", args.promptId))
      .unique();
  },
});
