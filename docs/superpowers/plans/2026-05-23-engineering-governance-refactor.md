# Engineering Governance Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor app orchestration into smaller app-level modules without changing product behavior.

**Architecture:** Keep Supabase service functions and feature components intact. Move `PrivateCircleApp`, demo mode, app loading/error views, app-scoped query composition, mutations, dialog state, and composer focus into focused files under `src/features/app`, with shared query keys and error normalization in `src/lib`.

**Tech Stack:** Vite, React, TypeScript, TanStack Query, Supabase JS, Tailwind CSS.

---

### Task 1: App-Level File Boundaries

**Files:**
- Modify: `src/App.tsx`
- Create: `src/features/app/PrivateCircleApp.tsx`
- Create: `src/features/app/DemoApp.tsx`
- Create: `src/features/app/LoadingScreen.tsx`
- Create: `src/features/app/SetupError.tsx`

- [x] Move private app orchestration out of `src/App.tsx`.
- [x] Move demo-mode state and rendering out of `src/App.tsx`.
- [x] Move loading and Supabase setup error views out of `src/App.tsx`.
- [x] Keep the top-level app state machine unchanged.

### Task 2: Private App Hooks

**Files:**
- Create: `src/features/app/usePrivateCircleDialogs.ts`
- Create: `src/features/app/useComposerFocus.ts`
- Create: `src/features/app/usePrivateCircleQueries.ts`
- Create: `src/features/app/usePrivateCircleMutations.ts`
- Modify: `src/features/app/PrivateCircleApp.tsx`

- [x] Move dialog open/close state into `usePrivateCircleDialogs`.
- [x] Move composer ref, focus, and highlight behavior into `useComposerFocus`.
- [x] Move profile, circle, member, post, invite, and notification queries into `usePrivateCircleQueries`.
- [x] Move post, comment, reaction, circle, invite, notification, profile, and avatar mutations into `usePrivateCircleMutations`.
- [x] Keep query timing, enabled conditions, and mutation invalidation behavior unchanged.

### Task 3: Shared Query Keys and Errors

**Files:**
- Create: `src/lib/queryKeys.ts`
- Create: `src/lib/errors.ts`
- Modify: `src/features/feed/useRealtimeFeed.ts`
- Modify: `src/features/app/PrivateCircleApp.tsx`
- Modify: `src/features/app/usePrivateCircleQueries.ts`
- Modify: `src/features/app/usePrivateCircleMutations.ts`

- [x] Replace app-level string query keys with `queryKeys`.
- [x] Keep exact key shapes compatible with the current cache.
- [x] Normalize displayed errors through `getErrorMessage`.
- [x] Avoid changing service-layer thrown errors in this round.

### Task 4: Migration Notes and Verification

**Files:**
- Create: `scripts/migrations/README.md`

- [x] Document that `scripts/init.sql` remains the complete bootstrap.
- [x] Document that future backend changes should add incremental migration files.
- [x] Run `npm.cmd run build`.
- [x] Run `npm.cmd run lint`.
