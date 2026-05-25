-- Migration: Delete all read notifications

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
