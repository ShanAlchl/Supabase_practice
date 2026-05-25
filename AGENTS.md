<!-- From: c:\Users\Administrator\Documents\Codex\2026-05-22\web-supabase\AGENTS.md -->
# AGENTS.md — web-supabase

> Reference for AI coding agents working on this project. Read this first before making changes.

## Project Overview

A mobile-first **private friends-circle wall** built to learn Supabase end-to-end through a real product flow.

- Users authenticate with Supabase Auth (email/password).
- Each user gets a default private circle on first login via the `create_default_circle()` RPC.
- Circle members can publish text/image posts, comment (with nested replies), react, pin posts, invite others via cryptographically generated invite codes, and receive realtime notifications.
- The app runs in **demo mode** when Supabase credentials are missing, using purely local React state so the UI can still be inspected and interacted with.
- Multiple circles are supported at the data layer; the UI currently opens the default circle first and allows switching between circles the user belongs to.

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Bundler / Dev | Vite | 8 |
| Framework | React | 19 (function components + hooks) |
| Language | TypeScript | ~6.0.2 (ES2023, DOM, bundler module resolution) |
| Styling | Tailwind CSS | 4 (via `@tailwindcss/vite` plugin) |
| State (server) | TanStack Query (React Query) | v5 |
| Backend | Supabase | Postgres, Auth, Storage, Realtime |
| Icons | `lucide-react` | ^1.16.0 |
| Utilities | `clsx` | ^2.1.1 |

## Project Structure

```
src/
  components/ui/     # Shared UI primitives (Button, Card, Input, Dialog, Drawer,
                     # Avatar, AvatarGroup, Badge, EmptyState, Notice, SafeImage,
                     # Skeleton, Textarea)
  features/          # Domain features, each self-contained
    app/             # DemoApp, LoadingScreen, PrivateCircleApp, SetupError,
                     # plus orchestration hooks (useComposerFocus,
                     # usePrivateCircleDialogs, usePrivateCircleMutations,
                     # usePrivateCircleQueries)
    auth/            # useAuth hook, AuthPanel
    circles/         # CircleSwitcher
    composer/        # Post composer with image upload
    feed/            # Feed, PostCard, useRealtimeFeed
    invites/         # InviteDialog
    notifications/   # NotificationDialog
    search/          # FeedSearchBar
    settings/        # CircleSettingsDialog, MembersDialog, ProfileSettingsDialog
    shell/           # AppShell (responsive layout with left rail, main column,
                     # right rail, mobile header, mobile navigation)
  services/          # Supabase data access layer
    feedService.ts
    commentService.ts
    circleService.ts
    inviteService.ts
    notificationService.ts
    profileService.ts
    storageService.ts
  types/domain.ts    # Core domain types (Post, Profile, Circle, Comment, etc.)
  lib/               # Infrastructure clients and helpers
    supabase.ts      # Supabase client singleton
    queryClient.ts   # TanStack Query client with default options
    queryKeys.ts     # Centralized TanStack Query key factory
    env.ts           # Vite env variable parsing
    cn.ts            # clsx wrapper for Tailwind class composition
    errors.ts        # Error message normalization helper
  data/demo.ts       # Offline demo data used when Supabase is unavailable
  hooks/             # Shared generic React hooks
    useObjectUrls.ts # Creates and revokes blob URLs for file previews
  utils/             # Shared utility functions
    time.ts          # Relative time formatting
  index.css          # Global styles, CSS variables, Tailwind import, animations
  main.tsx           # Entry point (StrictMode + QueryClientProvider)
  App.tsx            # Root component; orchestrates auth, demo mode, and app shell

scripts/
  init.sql           # Complete Supabase bootstrap: schema, indexes, triggers,
                     # RPC functions, RLS policies, storage setup
  migrations/        # Incremental backend upgrades (currently empty)
```

## Build and Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Start Vite dev server
npm run build      # TypeScript check + production build to dist/
npm run lint       # ESLint across the project
npm run preview    # Preview the production build locally
```

There is **no test runner** currently configured (no Jest/Vitest/Playwright). See `IMPROVEMENT_PLAN.md` Phase 6 for the planned test infrastructure.

## Environment Configuration

Create `.env.local` in the project root with:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The app detects missing or placeholder values in `src/lib/env.ts` and falls back to **demo mode** (`src/data/demo.ts`) when:
- `VITE_SUPABASE_URL` is missing or contains `your-project`
- `VITE_SUPABASE_ANON_KEY` is missing or equals `your-anon-key`

In demo mode, a notice banner explains how to connect a real backend.

## Backend / Database Setup

1. Create a Supabase project.
2. Open **Supabase Dashboard → SQL Editor → New query**.
3. Paste and run `scripts/init.sql`.
4. Add your project URL and anon key to `.env.local`.
5. Restart the dev server.

The SQL script sets up:

- **Tables**: `profiles`, `circles`, `circle_members`, `posts`, `post_images`, `comments`, `reactions`, `circle_invites`, `notifications`
- **Indexes** for feed ordering, membership lookups, and search
- **Triggers**:
  - Auto-create profile on auth signup
  - Auto-update `updated_at`
  - Auto-generate notifications on reactions, comments, and invite acceptance
- **RPC functions**:
  - `create_default_circle` — atomically creates a default circle and owner membership for first-time users
  - `get_feed_posts` — cursor-paginated feed with author, images, comment count, reaction count, and viewer reaction state
  - `search_circle_posts` — keyword search within a circle with cursor pagination
  - `create_circle_invite`, `accept_circle_invite`, `revoke_circle_invite`
  - `remove_circle_member`
  - `mark_notification_read`, `mark_all_notifications_read`
  - `toggle_pin_post`
- **Row Level Security (RLS)** policies on every business table
- **Private Storage buckets** `post-media` and `avatars` with object-level policies
- **Realtime publication** for `posts`, `comments`, and `reactions`

## Code Style and Conventions

- **TypeScript strictness**: `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` are enabled. Unused variables will fail the build.
- **Imports**: Use explicit `type` imports where appropriate. Import paths include `.ts`/`.tsx` extensions (`verbatimModuleSyntax`).
- **Components**: Write function components with explicit prop types. Avoid default exports for components (use named exports). `App.tsx` is the only default export.
- **Styling**:
  - Prefer Tailwind utility classes.
  - Use CSS custom properties defined in `src/index.css` for the design system (e.g., `--color-primary`, `--color-page`, `--shadow-card`).
  - Use the `cn()` helper from `src/lib/cn.ts` to compose dynamic classes.
  - Custom reusable classes in `index.css`: `.focus-ring`, `.surface-card`, `.quiet-scrollbar`.
- **Naming**:
  - React hooks: `useFeature.ts`
  - Service functions: descriptive async verbs (`fetchPosts`, `createPost`, `toggleReaction`)
  - Domain types: PascalCase in `src/types/domain.ts` (e.g., `CircleMember`, `PaginatedResult`)
- **Query keys**: Follow TanStack Query conventions. Centralized in `src/lib/queryKeys.ts`. Examples:
  - `['posts', circleId]`
  - `['posts', circleId, searchTerm]`
  - `['profile', userId]`
  - `['members', circleId]`
  - `['notifications', userId]`
- **Error messages**: User-facing strings in the UI are written in **Chinese**. Internal logs, variable names, comments, and documentation are in **English**.

## Architecture Patterns

- **Service layer**: All Supabase calls live in `src/services/`. UI components never import `@supabase/supabase-js` directly except through `src/lib/supabase.ts`.
- **Demo mode guard**: Every service function checks `if (!supabase) throw new Error('Supabase is not configured.')`.
- **Realtime invalidation**:
  - `useRealtimeFeed` subscribes to Postgres changes for the current circle and invalidates the `['posts', circleId]` query.
  - `usePrivateCircleQueries` subscribes to notification changes for the current user and invalidates the notifications query.
- **Signed URLs for storage**: The `post-media` and `avatars` buckets are private. The app resolves signed URLs on the client via `createSignedUrl()` (1-hour expiry) before displaying images.
- **Image upload safety**: `storageService.ts` validates MIME types and file sizes, rolls back uploaded Storage objects if the subsequent database insert fails, and cleans up orphaned images when posts are deleted.
- **Cursor pagination**: Feed, comments, and notifications all use cursor pagination (`createdAt` + `id`) rather than offset pagination.
- **Optimistic updates**: The reaction toggle mutation uses TanStack Query optimistic updates to immediately flip the heart icon while the request is in flight.
- **Feature orchestration**: `PrivateCircleApp` composes domain features together. It delegates queries to `usePrivateCircleQueries`, mutations to `usePrivateCircleMutations`, and dialog state to `usePrivateCircleDialogs`.

## Security Considerations

- **RLS is the security boundary**: All data access is enforced by Postgres RLS policies, not frontend logic. The frontend still guards UX (e.g., hide admin buttons), but the database is the source of truth.
- **Private storage**: Images are not publicly readable. Signed URLs expire after one hour.
- **Auth tokens**: The Supabase anon key is safe to expose in the frontend; RLS policies enforce authorization. Never place the service role key in `.env.local`.
- **Invite codes**: Generated cryptographically (`gen_random_bytes` in SQL, `crypto.getRandomValues` in frontend fallback). Usage limits, expiry, and revocation are enforced server-side in `accept_circle_invite()` and `revoke_circle_invite()`.

## Testing Strategy

The project currently has **no automated tests**. The `IMPROVEMENT_PLAN.md` outlines a future Phase 6 to add:
- Vitest for unit tests
- Playwright for E2E tests against demo mode

Until then, manual verification is required:
- Run `npm run build` to verify TypeScript strictness
- Run `npm run lint` to verify ESLint compliance
- Test demo mode when UI changes touch shared components
- Test Supabase mode when changes touch data, auth, storage, RLS, RPC, or Realtime

## Deployment

- The project builds to a static site in `dist/` via Vite.
- Deploy `dist/` to any static host (e.g., Vercel, Netlify, GitHub Pages, Cloudflare Pages).
- Remember to configure the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in your hosting platform.

## Notable Files for Agents

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root routing: demo → loading → auth → app |
| `src/features/app/PrivateCircleApp.tsx` | Main app orchestrator; wires queries, mutations, dialogs, and shell |
| `src/lib/queryKeys.ts` | Single source of truth for all TanStack Query cache keys |
| `src/lib/errors.ts` | `getErrorMessage(error, fallback)` — normalize errors for UI display |
| `src/data/demo.ts` | Demo circle, members, and posts used when Supabase is unavailable |
| `scripts/init.sql` | Full database bootstrap; keep in sync with any schema or RPC changes |
| `IMPROVEMENT_PLAN.md` | 8-phase roadmap for future features and infrastructure improvements |
