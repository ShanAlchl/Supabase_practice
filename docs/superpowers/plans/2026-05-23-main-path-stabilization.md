# Main Path Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize the private friends wall main path with real pagination, consistent pinned/search data, deduplicated notifications, reply notifications, and safe object URL cleanup.

**Architecture:** Keep the existing service/UI boundaries from the governance refactor. Use TanStack Query infinite queries for feed and notifications, local paginated state for per-card comments, SQL RPC updates for pinned feed and notification behavior, and small React hooks for blob URL cleanup.

**Tech Stack:** Vite, React, TypeScript, TanStack Query, Supabase Postgres/RPC/Realtime, Tailwind CSS.

---

### Task 1: Feed and Notification Pagination

**Files:**
- Modify: `src/features/app/usePrivateCircleQueries.ts`
- Modify: `src/features/app/PrivateCircleApp.tsx`
- Modify: `src/features/feed/Feed.tsx`
- Modify: `src/features/notifications/NotificationDialog.tsx`
- Modify: `src/services/feedService.ts`

- [x] Replace feed `useQuery` with `useInfiniteQuery` using `fetchPostsPage` or `searchPosts`.
- [x] Flatten feed pages into a single `posts` array for `Feed`.
- [x] Add a feed "加载更多" button wired to `fetchNextPage`.
- [x] Replace notification `useQuery` with `useInfiniteQuery` using `fetchNotifications`.
- [x] Add a notification "加载更多" button wired to `fetchNextPage`.

### Task 2: Comment Pagination

**Files:**
- Modify: `src/features/feed/Feed.tsx`
- Modify: `src/features/feed/PostCard.tsx`
- Modify: `src/features/app/usePrivateCircleQueries.ts`

- [x] Change `onLoadComments` to return a full paginated result.
- [x] Store loaded comments and `nextCursor` inside each `PostCard`.
- [x] Add a comment "加载更多评论" button when more comments exist.
- [x] Preserve comment/reply submission behavior by refreshing the first comment page after submit.

### Task 3: Pinned Feed and Search Consistency

**Files:**
- Modify: `scripts/init.sql`
- Create: `scripts/migrations/2026-05-23-stabilize-feed-pagination.sql`
- Modify: `src/services/feedService.ts`

- [x] Add `pinned_at` to `search_circle_posts` return values.
- [x] Change `get_feed_posts` so pinned posts only appear on the first page.
- [x] Keep ordinary cursor pagination scoped to unpinned posts.
- [x] Preserve the existing `FeedCursor` shape.

### Task 4: Notification Dedupe and Reply Notifications

**Files:**
- Modify: `scripts/init.sql`
- Modify: `scripts/migrations/2026-05-23-stabilize-feed-pagination.sql`
- Modify: `src/types/domain.ts`
- Modify: `src/features/notifications/NotificationDialog.tsx`

- [x] Add `comment_replied` to notification type checks.
- [x] Add partial unique indexes for deduped reaction, comment, reply, member join, and invite notifications.
- [x] Change reaction notifications to upsert instead of inserting duplicates.
- [x] Change comment notifications to notify post authors and parent comment authors when appropriate.
- [x] Add UI label/icon support for `comment_replied`.

### Task 5: Object URL Cleanup

**Files:**
- Create: `src/hooks/useObjectUrls.ts`
- Modify: `src/features/composer/Composer.tsx`
- Modify: `src/features/settings/ProfileSettingsDialog.tsx`
- Modify: `src/features/app/DemoApp.tsx`

- [x] Add a reusable hook that creates object URLs and revokes them on replacement/unmount.
- [x] Use the hook for composer image previews.
- [x] Revoke avatar preview URLs when replaced, closed, or unmounted.
- [x] Track demo blob image URLs and revoke them when demo app unmounts.

### Task 6: Verification

**Files:**
- Modify: `docs/superpowers/plans/2026-05-23-main-path-stabilization.md`

- [x] Run `npm.cmd run build`.
- [x] Run `npm.cmd run lint`.
- [x] Confirm no unrelated product behavior was intentionally added.
