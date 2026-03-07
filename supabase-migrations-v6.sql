-- Mycélium V6 - Extension des profils et verrouillage (Gate System)
-- Exécuter après supabase-migrations.sql

-- Colonnes pour profils publics et initiation
alter table public.profiles
  add column if not exists is_public boolean default false,
  add column if not exists constellation_data jsonb default '{}',
  add column if not exists element_primordial text,
  add column if not exists initiation_step integer default 1 check (initiation_step between 1 and 4),
  add column if not exists test_mycelium_completed boolean default false,
  add column if not exists test_totem_completed boolean default false,
  add column if not exists xp_seve integer default 0;

-- RLS : lecture des profils publics (is_public au lieu de public_constellation pour cohérence V6)
-- On garde l'ancienne policy sur public_constellation pour rétrocompat, et on ajoute is_public
drop policy if exists "Public profiles are readable by everyone" on public.profiles;
create policy "Public profiles are readable by everyone"
  on public.profiles for select
  using (
    (public_constellation = true or is_public = true) and (slug is not null or initiate_name is not null)
  );

comment on column public.profiles.initiation_step is '1=inscrit, 2=49 racines, 3=+totem, 4=+constellation+element';
comment on column public.profiles.xp_seve is 'XP pour rangs (Graine Dormante, Hyphe Éveillée, etc.)';
