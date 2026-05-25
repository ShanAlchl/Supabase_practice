-- Stabilize feed pagination, search rows, and notifications.
-- Run this in Supabase Dashboard -> SQL Editor for existing projects.

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (
    type in (
      'post_reacted',
      'post_commented',
      'comment_replied',
      'member_joined',
      'invite_accepted'
    )
  );

with ranked as (
  select
    id,
    row_number() over (
      partition by recipient_id, actor_id, type, post_id
      order by created_at desc, id desc
    ) as rn
  from public.notifications
  where type = 'post_reacted' and post_id is not null
)
delete from public.notifications n
using ranked r
where n.id = r.id and r.rn > 1;

with ranked as (
  select
    id,
    row_number() over (
      partition by recipient_id, actor_id, type, comment_id
      order by created_at desc, id desc
    ) as rn
  from public.notifications
  where type in ('post_commented', 'comment_replied') and comment_id is not null
)
delete from public.notifications n
using ranked r
where n.id = r.id and r.rn > 1;

with ranked as (
  select
    id,
    row_number() over (
      partition by recipient_id, actor_id, type, circle_id
      order by created_at desc, id desc
    ) as rn
  from public.notifications
  where type in ('member_joined', 'invite_accepted')
)
delete from public.notifications n
using ranked r
where n.id = r.id and r.rn > 1;

create unique index if not exists notifications_reaction_unique_idx
  on public.notifications(recipient_id, actor_id, type, post_id)
  where type = 'post_reacted' and post_id is not null;

create unique index if not exists notifications_comment_unique_idx
  on public.notifications(recipient_id, actor_id, type, comment_id)
  where type in ('post_commented', 'comment_replied') and comment_id is not null;

create unique index if not exists notifications_member_joined_unique_idx
  on public.notifications(recipient_id, actor_id, type, circle_id)
  where type = 'member_joined';

create unique index if not exists notifications_invite_accepted_unique_idx
  on public.notifications(recipient_id, actor_id, type, circle_id)
  where type = 'invite_accepted';

drop function if exists public.get_feed_posts(uuid, timestamptz, uuid, int);

create or replace function public.get_feed_posts(
  target_circle_id uuid,
  before_created_at timestamptz default null,
  before_id uuid default null,
  page_size int default 20
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
  where p.circle_id = target_circle_id
    and (select public.is_circle_member(target_circle_id))
    and (
      (
        before_created_at is null
        and before_id is null
        and p.pinned_at is not null
      )
      or (
        p.pinned_at is null
        and (
          before_created_at is null
          or before_id is null
          or (p.created_at, p.id) < (before_created_at, before_id)
        )
      )
    )
  order by
    case when p.pinned_at is not null then 0 else 1 end,
    p.pinned_at asc nulls last,
    p.created_at desc, p.id desc
  limit least(greatest(coalesce(page_size, 20), 1), 50);
$$;

grant execute on function public.get_feed_posts(uuid, timestamptz, uuid, int) to authenticated;

drop function if exists public.search_circle_posts(uuid, text, timestamptz, uuid, int);

create or replace function public.search_circle_posts(
  target_circle_id uuid,
  keyword text,
  before_created_at timestamptz default null,
  before_id uuid default null,
  page_size int default 20
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
  where p.circle_id = target_circle_id
    and (select public.is_circle_member(target_circle_id))
    and nullif(trim(keyword), '') is not null
    and (
      p.body ilike '%' || trim(keyword) || '%'
      or exists (
        select 1
        from public.comments c
        where c.post_id = p.id
          and c.body ilike '%' || trim(keyword) || '%'
      )
    )
    and (
      (
        before_created_at is null
        and before_id is null
        and p.pinned_at is not null
      )
      or (
        p.pinned_at is null
        and (
          before_created_at is null
          or before_id is null
          or (p.created_at, p.id) < (before_created_at, before_id)
        )
      )
    )
  order by
    case when p.pinned_at is not null then 0 else 1 end,
    p.pinned_at asc nulls last,
    p.created_at desc, p.id desc
  limit least(greatest(coalesce(page_size, 20), 1), 50);
$$;

grant execute on function public.search_circle_posts(uuid, text, timestamptz, uuid, int) to authenticated;

create or replace function public.notify_post_reacted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author_id uuid;
begin
  select p.author_id into post_author_id
  from public.posts p
  where p.id = new.post_id;

  if post_author_id is not null and post_author_id <> new.user_id then
    insert into public.notifications (
      circle_id,
      recipient_id,
      actor_id,
      type,
      post_id
    )
    values (
      new.circle_id,
      post_author_id,
      new.user_id,
      'post_reacted',
      new.post_id
    )
    on conflict (recipient_id, actor_id, type, post_id)
    where type = 'post_reacted' and post_id is not null
    do update
      set read_at = null,
          created_at = now();
  end if;

  return new;
end;
$$;

create or replace function public.notify_post_commented()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author_id uuid;
  parent_author_id uuid;
begin
  select p.author_id into post_author_id
  from public.posts p
  where p.id = new.post_id;

  if new.parent_id is not null then
    select c.author_id into parent_author_id
    from public.comments c
    where c.id = new.parent_id;
  end if;

  if post_author_id is not null and post_author_id <> new.author_id then
    insert into public.notifications (
      circle_id,
      recipient_id,
      actor_id,
      type,
      post_id,
      comment_id
    )
    values (
      new.circle_id,
      post_author_id,
      new.author_id,
      'post_commented',
      new.post_id,
      new.id
    )
    on conflict (recipient_id, actor_id, type, comment_id)
    where type in ('post_commented', 'comment_replied') and comment_id is not null
    do nothing;
  end if;

  if parent_author_id is not null
    and parent_author_id <> new.author_id
    and parent_author_id <> post_author_id
  then
    insert into public.notifications (
      circle_id,
      recipient_id,
      actor_id,
      type,
      post_id,
      comment_id
    )
    values (
      new.circle_id,
      parent_author_id,
      new.author_id,
      'comment_replied',
      new.post_id,
      new.id
    )
    on conflict (recipient_id, actor_id, type, comment_id)
    where type in ('post_commented', 'comment_replied') and comment_id is not null
    do nothing;
  end if;

  return new;
end;
$$;
