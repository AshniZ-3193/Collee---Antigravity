"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import OpenAI from "openai";
import Exa from "exa-js";

export const search = action({
  args: {
    collegeName: v.string(),
    applicationYear: v.optional(v.string()),
  },
  handler: async (ctx) => {
    const year = ctx._args.applicationYear || new Date().getFullYear().toString();
    const collegeName = ctx._args.collegeName;

    // Check cache first
    const cached = await ctx.runQuery(api.ai.searchCollegePrompts.getCached, {
      collegeName,
      applicationYear: year,
    });

    if (cached && Date.now() - cached.cachedAt < 30 * 24 * 60 * 60 * 1000) {
      return cached.prompts;
    }

    // Search with Exa
    const exa = new Exa(process.env.EXA_API_KEY);
    const results = await exa.searchAndContents(
      `${collegeName} supplemental essay prompts ${year}`,
      {
        text: { maxCharacters: 5000 },
        numResults: 5,
        type: "auto",
      }
    );

    // Extract structured prompts with GPT
    const searchContent = results.results
      .map((r: any) => r.text || "")
      .join("\n\n---\n\n");

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2-mini",
      messages: [
        {
          role: "system",
          content: `Extract college essay prompts from the following search results for ${collegeName}. Return JSON:
{
  "prompts": [
    {
      "text": "The full prompt text",
      "wordCountMax": 250,
      "isOptional": false,
      "promptType": "why-college" | "contribution" | "why-major" | "extracurricular" | "identity" | "challenge" | "other"
    }
  ]
}

Only include actual essay prompts, not application instructions. If word count is not specified, use 250 as default. If you cannot find real prompts, return an empty array.`,
        },
        { role: "user", content: searchContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) return [];

    const result = JSON.parse(responseText);
    const prompts = result.prompts || [];

    // Cache results
    if (prompts.length > 0) {
      await ctx.runMutation(api.ai.searchCollegePrompts.saveCache, {
        collegeName,
        applicationYear: year,
        prompts,
        cachedAt: Date.now(),
      });
    }

    return prompts;
  },
});

import { mutation, query } from "../_generated/server";

export const getCached = query({
  args: {
    collegeName: v.string(),
    applicationYear: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cachedCollegePrompts")
      .withIndex("by_college_year", (q) =>
        q.eq("collegeName", args.collegeName).eq("applicationYear", args.applicationYear)
      )
      .unique();
  },
});

export const saveCache = mutation({
  args: {
    collegeName: v.string(),
    applicationYear: v.string(),
    prompts: v.array(v.object({
      text: v.string(),
      wordCountMax: v.number(),
      isOptional: v.boolean(),
      promptType: v.optional(v.string()),
    })),
    cachedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Remove old cache for this college/year
    const existing = await ctx.db
      .query("cachedCollegePrompts")
      .withIndex("by_college_year", (q) =>
        q.eq("collegeName", args.collegeName).eq("applicationYear", args.applicationYear)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return await ctx.db.insert("cachedCollegePrompts", args);
  },
});
