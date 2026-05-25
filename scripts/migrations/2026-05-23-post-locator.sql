-- Migration: Notification Jump and Post Locator
-- Phase 2 of IMPROVEMENT_PLAN.md

create or replace function public.get_feed_post_by_id(
  target_post_id uuid
)
returns table (
  id uuid,
  circle_id uuid,
  author_id uuid,
  body text,
  created_at timestamptz,
  updated_at timestamptz,
  pinned_at timestamptz,
  author jsonb,
  images jsonb,
  comment_count bigint,
  reaction_count bigint,
  viewer_has_reacted boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.circle_id,
    p.author_id,
    p.body,
    p.created_at,
    p.updated_at,
    p.pinned_at,
    jsonb_build_object(
      'id', pr.id,
      'display_name', pr.display_name,
      'avatar_url', pr.avatar_url,
      'bio', pr.bio
    ) as author,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pi.id,
          'post_id', pi.post_id,
          'public_url', pi.public_url,
          'storage_path', pi.storage_path,
          'sort_order', pi.sort_order
        )
        order by pi.sort_order asc
      )
      from public.post_images pi
      where pi.post_id = p.id
    ), '[]'::jsonb) as images,
    (
      select count(*)
      from public.comments c
      where c.post_id = p.id and c.parent_id is null
    ) as comment_count,
    (
      select count(*)
      from public.reactions r
      where r.post_id = p.id
    ) as reaction_count,
    exists (
      select 1
      from public.reactions vr
      where vr.post_id = p.id
        and vr.user_id = (select auth.uid())
    ) as viewer_has_reacted
  from public.posts p
  join public.profiles pr on pr.id = p.author_id
  where p.id = target_post_id
    and (select public.is_circle_member(p.circle_id));
$$;

grant execute on function public.get_feed_post_by_id(uuid) to authenticated;
