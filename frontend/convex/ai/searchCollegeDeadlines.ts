"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import Exa from "exa-js";
import { createOpenAIClient, AI_MODEL } from "./aiHelpers";

interface ApplicationType {
  label: string;
  deadline: string;
  value?: string;
}

export const search = action({
  args: {
    collegeName: v.string(),
    applicationYear: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<ApplicationType[]> => {
    const year = args.applicationYear || new Date().getFullYear().toString();
    const collegeName = args.collegeName;

    const cached = await ctx.runQuery(api.ai.collegeDeadlinesCache.getCached, {
      collegeName,
      applicationYear: year,
    });

    if (cached && Date.now() - cached.cachedAt < 30 * 24 * 60 * 60 * 1000) {
      return cached.applicationTypes as ApplicationType[];
    }

    const exa = new Exa(process.env.EXA_API_KEY);
    const results = await exa.searchAndContents(
      `${collegeName} application deadlines ${year} early action early decision regular decision`,
      {
        text: { maxCharacters: 6000 },
        numResults: 5,
        type: "auto",
      }
    );

    const searchContent = results.results
      .map((r: any) => r.text || "")
      .join("\n\n---\n\n");

    const openai = createOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: `Extract undergraduate application deadlines for ${collegeName} (for the ${year} admission cycle if specified). Return JSON:
{
  "applicationTypes": [
    {
      "label": "Early Action",
      "deadline": "Nov 1"
    }
  ]
}

Only include actual undergraduate application deadlines (not financial aid or housing). If multiple years appear, prefer the closest upcoming cycle. If a deadline is not clearly stated, omit that entry. If you cannot find real deadlines, return an empty array.`,
        },
        { role: "user", content: searchContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) return [];

    const result = JSON.parse(responseText);
    const applicationTypes = result.applicationTypes || [];

    if (applicationTypes.length > 0) {
      await ctx.runMutation(api.ai.collegeDeadlinesCache.saveCache, {
        collegeName,
        applicationYear: year,
        applicationTypes,
        cachedAt: Date.now(),
      });
    }

    return applicationTypes;
  },
});
