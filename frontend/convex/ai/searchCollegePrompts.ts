"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

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
    const typedApi: any = api;
    const year = args.applicationYear || new Date().getFullYear().toString();
    const ensured = await ctx.runAction(typedApi.ai.ensureSchoolContent.ensure, {
      query: args.collegeName,
      applicationYear: year,
    });
    return (ensured?.prompts || []) as CollegePrompt[];
  },
});
