# Private Friends Wall Design

## Goal

Build a private friends-circle activity wall for learning Supabase end to end. The first version should feel like a usable place to record moments with friends while demonstrating Auth, Postgres, Row Level Security, Storage, and Realtime in one small product.

## Product Scope

The app supports one default private circle in the UI, while the database already supports multiple circles for future expansion. Authenticated users can create or join a circle, publish text and image posts, comment, and react. The first version avoids public feeds, follow systems, ranking, direct messages, and recommendation algorithms.

## Architecture

The frontend uses Vite, React, TypeScript, Tailwind CSS, TanStack Query, lucide-react, and the Supabase JavaScript client. Supabase owns authentication, relational data, media storage, RLS policies, and realtime change notifications. The UI is mobile-first with a mature desktop layout: mobile uses a single feed column and bottom navigation, while desktop uses navigation, feed, and context sidebars.

## Data Model

- `profiles`: one row per Supabase Auth user.
- `circles`: private friend groups.
- `circle_members`: membership and role mapping.
- `posts`: text moments inside a circle.
- `post_images`: ordered image attachments backed by Storage.
- `comments`: post comments scoped to a circle.
- `reactions`: one reaction per user per post.

## Security

Every business table has RLS enabled. Circle membership is checked through helper functions so table access is enforced at the database boundary. Storage uses a private `post-media` bucket; clients upload into paths that include `circle_id` and `user_id`, and image display uses signed URLs.

## Frontend Structure

The app separates Supabase access from UI:

- `src/lib`: environment, Supabase client, query client.
- `src/services`: database and storage operations.
- `src/features/auth`: login and session handling.
- `src/features/composer`: post creation and image selection.
- `src/features/feed`: feed, cards, comments, reactions, realtime invalidation.
- `src/features/shell`: responsive app layout.
- `src/components/ui`: shared primitives.

## Interaction Model

Without Supabase credentials the app runs in demo mode so the visual and local interaction flow can be reviewed immediately. With credentials, the app requires email/password auth, ensures a profile row, creates a default circle for a new user, and then loads the private feed. Posting, commenting, and reacting invalidate feed queries and are also refreshed through Realtime.

## Extension Points

The next natural additions are invitation codes, profile editing, post deletion/editing, multi-circle switching, notifications, PWA install support, and later a React Native/Taro/wechat mini-program client using the same Supabase backend.
