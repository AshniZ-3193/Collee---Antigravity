import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeAlias, slugifySchoolName } from "./ai/schoolNormalization";
import { popularCollegeCatalog } from "./popularCollegeCatalog";

const acronymStopWords = new Set(["of", "the", "and", "for", "at", "in", "on"]);

function toSchoolAcronym(name: string): string {
  const words = normalizeAlias(name)
    .split(" ")
    .filter((word) => word && !acronymStopWords.has(word));
  if (words.length < 2) return "";
  return words.map((word) => word[0]).join("");
}

export const listPopularColleges = query({
  args: {},
  handler: async () => {
    return popularCollegeCatalog;
  },
});

export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    return await db
      .query("globalSchools")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .unique();
  },
});

export const searchByName = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const normalizedQuery = normalizeAlias(args.query);
    const limit = Math.min(Math.max(args.limit ?? 10, 1), 50);

    const activeSchools: any[] = await db
      .query("globalSchools")
      .withIndex("by_canonical_name")
      .collect();

    const filtered = activeSchools
      .filter((school: any) => {
        if (school.status !== "active") return false;
        if (!normalizedQuery) return true;
        const canonical = normalizeAlias(school.canonicalName);
        return canonical.includes(normalizedQuery);
      })
      .sort((a: any, b: any) => a.canonicalName.localeCompare(b.canonicalName))
      .slice(0, limit);

    if (!normalizedQuery) {
      return filtered.map((school: any) => ({
        canonicalName: school.canonicalName,
        slug: school.slug,
        status: school.status,
        qualityStatus: school.qualityStatus,
        qualityScore: school.qualityScore ?? 0,
      }));
    }

    const aliasMatch = await db
      .query("schoolAliases")
      .withIndex("by_alias", (q: any) => q.eq("aliasNormalized", normalizedQuery))
      .unique();

    if (!aliasMatch) {
      return filtered.map((school: any) => ({
        canonicalName: school.canonicalName,
        slug: school.slug,
        status: school.status,
        qualityStatus: school.qualityStatus,
        qualityScore: school.qualityScore ?? 0,
      }));
    }

    const aliasSchool = await db
      .query("globalSchools")
      .withIndex("by_slug", (q: any) => q.eq("slug", aliasMatch.schoolSlug))
      .unique();

    const combined = [...filtered];
    if (aliasSchool && !combined.find((school: any) => school.slug === aliasSchool.slug)) {
      combined.unshift(aliasSchool);
    }

    return combined.slice(0, limit).map((school: any) => ({
      canonicalName: school.canonicalName,
      slug: school.slug,
      status: school.status,
      qualityStatus: school.qualityStatus,
      qualityScore: school.qualityScore ?? 0,
    }));
  },
});

export const resolveOrCreate = mutation({
  args: {
    query: v.string(),
    createdByUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const normalizedAlias = normalizeAlias(args.query);
    const candidateSlug = slugifySchoolName(args.query);
    const now = Date.now();

    if (!normalizedAlias) {
      throw new Error("School query cannot be empty.");
    }

    const alias = await db
      .query("schoolAliases")
      .withIndex("by_alias", (q: any) => q.eq("aliasNormalized", normalizedAlias))
      .unique();

    if (alias) {
      const aliasSchool = await db
        .query("globalSchools")
        .withIndex("by_slug", (q: any) => q.eq("slug", alias.schoolSlug))
        .unique();
      if (aliasSchool) {
        return {
          school: aliasSchool,
          created: false,
          resolvedByAlias: true,
        };
      }
    }

    let school = await db
      .query("globalSchools")
      .withIndex("by_slug", (q: any) => q.eq("slug", candidateSlug))
      .unique();

    if (!school) {
      const schoolId = await db.insert("globalSchools", {
        canonicalName: args.query.trim(),
        slug: candidateSlug,
        status: "enriching",
        qualityStatus: "unverified",
        qualityScore: 0,
        createdByUserId: args.createdByUserId,
        createdAt: now,
        updatedAt: now,
      });
      school = await db.get(schoolId);
      if (!school) {
        throw new Error("Failed to create global school.");
      }
    } else {
      await db.patch(school._id, {
        updatedAt: now,
      });
    }

    const existingAlias = await db
      .query("schoolAliases")
      .withIndex("by_alias", (q: any) => q.eq("aliasNormalized", normalizedAlias))
      .unique();

    if (!existingAlias) {
      await db.insert("schoolAliases", {
        aliasNormalized: normalizedAlias,
        schoolSlug: school.slug,
        source: "user",
        createdAt: now,
      });
    }

    const acronym = toSchoolAcronym(school.canonicalName);
    if (acronym) {
      const acronymAlias = await db
        .query("schoolAliases")
        .withIndex("by_alias", (q: any) => q.eq("aliasNormalized", acronym))
        .unique();
      if (!acronymAlias) {
        await db.insert("schoolAliases", {
          aliasNormalized: acronym,
          schoolSlug: school.slug,
          source: "system",
          createdAt: now,
        });
      }
    }

    return {
      school,
      created: !alias,
      resolvedByAlias: false,
    };
  },
});

export const touchSchoolQuality = mutation({
  args: {
    slug: v.string(),
    status: v.optional(v.string()),
    qualityStatus: v.string(),
    qualityScore: v.number(),
    verifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const db = ctx.db as any;
    const school = await db
      .query("globalSchools")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .unique();
    if (!school) {
      throw new Error(`School not found for slug ${args.slug}`);
    }

    await db.patch(school._id, {
      status: args.status ?? school.status,
      qualityStatus: args.qualityStatus,
      qualityScore: args.qualityScore,
      verifiedAt: args.verifiedAt,
      verifiedBy: args.verifiedBy,
      updatedAt: Date.now(),
    });
  },
});
