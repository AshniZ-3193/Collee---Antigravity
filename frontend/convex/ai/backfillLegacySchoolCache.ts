"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { DEFAULT_PROMPT_VERSION, GLOBAL_CONTENT_TTL_MS } from "./schoolNormalization";

export const run = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const typedApi: any = api;
    const limit = Math.min(Math.max(args.limit ?? 500, 1), 5000);
    const now = Date.now();

    const promptCaches = await ctx.runQuery(typedApi.ai.collegePromptsCache.listAll, {
      limit,
    });
    const deadlineCaches = await ctx.runQuery(typedApi.ai.collegeDeadlinesCache.listAll, {
      limit,
    });

    const deadlineMap = new Map<string, any>();
    for (const deadline of deadlineCaches || []) {
      const key = `${deadline.collegeName}::${deadline.applicationYear}`;
      deadlineMap.set(key, deadline);
    }

    let migrated = 0;
    for (const promptCache of promptCaches || []) {
      const schoolResolution = await ctx.runMutation(typedApi.globalSchools.resolveOrCreate, {
        query: promptCache.collegeName,
      });
      const school = schoolResolution.school;
      const deadlineKey = `${promptCache.collegeName}::${promptCache.applicationYear}`;
      const deadlineCache = deadlineMap.get(deadlineKey);

      await ctx.runMutation(typedApi.ai.globalSchoolContent.upsert, {
        schoolSlug: school.slug,
        canonicalName: school.canonicalName,
        applicationYear: promptCache.applicationYear,
        promptVersion: DEFAULT_PROMPT_VERSION,
        prompts: promptCache.prompts,
        applicationTypes: deadlineCache?.applicationTypes || [],
        sourceUrls: [],
        sourceDomains: [],
        cachedAt: promptCache.cachedAt || now,
        expiresAt: (promptCache.cachedAt || now) + GLOBAL_CONTENT_TTL_MS,
        qualityStatus: "unverified",
        qualityScore: 0.5,
        verificationNotes: "Backfilled from legacy cache table.",
        verifiedAt: undefined,
        verifiedBy: undefined,
        lastError: undefined,
      });

      await ctx.runMutation(typedApi.globalSchools.touchSchoolQuality, {
        slug: school.slug,
        status: "active",
        qualityStatus: "unverified",
        qualityScore: 0.5,
        verifiedAt: undefined,
        verifiedBy: undefined,
      });
      migrated += 1;
    }

    return {
      migrated,
      promptCaches: (promptCaches || []).length,
      deadlineCaches: (deadlineCaches || []).length,
    };
  },
});
