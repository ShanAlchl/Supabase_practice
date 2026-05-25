-- Private friends wall Supabase bootstrap.
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.circle_members (
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) <= 800),
  pinned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  circle_id uuid not null references public.circles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) <= 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.circle_invites (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  code text not null unique,
  max_uses int not null default 1 check (max_uses > 0),
  used_count int not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (used_count <= max_uses)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (
    type in (
      'post_reacted',
      'post_commented',
      'comment_replied',
      'member_joined',
      'invite_accepted'
    )
  ),
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.comments
  add column if not exists updated_at timestamptz not null default now();

alter table public.circles
  add column if not exists updated_at timestamptz not null default now();

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

create index if not exists circle_members_user_id_idx
  on public.circle_members(user_id);

create index if not exists posts_circle_created_idx
  on public.posts(circle_id, created_at desc, id desc);

create index if not exists posts_author_id_idx
  on public.posts(author_id);

create index if not exists posts_pinned_idx
  on public.posts(circle_id, pinned_at desc nulls last);

create index if not exists post_images_post_sort_idx
  on public.post_images(post_id, sort_order);

create index if not exists comments_post_created_idx
  on public.comments(post_id, created_at desc, id desc);

create index if not exists comments_parent_idx
  on public.comments(parent_id) where parent_id is not null;

create index if not exists comments_circle_created_idx
  on public.comments(circle_id, created_at desc);

create index if not exists comments_author_id_idx
  on public.comments(author_id);

create index if not exists reactions_circle_user_idx
  on public.reactions(circle_id, user_id);

create index if not exists reactions_post_user_idx
  on public.reactions(post_id, user_id);

create extension if not exists pg_trgm;

create index if not exists posts_body_trgm_idx
  on public.posts using gin (body gin_trgm_ops);

create index if not exists comments_body_trgm_idx
  on public.comments using gin (body gin_trgm_ops);

create index if not exists circle_members_circle_role_idx
  on public.circle_members(circle_id, role);

create index if not exists circle_invites_circle_created_idx
  on public.circle_invites(circle_id, created_at desc);

create index if not exists circle_invites_code_idx
  on public.circle_invites(code);

create index if not exists notifications_recipient_created_idx
  on public.notifications(recipient_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
  on public.notifications(recipient_id, read_at, created_at desc);

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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

drop trigger if exists circles_set_updated_at on public.circles;
create trigger circles_set_updated_at
before update on public.circles
for each row execute function public.set_updated_at();

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at
before update on public.comments
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1),
      'New friend'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_circle_member(target_circle_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.circle_members cm
    where cm.circle_id = target_circle_id
      and cm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_circle_owner(target_circle_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.circle_members cm
    where cm.circle_id = target_circle_id
      and cm.user_id = (select auth.uid())
      and cm.role = 'owner'
  );
$$;

create or replace function public.create_default_circle(
  default_name text default '我们的私密朋友圈',
  default_description text default '记录朋友之间的日常、照片和小小的开心事。'
)
returns table (
  id uuid,
  name text,
  description text,
  created_by uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  existing_circle_id uuid;
  new_circle_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select cm.circle_id
    into existing_circle_id
  from public.circle_members cm
  where cm.user_id = current_user_id
  order by cm.joined_at asc
  limit 1;

  if existing_circle_id is not null then
    return query
    select c.id, c.name, c.description, c.created_by
    from public.circles c
    where c.id = existing_circle_id;
    return;
  end if;

  insert into public.circles (name, description, created_by)
  values (default_name, default_description, current_user_id)
  returning circles.id into new_circle_id;

  insert into public.circle_members (circle_id, user_id, role)
  values (new_circle_id, current_user_id, 'owner');

  return query
  select c.id, c.name, c.description, c.created_by
  from public.circles c
  where c.id = new_circle_id;
end;
$$;

grant execute on function public.create_default_circle(text, text) to authenticated;

create or replace function public.create_circle(
  circle_name text,
  circle_description text default null
)
returns table (
  id uuid,
  name text,
  description text,
  created_by uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  new_circle_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if nullif(trim(circle_name), '') is null then
    raise exception 'Circle name is required';
  end if;

  insert into public.circles (name, description, created_by)
  values (trim(circle_name), nullif(trim(circle_description), ''), current_user_id)
  returning circles.id into new_circle_id;

  insert into public.circle_members (circle_id, user_id, role)
  values (new_circle_id, current_user_id, 'owner');

  return query
  select c.id, c.name, c.description, c.created_by
  from public.circles c
  where c.id = new_circle_id;
end;
$$;

grant execute on function public.create_circle(text, text) to authenticated;

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

create or replace function public.toggle_pin_post(
  target_post_id uuid,
  target_circle_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.circle_members
    where circle_id = target_circle_id
      and user_id = (select auth.uid())
      and role = 'owner'
  ) then
    raise exception 'Only circle owner can pin posts.';
  end if;

  update public.posts
  set pinned_at = case when pinned_at is not null then null else now() end
  where id = target_post_id and circle_id = target_circle_id;
end;
$$;

grant execute on function public.toggle_pin_post(uuid, uuid) to authenticated;

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

create or replace function public.create_circle_invite(
  target_circle_id uuid,
  max_uses int default 1,
  expires_at timestamptz default null
)
returns public.circle_invites
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  current_user_id uuid := (select auth.uid());
  created_invite public.circle_invites;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not (select public.is_circle_owner(target_circle_id)) then
    raise exception 'Only circle owners can create invites';
  end if;

  if max_uses is null or max_uses < 1 then
    raise exception 'max_uses must be greater than 0';
  end if;

  insert into public.circle_invites (
    circle_id,
    created_by,
    code,
    max_uses,
    expires_at
  )
  values (
    target_circle_id,
    current_user_id,
    encode(gen_random_bytes(16), 'hex'),
    max_uses,
    expires_at
  )
  returning * into created_invite;

  return created_invite;
end;
$$;

grant execute on function public.create_circle_invite(uuid, int, timestamptz) to authenticated;

drop function if exists public.accept_circle_invite(text);

create or replace function public.accept_circle_invite(invite_code text)
returns table (
  joined_circle_id uuid,
  circle_name text,
  circle_description text,
  circle_created_by uuid,
  did_join boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  invite public.circle_invites;
  inserted_count int := 0;
  did_insert boolean := false;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select *
    into invite
  from public.circle_invites ci
  where ci.code = trim(invite_code)
  for update;

  if invite.id is null then
    raise exception 'Invite does not exist';
  end if;

  if invite.revoked_at is not null then
    raise exception 'Invite has been revoked';
  end if;

  if invite.expires_at is not null and invite.expires_at <= now() then
    raise exception 'Invite has expired';
  end if;

  if invite.used_count >= invite.max_uses
    and not exists (
      select 1
      from public.circle_members cm
      where cm.circle_id = invite.circle_id
        and cm.user_id = current_user_id
    )
  then
    raise exception 'Invite has reached its usage limit';
  end if;

  insert into public.circle_members (circle_id, user_id, role)
  values (invite.circle_id, current_user_id, 'member')
  on conflict (circle_id, user_id) do nothing;

  get diagnostics inserted_count = row_count;
  did_insert := inserted_count > 0;

  if did_insert then
    update public.circle_invites
    set used_count = used_count + 1
    where id = invite.id;

    if invite.created_by <> current_user_id then
      insert into public.notifications (
        circle_id,
        recipient_id,
        actor_id,
        type
      )
      values (
        invite.circle_id,
        invite.created_by,
        current_user_id,
        'invite_accepted'
      );
    end if;
  end if;

  return query
  select c.id, c.name, c.description, c.created_by, did_insert
  from public.circles c
  where c.id = invite.circle_id;
end;
$$;

grant execute on function public.accept_circle_invite(text) to authenticated;

create or replace function public.revoke_circle_invite(invite_id uuid)
returns public.circle_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  revoked_invite public.circle_invites;
begin
  update public.circle_invites ci
  set revoked_at = coalesce(ci.revoked_at, now())
  where ci.id = invite_id
    and (select public.is_circle_owner(ci.circle_id))
  returning * into revoked_invite;

  if revoked_invite.id is null then
    raise exception 'Invite not found or permission denied';
  end if;

  return revoked_invite;
end;
$$;

grant execute on function public.revoke_circle_invite(uuid) to authenticated;

create or replace function public.transfer_circle_ownership(
  target_circle_id uuid,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_member_exists boolean;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.circle_members
    where circle_id = target_circle_id
      and user_id = current_user_id
      and role = 'owner'
  ) then
    raise exception 'Only circle owner can transfer ownership.';
  end if;

  select exists (
    select 1 from public.circle_members
    where circle_id = target_circle_id
      and user_id = target_user_id
  ) into target_member_exists;

  if not target_member_exists then
    raise exception 'Target user is not a member of this circle.';
  end if;

  update public.circle_members
  set role = 'member'
  where circle_id = target_circle_id
    and user_id = current_user_id;

  update public.circle_members
  set role = 'owner'
  where circle_id = target_circle_id
    and user_id = target_user_id;
end;
$$;

grant execute on function public.transfer_circle_ownership(uuid, uuid) to authenticated;

create or replace function public.remove_circle_member(
  target_circle_id uuid,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  target_role text;
  owner_count int;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not (select public.is_circle_owner(target_circle_id)) then
    raise exception 'Only circle owners can remove members';
  end if;

  select role into target_role
  from public.circle_members
  where circle_id = target_circle_id
    and user_id = target_user_id;

  if target_role is null then
    raise exception 'Member not found';
  end if;

  select count(*) into owner_count
  from public.circle_members
  where circle_id = target_circle_id
    and role = 'owner';

  if target_role = 'owner' and owner_count <= 1 then
    raise exception 'Cannot remove the last circle owner';
  end if;

  delete from public.circle_members
  where circle_id = target_circle_id
    and user_id = target_user_id;
end;
$$;

grant execute on function public.remove_circle_member(uuid, uuid) to authenticated;

create or replace function public.leave_circle(target_circle_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_role text;
  owner_count int;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select role into current_role
  from public.circle_members
  where circle_id = target_circle_id
    and user_id = current_user_id;

  if current_role is null then
    raise exception 'Member not found';
  end if;

  select count(*) into owner_count
  from public.circle_members
  where circle_id = target_circle_id
    and role = 'owner';

  if current_role = 'owner' and owner_count <= 1 then
    raise exception 'Cannot leave as the last circle owner';
  end if;

  delete from public.circle_members
  where circle_id = target_circle_id
    and user_id = current_user_id;
end;
$$;

grant execute on function public.leave_circle(uuid) to authenticated;

create or replace function public.mark_notification_read(notification_id uuid)
returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_notification public.notifications;
begin
  update public.notifications n
  set read_at = coalesce(n.read_at, now())
  where n.id = notification_id
    and n.recipient_id = (select auth.uid())
  returning * into updated_notification;

  if updated_notification.id is null then
    raise exception 'Notification not found';
  end if;

  return updated_notification;
end;
$$;

grant execute on function public.mark_notification_read(uuid) to authenticated;

create or replace function public.mark_all_notifications_read()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count int;
begin
  update public.notifications
  set read_at = now()
  where recipient_id = (select auth.uid())
    and read_at is null;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

grant execute on function public.mark_all_notifications_read() to authenticated;

create or replace function public.delete_all_read_notifications()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count int;
begin
  delete from public.notifications
  where recipient_id = (select auth.uid())
    and read_at is not null;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

grant execute on function public.delete_all_read_notifications() to authenticated;

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

drop trigger if exists reactions_notify_post_reacted on public.reactions;
create trigger reactions_notify_post_reacted
after insert on public.reactions
for each row execute function public.notify_post_reacted();

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

drop trigger if exists comments_notify_post_commented on public.comments;
create trigger comments_notify_post_commented
after insert on public.comments
for each row execute function public.notify_post_commented();

create or replace function public.notify_member_joined()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    circle_id,
    recipient_id,
    actor_id,
    type
  )
  select
    new.circle_id,
    cm.user_id,
    new.user_id,
    'member_joined'
  from public.circle_members cm
  where cm.circle_id = new.circle_id
    and cm.user_id <> new.user_id;

  return new;
end;
$$;

drop trigger if exists circle_members_notify_member_joined on public.circle_members;
create trigger circle_members_notify_member_joined
after insert on public.circle_members
for each row execute function public.notify_member_joined();

alter table public.profiles enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.posts enable row level security;
alter table public.post_images enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.circle_invites enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles are visible to circle members" on public.profiles;
drop policy if exists "profiles are visible to circle members" on public.profiles;
create policy "profiles are visible to circle members"
on public.profiles for select
to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1
    from public.circle_members mine
    join public.circle_members theirs on theirs.circle_id = mine.circle_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = profiles.id
  )
);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
on public.profiles for insert
to authenticated
with check (id = (select auth.uid()));

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "members view circles" on public.circles;
create policy "members view circles"
on public.circles for select
to authenticated
using ((select public.is_circle_member(id)));

drop policy if exists "authenticated users create circles" on public.circles;
create policy "authenticated users create circles"
on public.circles for insert
to authenticated
with check (created_by = (select auth.uid()));

drop policy if exists "owners update circles" on public.circles;
create policy "owners update circles"
on public.circles for update
to authenticated
using ((select public.is_circle_owner(id)))
with check ((select public.is_circle_owner(id)));

drop policy if exists "members view memberships" on public.circle_members;
create policy "members view memberships"
on public.circle_members for select
to authenticated
using ((select public.is_circle_member(circle_id)));

drop policy if exists "users join own new circle" on public.circle_members;
create policy "users join own new circle"
on public.circle_members for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (
    (
      role = 'owner'
      and exists (
        select 1
        from public.circles c
        where c.id = circle_members.circle_id
          and c.created_by = (select auth.uid())
      )
    )
    or (select public.is_circle_owner(circle_id))
  )
);

drop policy if exists "owners manage memberships" on public.circle_members;
create policy "owners manage memberships"
on public.circle_members for update
to authenticated
using ((select public.is_circle_owner(circle_id)))
with check ((select public.is_circle_owner(circle_id)));

drop policy if exists "members view posts" on public.posts;
create policy "members view posts"
on public.posts for select
to authenticated
using ((select public.is_circle_member(circle_id)));

drop policy if exists "members create own posts" on public.posts;
create policy "members create own posts"
on public.posts for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and (select public.is_circle_member(circle_id))
);

drop policy if exists "authors update own posts" on public.posts;
create policy "authors update own posts"
on public.posts for update
to authenticated
using (author_id = (select auth.uid()))
with check (
  author_id = (select auth.uid())
  and (select public.is_circle_member(circle_id))
);

drop policy if exists "authors delete own posts" on public.posts;
create policy "authors delete own posts"
on public.posts for delete
to authenticated
using (author_id = (select auth.uid()));

drop policy if exists "members view images" on public.post_images;
create policy "members view images"
on public.post_images for select
to authenticated
using (
  exists (
    select 1 from public.posts p
    where p.id = post_images.post_id
      and (select public.is_circle_member(p.circle_id))
  )
);

drop policy if exists "members add images to own posts" on public.post_images;
create policy "members add images to own posts"
on public.post_images for insert
to authenticated
with check (
  exists (
    select 1 from public.posts p
    where p.id = post_images.post_id
      and p.author_id = (select auth.uid())
      and (select public.is_circle_member(p.circle_id))
  )
);

drop policy if exists "members view comments" on public.comments;
create policy "members view comments"
on public.comments for select
to authenticated
using ((select public.is_circle_member(circle_id)));

drop policy if exists "members create own comments" on public.comments;
create policy "members create own comments"
on public.comments for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and (select public.is_circle_member(circle_id))
  and exists (
    select 1 from public.posts p
    where p.id = comments.post_id
      and p.circle_id = comments.circle_id
  )
);

drop policy if exists "authors delete own comments" on public.comments;
create policy "authors delete own comments"
on public.comments for delete
to authenticated
using (author_id = (select auth.uid()));

drop policy if exists "authors update own comments" on public.comments;
create policy "authors update own comments"
on public.comments for update
to authenticated
using (author_id = (select auth.uid()))
with check (
  author_id = (select auth.uid())
  and (select public.is_circle_member(circle_id))
);

drop policy if exists "members view reactions" on public.reactions;
create policy "members view reactions"
on public.reactions for select
to authenticated
using ((select public.is_circle_member(circle_id)));

drop policy if exists "members create own reactions" on public.reactions;
create policy "members create own reactions"
on public.reactions for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (select public.is_circle_member(circle_id))
);

drop policy if exists "users delete own reactions" on public.reactions;
create policy "users delete own reactions"
on public.reactions for delete
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "owners view circle invites" on public.circle_invites;
create policy "owners view circle invites"
on public.circle_invites for select
to authenticated
using ((select public.is_circle_owner(circle_id)));

drop policy if exists "owners create circle invites" on public.circle_invites;
create policy "owners create circle invites"
on public.circle_invites for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select public.is_circle_owner(circle_id))
);

drop policy if exists "owners update circle invites" on public.circle_invites;
create policy "owners update circle invites"
on public.circle_invites for update
to authenticated
using ((select public.is_circle_owner(circle_id)))
with check ((select public.is_circle_owner(circle_id)));

drop policy if exists "owners delete circle invites" on public.circle_invites;
create policy "owners delete circle invites"
on public.circle_invites for delete
to authenticated
using ((select public.is_circle_owner(circle_id)));

drop policy if exists "users view own notifications" on public.notifications;
create policy "users view own notifications"
on public.notifications for select
to authenticated
using (recipient_id = (select auth.uid()));

drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications"
on public.notifications for update
to authenticated
using (recipient_id = (select auth.uid()))
with check (recipient_id = (select auth.uid()));

drop policy if exists "clients cannot insert notifications" on public.notifications;
create policy "clients cannot insert notifications"
on public.notifications for insert
to authenticated
with check (false);

drop policy if exists "users delete own notifications" on public.notifications;
create policy "users delete own notifications"
on public.notifications for delete
to authenticated
using (recipient_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "members can read post media" on storage.objects;
create policy "members can read post media"
on storage.objects for select
to authenticated
using (
  bucket_id = 'post-media'
  and exists (
    select 1
    from public.circle_members cm
    where cm.circle_id::text = (storage.foldername(name))[1]
      and cm.user_id = (select auth.uid())
  )
);

drop policy if exists "members upload own post media" on storage.objects;
create policy "members upload own post media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'post-media'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and exists (
    select 1
    from public.circle_members cm
    where cm.circle_id::text = (storage.foldername(name))[1]
      and cm.user_id = (select auth.uid())
  )
);

drop policy if exists "users update own post media" on storage.objects;
create policy "users update own post media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'post-media'
  and owner = (select auth.uid())
)
with check (
  bucket_id = 'post-media'
  and owner = (select auth.uid())
);

drop policy if exists "users delete own post media" on storage.objects;
create policy "users delete own post media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'post-media'
  and owner = (select auth.uid())
);

drop policy if exists "circle members can read avatars" on storage.objects;
create policy "circle members can read avatars"
on storage.objects for select
to authenticated
using (
  bucket_id = 'avatars'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1
      from public.circle_members mine
      join public.circle_members theirs
        on theirs.circle_id = mine.circle_id
      where mine.user_id = (select auth.uid())
        and theirs.user_id::text = (storage.foldername(name))[1]
    )
  )
);

drop policy if exists "users upload own avatar" on storage.objects;
create policy "users upload own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "users update own avatar" on storage.objects;
create policy "users update own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and owner = (select auth.uid())
)
with check (
  bucket_id = 'avatars'
  and owner = (select auth.uid())
);

drop policy if exists "users delete own avatar" on storage.objects;
create policy "users delete own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and owner = (select auth.uid())
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'reactions'
  ) then
    alter publication supabase_realtime add table public.reactions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
