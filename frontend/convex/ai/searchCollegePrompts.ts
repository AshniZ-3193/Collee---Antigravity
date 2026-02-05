"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import Exa from "exa-js";
import { createOpenAIClient, AI_MODEL } from "./aiHelpers";

interface CollegePrompt {
  text: string;
  wordCountMax: number;
  isOptional: boolean;
  promptType?: string;
  targetProgram?: string;
  relevantMajors?: string[];
}

export const search = action({
  args: {
    collegeName: v.string(),
    applicationYear: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<CollegePrompt[]> => {
    const year = args.applicationYear || new Date().getFullYear().toString();
    const collegeName = args.collegeName;

    // Check cache first (using separate non-Node.js file)
    const cached = await ctx.runQuery(api.ai.collegePromptsCache.getCached, {
      collegeName,
      applicationYear: year,
    });

    if (cached && Date.now() - cached.cachedAt < 30 * 24 * 60 * 60 * 1000) {
      return cached.prompts as CollegePrompt[];
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

    const openai = createOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
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
      "promptType": "why-college" | "contribution" | "why-major" | "extracurricular" | "identity" | "challenge" | "other",
      "targetProgram": "Name of specific school/program if applicable, otherwise null",
      "relevantMajors": ["Array of relevant majors, or 'all' for general prompts"]
    }
  ]
}

Guidelines for targetProgram and relevantMajors:
- If a prompt is for a SPECIFIC school/program (e.g., "Ross School of Business", "College of Engineering", "School of Nursing"), set targetProgram to that name.
- For general prompts applicable to all applicants, set targetProgram to null and relevantMajors to ["all"].
- For business school prompts, use relevantMajors: ["Business Administration", "Economics", "Finance", "Accounting", "Marketing"].
- For engineering prompts, use relevantMajors: ["Engineering", "Computer Science", "Physics", "Mathematics"].
- For arts/humanities prompts, use relevantMajors: ["Art", "Music", "Theater", "English", "History", "Philosophy"].
- For science prompts, use relevantMajors: ["Biology", "Chemistry", "Physics", "Neuroscience", "Environmental Science"].
- For nursing/health prompts, use relevantMajors: ["Nursing", "Public Health", "Pre-Med", "Health Sciences"].

Examples:
- "Why do you want to attend Ross School of Business?" → targetProgram: "Ross School of Business", relevantMajors: ["Business Administration", "Economics", "Finance"]
- "What would you contribute to our campus community?" → targetProgram: null, relevantMajors: ["all"]
- "Describe your interest in engineering" → targetProgram: "College of Engineering", relevantMajors: ["Engineering", "Computer Science", "Physics"]

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

    // Cache results (using separate non-Node.js file)
    if (prompts.length > 0) {
      await ctx.runMutation(api.ai.collegePromptsCache.saveCache, {
        collegeName,
        applicationYear: year,
        prompts,
        cachedAt: Date.now(),
      });
    }

    return prompts;
  },
});
