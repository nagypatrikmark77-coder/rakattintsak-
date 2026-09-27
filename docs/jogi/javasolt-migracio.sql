-- JAVASLAT, NEM ALKALMAZOTT MIGRÁCIÓ (2026-09-27).
-- Az éles adatbázison a jogosultsági rendszer nem engedte lefuttatni. Alkalmazáshoz másold a
-- supabase/migrations/20260927000004_alerts_member_leave_cleanup.sql fájlba, futtasd, majd frissítsd a
-- scripts/test-db.ts oszlopellenőrzését és az adatkezelési tájékoztató 4.3. és 4.6. pontját (lásd README, K1b).

-- Törlési jog (GDPR 17. cikk) és korlátozott tárolhatóság.
-- 1) A riasztás a kiváltó taghoz kötve: kilépéskor és fióktörléskor a tag riasztásai is törlődnek.
-- 2) Kilépés a családból (member) egy tranzakcióban: tagság + a tag riasztásai.
-- 3) Az IP-hash sorok ütemezett törlése: nem csak a következő ellenőrzéskor, hanem 10 percenként is.

alter table public.alerts add column user_id uuid references auth.users(id) on delete cascade;
create index alerts_user_idx on public.alerts (user_id);

-- PIROS ítélet után: red_count++ és riasztás minden családnak, ahol a felhasználó "member".
-- Csak márka, ítélet és a kiváltó tag azonosítója kerül be, tartalom soha. Visszatérés: a beszúrt riasztások száma.
create or replace function public.record_red(p_user_id uuid, p_brand text)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date := (now() at time zone 'Europe/Budapest')::date;
  v_n int;
begin
  update public.usage set red_count = red_count + 1 where user_id = p_user_id and day = v_day;
  insert into public.alerts (family_id, user_id, brand, verdict)
    select m.family_id, p_user_id, p_brand, 'red' from public.family_members m
    where m.user_id = p_user_id and m.role = 'member';
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
revoke execute on function public.record_red(uuid, text) from public, anon, authenticated;
grant execute on function public.record_red(uuid, text) to service_role;

-- Kilépés a családból: csak "member" léphet ki (a tulajdonos a családot törli). Visszatérés: kilépett-e.
create function public.leave_family(p_user_id uuid, p_family_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_left int;
begin
  delete from public.family_members
    where family_id = p_family_id and user_id = p_user_id and role = 'member';
  get diagnostics v_left = row_count;
  if v_left = 0 then return false; end if;
  delete from public.alerts where family_id = p_family_id and user_id = p_user_id;
  return true;
end;
$$;
revoke execute on function public.leave_family(uuid, uuid) from public, anon, authenticated;
grant execute on function public.leave_family(uuid, uuid) to service_role;

-- Ütemezett takarítás: az óraablak kezdetétől számított 2 óránál régebbi IP-hash sorok 10 percenként törlődnek.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'rakattintsak-rate-limits-cleanup',
  '*/10 * * * *',
  $$delete from public.rate_limits where window_start < now() - interval '2 hours'$$
);
