import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new share link for an essay
export const create = mutation({
  args: {
    essayId: v.id("essays"),
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

    // Check if share already exists for this essay
    const existingShare = await ctx.db
      .query("shares")
      .withIndex("by_essay", (q) => q.eq("essayId", args.essayId))
      .first();

    if (existingShare) {
      return { token: existingShare.token, shareId: existingShare._id };
    }

    // Generate unique token
    const token = crypto.randomUUID();

    // Create share record
    const shareId = await ctx.db.insert("shares", {
      userId: user._id,
      essayId: args.essayId,
      token,
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
      essayContent: essay.content,
      wordCount: essay.wordCount,
      promptText: prompt.text,
      collegeName: college.name,
      authorName: user?.name || "Student",
    };
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
