import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import { v } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel, Doc, Id } from "./_generated/dataModel";
import { mutation, type MutationCtx, type QueryCtx } from "./_generated/server";
import { buildExcerptRecords } from "./experienceBankHelpers";
import {
  countRichTextWords,
  normalizeRichTextForStorage,
  stripRichTextFormatting,
} from "./richTextHelpers";
import { getUserId } from "./authHelpers";

const prosemirrorSync = new ProsemirrorSync<Id<"essays">>((components as any).prosemirrorSync);

const ensureEssayOwner = async (ctx: QueryCtx | MutationCtx, id: string): Promise<Doc<"essays">> => {
  const userId = await getUserId(ctx);
  const essayId = id as Id<"essays">;
  const essay = await ctx.db.get(essayId);

  if (!essay || essay.userId !== userId) {
    throw new Error("Essay not found or unauthorized");
  }

  return essay;
};

export const {
  getSnapshot,
  submitSnapshot,
  latestVersion,
  getSteps,
  submitSteps,
} = prosemirrorSync.syncApi<DataModel>({
  checkRead: async (ctx, id) => {
    await ensureEssayOwner(ctx as QueryCtx, id);
  },
  checkWrite: async (ctx, id) => {
    await ensureEssayOwner(ctx as MutationCtx, id);
  },
  onSnapshot: async (ctx, id, snapshot) => {
    const essay = await ensureEssayOwner(ctx as MutationCtx, id);
    const essayId = id as Id<"essays">;
    const normalizedContent = normalizeRichTextForStorage(snapshot);
    const wordCount = countRichTextWords(normalizedContent);

    const prompt = await ctx.db.get(essay.promptId as Id<"prompts">);
    const wordLimit = prompt?.wordCountMax ?? 650;

    let status: string;
    if (wordCount === 0) {
      status = "not-started";
    } else if (wordCount >= wordLimit * 0.9) {
      status = "complete";
    } else {
      status = "in-progress";
    }

    const contentChanged = essay.content !== normalizedContent;
    const metadataChanged = essay.wordCount !== wordCount || essay.status !== status;
    const now = Date.now();

    if (contentChanged || metadataChanged) {
      await ctx.db.patch(essayId, {
        content: normalizedContent,
        wordCount,
        status,
        ...(contentChanged ? { lastUpdated: now } : {}),
      });
    }

    if (contentChanged && wordCount > 0) {
      const recentVersions = await ctx.db
        .query("essayVersions")
        .withIndex("by_essay", (q) => q.eq("essayId", essayId))
        .order("desc")
        .take(1);

      const lastVersion = recentVersions[0];
      if (!lastVersion || now - lastVersion.timestamp > 30000) {
        await ctx.db.insert("essayVersions", {
          userId: essay.userId,
          essayId,
          content: normalizedContent,
          wordCount,
          timestamp: now,
        });
      }
    }

    if (contentChanged) {
      const existingExcerpts = await ctx.db
        .query("essayExcerpts")
        .withIndex("by_essay", (q) => q.eq("essayId", essayId))
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
            essayId,
            collegeId: essay.collegeId,
            excerpt: record.excerpt,
            themes: record.themes,
            promptType: record.promptType,
          });
        }
      }
    }
  },
});

/**
 * Reset the ProseMirror sync document for a given essay.
 * Called when the essay content was updated externally (e.g. via a share link)
 * and the owner's editor needs to reload the latest content from the database.
 * This clears snapshots/steps and immediately recreates version 1 from the
 * current essay content to avoid stale-client recreation races.
 */
export const resetDocument = mutation({
  args: { id: v.string() },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    // Verify essay ownership — only the essay owner can reset their sync doc
    const essay = await ensureEssayOwner(ctx, id);
    const normalizedContent = normalizeRichTextForStorage(essay.content);

    // Delete all ProseMirror snapshots for this document
    await ctx.runMutation(
      (components as any).prosemirrorSync.lib.deleteSnapshots,
      { id },
    );

    // Delete all ProseMirror steps (deltas) for this document
    await ctx.runMutation(
      (components as any).prosemirrorSync.lib.deleteSteps,
      { id, beforeTs: Infinity, deleteNewerThanLatestSnapshot: true },
    );

    // Recreate an authoritative base snapshot from the current essay content.
    // Doing this server-side avoids client races where stale editors recreate
    // version 1 with outdated content after a reset.
    await ctx.runMutation(
      (components as any).prosemirrorSync.lib.submitSnapshot,
      {
        id,
        version: 1,
        content: normalizedContent,
      },
    );

    return null;
  },
});
