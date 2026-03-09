-- Mycélium — Création complète de la table profiles (si elle n'existe pas)
-- À exécuter dans le SQL Editor Supabase (projet narrative_roots).
-- Résout l'erreur : relation "public.profiles" does not exist

-- 1. Créer la table profiles (liée à auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  initiate_name text,
  totem text,
  maison text,
  public_constellation boolean DEFAULT false,
  slug text UNIQUE,
  updated_at timestamptz DEFAULT now()
);

-- 2. RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Colonnes V6 (initiation, XP, totem, etc.)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS constellation_data jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS element_primordial text,
  ADD COLUMN IF NOT EXISTS initiation_step integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS test_mycelium_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS test_totem_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS xp_seve integer DEFAULT 0;

-- 4. TCG (Points de Symbiose, Constellation)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS symbiose_points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS constellation_result jsonb;

-- 5. Résonance du Cycle (Sceau / Nébuleuse)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_seal_id text,
  ADD COLUMN IF NOT EXISTS current_nebula_css text,
  ADD COLUMN IF NOT EXISTS resonance_month_year text;

-- 6. Matrice d'Intelligence
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS capacite_maillage numeric(5,2),
  ADD COLUMN IF NOT EXISTS cognitive_title text;

-- 7. Onboarding, Sceaux, Racines Narratives
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS unlocked_seals jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS narrative_roots text;

-- Politique lecture profils publics (après ajout de is_public)
DROP POLICY IF EXISTS "Public profiles are readable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are readable by everyone"
  ON public.profiles FOR SELECT
  USING (
    (public_constellation = true OR is_public = true) AND (slug IS NOT NULL OR initiate_name IS NOT NULL)
  );

-- Contrainte initiation_step (V6)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_initiation_step_check'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_initiation_step_check
      CHECK (initiation_step BETWEEN 1 AND 4);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Commentaires
COMMENT ON COLUMN public.profiles.initiation_step IS '1=inscrit, 2=49 racines, 3=+totem, 4=+constellation+element';
COMMENT ON COLUMN public.profiles.xp_seve IS 'XP pour rangs (Graine Dormante, Hyphe Éveillée, etc.)';
COMMENT ON COLUMN public.profiles.symbiose_points IS 'Points de Symbiose (PS) pour échanges, boutique et récompenses.';
COMMENT ON COLUMN public.profiles.constellation_result IS 'Dernier résultat du questionnaire Constellation (état vibratoire).';
COMMENT ON COLUMN public.profiles.narrative_roots IS 'Texte libre de présentation (Racines Narratives)';
COMMENT ON COLUMN public.profiles.has_completed_onboarding IS 'Tour guidé terminé (Éclats de Sève)';
COMMENT ON COLUMN public.profiles.unlocked_seals IS 'IDs des Sceaux de Maîtrise débloqués (7 quêtes par clé)';

-- 8. Trigger : créer une ligne profiles à chaque nouvel utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
