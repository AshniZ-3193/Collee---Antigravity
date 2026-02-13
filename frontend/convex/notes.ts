import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

import { createStoredRichTextFromPlainText } from "./richTextHelpers";
import { getUserId } from "./authHelpers";

const lensCategoryToTitle = (category: string) => {
  switch (category) {
    case "moment":
      return "A moment";
    case "observation":
      return "An observation";
    case "responsibility":
      return "A responsibility";
    case "realization":
      return "A realization";
    case "value":
      return "A value";
    case "shift":
      return "A shift";
    default:
      return "Personal note";
  }
};

export const list = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = args.userId ?? (await getUserId(ctx));
    const targetStatus = args.status ?? "active";

    const notes = await ctx.db
      .query("notesDocuments")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", targetStatus))
      .collect();

    return notes.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const get = query({
  args: {
    id: v.id("notesDocuments"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const note = await ctx.db.get(args.id);

    if (!note || note.userId !== userId) {
      return null;
    }

    return note;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.optional(v.string()),
    linkedCollegeIds: v.optional(v.array(v.id("colleges"))),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const now = Date.now();

    return await ctx.db.insert("notesDocuments", {
      userId,
      title: args.title.trim() || "Untitled",
      content: args.content ?? createStoredRichTextFromPlainText(""),
      status: "active",
      linkedCollegeIds: args.linkedCollegeIds ?? [],
      source: "manual",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("notesDocuments"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    linkedCollegeIds: v.optional(v.array(v.id("colleges"))),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const note = await ctx.db.get(args.id);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found");
    }

    const patch: {
      title?: string;
      content?: string;
      linkedCollegeIds?: Array<typeof note.linkedCollegeIds[number]>;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      patch.title = args.title.trim() || "Untitled";
    }
    if (args.content !== undefined) {
      patch.content = args.content;
    }
    if (args.linkedCollegeIds !== undefined) {
      patch.linkedCollegeIds = args.linkedCollegeIds;
    }

    await ctx.db.patch(args.id, patch);
    return { success: true };
  },
});

export const archive = mutation({
  args: {
    id: v.id("notesDocuments"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const note = await ctx.db.get(args.id);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found");
    }

    await ctx.db.patch(args.id, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const remove = mutation({
  args: {
    id: v.id("notesDocuments"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const note = await ctx.db.get(args.id);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const migratePersonalLens = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);

    const lensNotes = await ctx.db
      .query("personalLensNotes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (lensNotes.length === 0) {
      return { migratedCount: 0, skippedCount: 0, totalLensNotes: 0 };
    }

    const existingNotes = await ctx.db
      .query("notesDocuments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    let migratedCount = 0;
    let skippedCount = 0;

    for (const lensNote of lensNotes) {
      const title = lensCategoryToTitle(lensNote.category);
      const content = createStoredRichTextFromPlainText(lensNote.content);

      const alreadyMigrated = existingNotes.some(
        (note) => note.source === "migrated_personal_lens" && note.title === title && note.content === content,
      );

      if (alreadyMigrated) {
        skippedCount += 1;
        continue;
      }

      await ctx.db.insert("notesDocuments", {
        userId,
        title,
        content,
        status: "active",
        linkedCollegeIds: [],
        source: "migrated_personal_lens",
        createdAt: lensNote._creationTime,
        updatedAt: Date.now(),
      });

      migratedCount += 1;
    }

    return {
      migratedCount,
      skippedCount,
      totalLensNotes: lensNotes.length,
    };
  },
});
