-- ============================================================================
-- MIGRATION : Journal Compagnon avec Intégration IA Contextuelle
-- Version : 2.0 - Sécurité RLS renforcée + Mémoire courte
-- Exécuter après supabase-migrations-combat-journal.sql
-- ============================================================================

-- ============================================================================
-- SECTION 1 : STRUCTURE DE LA TABLE
-- ============================================================================

-- Ajout des colonnes IA à user_journal (réponse Claude)
ALTER TABLE public.user_journal
  ADD COLUMN IF NOT EXISTS ai_element text,
  ADD COLUMN IF NOT EXISTS ai_quote text,
  ADD COLUMN IF NOT EXISTS ai_reflection text,
  ADD COLUMN IF NOT EXISTS ai_insight text,
  ADD COLUMN IF NOT EXISTS ai_quest text,
  ADD COLUMN IF NOT EXISTS analysis_completed_at timestamptz;

COMMENT ON COLUMN public.user_journal.ai_element IS 'Élément alchimique détecté (Feu, Eau, Terre, Air, Bois, Métal, Éther)';
COMMENT ON COLUMN public.user_journal.ai_quote IS 'Citation philosophique/poétique générée par l''IA';
COMMENT ON COLUMN public.user_journal.ai_reflection IS 'Question d''introspection basée sur l''évolution des notes';
COMMENT ON COLUMN public.user_journal.ai_insight IS 'Phrase de sagesse poétique générée par l''IA';
COMMENT ON COLUMN public.user_journal.ai_quest IS 'Conseil/quête personnalisée liée à l''élément';
COMMENT ON COLUMN public.user_journal.analysis_completed_at IS 'Timestamp de l''analyse IA';

-- Colonne pour l'ordre personnalisé (drag & drop) et épinglage
ALTER TABLE public.user_journal
  ADD COLUMN IF NOT EXISTS custom_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

COMMENT ON COLUMN public.user_journal.custom_order IS 'Ordre personnalisé pour le tri (drag & drop)';
COMMENT ON COLUMN public.user_journal.is_pinned IS 'Note épinglée en haut de la liste';

-- Index optimisés pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_user_journal_ai_element ON public.user_journal(user_id, ai_element);
CREATE INDEX IF NOT EXISTS idx_user_journal_user_created ON public.user_journal(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_journal_custom_order ON public.user_journal(user_id, is_pinned DESC, custom_order ASC);

-- ============================================================================
-- SECTION 2 : SÉCURITÉ RLS (Row Level Security) - CRITIQUE
-- ============================================================================

-- Activer RLS sur la table (si pas déjà fait)
ALTER TABLE public.user_journal ENABLE ROW LEVEL SECURITY;

-- Forcer RLS même pour le propriétaire de la table (sécurité maximale)
ALTER TABLE public.user_journal FORCE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent (clean slate)
DROP POLICY IF EXISTS "Users can read own user_journal" ON public.user_journal;
DROP POLICY IF EXISTS "Users can insert own user_journal" ON public.user_journal;
DROP POLICY IF EXISTS "Users can update own user_journal" ON public.user_journal;
DROP POLICY IF EXISTS "Users can delete own user_journal" ON public.user_journal;
DROP POLICY IF EXISTS "journal_select_own" ON public.user_journal;
DROP POLICY IF EXISTS "journal_insert_own" ON public.user_journal;
DROP POLICY IF EXISTS "journal_update_own" ON public.user_journal;
DROP POLICY IF EXISTS "journal_delete_own" ON public.user_journal;

-- Politique SELECT : Un utilisateur ne peut lire QUE ses propres entrées
CREATE POLICY "journal_select_own" ON public.user_journal
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique INSERT : Un utilisateur ne peut créer QUE des entrées avec son propre user_id
CREATE POLICY "journal_insert_own" ON public.user_journal
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique UPDATE : Un utilisateur ne peut modifier QUE ses propres entrées
CREATE POLICY "journal_update_own" ON public.user_journal
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique DELETE : Un utilisateur ne peut supprimer QUE ses propres entrées
CREATE POLICY "journal_delete_own" ON public.user_journal
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 3 : VÉRIFICATION DE SÉCURITÉ
-- ============================================================================

-- Requête de vérification (à exécuter manuellement pour confirmer)
-- SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies WHERE tablename = 'user_journal';

COMMENT ON TABLE public.user_journal IS 'Journal Compagnon : notes personnelles avec analyse IA contextuelle. RLS stricte appliquée.';
