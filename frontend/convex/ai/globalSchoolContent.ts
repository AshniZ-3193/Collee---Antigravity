import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { GLOBAL_CONTENT_TTL_MS } from "./schoolNormalization";

const promptValidator = v.object({
  text: v.string(),
  wordCountMax: v.number(),
  isOptional: v.boolean(),
  promptType: v.optional(v.string()),
  targetProgram: v.optional(v.string()),
  relevantMajors: v.optional(v.array(v.string())),
});

const applicationTypeValidator = v.object({
  label: v.string(),
  deadline: v.string(),
  value: v.optional(v.string()),
});

export const getLatest = query({
  args: {
    schoolSlug: v.string(),
    applicationYear: v.string(),
    promptVersion: v.string(),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    return await db
      .query("globalSchoolContent")
      .withIndex("by_school_year_version", (q: any) =>
        q
          .eq("schoolSlug", args.schoolSlug)
          .eq("applicationYear", args.applicationYear)
          .eq("promptVersion", args.promptVersion)
      )
      .unique();
  },
});

export const upsert = mutation({
  args: {
    schoolSlug: v.string(),
    canonicalName: v.string(),
    applicationYear: v.string(),
    promptVersion: v.string(),
    prompts: v.array(promptValidator),
    applicationTypes: v.array(applicationTypeValidator),
    sourceUrls: v.array(v.string()),
    sourceDomains: v.array(v.string()),
    cachedAt: v.number(),
    expiresAt: v.number(),
    qualityStatus: v.string(),
    qualityScore: v.number(),
    verificationNotes: v.optional(v.string()),
    verifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.string()),
    lastError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const existing = await db
      .query("globalSchoolContent")
      .withIndex("by_school_year_version", (q: any) =>
        q
          .eq("schoolSlug", args.schoolSlug)
          .eq("applicationYear", args.applicationYear)
          .eq("promptVersion", args.promptVersion)
      )
      .unique();

    if (existing) {
      await db.patch(existing._id, {
        ...args,
      });
      return existing._id;
    }

    return await db.insert("globalSchoolContent", args);
  },
});

export const seedFromUserInput = mutation({
  args: {
    schoolSlug: v.string(),
    canonicalName: v.string(),
    applicationYear: v.string(),
    promptVersion: v.string(),
    prompts: v.array(promptValidator),
    applicationTypes: v.array(applicationTypeValidator),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const existing = await db
      .query("globalSchoolContent")
      .withIndex("by_school_year_version", (q: any) =>
        q
          .eq("schoolSlug", args.schoolSlug)
          .eq("applicationYear", args.applicationYear)
          .eq("promptVersion", args.promptVersion)
      )
      .unique();

    if (existing && existing.qualityStatus === "verified") {
      return existing._id;
    }

    const now = Date.now();
    const payload = {
      schoolSlug: args.schoolSlug,
      canonicalName: args.canonicalName,
      applicationYear: args.applicationYear,
      promptVersion: args.promptVersion,
      prompts: args.prompts,
      applicationTypes: args.applicationTypes,
      sourceUrls: [],
      sourceDomains: [],
      cachedAt: now,
      expiresAt: now + GLOBAL_CONTENT_TTL_MS,
      qualityStatus: "unverified",
      qualityScore: 0.3,
      verificationNotes: "User-submitted content awaiting verification.",
      verifiedAt: undefined,
      verifiedBy: undefined,
      lastError: undefined,
    } as const;

    if (existing) {
      await db.patch(existing._id, payload);
      return existing._id;
    }

    return await db.insert("globalSchoolContent", payload);
  },
});

export const acquireLock = mutation({
  args: {
    lockKey: v.string(),
    schoolSlug: v.string(),
    applicationYear: v.string(),
    promptVersion: v.string(),
    ttlMs: v.number(),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const now = Date.now();
    const existing = await db
      .query("contentGenerationLocks")
      .withIndex("by_lock_key", (q: any) => q.eq("lockKey", args.lockKey))
      .unique();

    if (existing && existing.expiresAt > now) {
      return false;
    }

    if (existing) {
      await db.delete(existing._id);
    }

    await db.insert("contentGenerationLocks", {
      lockKey: args.lockKey,
      schoolSlug: args.schoolSlug,
      applicationYear: args.applicationYear,
      promptVersion: args.promptVersion,
      acquiredAt: now,
      expiresAt: now + args.ttlMs,
    });

    return true;
  },
});

export const releaseLock = mutation({
  args: {
    lockKey: v.string(),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const existing = await db
      .query("contentGenerationLocks")
      .withIndex("by_lock_key", (q: any) => q.eq("lockKey", args.lockKey))
      .unique();

    if (existing) {
      await db.delete(existing._id);
    }
  },
});

export const listNeedsReview = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
    const docs = await db
      .query("globalSchoolContent")
      .withIndex("by_quality_status", (q: any) => q.eq("qualityStatus", "needs_review"))
      .collect();

    return docs
      .sort((a: any, b: any) => b.cachedAt - a.cachedAt)
      .slice(0, limit);
  },
});
