import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./authHelpers";
import { buildExcerptRecords } from "./experienceBankHelpers";
import {
  countRichTextWords,
  normalizeRichTextForStorage,
  stripRichTextFormatting,
} from "./richTextHelpers";

export const get = query({
  args: { essayId: v.id("essays") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.essayId);
  },
});

export const save = mutation({
  args: {
    essayId: v.id("essays"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await getUserId(ctx);
    const essay = await ctx.db.get(args.essayId);
    if (!essay) throw new Error("Essay not found");

    const normalizedContent = normalizeRichTextForStorage(args.content);
    const wordCount = countRichTextWords(normalizedContent);

    // Determine status
    const prompt = await ctx.db.get(essay.promptId);
    const wordLimit = prompt?.wordCountMax ?? 650;
    let status: string;
    if (wordCount === 0) {
      status = "not-started";
    } else if (wordCount >= wordLimit * 0.9) {
      status = "complete";
    } else {
      status = "in-progress";
    }

    const now = Date.now();

    // Update essay
    await ctx.db.patch(args.essayId, {
      content: normalizedContent,
      wordCount,
      status,
      lastUpdated: now,
    });

    const contentChanged = essay.content !== normalizedContent;

    // Create version snapshot (only if content changed meaningfully)
    if (contentChanged && wordCount > 0) {
      // Check if last version was very recent (< 30 seconds), skip if so
      const recentVersions = await ctx.db
        .query("essayVersions")
        .withIndex("by_essay", (q) => q.eq("essayId", args.essayId))
        .order("desc")
        .take(1);

      const lastVersion = recentVersions[0];
      if (!lastVersion || now - lastVersion.timestamp > 30000) {
        await ctx.db.insert("essayVersions", {
          userId: essay.userId,
          essayId: args.essayId,
          content: normalizedContent,
          wordCount,
          timestamp: now,
        });
      }
    }

    if (contentChanged) {
      const existingExcerpts = await ctx.db
        .query("essayExcerpts")
        .withIndex("by_essay", (q) => q.eq("essayId", args.essayId))
        .collect();

      for (const existing of existingExcerpts) {
        await ctx.db.delete(existing._id);
      }

      if (wordCount >= 80) {
        const excerptRecords = buildExcerptRecords(
          stripRichTextFormatting(normalizedContent),
          prompt?.promptType,
        );
        for (const record of excerptRecords) {
          await ctx.db.insert("essayExcerpts", {
            userId: essay.userId,
            essayId: args.essayId,
            collegeId: essay.collegeId,
            excerpt: record.excerpt,
            themes: record.themes,
            promptType: record.promptType,
          });
        }
      }
    }

    return { wordCount, status };
  },
});

export const getVersions = query({
  args: { essayId: v.id("essays") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("essayVersions")
      .withIndex("by_essay", (q) => q.eq("essayId", args.essayId))
      .order("desc")
      .collect();
  },
});

export const restoreVersion = mutation({
  args: {
    essayId: v.id("essays"),
    versionId: v.id("essayVersions"),
  },
  handler: async (ctx, args) => {
    await getUserId(ctx);
    const version = await ctx.db.get(args.versionId);
    if (!version) throw new Error("Version not found");

    await ctx.db.patch(args.essayId, {
      content: version.content,
      wordCount: version.wordCount,
      lastUpdated: Date.now(),
    });
  },
});
