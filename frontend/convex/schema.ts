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
    identityHandling: v.optional(v.array(v.object({
      aspect: v.string(),
      elaboration: v.optional(v.string()),
      handling: v.string(),
    }))),
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
    schoolSlug: v.optional(v.string()),
    applicationType: v.optional(v.string()),
    deadline: v.optional(v.string()),
    sourceQualityStatus: v.optional(v.string()),
    sourceQualityScore: v.optional(v.number()),
    sourceVerifiedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  // Global canonical school directory shared across users
  globalSchools: defineTable({
    canonicalName: v.string(),
    slug: v.string(),
    status: v.string(), // 'enriching' | 'active'
    qualityStatus: v.string(), // 'unverified' | 'verified' | 'needs_review'
    qualityScore: v.optional(v.number()),
    verifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.string()), // 'system' | 'human'
    createdByUserId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"])
    .index("by_canonical_name", ["canonicalName"])
    .index("by_status_quality", ["status", "qualityStatus"]),

  // Alias mapping (e.g., UCF -> university-of-central-florida)
  schoolAliases: defineTable({
    aliasNormalized: v.string(),
    schoolSlug: v.string(),
    source: v.string(), // 'user' | 'system'
    createdAt: v.number(),
  }).index("by_alias", ["aliasNormalized"])
    .index("by_school_slug", ["schoolSlug"]),

  // Global prompts/deadlines cache with verification metadata
  globalSchoolContent: defineTable({
    schoolSlug: v.string(),
    canonicalName: v.string(),
    applicationYear: v.string(),
    promptVersion: v.string(),
    prompts: v.array(v.object({
      text: v.string(),
      wordCountMax: v.number(),
      isOptional: v.boolean(),
      promptType: v.optional(v.string()),
      targetProgram: v.optional(v.string()),
      relevantMajors: v.optional(v.array(v.string())),
    })),
    applicationTypes: v.array(v.object({
      label: v.string(),
      deadline: v.string(),
      value: v.optional(v.string()),
    })),
    sourceUrls: v.array(v.string()),
    sourceDomains: v.array(v.string()),
    cachedAt: v.number(),
    expiresAt: v.number(),
    qualityStatus: v.string(), // 'unverified' | 'verified' | 'needs_review'
    qualityScore: v.number(),
    verificationNotes: v.optional(v.string()),
    verifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.string()), // 'system' | 'human'
    lastError: v.optional(v.string()),
  }).index("by_school_year_version", ["schoolSlug", "applicationYear", "promptVersion"])
    .index("by_quality_status", ["qualityStatus"]),

  // In-flight dedupe for expensive generation jobs
  contentGenerationLocks: defineTable({
    lockKey: v.string(),
    schoolSlug: v.string(),
    applicationYear: v.string(),
    promptVersion: v.string(),
    acquiredAt: v.number(),
    expiresAt: v.number(),
  }).index("by_lock_key", ["lockKey"])
    .index("by_school_year_version", ["schoolSlug", "applicationYear", "promptVersion"]),

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
    syncGeneration: v.optional(v.number()), // ProseMirror sync session generation
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

  notesDocuments: defineTable({
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
    status: v.string(), // 'active' | 'archived'
    linkedCollegeIds: v.array(v.id("colleges")),
    source: v.string(), // 'manual' | 'migrated_personal_lens'
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

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
      targetProgram: v.optional(v.string()),
      relevantMajors: v.optional(v.array(v.string())),
    })),
    cachedAt: v.number(),
  }).index("by_college_year", ["collegeName", "applicationYear"]),

  // Shared cache of searched application deadlines (not user-scoped)
  cachedCollegeDeadlines: defineTable({
    collegeName: v.string(),
    applicationYear: v.string(),
    applicationTypes: v.array(v.object({
      label: v.string(),
      deadline: v.string(),
      value: v.optional(v.string()),
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

  // Share links for essays (permanent, no expiration)
  shares: defineTable({
    userId: v.id("users"),
    essayId: v.id("essays"),
    token: v.string(),
    // Temporarily optional to allow backfill of legacy documents.
    // TODO: Make required after backfill migration runs.
    permission: v.optional(v.string()), // 'view' | 'comment' | 'edit'
    recipientEmail: v.optional(v.string()),
    recipientType: v.optional(v.string()), // 'parent' | 'counselor'
    createdAt: v.number(),
  }).index("by_token", ["token"])
    .index("by_essay", ["essayId"])
    .index("by_user", ["userId"]),

  // Grammar preferences (dictionary + ignored rules)
  grammarPreferences: defineTable({
    userId: v.id("users"),
    customDictionary: v.array(v.string()),
    ignoredRules: v.array(v.string()),
    // Context-sensitive ignored lint hashes from Harper.
    ignoredLintHashes: v.optional(v.array(v.string())),
    // Serialized Harper lint config (JSON string).
    lintConfigJson: v.optional(v.string()),
    // Harper dialect label (American, British, etc).
    dialect: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // Inline comments on shared essays
  shareComments: defineTable({
    shareId: v.id("shares"),
    essayId: v.id("essays"),
    authorName: v.string(),
    authorEmail: v.optional(v.string()),
    content: v.string(),
    selectionStart: v.number(), // Character position start
    selectionEnd: v.number(), // Character position end
    selectedText: v.string(), // The highlighted text
    resolved: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_share", ["shareId"])
    .index("by_essay", ["essayId"]),

  // Replies to comments (threaded conversation)
  shareCommentReplies: defineTable({
    commentId: v.id("shareComments"),
    authorName: v.string(),
    authorEmail: v.optional(v.string()),
    isOwner: v.boolean(), // true if reply is from the essay owner
    content: v.string(),
    createdAt: v.number(),
  }).index("by_comment", ["commentId"]),
});
