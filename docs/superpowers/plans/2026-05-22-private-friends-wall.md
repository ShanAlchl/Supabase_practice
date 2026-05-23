# Private Friends Wall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private friends-circle wall that teaches Supabase Auth, Postgres, RLS, Storage, and Realtime through one usable web app.

**Architecture:** Use Vite + React + TypeScript as the frontend shell, with Supabase as the full backend. Keep UI components separate from Supabase service functions so the app can later move toward a native app or mini-program client.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, TanStack Query, lucide-react, Supabase JS, Supabase Postgres, Storage, Auth, Realtime.

---

### Task 1: Project Foundation

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/index.css`
- Create: `.env.example`

- [x] Scaffold Vite React TypeScript.
- [x] Install `@supabase/supabase-js`, `@tanstack/react-query`, `lucide-react`, `clsx`, `tailwindcss`, and `@tailwindcss/vite`.
- [x] Configure Tailwind through the Vite plugin.
- [x] Wrap the app in `QueryClientProvider`.
- [x] Add `.env.example` with Supabase URL and anon key placeholders.

### Task 2: Supabase Schema and Policies

**Files:**
- Create: `scripts/init.sql`

- [x] Create profiles, circles, circle_members, posts, post_images, comments, and reactions tables.
- [x] Add indexes for membership lookups, feed ordering, joins, comments, and reactions.
- [x] Add profile creation trigger for new Auth users.
- [x] Add membership helper functions for RLS policies.
- [x] Enable RLS and define table policies.
- [x] Create private `post-media` Storage bucket and object policies.
- [x] Add posts, comments, and reactions to Supabase Realtime publication idempotently.

### Task 3: Auth and App Shell

**Files:**
- Create: `src/features/auth/useAuth.ts`
- Create: `src/features/auth/AuthPanel.tsx`
- Create: `src/features/shell/AppShell.tsx`

- [x] Read Supabase session state and subscribe to auth changes.
- [x] Build email/password login and signup UI.
- [x] Build responsive app shell: mobile header/bottom nav and desktop sidebars.
- [x] Add demo mode when Supabase credentials are missing.

### Task 4: Data Services

**Files:**
- Create: `src/services/profileService.ts`
- Create: `src/services/feedService.ts`
- Create: `src/services/storageService.ts`
- Create: `src/types/domain.ts`

- [x] Ensure profile rows after login.
- [x] Create a default private circle for first-time users.
- [x] Fetch members and feed posts with nested authors, images, comments, and reactions.
- [x] Upload images to private Storage and resolve signed URLs for display.
- [x] Create posts, comments, and reaction toggles.

### Task 5: Feed UI

**Files:**
- Create: `src/features/composer/Composer.tsx`
- Create: `src/features/feed/Feed.tsx`
- Create: `src/features/feed/PostCard.tsx`
- Create: `src/features/feed/useRealtimeFeed.ts`
- Create: `src/components/ui/Avatar.tsx`
- Create: `src/components/ui/EmptyState.tsx`
- Create: `src/utils/time.ts`

- [x] Build post composer with text, image selection, previews, and submit states.
- [x] Build post cards with responsive image grids.
- [x] Build comments and reaction controls.
- [x] Add realtime invalidation for posts, comments, and reactions.
- [x] Add empty and loading states.

### Task 6: Verification

**Files:**
- Modify: `README.md`

- [x] Run TypeScript build.
- [x] Run lint.
- [x] Start Vite dev server.
- [x] Open the app in headless Chrome and verify the rendered page.
- [x] Verify mobile and desktop layout.
- [x] Update README with setup and Supabase SQL instructions.
