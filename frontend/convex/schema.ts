import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users synced from Clerk
  users: defineTable({
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"])
    .index("by_clerk_id", ["clerkId"]),

  // Full onboarding profile
  userProfiles: defineTable({
    userId: v.id("users"),
    activitiesText: v.optional(v.string()),
    primaryInterests: v.optional(v.array(v.string())),
    secondaryInterest: v.optional(v.string()),
    orientation: v.optional(v.array(v.string())),
    motivation: v.optional(v.array(v.string())),
    storyPreference: v.optional(v.array(v.string())),
    socialRole: v.optional(v.array(v.string())),
    writingTone: v.optional(v.string()),
    identityAspects: v.optional(v.array(v.string())),
    identityHandling: v.optional(v.string()),
    reflection: v.optional(v.string()),
    onboardingComplete: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  // AI-generated story identity
  storyIdentities: defineTable({
    userId: v.id("users"),
    angle: v.string(),
    distinct: v.string(),
    voiceTone: v.string(),
    voiceStyle: v.string(),
    cautions: v.array(v.string()),
    writingReminders: v.array(v.string()),
  }).index("by_user", ["userId"]),

  // User experiences with tags and pillar links
  experiences: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    tags: v.array(v.string()),
    storyPillar: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // Theme pillars from story identity
  storyPillars: defineTable({
    userId: v.id("users"),
    theme: v.string(),
    description: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // College list
  colleges: defineTable({
    userId: v.id("users"),
    name: v.string(),
    applicationType: v.optional(v.string()),
    deadline: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // Essay prompts per college
  prompts: defineTable({
    userId: v.id("users"),
    collegeId: v.id("colleges"),
    text: v.string(),
    wordCountMax: v.number(),
    isOptional: v.boolean(),
    promptType: v.optional(v.string()),
  }).index("by_college", ["collegeId"])
    .index("by_user", ["userId"]),

  // Essays
  essays: defineTable({
    userId: v.id("users"),
    promptId: v.id("prompts"),
    collegeId: v.id("colleges"),
    content: v.string(),
    status: v.string(), // 'not-started' | 'in-progress' | 'complete'
    wordCount: v.number(),
    lastUpdated: v.number(), // timestamp
  }).index("by_prompt", ["promptId"])
    .index("by_college", ["collegeId"])
    .index("by_user", ["userId"]),

  // Version history snapshots
  essayVersions: defineTable({
    userId: v.id("users"),
    essayId: v.id("essays"),
    content: v.string(),
    wordCount: v.number(),
    timestamp: v.number(),
  }).index("by_essay", ["essayId"]),

  // Personal lens reflections
  personalLensNotes: defineTable({
    userId: v.id("users"),
    content: v.string(),
    category: v.string(), // 'moment' | 'observation' | 'responsibility' | 'realization' | 'value' | 'shift'
  }).index("by_user", ["userId"]),

  // AI-generated story suggestions
  storySuggestions: defineTable({
    userId: v.id("users"),
    promptId: v.optional(v.id("prompts")),
    experienceId: v.optional(v.id("experiences")),
    experienceName: v.string(),
    storyPillar: v.optional(v.string()),
    matchStrength: v.string(), // 'strong' | 'moderate'
    whyItFitsThisPrompt: v.string(),
    framingGuidance: v.array(v.string()),
    startWith: v.optional(v.string()),
    focusOn: v.optional(v.string()),
    avoidFocus: v.optional(v.string()),
    starterSentences: v.optional(v.array(v.string())),
  }).index("by_user", ["userId"])
    .index("by_prompt", ["promptId"]),

  // Track which experience used in which essay
  experienceUsages: defineTable({
    userId: v.id("users"),
    experienceId: v.id("experiences"),
    essayId: v.id("essays"),
    collegeId: v.id("colleges"),
  }).index("by_user", ["userId"])
    .index("by_experience", ["experienceId"])
    .index("by_essay", ["essayId"]),

  // Excerpts for Smart Reuse feature
  essayExcerpts: defineTable({
    userId: v.id("users"),
    essayId: v.id("essays"),
    collegeId: v.id("colleges"),
    excerpt: v.string(),
    themes: v.array(v.string()),
    promptType: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_essay", ["essayId"]),

  // Shared cache of searched prompts (not user-scoped)
  cachedCollegePrompts: defineTable({
    collegeName: v.string(),
    applicationYear: v.string(),
    prompts: v.array(v.object({
      text: v.string(),
      wordCountMax: v.number(),
      isOptional: v.boolean(),
      promptType: v.optional(v.string()),
    })),
    cachedAt: v.number(),
  }).index("by_college_year", ["collegeName", "applicationYear"]),

  // AI-generated per-prompt approach guidance
  promptStrategies: defineTable({
    userId: v.id("users"),
    promptId: v.id("prompts"),
    approach: v.string(),
    experienceMatches: v.array(v.object({
      experienceId: v.id("experiences"),
      experienceName: v.string(),
      matchStrength: v.string(),
      whyItFits: v.string(),
      framingTips: v.array(v.string()),
      caution: v.optional(v.string()),
      startWith: v.optional(v.string()),
      focusOn: v.optional(v.string()),
      avoidFocus: v.optional(v.string()),
      starterSentences: v.optional(v.array(v.string())),
    })),
  }).index("by_prompt", ["promptId"])
    .index("by_user", ["userId"]),

  // AI coaching feedback per essay
  essayFeedback: defineTable({
    userId: v.id("users"),
    essayId: v.id("essays"),
    feedbackType: v.string(), // 'overall' | 'opening' | 'structure' | 'voice' | 'specificity'
    feedback: v.string(),
    timestamp: v.number(),
  }).index("by_essay", ["essayId"])
    .index("by_user", ["userId"]),
});
