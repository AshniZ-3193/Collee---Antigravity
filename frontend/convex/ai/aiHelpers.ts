"use node";

import { ActionCtx } from "../_generated/server";
import { api } from "../_generated/api";
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
