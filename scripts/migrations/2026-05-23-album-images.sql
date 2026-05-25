-- Migration: Album and Image Lightbox
-- Phase 1 of IMPROVEMENT_PLAN.md

create or replace function public.get_circle_album_images(
  target_circle_id uuid,
  before_created_at timestamptz default null,
  before_id uuid default null,
  page_size int default 30
)
returns table (
  id uuid,
  post_id uuid,
  circle_id uuid,
  author_id uuid,
  storage_path text,
  public_url text,
  sort_order int,
  post_body text,
  post_created_at timestamptz,
  author jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select
    pi.id,
    pi.post_id,
    p.circle_id,
    p.author_id,
    pi.storage_path,
    pi.public_url,
    pi.sort_order,
    p.body as post_body,
    p.created_at as post_created_at,
    jsonb_build_object(
      'id', pr.id,
      'display_name', pr.display_name,
      'avatar_url', pr.avatar_url,
      'bio', pr.bio
    ) as author
  from public.post_images pi
  join public.posts p on p.id = pi.post_id
  join public.profiles pr on pr.id = p.author_id
  where p.circle_id = target_circle_id
    and (select public.is_circle_member(target_circle_id))
    and (
      before_created_at is null
      or before_id is null
      or (p.created_at, pi.id) < (before_created_at, before_id)
    )
  order by p.created_at desc, pi.id desc
  limit least(greatest(coalesce(page_size, 30), 1), 50);
$$;

grant execute on function public.get_circle_album_images(uuid, timestamptz, uuid, int) to authenticated;
