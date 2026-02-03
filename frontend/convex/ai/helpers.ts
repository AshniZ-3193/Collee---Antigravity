import { QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export async function gatherUserContext(ctx: QueryCtx, userId: Id<"users">) {
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

  const storyIdentity = await ctx.db
    .query("storyIdentities")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

  const experiences = await ctx.db
    .query("experiences")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const pillars = await ctx.db
    .query("storyPillars")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const lensNotes = await ctx.db
    .query("personalLensNotes")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const essays = await ctx.db
    .query("essays")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  // Fetch prompts for each essay to get full context
  const essaysWithPrompts = await Promise.all(
    essays.map(async (essay) => {
      const prompt = await ctx.db.get(essay.promptId);
      const college = await ctx.db.get(essay.collegeId);
      return {
        ...essay,
        promptText: prompt?.text ?? "",
        promptType: prompt?.promptType,
        collegeName: college?.name ?? "",
      };
    })
  );

  const usages = await ctx.db
    .query("experienceUsages")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  return {
    profile,
    storyIdentity,
    experiences,
    pillars,
    lensNotes,
    essays: essaysWithPrompts,
    usages,
  };
}
