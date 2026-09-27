-- Egy tulajdonosnak egy családja: két gyors "Család létrehozása" koppintás se hozzon létre kettőt.
create unique index families_owner_unique on public.families (owner_id);
