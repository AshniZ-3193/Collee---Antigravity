"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import Exa from "exa-js";
import { createOpenAIClient, AI_MODEL, getAuthenticatedUser } from "./aiHelpers";
import {
  DEFAULT_PROMPT_VERSION,
  GLOBAL_CONTENT_TTL_MS,
  extractDomain,
  isTrustedSourceDomain,
  scorePromptSimilarity,
} from "./schoolNormalization";

interface CollegePrompt {
  text: string;
  wordCountMax: number;
  isOptional: boolean;
  promptType?: string;
  targetProgram?: string;
  relevantMajors?: string[];
}

interface ApplicationType {
  label: string;
  deadline: string;
  value?: string;
}

interface QualityEvaluation {
  qualityStatus: "unverified" | "verified" | "needs_review";
  qualityScore: number;
  verificationNotes: string;
  verifiedAt?: number;
  verifiedBy?: "system" | "human";
}

function extractSourceUrls(results: any[]): string[] {
  const urls = new Set<string>();
  for (const result of results) {
    const url = typeof result?.url === "string" ? result.url.trim() : "";
    if (url) urls.add(url);
  }
  return Array.from(urls);
}

function extractSourceDomains(urls: string[]): string[] {
  const domains = new Set<string>();
  for (const url of urls) {
    const domain = extractDomain(url);
    if (domain) domains.add(domain);
  }
  return Array.from(domains);
}

function evaluateQuality(args: {
  sourceDomains: string[];
  prompts: CollegePrompt[];
  applicationTypes: ApplicationType[];
  seedPrompts: CollegePrompt[];
}): QualityEvaluation {
  const trustedSourceCount = args.sourceDomains.filter(isTrustedSourceDomain).length;
  const totalSourceCount = args.sourceDomains.length;
  const extractedPromptTexts = args.prompts.map((prompt) => prompt.text);
  const seedPromptTexts = args.seedPrompts.map((prompt) => prompt.text);
  const similarity =
    seedPromptTexts.length > 0
      ? scorePromptSimilarity(seedPromptTexts, extractedPromptTexts)
      : 0;

  let score = 0;
  if (trustedSourceCount > 0) score += 0.4;
  if (totalSourceCount >= 2) score += 0.15;
  if (args.prompts.length > 0) score += 0.2;
  if (args.applicationTypes.length > 0) score += 0.1;
  if (seedPromptTexts.length === 0) {
    score += 0.1;
  } else {
    score += 0.15 * Math.max(0, Math.min(1, similarity));
  }

  const notes: string[] = [
    `trusted_sources=${trustedSourceCount}`,
    `all_sources=${totalSourceCount}`,
    `prompts=${args.prompts.length}`,
    `deadlines=${args.applicationTypes.length}`,
  ];

  if (seedPromptTexts.length > 0) {
    notes.push(`seed_prompt_similarity=${similarity.toFixed(2)}`);
  }

  if (args.prompts.length === 0 && args.applicationTypes.length === 0) {
    return {
      qualityStatus: "needs_review",
      qualityScore: 0,
      verificationNotes: `${notes.join("; ")}; no_extracted_data=true`,
    };
  }

  if (seedPromptTexts.length > 0 && args.prompts.length > 0 && similarity < 0.55) {
    return {
      qualityStatus: "needs_review",
      qualityScore: Math.max(0, Math.min(1, score)),
      verificationNotes: `${notes.join("; ")}; reason=seed_mismatch`,
    };
  }

  if (trustedSourceCount === 0) {
    return {
      qualityStatus: "unverified",
      qualityScore: Math.max(0, Math.min(1, score)),
      verificationNotes: `${notes.join("; ")}; reason=no_trusted_source`,
    };
  }

  if (score >= 0.75) {
    return {
      qualityStatus: "verified",
      qualityScore: Math.max(0, Math.min(1, score)),
      verificationNotes: `${notes.join("; ")}; reason=auto_verified`,
      verifiedAt: Date.now(),
      verifiedBy: "system",
    };
  }

  return {
    qualityStatus: "unverified",
    qualityScore: Math.max(0, Math.min(1, score)),
    verificationNotes: `${notes.join("; ")}; reason=low_confidence`,
  };
}

async function extractPrompts(
  collegeName: string,
  searchContent: string
): Promise<CollegePrompt[]> {
  if (!searchContent.trim()) return [];
  const openai = createOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content: `Extract college essay prompts from search results for ${collegeName}. Return JSON:
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
Only include real supplemental essay prompts. If none are reliable, return an empty array.`,
      },
      { role: "user", content: searchContent },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const responseText = completion.choices[0]?.message?.content;
  if (!responseText) return [];

  let parsed: any;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    return [];
  }

  return (parsed.prompts || [])
    .filter((prompt: any) => prompt && typeof prompt.text === "string" && prompt.text.trim().length > 0)
    .map((prompt: any) => ({
      text: prompt.text.trim(),
      wordCountMax:
        typeof prompt.wordCountMax === "number" && prompt.wordCountMax > 0
          ? prompt.wordCountMax
          : 250,
      isOptional: typeof prompt.isOptional === "boolean" ? prompt.isOptional : false,
      promptType:
        typeof prompt.promptType === "string" && prompt.promptType.trim().length > 0
          ? prompt.promptType
          : undefined,
      targetProgram:
        typeof prompt.targetProgram === "string" && prompt.targetProgram.trim().length > 0
          ? prompt.targetProgram
          : undefined,
      relevantMajors: Array.isArray(prompt.relevantMajors)
        ? prompt.relevantMajors.filter((major: any) => typeof major === "string" && major.trim().length > 0)
        : undefined,
    }));
}

async function extractDeadlines(
  collegeName: string,
  year: string,
  searchContent: string
): Promise<ApplicationType[]> {
  if (!searchContent.trim()) return [];
  const openai = createOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content: `Extract undergraduate application deadlines for ${collegeName} (${year} cycle when available). Return JSON:
{
  "applicationTypes": [
    {
      "label": "Early Action",
      "deadline": "Nov 1"
    }
  ]
}
Only include real undergraduate deadlines. Omit uncertain entries. Return empty array if not found.`,
      },
      { role: "user", content: searchContent },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const responseText = completion.choices[0]?.message?.content;
  if (!responseText) return [];

  let parsed: any;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    return [];
  }

  const seen = new Set<string>();
  return (parsed.applicationTypes || [])
    .filter((item: any) => item && typeof item.label === "string" && typeof item.deadline === "string")
    .map((item: any) => {
      const value = (item.value || item.label)
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return {
        label: item.label.trim(),
        deadline: item.deadline.trim(),
        value: value || "application",
      };
    })
    .filter((item: ApplicationType) => {
      if (!item.label || !item.deadline) return false;
      if (seen.has(item.value || "")) return false;
      seen.add(item.value || "");
      return true;
    });
}

export const ensure = action({
  args: {
    query: v.string(),
    schoolSlug: v.optional(v.string()),
    applicationYear: v.optional(v.string()),
    promptVersion: v.optional(v.string()),
    seedPrompts: v.optional(
      v.array(
        v.object({
          text: v.string(),
          wordCountMax: v.number(),
          isOptional: v.boolean(),
          promptType: v.optional(v.string()),
          targetProgram: v.optional(v.string()),
          relevantMajors: v.optional(v.array(v.string())),
        })
      )
    ),
    seedApplicationTypes: v.optional(
      v.array(
        v.object({
          label: v.string(),
          deadline: v.string(),
          value: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const typedApi: any = api;
    const year = args.applicationYear || new Date().getFullYear().toString();
    const promptVersion = args.promptVersion || DEFAULT_PROMPT_VERSION;
    const seedPrompts = args.seedPrompts || [];
    const seedApplicationTypes = args.seedApplicationTypes || [];

    let createdByUserId: any = undefined;
    try {
      const user = await getAuthenticatedUser(ctx);
      createdByUserId = user?._id;
    } catch {
      createdByUserId = undefined;
    }

    let school: any = null;
    if (args.schoolSlug) {
      school = await ctx.runQuery(typedApi.globalSchools.getBySlug, {
        slug: args.schoolSlug,
      });
    }

    if (!school) {
      const resolved = await ctx.runMutation(typedApi.globalSchools.resolveOrCreate, {
        query: args.query,
        createdByUserId,
      });
      school = resolved.school;
    }

    if (!school) {
      throw new Error("Unable to resolve school.");
    }

    if (seedPrompts.length > 0 || seedApplicationTypes.length > 0) {
      await ctx.runMutation(typedApi.ai.globalSchoolContent.seedFromUserInput, {
        schoolSlug: school.slug,
        canonicalName: school.canonicalName,
        applicationYear: year,
        promptVersion,
        prompts: seedPrompts,
        applicationTypes: seedApplicationTypes,
      });
    }

    const cached = await ctx.runQuery(typedApi.ai.globalSchoolContent.getLatest, {
      schoolSlug: school.slug,
      applicationYear: year,
      promptVersion,
    });

    const now = Date.now();
    const shouldGenerate =
      !cached ||
      cached.expiresAt <= now ||
      cached.qualityStatus !== "verified" ||
      cached.prompts.length === 0 ||
      cached.applicationTypes.length === 0;

    if (!shouldGenerate) {
      console.log("school_content_cache_hit", {
        schoolSlug: school.slug,
        year,
        promptVersion,
        qualityStatus: cached.qualityStatus,
      });
      return {
        status: "ready",
        schoolSlug: school.slug,
        canonicalName: school.canonicalName,
        qualityStatus: cached.qualityStatus,
        qualityScore: cached.qualityScore,
        verificationNotes: cached.verificationNotes,
        prompts: cached.prompts,
        applicationTypes: cached.applicationTypes,
        sourceUrls: cached.sourceUrls,
        cachedAt: cached.cachedAt,
        expiresAt: cached.expiresAt,
      };
    }

    console.log("school_content_cache_miss", {
      schoolSlug: school.slug,
      year,
      promptVersion,
      hasCached: Boolean(cached),
      cachedQualityStatus: cached?.qualityStatus,
    });

    const lockKey = `${school.slug}:${year}:${promptVersion}`;
    const acquired = await ctx.runMutation(typedApi.ai.globalSchoolContent.acquireLock, {
      lockKey,
      schoolSlug: school.slug,
      applicationYear: year,
      promptVersion,
      ttlMs: 60_000,
    });

    if (!acquired) {
      if (cached) {
        return {
          status: "enriching",
          schoolSlug: school.slug,
          canonicalName: school.canonicalName,
          qualityStatus: cached.qualityStatus,
          qualityScore: cached.qualityScore,
          verificationNotes: cached.verificationNotes,
          prompts: cached.prompts,
          applicationTypes: cached.applicationTypes,
          sourceUrls: cached.sourceUrls,
          cachedAt: cached.cachedAt,
          expiresAt: cached.expiresAt,
        };
      }
      return {
        status: "enriching",
        schoolSlug: school.slug,
        canonicalName: school.canonicalName,
        qualityStatus: school.qualityStatus || "unverified",
        qualityScore: school.qualityScore || 0,
        verificationNotes: "Generation in progress.",
        prompts: [],
        applicationTypes: [],
        sourceUrls: [],
        cachedAt: 0,
        expiresAt: 0,
      };
    }

    try {
      const exaKey = process.env.EXA_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!exaKey || !openaiKey) {
        throw new Error("EXA_API_KEY and OPENAI_API_KEY must be set.");
      }

      const exa = new Exa(exaKey);

      const promptResults = await exa.searchAndContents(
        `${school.canonicalName} supplemental essay prompts ${year}`,
        {
          text: { maxCharacters: 5000 },
          numResults: 5,
          type: "auto",
        }
      );

      const deadlineResults = await exa.searchAndContents(
        `${school.canonicalName} application deadlines ${year} early action early decision regular decision`,
        {
          text: { maxCharacters: 6000 },
          numResults: 5,
          type: "auto",
        }
      );

      const promptSearchContent = (promptResults.results || [])
        .map((result: any) => result?.text || "")
        .join("\n\n---\n\n");
      const deadlineSearchContent = (deadlineResults.results || [])
        .map((result: any) => result?.text || "")
        .join("\n\n---\n\n");

      const extractedPrompts = await extractPrompts(
        school.canonicalName,
        promptSearchContent
      );
      const extractedDeadlines = await extractDeadlines(
        school.canonicalName,
        year,
        deadlineSearchContent
      );

      const sourceUrls = extractSourceUrls([
        ...(promptResults.results || []),
        ...(deadlineResults.results || []),
      ]);
      const sourceDomains = extractSourceDomains(sourceUrls);
      const candidateSeedPrompts =
        seedPrompts.length > 0
          ? seedPrompts
          : cached?.qualityStatus === "unverified"
            ? cached.prompts
            : [];
      const quality = evaluateQuality({
        sourceDomains,
        prompts: extractedPrompts,
        applicationTypes: extractedDeadlines,
        seedPrompts: candidateSeedPrompts,
      });

      const resolvedPrompts =
        extractedPrompts.length > 0 ? extractedPrompts : seedPrompts;
      const resolvedApplicationTypes =
        extractedDeadlines.length > 0 ? extractedDeadlines : seedApplicationTypes;

      const payload = {
        schoolSlug: school.slug,
        canonicalName: school.canonicalName,
        applicationYear: year,
        promptVersion,
        prompts: resolvedPrompts,
        applicationTypes: resolvedApplicationTypes,
        sourceUrls,
        sourceDomains,
        cachedAt: now,
        expiresAt: now + GLOBAL_CONTENT_TTL_MS,
        qualityStatus: quality.qualityStatus,
        qualityScore: quality.qualityScore,
        verificationNotes: quality.verificationNotes,
        verifiedAt: quality.verifiedAt,
        verifiedBy: quality.verifiedBy,
        lastError: undefined,
      };

      await ctx.runMutation(typedApi.ai.globalSchoolContent.upsert, payload);
      await ctx.runMutation(typedApi.globalSchools.touchSchoolQuality, {
        slug: school.slug,
        status: "active",
        qualityStatus: quality.qualityStatus,
        qualityScore: quality.qualityScore,
        verifiedAt: quality.verifiedAt,
        verifiedBy: quality.verifiedBy,
      });
      console.log("school_content_generation_success", {
        schoolSlug: school.slug,
        year,
        promptVersion,
        qualityStatus: quality.qualityStatus,
        sourceCount: sourceUrls.length,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown enrichment failure";
      console.error("school_content_generation_failed", {
        schoolSlug: school.slug,
        year,
        promptVersion,
        error: message,
      });
      await ctx.runMutation(typedApi.globalSchools.touchSchoolQuality, {
        slug: school.slug,
        status: "active",
        qualityStatus: "needs_review",
        qualityScore: 0,
        verifiedAt: undefined,
        verifiedBy: undefined,
      });

      const stale = await ctx.runQuery(typedApi.ai.globalSchoolContent.getLatest, {
        schoolSlug: school.slug,
        applicationYear: year,
        promptVersion,
      });

      if (!stale) {
        throw new Error(`Failed to fetch school content: ${message}`);
      }

      await ctx.runMutation(typedApi.ai.globalSchoolContent.upsert, {
        schoolSlug: school.slug,
        canonicalName: school.canonicalName,
        applicationYear: year,
        promptVersion,
        prompts: stale.prompts,
        applicationTypes: stale.applicationTypes,
        sourceUrls: stale.sourceUrls,
        sourceDomains: stale.sourceDomains,
        cachedAt: stale.cachedAt,
        expiresAt: stale.expiresAt,
        qualityStatus: stale.qualityStatus,
        qualityScore: stale.qualityScore,
        verificationNotes: stale.verificationNotes,
        verifiedAt: stale.verifiedAt,
        verifiedBy: stale.verifiedBy,
        lastError: message,
      });
    } finally {
      await ctx.runMutation(typedApi.ai.globalSchoolContent.releaseLock, {
        lockKey,
      });
    }

    const latest = await ctx.runQuery(typedApi.ai.globalSchoolContent.getLatest, {
      schoolSlug: school.slug,
      applicationYear: year,
      promptVersion,
    });

    if (!latest) {
      return {
        status: "enriching",
        schoolSlug: school.slug,
        canonicalName: school.canonicalName,
        qualityStatus: "unverified",
        qualityScore: 0,
        verificationNotes: "No content available yet.",
        prompts: [],
        applicationTypes: [],
        sourceUrls: [],
        cachedAt: 0,
        expiresAt: 0,
      };
    }

    return {
      status: "ready",
      schoolSlug: school.slug,
      canonicalName: school.canonicalName,
      qualityStatus: latest.qualityStatus,
      qualityScore: latest.qualityScore,
      verificationNotes: latest.verificationNotes,
      prompts: latest.prompts,
      applicationTypes: latest.applicationTypes,
      sourceUrls: latest.sourceUrls,
      cachedAt: latest.cachedAt,
      expiresAt: latest.expiresAt,
    };
  },
});
