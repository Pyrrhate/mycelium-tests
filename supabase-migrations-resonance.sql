-- Mycélium V7 — La Résonance du Cycle (test mensuel 28 questions)
-- Exécuter après supabase-migrations-v6.sql

-- Table des résonances mensuelles (1 par user par mois)
create table if not exists public.monthly_resonance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_year text not null,
  scores jsonb not null default '[]',
  resonance_summary text,
  seal_id text,
  nebula_css text,
  created_at timestamptz default now(),
  unique(user_id, month_year)
);

create index if not exists idx_monthly_resonance_user_month on public.monthly_resonance(user_id, month_year);
create index if not exists idx_monthly_resonance_created_at on public.monthly_resonance(created_at);

alter table public.monthly_resonance enable row level security;

create policy "Users can read own monthly_resonance"
  on public.monthly_resonance for select
  using (auth.uid() = user_id);

create policy "Users can insert own monthly_resonance"
  on public.monthly_resonance for insert
  with check (auth.uid() = user_id);

-- Lecture des résonances publiques (pour afficher Sceau/Nébuleuse sur profil public)
create policy "Public can read monthly_resonance for public profiles"
  on public.monthly_resonance for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = monthly_resonance.user_id
        and (p.public_constellation = true or p.is_public = true)
    )
  );

-- Éveil de la Forêt : quand 100+ utilisateurs ont complété la Résonance dans la même semaine
create table if not exists public.forest_awakening (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  trigger_count integer not null
);

alter table public.forest_awakening enable row level security;

create policy "Anyone can read active forest_awakening"
  on public.forest_awakening for select
  using (ends_at > now());

create policy "Service can insert forest_awakening"
  on public.forest_awakening for insert
  with check (true);

-- Colonnes profil pour afficher Sceau/Nébuleuse sur la page publique
alter table public.profiles
  add column if not exists current_seal_id text,
  add column if not exists current_nebula_css text,
  add column if not exists resonance_month_year text;

comment on table public.monthly_resonance is 'Résonance du Cycle : 1 test / mois / user, 28 questions, Sceau du Mois';
comment on table public.forest_awakening is 'Éveil de la Forêt : 24h de brillance des avatars après 100+ résonances dans la semaine';
