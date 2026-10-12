-- When a member row disappears for any reason (including account deletion,
-- which cascades), make sure the group still has an admin, or is removed if
-- it is now empty. leave_group/remove_group_member already do this; this
-- covers deletes that bypass them.
create function private.after_member_removed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.groups where id = old.group_id) then
    perform private.ensure_group_has_admin(old.group_id);
  end if;
  return null;
end;
$$;

create trigger group_members_ensure_admin
  after delete on public.group_members
  for each row execute function private.after_member_removed();
