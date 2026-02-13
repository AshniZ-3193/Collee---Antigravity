"use node";

import { ActionCtx } from "../_generated/server";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { stripRichTextFormatting } from "../richTextHelpers";
import OpenAI from "openai";

// Shared model constant - update this in one place when changing models
export const AI_MODEL = "gpt-5.2";

// Shared OpenAI client factory
export function createOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Shared authentication helper for action handlers
export async function getAuthenticatedUser(ctx: ActionCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.runQuery(api.users.getByToken, {
    tokenIdentifier: identity.tokenIdentifier,
  });
  if (!user) throw new Error("User not found");

  return user;
}

export async function getUserNotesContext(ctx: ActionCtx, userId: Id<"users">) {
  const notes = await ctx.runQuery(api.notes.list, {
    userId,
    status: "active",
  });

  if (!notes || notes.length === 0) {
    return "None";
  }

  return notes
    .slice(0, 20)
    .map((note: any) => {
      const text = stripRichTextFormatting(note.content || "")
        .replace(/\s+/g, " ")
        .trim();
      const clipped = text.length > 280 ? `${text.slice(0, 280)}...` : text;
      return `- ${note.title}: ${clipped || "(empty)"}`;
    })
    .join("\n");
}
