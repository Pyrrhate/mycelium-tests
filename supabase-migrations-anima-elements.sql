-- ============================================================================
-- MIGRATION : Anima - Nouvelles Colonnes pour les 7 Éléments Alchimiques
-- Nomenclature : Air, Terre, Eau, Feu, Bois, Métal, Éther
-- ============================================================================

-- Ajouter les colonnes pour les scores des 7 éléments (nouvelle nomenclature)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS score_air numeric(4,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_terre numeric(4,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_eau numeric(4,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_feu numeric(4,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_bois numeric(4,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_metal numeric(4,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_ether numeric(4,2) DEFAULT 0;

-- Commentaires pour documentation
COMMENT ON COLUMN public.profiles.score_air IS 'Élément Air (Le Souffle) : Idées, inspiration, liberté';
COMMENT ON COLUMN public.profiles.score_terre IS 'Élément Terre (Le Socle) : Stabilité, ancrage, pragmatisme';
COMMENT ON COLUMN public.profiles.score_eau IS 'Élément Eau (L Onde) : Émotions, empathie, intuition';
COMMENT ON COLUMN public.profiles.score_feu IS 'Élément Feu (La Forge) : Action, passion, transformation';
COMMENT ON COLUMN public.profiles.score_bois IS 'Élément Bois (L Éclosion) : Croissance, créativité, joie';
COMMENT ON COLUMN public.profiles.score_metal IS 'Élément Métal (Le Prisme) : Logique, analyse, structure';
COMMENT ON COLUMN public.profiles.score_ether IS 'Élément Éther (Le Vide) : Spiritualité, introspection, sagesse';

-- Ajouter colonne pour stocker le transcript de l'initiation chat
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS initiation_chat_history jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS initiation_completed_at timestamptz;

COMMENT ON COLUMN public.profiles.initiation_chat_history IS 'Historique du chat d initiation avec le Gardien';
COMMENT ON COLUMN public.profiles.initiation_completed_at IS 'Date de completion de l initiation Anima';

-- Index pour recherche par élément dominant
CREATE INDEX IF NOT EXISTS idx_profiles_score_air ON public.profiles(score_air) WHERE score_air IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_score_feu ON public.profiles(score_feu) WHERE score_feu IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_score_eau ON public.profiles(score_eau) WHERE score_eau IS NOT NULL;

-- ============================================================================
-- TABLE forest_stats : Ajouter les nouvelles colonnes pour compatibilité
-- ============================================================================

ALTER TABLE public.forest_stats
  ADD COLUMN IF NOT EXISTS score_air numeric(4,2),
  ADD COLUMN IF NOT EXISTS score_terre numeric(4,2),
  ADD COLUMN IF NOT EXISTS score_eau numeric(4,2),
  ADD COLUMN IF NOT EXISTS score_feu numeric(4,2),
  ADD COLUMN IF NOT EXISTS score_bois numeric(4,2),
  ADD COLUMN IF NOT EXISTS score_metal numeric(4,2),
  ADD COLUMN IF NOT EXISTS score_ether numeric(4,2);

-- ============================================================================
-- MAPPING : Ancienne nomenclature -> Nouvelle nomenclature (pour référence)
-- ============================================================================
-- Spore      -> Éther (spiritualité, introspection)
-- Ancrage    -> Terre (stabilité, sécurité)  
-- Expansion  -> Eau (émotions, empathie)
-- Lyse       -> Feu (transformation, action)
-- Fructification -> Bois (croissance, créativité)
-- Absorption -> Métal (analyse, structure)
-- Dormance   -> Air (mental, questionnement) -- Note: interprétation

-- Vue pour faciliter la transition (optionnel)
-- CREATE OR REPLACE VIEW public.v_profiles_anima AS
-- SELECT 
--   id,
--   initiate_name,
--   totem_animal,
--   score_air as air,
--   score_terre as terre,
--   score_eau as eau,
--   score_feu as feu,
--   score_bois as bois,
--   score_metal as metal,
--   score_ether as ether,
--   GREATEST(score_air, score_terre, score_eau, score_feu, score_bois, score_metal, score_ether) as dominant_score
-- FROM public.profiles;
