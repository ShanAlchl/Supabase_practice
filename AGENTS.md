# AGENTS.md — web-supabase

> Reference for AI coding agents working on this project. Read this first before making changes.

## Project Overview

A mobile-first **private friends-circle wall** built to learn Supabase end-to-end through a real product flow.

- Users authenticate with Supabase Auth (email/password).
- Each user gets a default private circle on first login.
- Circle members can publish text/image posts, comment, react, invite others via invite codes, and receive notifications.
- The app runs in **demo mode** when Supabase credentials are missing, using purely local React state so the UI can still be inspected and interacted with.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Bundler / Dev | Vite 8 |
| Framework | React 19 (function components + hooks) |
| Language | TypeScript 6 (ES2023, DOM, bundler module resolution) |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite` plugin) |
| State (server) | TanStack Query (React Query) v5 |
| Backend | Supabase (Postgres, Auth, Storage, Realtime) |
| Icons | `lucide-react` |
| Utilities | `clsx` for class merging |

## Project Structure

```
src/
  components/ui/     # Shared UI primitives (Button, Card, Input, Dialog, Avatar, etc.)
  features/          # Domain features, each self-contained
    auth/            # useAuth hook, AuthPanel
    circles/         # CircleSwitcher
    composer/        # Post composer with image upload
    feed/            # Feed, PostCard, useRealtimeFeed
    invites/         # InviteDialog
    notifications/   # NotificationDialog
    search/          # FeedSearchBar
    settings/        # CircleSettingsDialog, ProfileSettingsDialog
    shell/           # AppShell (responsive layout)
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
    env.ts           # Vite env variable parsing
    cn.ts            # clsx wrapper for Tailwind class composition
  data/demo.ts       # Offline demo data used when Supabase is unavailable
  index.css          # Global styles, CSS variables, Tailwind import
  main.tsx           # Entry point (StrictMode + QueryClientProvider)
  App.tsx            # Root component; orchestrates auth, demo mode, and app shell

scripts/
  init.sql           # Complete Supabase bootstrap: schema, indexes, triggers,
                     # RPC functions, RLS policies, storage setup
```

## Build and Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Start Vite dev server
npm run build      # TypeScript check + production build to dist/
npm run lint       # ESLint across the project
npm run preview    # Preview the production build locally
```

There is **no test runner** configured (no Jest/Vitest/Playwright).

## Environment Configuration

Create `.env.local` in the project root with:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

If these are missing or still contain placeholder values, the app falls back to **demo mode** (`src/data/demo.ts`) and renders a notice explaining how to connect a real backend.

## Backend / Database Setup

1. Create a Supabase project.
2. Open **Supabase Dashboard → SQL Editor → New query**.
3. Paste and run `scripts/init.sql`.
4. Add your project URL and anon key to `.env.local`.
5. Restart the dev server.

The SQL script sets up:

- Tables: `profiles`, `circles`, `circle_members`, `posts`, `post_images`, `comments`, `reactions`, `circle_invites`, `notifications`
- Indexes for feed ordering, membership lookups, and search
- Triggers: auto-create profile on auth signup, auto-update `updated_at`, auto-generate notifications
- RPC functions: `create_default_circle`, `get_feed_posts`, `search_circle_posts`, `create_circle_invite`, `accept_circle_invite`, `revoke_circle_invite`, `remove_circle_member`, `mark_notification_read`, `mark_all_notifications_read`
- Row Level Security (RLS) policies on every business table
- Private Storage buckets `post-media` and `avatars` with object policies
- Realtime publication for `posts`, `comments`, and `reactions`

## Code Style and Conventions

- **TypeScript strictness**: `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` are enabled. Unused variables will fail the build.
- **Imports**: Use explicit `type` imports where appropriate. Import paths include `.ts`/`.tsx` extensions (`verbatimModuleSyntax`).
- **Components**: Write function components with explicit prop types. Avoid default exports for components (use named exports).
- **Styling**:
  - Prefer Tailwind utility classes.
  - Use CSS custom properties defined in `src/index.css` for the design system (e.g., `--color-primary`, `--color-page`, `--shadow-card`).
  - Use the `cn()` helper from `src/lib/cn.ts` to compose dynamic classes.
  - Custom reusable classes in `index.css`: `.focus-ring`, `.surface-card`, `.quiet-scrollbar`.
- **Naming**:
  - React hooks: `useFeature.ts`
  - Service functions: descriptive async verbs (`fetchPosts`, `createPost`, `toggleReaction`)
  - Domain types: PascalCase in `src/types/domain.ts` (e.g., `CircleMember`, `PaginatedResult`)
- **Query keys**: Follow TanStack Query conventions. Examples:
  - `['posts', circleId]`
  - `['posts', circleId, searchTerm]`
  - `['profile', userId]`
  - `['members', circleId]`
  - `['notifications', userId]`
- **Error messages**: User-facing strings in the UI are written in **Chinese**. Internal logs, variable names, comments, and documentation are in **English**.

## Architecture Patterns

- **Service layer**: All Supabase calls live in `src/services/`. UI components never import `@supabase/supabase-js` directly except through `src/lib/supabase.ts`.
- **Demo mode guard**: Every service function checks `if (!supabase) throw new Error('Supabase is not configured.')`.
- **Realtime invalidation**: `useRealtimeFeed` subscribes to Postgres changes for the current circle and invalidates the `['posts', circleId]` query. This keeps the feed synchronized across clients.
- **Signed URLs for storage**: The `post-media` and `avatars` buckets are private. The app resolves signed URLs on the client via `createSignedUrl()` before displaying images.
- **Image upload safety**: `storageService.ts` validates MIME types and file sizes, rolls back uploaded Storage objects if the subsequent database insert fails, and cleans up orphaned images when posts are deleted.
- **Cursor pagination**: Feed and comment queries use cursor pagination (`createdAt` + `id`) rather than offset pagination.

## Security Considerations

- **RLS is the security boundary**: All data access is enforced by Postgres RLS policies, not frontend logic. The frontend should still guard UX (e.g., hide admin buttons), but the database is the source of truth.
- **Private storage**: Images are not publicly readable. Signed URLs expire after one hour.
- **Auth tokens**: The Supabase anon key is safe to expose in the frontend; RLS policies enforce authorization. Never place the service role key in `.env.local`.
- **Invite codes**: Generated cryptographically (`gen_random_bytes`). Usage limits, expiry, and revocation are enforced server-side in `accept_circle_invite()` and `revoke_circle_invite()`.

## Deployment

- The project builds to a static site in `dist/` via Vite.
- Deploy `dist/` to any static host (e.g., Vercel, Netlify, GitHub Pages, Cloudflare Pages).
- Remember to configure the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in your hosting platform.
