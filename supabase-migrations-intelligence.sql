-- Mycélium V8 — La Matrice des Intelligences (28 questions, Carte Neuronale)
-- Exécuter après supabase-migrations-resonance.sql

-- Table des résultats Matrice d'Intelligence (1 par user, dernier écrasé ou historique selon besoin)
create table if not exists public.intelligence_matrix (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scores jsonb not null default '[]',
  dominant_key text,
  cognitive_title text,
  capacite_maillage numeric(5,2),
  created_at timestamptz default now()
);

create index if not exists idx_intelligence_matrix_user on public.intelligence_matrix(user_id);
create index if not exists idx_intelligence_matrix_created on public.intelligence_matrix(created_at desc);

alter table public.intelligence_matrix enable row level security;

create policy "Users can read own intelligence_matrix"
  on public.intelligence_matrix for select
  using (auth.uid() = user_id);

create policy "Users can insert own intelligence_matrix"
  on public.intelligence_matrix for insert
  with check (auth.uid() = user_id);

create policy "Users can update own intelligence_matrix"
  on public.intelligence_matrix for update
  using (auth.uid() = user_id);

-- Lecture pour profils publics (Capacité de Maillage)
create policy "Public can read intelligence_matrix for public profiles"
  on public.intelligence_matrix for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = intelligence_matrix.user_id
        and (p.public_constellation = true or p.is_public = true)
    )
  );

-- Colonne profil pour affichage public
alter table public.profiles
  add column if not exists capacite_maillage numeric(5,2),
  add column if not exists cognitive_title text;

comment on table public.intelligence_matrix is 'Matrice des Intelligences : 28 questions, 7 pôles, Carte Neuronale';
comment on column public.profiles.capacite_maillage is 'Capacité de Maillage (débloquée par le test Matrice d''Intelligence)';
