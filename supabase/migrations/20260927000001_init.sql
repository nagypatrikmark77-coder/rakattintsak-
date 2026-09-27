-- Rákattintsak? – kezdő séma (M4 + M5 + M6).
-- Adatvédelem: beküldött tartalom, idézet, link SEHOL nem tárolódik. Az alerts sor csak család, márka, ítélet, idő;
-- a usage sor csak felhasználó, nap, darabszámok; a rate_limits sor csak IP-hash és darabszám.

-- Családok: a létrehozó (unoka) a tulajdonos.
create table public.families (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Tagság: owner = unoka, member = akiért aggódunk (nagyi). A riasztás a member ellenőrzéséből születik.
create table public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (family_id, user_id)
);
create index family_members_user_idx on public.family_members (user_id);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  brand text not null,
  verdict text not null check (verdict = 'red'),
  created_at timestamptz not null default now()
);
create index alerts_family_created_idx on public.alerts (family_id, created_at desc);

-- Napi használat felhasználónként (Europe/Budapest nap).
create table public.usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  count int not null default 0,
  red_count int not null default 0,
  primary key (user_id, day)
);

-- Óránkénti IP-limit (sózott hash, legfeljebb 2 óráig tároljuk).
create table public.rate_limits (
  ip_hash text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (ip_hash, window_start)
);

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.alerts enable row level security;
alter table public.usage enable row level security;
alter table public.rate_limits enable row level security;

-- Tagság-ellenőrzés RLS-hez (security definer, hogy a family_members policy ne hivatkozzon önmagára).
create function public.is_family_member(fid uuid)
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
revoke execute on function public.is_family_member(uuid) from public, anon;
grant execute on function public.is_family_member(uuid) to authenticated;

create policy "families: a tagok olvashatják" on public.families
  for select to authenticated using (public.is_family_member(id));
create policy "family_members: a család tagjai olvashatják" on public.family_members
  for select to authenticated using (public.is_family_member(family_id));
create policy "alerts: a család tagjai olvashatják" on public.alerts
  for select to authenticated using (public.is_family_member(family_id));
create policy "usage: csak a saját sor" on public.usage
  for select to authenticated using (user_id = (select auth.uid()));
-- rate_limits: nincs policy, csak a szerver (service role) éri el.

-- Az új projektek nem adnak automatikus jogot az új táblákra: explicit grantok.
grant select on public.families, public.family_members, public.alerts, public.usage to authenticated;
revoke all on public.rate_limits from anon, authenticated;
grant all on public.families, public.family_members, public.alerts, public.usage, public.rate_limits to service_role;

-- Realtime: az unoka nézet feliratkozik az új riasztásokra (RLS szerint csak a saját családjáéra).
alter publication supabase_realtime add table public.alerts;

-- Limit: 20 ellenőrzés / óra / IP ÉS 30 / nap / felhasználó, amelyik előbb eléri. Elutasításnál nem számol.
-- Visszatérés: 'ok' | 'ip_hour' | 'user_day'.
create function public.hit_limits(p_user_id uuid, p_ip_hash text, p_hour_limit int, p_day_limit int)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := date_trunc('hour', now());
  v_day date := (now() at time zone 'Europe/Budapest')::date;
  v_ip int;
  v_user int := 0;
begin
  delete from public.rate_limits where window_start < now() - interval '2 hours';

  insert into public.rate_limits (ip_hash, window_start) values (p_ip_hash, v_window) on conflict do nothing;
  select r.count into v_ip from public.rate_limits r
    where r.ip_hash = p_ip_hash and r.window_start = v_window for update;

  if p_user_id is not null then
    insert into public.usage (user_id, day) values (p_user_id, v_day) on conflict do nothing;
    select u.count into v_user from public.usage u
      where u.user_id = p_user_id and u.day = v_day for update;
  end if;

  if v_ip >= p_hour_limit then return 'ip_hour'; end if;
  if p_user_id is not null and v_user >= p_day_limit then return 'user_day'; end if;

  update public.rate_limits set count = count + 1 where ip_hash = p_ip_hash and window_start = v_window;
  if p_user_id is not null then
    update public.usage set count = count + 1 where user_id = p_user_id and day = v_day;
  end if;
  return 'ok';
end;
$$;
revoke execute on function public.hit_limits(uuid, text, int, int) from public, anon, authenticated;
grant execute on function public.hit_limits(uuid, text, int, int) to service_role;

-- PIROS ítélet után: red_count++ és riasztás minden családnak, ahol a felhasználó "member".
-- Csak márka és ítélet kerül be, tartalom soha. Visszatérés: a beszúrt riasztások száma.
create function public.record_red(p_user_id uuid, p_brand text)
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
  insert into public.alerts (family_id, brand, verdict)
    select m.family_id, p_brand, 'red' from public.family_members m
    where m.user_id = p_user_id and m.role = 'member';
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;
revoke execute on function public.record_red(uuid, text) from public, anon, authenticated;
grant execute on function public.record_red(uuid, text) to service_role;
