# Web Supabase Improvement Plan

## Goal

Turn the current private friends-circle wall into a more complete, reliable, and maintainable product while keeping the existing architecture intact.

The project should remain a mobile-first private friends wall, not a public social network or heavy admin dashboard. Improvements should extend the current feature boundaries:

- `src/features/*` for product features
- `src/components/ui/*` for reusable UI primitives
- `src/services/*` for Supabase data access
- `src/types/domain.ts` for shared domain types
- `scripts/init.sql` for fresh Supabase bootstrap
- `scripts/migrations/*` for incremental backend upgrades

## Current Baseline

The app already has:

- Supabase Auth email/password login and signup
- Demo mode when Supabase credentials are missing
- Private circles, members, invites, notifications, settings, profile editing
- Text/image posts, comments, replies, reactions, pinned posts
- Realtime invalidation for feed and notifications
- Cursor pagination for feed, comments, and notifications
- Private Storage signed URLs for post images and avatars
- RLS policies and RPC functions in `scripts/init.sql`
- App orchestration split into `src/features/app/*`
- Shared query keys in `src/lib/queryKeys.ts`
- Error text normalization in `src/lib/errors.ts`

The next work should build on this baseline rather than replacing it.

## Execution Rules

Each phase should be implemented as an independent slice:

1. Update or create the relevant frontend files.
2. Update `scripts/init.sql` when backend schema/RPC/policy behavior changes.
3. Add an incremental migration under `scripts/migrations/YYYY-MM-DD-short-name.sql`.
4. Run verification:

```bash
npm.cmd run build
npm.cmd run lint
```

5. If the phase changes Supabase behavior, manually run the migration in Supabase Dashboard -> SQL Editor for existing projects.
6. Keep user-facing strings in Chinese.
7. Keep internal names, comments, and documentation in English unless existing local context uses Chinese.

## Phase 1: Album and Image Lightbox

### Purpose

Make uploaded photos first-class content. Right now images only live inside feed posts. The app already has an `album` nav item in `AppShell`, but it is disabled. This phase should enable it and add a polished private circle photo browsing experience.

### Product Behavior

- The left rail and mobile navigation should expose `相册` as an active destination.
- Album view should show all post images in the selected circle.
- Images should be sorted newest first by the parent post creation time, then image sort order.
- Each image tile should show enough context:
  - author avatar/name
  - relative time
  - short post excerpt
  - optional multi-image indicator if useful
- Clicking an image opens a lightbox dialog.
- Lightbox should support:
  - previous/next image
  - close
  - author/time/post excerpt
  - image count position, for example `3 / 24`
  - "查看原动态" action for a later shared locator flow
- Demo mode should include a small album experience based on `demoPosts`.

### Frontend Files

Create:

- `src/features/album/AlbumView.tsx`
- `src/features/album/LightboxDialog.tsx`
- `src/features/album/useAlbumState.ts`
- `src/services/albumService.ts`

Modify:

- `src/features/shell/AppShell.tsx`
- `src/features/app/PrivateCircleApp.tsx`
- `src/features/app/DemoApp.tsx`
- `src/lib/queryKeys.ts`
- `src/types/domain.ts`

### Suggested Types

Add to `src/types/domain.ts`:

```ts
export type AlbumImage = {
  id: string
  postId: string
  circleId: string
  authorId: string
  url: string
  storagePath: string
  sortOrder: number
  postBody: string
  postCreatedAt: string
  author: Profile
}
```

### Backend Files

Modify:

- `scripts/init.sql`

Create:

- `scripts/migrations/YYYY-MM-DD-album-images.sql`

### Backend Design

Add an RPC:

```sql
public.get_circle_album_images(
  target_circle_id uuid,
  before_created_at timestamptz default null,
  before_id uuid default null,
  page_size int default 30
)
```

Return rows containing:

- image id
- post id
- circle id
- author id
- storage path
- public url fallback
- sort order
- post body
- post created_at
- author jsonb

Security:

- The RPC must check `public.is_circle_member(target_circle_id)`.
- It should not expose images from circles the user does not belong to.

Index review:

- Existing `post_images(post_id, sort_order)` helps image ordering inside a post.
- Existing `posts(circle_id, created_at desc, id desc)` helps album pagination through posts.
- No extra index is necessary at first unless the query plan is poor.

### UI Details

Desktop:

- The album can render in the main content column.
- Right rail remains circle/member context.
- Use a dense responsive image grid, not large marketing cards.

Mobile:

- Album grid should be two columns.
- Lightbox controls must be thumb-friendly.
- Do not hide the close button behind gestures only.

### Acceptance Criteria

- Album nav is no longer disabled.
- Album shows images for the active circle.
- Lightbox opens, closes, and navigates images.
- Private Storage signed URLs are used.
- Empty album state invites the user to publish a photo post.
- Demo mode still works.
- `npm.cmd run build` passes.
- `npm.cmd run lint` passes.

### Risks

- Signed URLs can expire. Reuse existing signed URL helpers and allow React Query refetch to refresh them.
- If the album query joins too much data, keep page size around 30.
- Do not implement upload from album in this phase; uploads should remain in the composer.

## Phase 2: Notification Jump and Post Locator

### Purpose

Make notifications actionable. Users should be able to click a notification and arrive at the relevant post or comment.

### Product Behavior

- Clicking a notification closes the dialog.
- If the notification belongs to another circle, switch to that circle first.
- If the target post is already loaded, scroll to it and briefly highlight it.
- If the target post is not loaded, fetch it by id and render it in a temporary located-post area or insert it into the feed cache.
- If the notification references a comment, expand comments and highlight the matching comment when possible.
- If the post was deleted or inaccessible, show a gentle message such as `这条动态可能已被删除或你已无法访问。`

### Frontend Files

Create:

- `src/features/feed/usePostLocator.ts`
- `src/features/feed/PostHighlight.tsx` if highlight styling becomes reusable

Modify:

- `src/features/app/PrivateCircleApp.tsx`
- `src/features/app/usePrivateCircleQueries.ts`
- `src/features/notifications/NotificationDialog.tsx`
- `src/features/feed/Feed.tsx`
- `src/features/feed/PostCard.tsx`
- `src/services/feedService.ts`
- `src/lib/queryKeys.ts`

### Backend and Service Design

Add service function:

```ts
export const fetchPostById = async (postId: string, viewerId: string): Promise<Post>
```

Backend options:

1. Preferred: add RPC `get_feed_post_by_id(target_post_id uuid)` that returns the same row shape as `get_feed_posts`.
2. Acceptable: query `posts` with joins from Supabase client if RLS policies cover all reads cleanly.

Preferred RPC benefits:

- Same shape as feed rows.
- Centralized membership check.
- Easier to include reaction counts and viewer reaction state.

### UI Flow

Add `onSelectNotification` to `NotificationDialog`:

```ts
onSelectNotification?: (notification: CircleNotification) => void
```

Implementation flow in `PrivateCircleApp`:

1. Receive notification.
2. Mark it read if unread.
3. Ensure selected circle matches `notification.circleId`.
4. Locate or fetch `notification.postId`.
5. Scroll to target post.
6. Highlight post for about 1 second.
7. If `commentId` exists, open comments and highlight comment if loaded.

### Acceptance Criteria

- Clicking a post reaction notification scrolls to the relevant post.
- Clicking a comment notification opens the relevant post and comment area.
- Switching circles before locating works.
- Missing/deleted post shows a user-friendly notice.
- Realtime notifications still update unread count.
- build/lint pass.

### Risks

- Circle switching and fetch timing can race. Use a small locator state machine instead of chained anonymous callbacks.
- Highlighting a comment that is not in the first comment page may require loading comment context. For this phase, highlight the post and open comments even if exact comment is not found.

## Phase 3: Post and Comment Editing

### Purpose

Let users maintain their own content after publishing.

### Product Behavior

- Post authors can edit post body.
- Post authors can delete posts through a proper confirm dialog.
- Comment authors can edit comments.
- Comment authors can delete comments.
- Edited content updates feed state through query invalidation or cache update.
- Deletions preserve current pagination state where practical.

### Frontend Files

Create:

- `src/components/ui/ConfirmDialog.tsx`
- `src/features/feed/PostActionsMenu.tsx`
- `src/features/feed/CommentActionsMenu.tsx`

Modify:

- `src/features/feed/PostCard.tsx`
- `src/features/feed/Feed.tsx`
- `src/features/app/usePrivateCircleMutations.ts`
- `src/services/feedService.ts`
- `src/services/commentService.ts`
- `src/types/domain.ts`

### Service Design

Add to `feedService.ts`:

```ts
export const updatePost = async (
  postId: string,
  input: { body: string },
): Promise<void>
```

Existing comment service already has:

- `updateComment(commentId, body)`
- `deleteComment(commentId)`

Connect them to UI.

### UI Design

- Replace `window.confirm` in `PostCard` with `ConfirmDialog`.
- Add compact action menu using icons:
  - edit
  - delete
  - pin/unpin for owners
- Inline edit mode can be simple:
  - textarea
  - save button
  - cancel button
- For comments, show actions near each comment on hover/long tap.

### Backend Review

Existing RLS:

- Authors can update/delete own posts.
- Authors can update/delete own comments.

Check that update policies still require membership.

### Acceptance Criteria

- Author can edit and delete own post.
- Non-author cannot see edit/delete controls.
- Author can edit/delete own comment.
- Confirm dialog replaces browser confirm.
- build/lint pass.

### Risks

- Nested replies make deletion behavior sensitive. Since comments cascade through `parent_id on delete cascade`, deleting a parent reply can delete children. UI should warn when deleting a comment with replies if reply count is known.

## Phase 4: Authentication Experience

### Purpose

Make account access realistic beyond the minimal email/password form.

### Product Behavior

- Users can request password reset.
- Users see clear Chinese auth errors.
- Signup flow clearly explains email confirmation if enabled.
- Optional OAuth providers can be added with minimal Supabase built-in flow.

### Frontend Files

Create:

- `src/services/authService.ts`
- `src/features/auth/ResetPasswordPanel.tsx` if separate panel is cleaner

Modify:

- `src/features/auth/AuthPanel.tsx`
- `src/features/auth/useAuth.ts`
- `src/lib/errors.ts`
- `README.md`

### Service Design

Add wrappers:

```ts
signInWithEmail(email, password)
signUpWithEmail(email, password)
sendPasswordReset(email)
signInWithOAuth(provider)
```

OAuth should call:

```ts
supabase.auth.signInWithOAuth({
  provider,
  options: { redirectTo: window.location.origin },
})
```

### Error Mapping

Map common Supabase Auth errors:

- invalid login credentials -> 邮箱或密码不正确。
- email not confirmed -> 请先完成邮箱验证。
- user already registered -> 这个邮箱已经注册。
- password should be at least 6 characters -> 密码至少需要 6 位。
- email rate limit exceeded -> 邮件发送太频繁，请稍后再试。

### Acceptance Criteria

- Login/signup still work.
- Reset password email request works.
- Auth errors are Chinese and actionable.
- OAuth buttons are optional and documented.
- build/lint pass.

### Risks

- OAuth requires Supabase Dashboard provider configuration. Do not hardcode provider secrets.
- Password reset redirect URL may need Supabase Dashboard URL configuration.

## Phase 5: Circle Roles and Ownership Transfer

### Purpose

Make circle membership management safe for real multi-user usage.

### Product Behavior

- Owners can transfer ownership to another member.
- Optional: owners can promote members to admin.
- Owners can leave after transferring ownership.
- The backend prevents circles from having no owner.

### Backend Files

Modify:

- `scripts/init.sql`

Create:

- `scripts/migrations/YYYY-MM-DD-circle-roles.sql`

### Frontend Files

Modify:

- `src/types/domain.ts`
- `src/services/circleService.ts`
- `src/features/settings/MembersDialog.tsx`
- `src/features/settings/CircleSettingsDialog.tsx`

### Backend Design Option A: Minimal Ownership Transfer

Keep roles:

- `owner`
- `member`

Add RPC:

```sql
transfer_circle_ownership(
  target_circle_id uuid,
  target_user_id uuid
)
```

Behavior:

- Caller must be current owner.
- Target must be a member of the circle.
- Target becomes owner.
- Current user becomes member.

### Backend Design Option B: Owner/Admin/Member

Expand roles:

- `owner`
- `admin`
- `member`

Add RPCs:

- `transfer_circle_ownership`
- `update_circle_member_role`

Recommended first implementation: Option A. It solves the urgent product dead end with less surface area.

### Acceptance Criteria

- Owner can transfer ownership.
- Previous owner can leave after transfer.
- Last owner cannot be removed.
- Non-owner cannot call ownership RPC successfully.
- build/lint pass.

### Risks

- Role expansion affects RLS checks and UI labels. If adding admin, update all `role === 'owner'` assumptions carefully.

## Phase 6: Test Infrastructure

### Purpose

Reduce regression risk as the app gains more product behavior.

### Files

Modify:

- `package.json`

Create:

- `vitest.config.ts`
- `src/lib/errors.test.ts`
- `src/lib/queryKeys.test.ts`
- `src/hooks/useObjectUrls.test.tsx`
- `tests/e2e/demo.spec.ts`
- `playwright.config.ts`

### Unit Tests

Start with deterministic logic:

- `getErrorMessage`
- `queryKeys`
- mapper functions if exported or moved into testable utilities
- object URL cleanup behavior with mocked `URL.createObjectURL` / `URL.revokeObjectURL`

### E2E Tests

Use demo mode first because it does not need Supabase credentials:

- page renders without env vars
- demo notice appears
- user can write a post
- user can add a comment
- user can toggle reaction
- album entry renders after Phase 1

### Scripts

Add:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "e2e": "playwright test"
}
```

### Acceptance Criteria

- `npm.cmd run test` passes.
- `npm.cmd run e2e` passes in demo mode.
- Existing build/lint still pass.

### Risks

- Installing dependencies changes `package-lock.json`.
- Playwright browser installation can require network. If blocked, keep Playwright config and document the install step.

## Phase 7: Performance and Bundle Size

### Purpose

Reduce the main JS chunk and improve perceived startup time.

### Target

The production build currently warns that the main chunk is above 500 KB. Reduce first-load JavaScript by lazy-loading dialogs and heavier views.

### Frontend Files

Modify:

- `src/features/app/PrivateCircleApp.tsx`
- `src/features/app/DemoApp.tsx`
- future album/lightbox files

Create:

- `src/components/ui/DialogFallback.tsx` if needed

### Lazy Load Candidates

- `InviteDialog`
- `NotificationDialog`
- `ProfileSettingsDialog`
- `MembersDialog`
- `CircleSettingsDialog`
- `LightboxDialog`
- `AlbumView`, if album becomes heavy

### Design

Use `React.lazy` and `Suspense` around non-critical UI:

- Keep feed and composer eagerly loaded.
- Lazy-load modals only when they can be opened.
- Keep loading fallback small and visually consistent.

### Acceptance Criteria

- Main JS chunk decreases.
- No modal loses state unexpectedly during normal open/close.
- build/lint pass.

### Risks

- Lazy loading many tiny components can add complexity without meaningful gain. Measure build output before and after.

## Phase 8: Search Enhancement

### Purpose

Make circle search useful as content grows.

### Backend Files

Modify:

- `scripts/init.sql`

Create:

- `scripts/migrations/YYYY-MM-DD-search-indexes.sql`

### Frontend Files

Modify:

- `src/services/feedService.ts`
- `src/features/search/FeedSearchBar.tsx`
- `src/features/app/usePrivateCircleQueries.ts`

### Backend Design

Enable trigram search:

```sql
create extension if not exists pg_trgm;
```

Add index:

```sql
create index if not exists posts_body_trgm_idx
on public.posts using gin (body gin_trgm_ops);
```

Later add comments:

```sql
create index if not exists comments_body_trgm_idx
on public.comments using gin (body gin_trgm_ops);
```

### Product Behavior

- Search post bodies first.
- Then add comment search with result context.
- Show result source:
  - `动态正文`
  - `评论`
- Keep search scoped to active circle.
- Keep cursor pagination.

### Acceptance Criteria

- Existing search still works.
- Search result shape still includes `pinnedAt`.
- Search does not expose non-member content.
- build/lint pass.

### Risks

- Full-text search for Chinese is more complex than trigram. Start with trigram because it works reasonably for substring matching.

## Suggested Order

Recommended implementation order:

1. Phase 1: Album and Image Lightbox
2. Phase 2: Notification Jump and Post Locator
3. Phase 3: Post and Comment Editing
4. Phase 4: Authentication Experience
5. Phase 5: Circle Roles and Ownership Transfer
6. Phase 6: Test Infrastructure
7. Phase 7: Performance and Bundle Size
8. Phase 8: Search Enhancement

Reasoning:

- Phases 1 and 2 deliver the largest user-visible product value.
- Phase 3 completes content management after the feed is stable.
- Phases 4 and 5 make the app credible for real users and groups.
- Phase 6 creates a safety net before more advanced changes.
- Phase 7 is easier after major views/dialogs exist.
- Phase 8 matters more once enough content exists to search.

## Release Checklist Per Phase

For every phase:

- Update frontend files.
- Update backend SQL if needed.
- Add migration if SQL changes.
- Keep `scripts/init.sql` and migration behavior aligned.
- Run:

```bash
npm.cmd run build
npm.cmd run lint
```

- For SQL changes, manually run the migration against the existing Supabase project.
- Test demo mode if the phase touches UI.
- Test Supabase mode if the phase touches data, auth, storage, RLS, RPC, or Realtime.

## Deferred Ideas

These are useful but should wait until the above phases are done:

- PWA install support
- Push notifications
- Dark mode
- Export circle memories
- Soft delete / recycle bin
- Moderation audit log
- Edge Function for image processing
- Multiple reaction types
- Direct messages

They are not needed for the next product-quality milestone.
