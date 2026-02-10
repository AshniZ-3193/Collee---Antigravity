# Collee - MVP

Your personal admissions copilot.

Collee helps students manage college essays end-to-end: onboarding, prompt strategy, writing, AI feedback, sharing for review, and export.

## Recent Updates In This Repo

- Added a rich-text essay editor powered by **Tiptap** with **Convex ProseMirror sync**.
- Added Convex component wiring in `frontend/convex/convex.config.ts` and sync handlers in `frontend/convex/prosemirror.ts`.
- Added rich-text normalization/parsing/rendering utilities:
  - Backend: `frontend/convex/richTextHelpers.ts`
  - Frontend: `frontend/src/lib/richText.ts`
- Replaced workspace textarea editing with synced `SyncEssayEditor` (`frontend/src/components/editor/SyncEssayEditor.tsx`).
- Added external-change handling so owner editors refresh when essays are updated through shared edit links.
- Updated sharing and review screens to support rich-text content correctly:
  - View mode renders formatted essay HTML.
  - Comment mode maps selections against plain-text offsets from rich text.
  - Edit mode uses rich-text editing with autosave.
- Updated AI context building and smart-suggestion inputs to use plain text extracted from rich-text content.
- Updated share-link creation flow to pass explicit permission defaults in export flow.

## Project Structure

- `frontend/` Vite + React TypeScript app.
- `frontend/src/main.tsx` App bootstrap (PostHog, Clerk, Convex, theme providers).
- `frontend/src/App.tsx` Route map:
  - `/` main product flow
  - `/screens` screen showcase
  - `/sso-callback` Clerk callback
  - `/share/:token` permission-based shared essay page
- `frontend/src/pages/` Route-level pages.
- `frontend/src/components/screens/` Main product and share-mode screens.
- `frontend/src/components/editor/SyncEssayEditor.tsx` Tiptap + Convex sync wrapper for essays.
- `frontend/src/lib/richText.ts` Rich-text parsing, rendering, and plain-text extraction utilities.
- `frontend/convex/` Convex backend functions (queries, mutations, actions).
- `frontend/convex/convex.config.ts` Convex app config enabling `@convex-dev/prosemirror-sync`.
- `frontend/convex/prosemirror.ts` Sync API handlers, snapshot hooks, and sync reset mutation.
- `frontend/convex/richTextHelpers.ts` Server-side rich-text utilities.
- `frontend/convex/schema.ts` Convex schema.

## App Flow

1. **Bootstrap** (`frontend/src/main.tsx`)
- Initializes providers for Clerk, Convex, PostHog, and theming.

2. **Routing** (`frontend/src/App.tsx`)
- Main app at `/`.
- Shared essay route at `/share/:token` routes users into view/comment/edit modes based on share permission.

3. **Auth + Onboarding** (`frontend/src/pages/Index.tsx`)
- Clerk session syncs to Convex via `useStoreUserEffect`.
- If onboarding is complete, user lands in workspace; otherwise onboarding sequence runs.

4. **Workspace** (`frontend/src/components/screens/ColleeWorkspace.tsx`)
- College/prompt management, AI guidance, version history, feedback, export, and sharing.
- Essay editing uses `SyncEssayEditor` with ProseMirror sync state.
- Word count/status/versioning/excerpt generation stay in sync via Convex snapshot handling.

5. **Share Flow** (`frontend/src/pages/SharePage.tsx`)
- `view`: read-only formatted essay.
- `comment`: inline comment selection/highlighting + threaded replies.
- `edit`: rich-text editing with autosave through token-scoped mutation.

## Backend Architecture

```text
 +--------------------------+                          +-----------------------+
 |          Clerk           |                          |      OpenAI API       |
 |    Auth + Session JWT    |                          |-----------------------|
 +------------+-------------+                          | story identity        |
              |                                        | prompt strategies     |
              | tokenIdentifier                        | smart suggestions     |
              v                                        | essay feedback        |
 +------------+-----------+   RPC    +-----------------+-----------------------+
 |                        |<-------->|                                         |
 |   Frontend (React)     |         |            Convex Backend               |
 |                        |          |                                         |
 |  - App routes          |          |  Queries / Mutations                    |
 |  - Workspace + editor  |          |  .- users, userProfile, colleges       |
 |  - Share page          |          |  .- essays, shares, storyIdentity      |
 |                        |          |  .- experienceBank, personalLens       |
 +------------+-----------+          |                                         |
              |                      |  ProseMirror Sync                       |
              | public               |  .- get / submitSnapshot               |
              | share token          |  .- steps / reset                      |
              v                      |                                         |
 +----------------------------+      |  Node Actions (AI + enrichment)         |
 | Token-Scoped Share Layer   |      |  .- generateStoryIdentity              |
 |----------------------------|      |  .- PromptStrategy / Suggestions       |
 | getByToken                 |      |  .- EssayFeedback / SchoolContent      |
 | addComment / replies       |      |                                         |
 | updateEssayViaShare        +----->|                                         |
 +----------------------------+      +-----------+-----------------------------+
                                                 |
                                                 | read / write
                                                 v
 +-----------------------------------------------------------------------+
 |                          Convex DB Tables                             |
 |-----------------------------------------------------------------------|
 |  Identity : users, userProfiles, storyIdentities                      |
 |  Writing  : colleges, prompts, essays, essayVersions, essayExcerpts   |
 |  Sharing  : shares, shareComments, shareCommentReplies                |
 |  AI Cache : globalSchools, globalSchoolContent, generationLocks       |
 +-----------------------------------+-----------------------------------+
                                     |
                                     | school prompt / deadline enrichment
                                     v
                        +----------------------------+
                        |      Exa Search API        |
                        |----------------------------|
                        | sources for prompts and    |
                        | application deadlines      |
                        +----------------------------+
```

## Rich-Text + Sync Notes

- `essays.content` is persisted as normalized ProseMirror JSON (string).
- Legacy plain/markdown-like essay content is normalized for compatibility.
- Word counts are computed from plain text extracted from rich-text docs.
- Convex `prosemirror.onSnapshot` updates:
  - `essays.content`, `wordCount`, `status`, `lastUpdated`
  - `essayVersions` (throttled snapshot history)
  - `essayExcerpts` (rebuilt from plain text for smart reuse)
- `prosemirror.resetDocument` is used when external edits invalidate local sync state.

## Data Model (Convex)

Core tables include:

- `users`, `userProfiles`, `storyIdentities`
- `colleges`, `prompts`, `essays`, `essayVersions`
- `experiences`, `storyPillars`, `personalLensNotes`
- `storySuggestions`, `promptStrategies`, `essayFeedback`
- `essayExcerpts`, `experienceUsages`
- `shares`, `shareComments`, `shareCommentReplies`
- `cachedCollegePrompts`, `cachedCollegeDeadlines`

## Environment Variables

- `OPENAI_API_KEY` (required for AI actions)
- `VITE_CONVEX_URL`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_PUBLIC_POSTHOG_KEY`
- `VITE_PUBLIC_POSTHOG_HOST`

## Local Development

1. `cd frontend`
2. `npm install`
3. In terminal 1: `npx convex dev`
4. In terminal 2: `npm run dev`
5. Open `http://localhost:8080`

testing
