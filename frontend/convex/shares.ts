import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { countRichTextWords, normalizeRichTextForStorage } from "./richTextHelpers";

// Create a new share link for an essay
export const create = mutation({
  args: {
    essayId: v.id("essays"),
    permission: v.string(), // 'view' | 'comment' | 'edit'
    recipientEmail: v.optional(v.string()),
    recipientType: v.optional(v.string()), // 'parent' | 'counselor'
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify the essay belongs to the user
    const essay = await ctx.db.get(args.essayId);
    if (!essay || essay.userId !== user._id) {
      throw new Error("Essay not found or unauthorized");
    }

    // Check if share already exists for this essay with same permission and recipient
    const existingShares = await ctx.db
      .query("shares")
      .withIndex("by_essay", (q) => q.eq("essayId", args.essayId))
      .collect();

    // Find a share with matching permission and recipient email
    const matchingShare = existingShares.find(
      (s) => s.permission === args.permission && s.recipientEmail === args.recipientEmail
    );

    if (matchingShare) {
      return { token: matchingShare.token, shareId: matchingShare._id };
    }

    // Generate unique token
    const token = crypto.randomUUID();

    // Create share record
    const shareId = await ctx.db.insert("shares", {
      userId: user._id,
      essayId: args.essayId,
      token,
      permission: args.permission,
      recipientEmail: args.recipientEmail,
      recipientType: args.recipientType,
      createdAt: Date.now(),
    });

    return { token, shareId };
  },
});

// Get share by token (public - no auth required)
export const getByToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const share = await ctx.db
      .query("shares")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!share) {
      return null;
    }

    // Get the essay
    const essay = await ctx.db.get(share.essayId);
    if (!essay) {
      return null;
    }

    // Get the prompt
    const prompt = await ctx.db.get(essay.promptId);
    if (!prompt) {
      return null;
    }

    // Get the college
    const college = await ctx.db.get(essay.collegeId);
    if (!college) {
      return null;
    }

    // Get the user (author)
    const user = await ctx.db.get(share.userId);

    return {
      shareId: share._id,
      essayId: share.essayId,
      permission: share.permission ?? "view",
      essayContent: essay.content,
      wordCount: countRichTextWords(essay.content),
      wordLimit: prompt.wordCountMax,
      promptText: prompt.text,
      collegeName: college.name,
      authorName: user?.name || "Student",
    };
  },
});

// Backfill missing permissions on legacy share documents.
export const backfillMissingPermissions = mutation({
  args: {},
  handler: async (ctx) => {
    const shares = await ctx.db.query("shares").collect();
    let updated = 0;

    for (const share of shares) {
      if (!share.permission) {
        await ctx.db.patch(share._id, { permission: "view" });
        updated += 1;
      }
    }

    return { scanned: shares.length, updated };
  },
});

// Delete a share link
export const remove = mutation({
  args: {
    shareId: v.id("shares"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify the share belongs to the user
    const share = await ctx.db.get(args.shareId);
    if (!share || share.userId !== user._id) {
      throw new Error("Share not found or unauthorized");
    }

    await ctx.db.delete(args.shareId);
    return { success: true };
  },
});

// Update essay via share link (for edit permission)
export const updateEssayViaShare = mutation({
  args: {
    token: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the share by token
    const share = await ctx.db
      .query("shares")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!share) {
      throw new Error("Share not found");
    }

    // Verify the share has edit permission
    if (share.permission !== "edit") {
      throw new Error("This share link does not have edit permission");
    }

    // Get the essay
    const essay = await ctx.db.get(share.essayId);
    if (!essay) {
      throw new Error("Essay not found");
    }

    const normalizedContent = normalizeRichTextForStorage(args.content);
    const wordCount = countRichTextWords(normalizedContent);
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

    // Update the essay
    await ctx.db.patch(share.essayId, {
      content: normalizedContent,
      wordCount,
      lastUpdated: Date.now(),
      status,
    });

    return { success: true, wordCount };
  },
});

// ===== Comment mutations =====

// Add a comment to a shared essay
export const addComment = mutation({
  args: {
    token: v.string(),
    authorName: v.string(),
    authorEmail: v.optional(v.string()),
    content: v.string(),
    selectionStart: v.number(),
    selectionEnd: v.number(),
    selectedText: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the share by token
    const share = await ctx.db
      .query("shares")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!share) {
      throw new Error("Share not found");
    }

    // Verify the share has comment or edit permission
    if (share.permission !== "comment" && share.permission !== "edit") {
      throw new Error("This share link does not have comment permission");
    }

    const now = Date.now();

    // Create the comment
    const commentId = await ctx.db.insert("shareComments", {
      shareId: share._id,
      essayId: share.essayId,
      authorName: args.authorName,
      authorEmail: args.authorEmail,
      content: args.content,
      selectionStart: args.selectionStart,
      selectionEnd: args.selectionEnd,
      selectedText: args.selectedText,
      resolved: false,
      createdAt: now,
      updatedAt: now,
    });

    return { commentId };
  },
});

// Get all comments for a share (by token - for reviewers)
export const getComments = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the share by token
    const share = await ctx.db
      .query("shares")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!share) {
      return [];
    }

    // Get all comments for this share
    const comments = await ctx.db
      .query("shareComments")
      .withIndex("by_share", (q) => q.eq("shareId", share._id))
      .collect();

    // Sort by creation time (newest first for resolved, oldest first for active)
    return comments.sort((a, b) => {
      if (a.resolved !== b.resolved) {
        return a.resolved ? 1 : -1; // Active comments first
      }
      return a.createdAt - b.createdAt; // Then by creation time
    });
  },
});

// Get all comments for an essay (by essay ID - for essay owner)
export const getCommentsForEssay = query({
  args: {
    essayId: v.id("essays"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return [];
    }

    // Verify the essay belongs to the user
    const essay = await ctx.db.get(args.essayId);
    if (!essay || essay.userId !== user._id) {
      return [];
    }

    // Get all comments for this essay across all shares
    const comments = await ctx.db
      .query("shareComments")
      .withIndex("by_essay", (q) => q.eq("essayId", args.essayId))
      .collect();

    // Sort by creation time (active first, then by time)
    return comments.sort((a, b) => {
      if (a.resolved !== b.resolved) {
        return a.resolved ? 1 : -1;
      }
      return a.createdAt - b.createdAt;
    });
  },
});

// Add a reply as the essay owner
export const addOwnerReply = mutation({
  args: {
    commentId: v.id("shareComments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Verify the essay belongs to the user
    const essay = await ctx.db.get(comment.essayId);
    if (!essay || essay.userId !== user._id) {
      throw new Error("Not authorized to reply to this comment");
    }

    // Create the reply with isOwner = true
    const replyId = await ctx.db.insert("shareCommentReplies", {
      commentId: args.commentId,
      authorName: user.name,
      authorEmail: user.email,
      isOwner: true,
      content: args.content,
      createdAt: Date.now(),
    });

    return { replyId };
  },
});

// Resolve a comment as the essay owner
export const resolveCommentAsOwner = mutation({
  args: {
    commentId: v.id("shareComments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get the comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Verify the essay belongs to the user
    const essay = await ctx.db.get(comment.essayId);
    if (!essay || essay.userId !== user._id) {
      throw new Error("Not authorized");
    }

    // Toggle resolved status
    await ctx.db.patch(args.commentId, {
      resolved: !comment.resolved,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Resolve a comment
export const resolveComment = mutation({
  args: {
    token: v.string(),
    commentId: v.id("shareComments"),
  },
  handler: async (ctx, args) => {
    // Find the share by token
    const share = await ctx.db
      .query("shares")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!share) {
      throw new Error("Share not found");
    }

    // Get the comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment || comment.shareId !== share._id) {
      throw new Error("Comment not found");
    }

    // Toggle resolved status
    await ctx.db.patch(args.commentId, {
      resolved: !comment.resolved,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete a comment
export const deleteComment = mutation({
  args: {
    token: v.string(),
    commentId: v.id("shareComments"),
  },
  handler: async (ctx, args) => {
    // Find the share by token
    const share = await ctx.db
      .query("shares")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!share) {
      throw new Error("Share not found");
    }

    // Get the comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment || comment.shareId !== share._id) {
      throw new Error("Comment not found");
    }

    // Delete all replies first
    const replies = await ctx.db
      .query("shareCommentReplies")
      .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
      .collect();
    
    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }

    await ctx.db.delete(args.commentId);
    return { success: true };
  },
});

// ===== Reply mutations =====

// Add a reply to a comment
export const addReply = mutation({
  args: {
    token: v.string(),
    commentId: v.id("shareComments"),
    authorName: v.string(),
    authorEmail: v.optional(v.string()),
    isOwner: v.boolean(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the share by token
    const share = await ctx.db
      .query("shares")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!share) {
      throw new Error("Share not found");
    }

    // Get the comment to verify it belongs to this share
    const comment = await ctx.db.get(args.commentId);
    if (!comment || comment.shareId !== share._id) {
      throw new Error("Comment not found");
    }

    // Create the reply
    const replyId = await ctx.db.insert("shareCommentReplies", {
      commentId: args.commentId,
      authorName: args.authorName,
      authorEmail: args.authorEmail,
      isOwner: args.isOwner,
      content: args.content,
      createdAt: Date.now(),
    });

    return { replyId };
  },
});

// Get replies for a comment
export const getReplies = query({
  args: {
    commentId: v.id("shareComments"),
  },
  handler: async (ctx, args) => {
    const replies = await ctx.db
      .query("shareCommentReplies")
      .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
      .collect();

    return replies.sort((a, b) => a.createdAt - b.createdAt);
  },
});

// Delete a reply
export const deleteReply = mutation({
  args: {
    token: v.string(),
    replyId: v.id("shareCommentReplies"),
  },
  handler: async (ctx, args) => {
    // Find the share by token
    const share = await ctx.db
      .query("shares")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!share) {
      throw new Error("Share not found");
    }

    // Get the reply
    const reply = await ctx.db.get(args.replyId);
    if (!reply) {
      throw new Error("Reply not found");
    }

    // Verify the reply's comment belongs to this share
    const comment = await ctx.db.get(reply.commentId);
    if (!comment || comment.shareId !== share._id) {
      throw new Error("Reply not found");
    }

    await ctx.db.delete(args.replyId);
    return { success: true };
  },
});
