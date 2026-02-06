/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_aiHelpers from "../ai/aiHelpers.js";
import type * as ai_backfillLegacySchoolCache from "../ai/backfillLegacySchoolCache.js";
import type * as ai_collegeDeadlinesCache from "../ai/collegeDeadlinesCache.js";
import type * as ai_collegePromptsCache from "../ai/collegePromptsCache.js";
import type * as ai_ensureSchoolContent from "../ai/ensureSchoolContent.js";
import type * as ai_essayFeedback from "../ai/essayFeedback.js";
import type * as ai_generateEssayFeedback from "../ai/generateEssayFeedback.js";
import type * as ai_generatePromptStrategy from "../ai/generatePromptStrategy.js";
import type * as ai_generateStoryIdentity from "../ai/generateStoryIdentity.js";
import type * as ai_generateSuggestions from "../ai/generateSuggestions.js";
import type * as ai_globalSchoolContent from "../ai/globalSchoolContent.js";
import type * as ai_helpers from "../ai/helpers.js";
import type * as ai_promptStrategy from "../ai/promptStrategy.js";
import type * as ai_prompts from "../ai/prompts.js";
import type * as ai_schoolNormalization from "../ai/schoolNormalization.js";
import type * as ai_searchCollegeDeadlines from "../ai/searchCollegeDeadlines.js";
import type * as ai_searchCollegePrompts from "../ai/searchCollegePrompts.js";
import type * as ai_storyIdentityData from "../ai/storyIdentityData.js";
import type * as ai_suggestions from "../ai/suggestions.js";
import type * as authHelpers from "../authHelpers.js";
import type * as colleges from "../colleges.js";
import type * as essays from "../essays.js";
import type * as experienceBank from "../experienceBank.js";
import type * as experienceBankHelpers from "../experienceBankHelpers.js";
import type * as globalSchools from "../globalSchools.js";
import type * as personalLens from "../personalLens.js";
import type * as prosemirror from "../prosemirror.js";
import type * as richTextHelpers from "../richTextHelpers.js";
import type * as shares from "../shares.js";
import type * as storyIdentity from "../storyIdentity.js";
import type * as userProfile from "../userProfile.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai/aiHelpers": typeof ai_aiHelpers;
  "ai/backfillLegacySchoolCache": typeof ai_backfillLegacySchoolCache;
  "ai/collegeDeadlinesCache": typeof ai_collegeDeadlinesCache;
  "ai/collegePromptsCache": typeof ai_collegePromptsCache;
  "ai/ensureSchoolContent": typeof ai_ensureSchoolContent;
  "ai/essayFeedback": typeof ai_essayFeedback;
  "ai/generateEssayFeedback": typeof ai_generateEssayFeedback;
  "ai/generatePromptStrategy": typeof ai_generatePromptStrategy;
  "ai/generateStoryIdentity": typeof ai_generateStoryIdentity;
  "ai/generateSuggestions": typeof ai_generateSuggestions;
  "ai/globalSchoolContent": typeof ai_globalSchoolContent;
  "ai/helpers": typeof ai_helpers;
  "ai/promptStrategy": typeof ai_promptStrategy;
  "ai/prompts": typeof ai_prompts;
  "ai/schoolNormalization": typeof ai_schoolNormalization;
  "ai/searchCollegeDeadlines": typeof ai_searchCollegeDeadlines;
  "ai/searchCollegePrompts": typeof ai_searchCollegePrompts;
  "ai/storyIdentityData": typeof ai_storyIdentityData;
  "ai/suggestions": typeof ai_suggestions;
  authHelpers: typeof authHelpers;
  colleges: typeof colleges;
  essays: typeof essays;
  experienceBank: typeof experienceBank;
  experienceBankHelpers: typeof experienceBankHelpers;
  globalSchools: typeof globalSchools;
  personalLens: typeof personalLens;
  prosemirror: typeof prosemirror;
  richTextHelpers: typeof richTextHelpers;
  shares: typeof shares;
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

export declare const components: {
  prosemirrorSync: {
    lib: {
      deleteDocument: FunctionReference<
        "mutation",
        "internal",
        { id: string },
        null
      >;
      deleteSnapshots: FunctionReference<
        "mutation",
        "internal",
        { afterVersion?: number; beforeVersion?: number; id: string },
        null
      >;
      deleteSteps: FunctionReference<
        "mutation",
        "internal",
        {
          afterVersion?: number;
          beforeTs: number;
          deleteNewerThanLatestSnapshot?: boolean;
          id: string;
        },
        null
      >;
      getSnapshot: FunctionReference<
        "query",
        "internal",
        { id: string; version?: number },
        { content: null } | { content: string; version: number }
      >;
      getSteps: FunctionReference<
        "query",
        "internal",
        { id: string; version: number },
        {
          clientIds: Array<string | number>;
          steps: Array<string>;
          version: number;
        }
      >;
      latestVersion: FunctionReference<
        "query",
        "internal",
        { id: string },
        null | number
      >;
      submitSnapshot: FunctionReference<
        "mutation",
        "internal",
        {
          content: string;
          id: string;
          pruneSnapshots?: boolean;
          version: number;
        },
        null
      >;
      submitSteps: FunctionReference<
        "mutation",
        "internal",
        {
          clientId: string | number;
          id: string;
          steps: Array<string>;
          version: number;
        },
        | {
            clientIds: Array<string | number>;
            status: "needs-rebase";
            steps: Array<string>;
          }
        | { status: "synced" }
      >;
    };
  };
};
