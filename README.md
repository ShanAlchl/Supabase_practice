# Private Friends Wall

A mobile-first private friends-circle wall built to learn Supabase through a real app flow.

## What It Covers

- Supabase Auth for email/password login
- Postgres tables for profiles, circles, invites, notifications, posts, images, comments, and reactions
- Row Level Security for private circle access
- Supabase Storage for private post images and avatars
- Realtime updates for posts, comments, reactions, and notifications
- Responsive React UI for mobile and desktop

## Local Development

```bash
npm install
npm run dev
```

If `.env.local` is missing, the app opens in demo mode so you can inspect the UI and local interactions first.

## Connect Supabase

1. Create a Supabase project.
2. Open Supabase Dashboard -> SQL Editor -> New query.
3. Paste and run `scripts/init.sql`.
4. Copy `.env.example` to `.env.local`.
5. Fill in your Supabase project URL and anon key:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

6. Restart the dev server.

## Troubleshooting

If the app shows `new row violates row-level security policy for table "circles"`, rerun the latest `scripts/init.sql` in Supabase SQL Editor. The current schema uses the `create_default_circle()` RPC to create the first private circle and owner membership in one database-side operation, which avoids a first-login RLS race.

If the app shows `Could not embed because more than one relationship was found`, restart the Vite dev server after pulling the latest frontend code. The feed queries use explicit Supabase relationship hints such as `profiles!posts_author_id_fkey` so PostgREST knows which foreign key to use.

## Backend Capabilities

- `create_default_circle()` creates the first private circle and owner membership atomically.
- `get_feed_posts()` returns cursor-paginated feed rows with author, images, comment count, reaction count, and viewer reaction state. It does not load every comment by default.
- `fetchComments(postId, { cursor })` loads comments per post with cursor pagination.
- `create_circle_invite()`, `accept_circle_invite()`, and `revoke_circle_invite()` power private invite links with expiry, revocation, and usage limits.
- `notifications` stores `post_reacted`, `post_commented`, `member_joined`, and `invite_accepted` events. RLS lets users read and update only their own notifications.
- `post-media` remains private and uses signed URLs. Post image uploads are validated and cleaned up if a later database step fails.
- `avatars` is a separate private bucket for profile avatars.

## Notes

- The first authenticated user automatically gets a default private circle.
- The database and service layer support multiple circles, while the current UI still opens the default circle first.
- The `post-media` bucket is private. The app resolves signed image URLs when loading the feed.
