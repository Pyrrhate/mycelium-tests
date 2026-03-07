-- Mycélium - Tables pour Auth & Profils (Supabase)
-- Exécuter dans l'éditeur SQL du projet Supabase.

-- 1. Table profiles (liée à auth.users via id = auth.uid())
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  initiate_name text,
  totem text,
  maison text,
  public_constellation boolean default false,
  slug text unique,
  updated_at timestamptz default now()
);

-- RLS : un utilisateur ne peut lire/écrire que son propre profil
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Lecture des profils publics (pour Hyphes actives et pages /u/slug)
create policy "Public profiles are readable by everyone"
  on public.profiles for select
  using (public_constellation = true and slug is not null);

-- 2. Ajouter user_id à forest_stats (optionnel, pour lier les sessions aux comptes)
alter table public.forest_stats
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- RLS forest_stats : tout le monde peut insérer (anon pour enregistrer les tests), lire ses propres lignes ou agrégats publics
alter table public.forest_stats enable row level security;

create policy "Anyone can insert forest_stats"
  on public.forest_stats for insert
  with check (true);

create policy "Users can read own forest_stats"
  on public.forest_stats for select
  using (auth.uid() = user_id or user_id is null);

-- Pour getGlobalPulse : lecture des lignes (anon peut lire pour les moyennes globales)
create policy "Allow read for global pulse"
  on public.forest_stats for select
  using (true);

-- Trigger : créer une ligne profiles à l'inscription (optionnel)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
