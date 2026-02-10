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

const prosemirrorSync = new ProsemirrorSync<string>(components.prosemirrorSync);
const VERSION_SNAPSHOT_INTERVAL_MS = 30000;
const MIN_WORDS_FOR_EXCERPTS = 80;
const DEFAULT_SYNC_GENERATION = 0;
const SYNC_DOC_ID_SEPARATOR = ":";
const OLD_SYNC_DOCUMENT_CLEANUP_DELAY_MS = 5 * 60 * 1000;
const STALE_SYNC_SESSION_ERROR = "Sync session expired. Reload the editor to continue writing.";

type ExcerptRecord = ReturnType<typeof buildExcerptRecords>[number];
type SyncDocumentRef = {
  essayId: Id<"essays">;
  generation: number;
  rawId: string;
};

const ensureEssayOwner = async (
  ctx: QueryCtx | MutationCtx,
  essayId: Id<"essays">,
): Promise<Doc<"essays">> => {
  const userId = await getUserId(ctx);
  const essay = await ctx.db.get(essayId);

  if (!essay || essay.userId !== userId) {
    throw new Error("Essay not found or unauthorized");
  }

  return essay;
};

const getEssaySyncGeneration = (essay: Doc<"essays">) =>
  essay.syncGeneration ?? DEFAULT_SYNC_GENERATION;

const buildSyncDocumentId = (essayId: Id<"essays"> | string, generation: number) =>
  `${essayId}${SYNC_DOC_ID_SEPARATOR}${generation}`;

const parseSyncDocumentId = (id: string): SyncDocumentRef => {
  const separatorIndex = id.lastIndexOf(SYNC_DOC_ID_SEPARATOR);
  if (separatorIndex === -1) {
    return {
      essayId: id as Id<"essays">,
      generation: DEFAULT_SYNC_GENERATION,
      rawId: id,
    };
  }

  const essayId = id.slice(0, separatorIndex);
  const generation = Number(id.slice(separatorIndex + 1));
  if (!essayId || !Number.isInteger(generation) || generation < DEFAULT_SYNC_GENERATION) {
    throw new Error("Invalid sync document identifier");
  }

  return {
    essayId: essayId as Id<"essays">,
    generation,
    rawId: id,
  };
};

const ensureSyncDocumentOwner = async (
  ctx: QueryCtx | MutationCtx,
  id: string,
  options?: { allowStaleGeneration?: boolean },
) => {
  const parsed = parseSyncDocumentId(id);
  const essay = await ensureEssayOwner(ctx, parsed.essayId);
  const currentGeneration = getEssaySyncGeneration(essay);

  if (!options?.allowStaleGeneration && parsed.generation !== currentGeneration) {
    throw new Error(STALE_SYNC_SESSION_ERROR);
  }

  return {
    essay,
    essayId: parsed.essayId,
    requestedGeneration: parsed.generation,
    currentGeneration,
    syncDocumentId: parsed.rawId,
  };
};

const excerptSignature = (record: { excerpt: string; themes: string[]; promptType?: string }) => {
  const sortedThemes = [...record.themes].sort();
  return `${record.excerpt}::${sortedThemes.join("|")}::${record.promptType ?? ""}`;
};

const areExcerptSetsEqual = (existing: Doc<"essayExcerpts">[], next: ExcerptRecord[]): boolean => {
  if (existing.length !== next.length) {
    return false;
  }

  const existingSignatures = existing.map((record) => excerptSignature(record)).sort();
  const nextSignatures = next.map((record) => excerptSignature(record)).sort();

  return existingSignatures.every((signature, index) => signature === nextSignatures[index]);
};

const rollbackExcerptUpdate = async (
  ctx: MutationCtx,
  essayId: Id<"essays">,
  insertedIds: Id<"essayExcerpts">[],
  deletedExcerpts: Doc<"essayExcerpts">[],
) => {
  for (const insertedId of insertedIds) {
    try {
      await ctx.db.delete(insertedId);
    } catch (cleanupError) {
      console.error("[prosemirror.onSnapshot] Failed to clean up inserted excerpt", {
        essayId,
        excerptId: insertedId,
        error: cleanupError,
      });
    }
  }

  for (const excerpt of deletedExcerpts) {
    try {
      await ctx.db.insert("essayExcerpts", {
        userId: excerpt.userId,
        essayId: excerpt.essayId,
        collegeId: excerpt.collegeId,
        excerpt: excerpt.excerpt,
        themes: excerpt.themes,
        promptType: excerpt.promptType,
      });
    } catch (restoreError) {
      console.error("[prosemirror.onSnapshot] Failed to restore deleted excerpt", {
        essayId,
        originalExcerptId: excerpt._id,
        error: restoreError,
      });
    }
  }
};

const updateEssayExcerpts = async (
  ctx: MutationCtx,
  essay: Doc<"essays">,
  essayId: Id<"essays">,
  normalizedContent: string,
  wordCount: number,
  promptType?: string,
): Promise<boolean> => {
  const existingExcerpts = await ctx.db
    .query("essayExcerpts")
    .withIndex("by_essay", (q) => q.eq("essayId", essayId))
    .collect();

  const nextExcerptRecords = wordCount >= MIN_WORDS_FOR_EXCERPTS
    ? buildExcerptRecords(stripRichTextFormatting(normalizedContent), promptType)
    : [];

  if (areExcerptSetsEqual(existingExcerpts, nextExcerptRecords)) {
    return true;
  }

  const insertedIds: Id<"essayExcerpts">[] = [];
  const deletedExcerpts: Doc<"essayExcerpts">[] = [];

  try {
    for (const record of nextExcerptRecords) {
      const insertedId = await ctx.db.insert("essayExcerpts", {
        userId: essay.userId,
        essayId,
        collegeId: essay.collegeId,
        excerpt: record.excerpt,
        themes: record.themes,
        promptType: record.promptType,
      });
      insertedIds.push(insertedId);
    }

    for (const existing of existingExcerpts) {
      await ctx.db.delete(existing._id);
      deletedExcerpts.push(existing);
    }

    return true;
  } catch (error) {
    console.error("[prosemirror.onSnapshot] Failed to update excerpts; attempting rollback", {
      essayId,
      error,
    });
    await rollbackExcerptUpdate(ctx, essayId, insertedIds, deletedExcerpts);
    return false;
  }
};

const maybeCreateVersionSnapshot = async (
  ctx: MutationCtx,
  essay: Doc<"essays">,
  essayId: Id<"essays">,
  normalizedContent: string,
  wordCount: number,
  now: number,
) => {
  const recentVersions = await ctx.db
    .query("essayVersions")
    .withIndex("by_essay", (q) => q.eq("essayId", essayId))
    .order("desc")
    .take(1);

  const lastVersion = recentVersions[0];
  if (lastVersion && (lastVersion.content === normalizedContent || now - lastVersion.timestamp <= VERSION_SNAPSHOT_INTERVAL_MS)) {
    return;
  }

  await ctx.db.insert("essayVersions", {
    userId: essay.userId,
    essayId,
    content: normalizedContent,
    wordCount,
    timestamp: now,
  });
};

export const {
  getSnapshot,
  submitSnapshot,
  latestVersion,
  getSteps,
  submitSteps,
} = prosemirrorSync.syncApi<DataModel>({
  checkRead: async (ctx, id) => {
    await ensureSyncDocumentOwner(ctx as QueryCtx, id);
  },
  checkWrite: async (ctx, id) => {
    await ensureSyncDocumentOwner(ctx as MutationCtx, id);
  },
  onSnapshot: async (ctx, id, snapshot) => {
    const { essay, essayId } = await ensureSyncDocumentOwner(ctx as MutationCtx, id);
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
      try {
        await ctx.db.patch(essayId, {
          content: normalizedContent,
          wordCount,
          status,
          ...(contentChanged ? { lastUpdated: now } : {}),
        });
      } catch (error) {
        console.error("[prosemirror.onSnapshot] Failed to update essay metadata", { essayId, error });
        throw error;
      }
    }

    if (!contentChanged) {
      return;
    }

    const excerptsUpdated = await updateEssayExcerpts(
      ctx as MutationCtx,
      essay,
      essayId,
      normalizedContent,
      wordCount,
      prompt?.promptType,
    );

    if (wordCount > 0) {
      if (!excerptsUpdated) {
        console.error("[prosemirror.onSnapshot] Skipping version snapshot because excerpt update failed", {
          essayId,
        });
        return;
      }

      try {
        await maybeCreateVersionSnapshot(
          ctx as MutationCtx,
          essay,
          essayId,
          normalizedContent,
          wordCount,
          now,
        );
      } catch (error) {
        console.error("[prosemirror.onSnapshot] Failed to create version snapshot", { essayId, error });
      }
    }
  },
});

/**
 * Rotate the ProseMirror sync document generation for a given essay.
 * Called when the essay content was updated externally (e.g. via a share link)
 * and the owner's editor needs to reload a fresh sync session.
 * This intentionally disconnects other active editors on older generations.
 */
export const resetDocument = mutation({
  args: {
    id: v.string(),
    expectedGeneration: v.optional(v.number()),
  },
  returns: v.object({
    status: v.union(v.literal("reset"), v.literal("stale")),
    generation: v.number(),
    syncDocumentId: v.string(),
  }),
  handler: async (ctx, { id, expectedGeneration }) => {
    const {
      essay,
      essayId,
      requestedGeneration,
      currentGeneration,
      syncDocumentId,
    } = await ensureSyncDocumentOwner(ctx, id, { allowStaleGeneration: true });

    if (expectedGeneration !== undefined && expectedGeneration !== currentGeneration) {
      return {
        status: "stale" as const,
        generation: currentGeneration,
        syncDocumentId: buildSyncDocumentId(essayId, currentGeneration),
      };
    }

    if (requestedGeneration !== currentGeneration) {
      return {
        status: "stale" as const,
        generation: currentGeneration,
        syncDocumentId: buildSyncDocumentId(essayId, currentGeneration),
      };
    }

    const normalizedContent = normalizeRichTextForStorage(essay.content);
    const nextGeneration = currentGeneration + 1;
    const nextSyncDocumentId = buildSyncDocumentId(essayId, nextGeneration);

    await ctx.db.patch(essayId, { syncGeneration: nextGeneration });

    // Create the next generation with a clean base snapshot.
    await ctx.runMutation(
      components.prosemirrorSync.lib.submitSnapshot,
      {
        id: nextSyncDocumentId,
        version: 1,
        content: normalizedContent,
      },
    );

    // Keep old generations briefly so active editors can finish gracefully.
    await ctx.scheduler.runAfter(
      OLD_SYNC_DOCUMENT_CLEANUP_DELAY_MS,
      components.prosemirrorSync.lib.deleteDocument,
      { id: syncDocumentId },
    );

    return {
      status: "reset" as const,
      generation: nextGeneration,
      syncDocumentId: nextSyncDocumentId,
    };
  },
});
