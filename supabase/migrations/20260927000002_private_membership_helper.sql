-- A tagság-ellenőrző ne legyen RPC-n hívható: nem publikált "private" sémába kerül.
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.is_family_member(fid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.family_members m
    where m.family_id = fid and m.user_id = (select auth.uid())
  );
$$;
revoke execute on function private.is_family_member(uuid) from public, anon;
grant execute on function private.is_family_member(uuid) to authenticated;

alter policy "families: a tagok olvashatják" on public.families using (private.is_family_member(id));
alter policy "family_members: a család tagjai olvashatják" on public.family_members using (private.is_family_member(family_id));
alter policy "alerts: a család tagjai olvashatják" on public.alerts using (private.is_family_member(family_id));

drop function public.is_family_member(uuid);
