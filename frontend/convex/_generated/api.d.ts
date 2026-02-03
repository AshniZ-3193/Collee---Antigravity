/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_collegeDeadlinesCache from "../ai/collegeDeadlinesCache.js";
import type * as ai_collegePromptsCache from "../ai/collegePromptsCache.js";
import type * as ai_essayFeedback from "../ai/essayFeedback.js";
import type * as ai_generateEssayFeedback from "../ai/generateEssayFeedback.js";
import type * as ai_generatePromptStrategy from "../ai/generatePromptStrategy.js";
import type * as ai_generateStoryIdentity from "../ai/generateStoryIdentity.js";
import type * as ai_generateSuggestions from "../ai/generateSuggestions.js";
import type * as ai_helpers from "../ai/helpers.js";
import type * as ai_promptStrategy from "../ai/promptStrategy.js";
import type * as ai_prompts from "../ai/prompts.js";
import type * as ai_searchCollegeDeadlines from "../ai/searchCollegeDeadlines.js";
import type * as ai_searchCollegePrompts from "../ai/searchCollegePrompts.js";
import type * as ai_storyIdentityData from "../ai/storyIdentityData.js";
import type * as ai_suggestions from "../ai/suggestions.js";
import type * as authHelpers from "../authHelpers.js";
import type * as colleges from "../colleges.js";
import type * as essays from "../essays.js";
import type * as experienceBank from "../experienceBank.js";
import type * as experienceBankHelpers from "../experienceBankHelpers.js";
import type * as personalLens from "../personalLens.js";
import type * as storyIdentity from "../storyIdentity.js";
import type * as userProfile from "../userProfile.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai/collegeDeadlinesCache": typeof ai_collegeDeadlinesCache;
  "ai/collegePromptsCache": typeof ai_collegePromptsCache;
  "ai/essayFeedback": typeof ai_essayFeedback;
  "ai/generateEssayFeedback": typeof ai_generateEssayFeedback;
  "ai/generatePromptStrategy": typeof ai_generatePromptStrategy;
  "ai/generateStoryIdentity": typeof ai_generateStoryIdentity;
  "ai/generateSuggestions": typeof ai_generateSuggestions;
  "ai/helpers": typeof ai_helpers;
  "ai/promptStrategy": typeof ai_promptStrategy;
  "ai/prompts": typeof ai_prompts;
  "ai/searchCollegeDeadlines": typeof ai_searchCollegeDeadlines;
  "ai/searchCollegePrompts": typeof ai_searchCollegePrompts;
  "ai/storyIdentityData": typeof ai_storyIdentityData;
  "ai/suggestions": typeof ai_suggestions;
  authHelpers: typeof authHelpers;
  colleges: typeof colleges;
  essays: typeof essays;
  experienceBank: typeof experienceBank;
  experienceBankHelpers: typeof experienceBankHelpers;
  personalLens: typeof personalLens;
  storyIdentity: typeof storyIdentity;
  userProfile: typeof userProfile;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
