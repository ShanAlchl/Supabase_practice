-- Migration: Circle Roles and Ownership Transfer
-- Phase 5 of IMPROVEMENT_PLAN.md

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
