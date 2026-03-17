-- ============================================================================
-- Smart Journal : tags et annotations sur user_journal (RLS inchangé)
-- Exécuter après supabase-migrations-magic-journal.sql
-- ============================================================================

-- Tags : tableau de chaînes (ex: #travail, #idées)
ALTER TABLE public.user_journal
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

COMMENT ON COLUMN public.user_journal.tags IS 'Étiquettes de la note (ex: travail, idées, voyage)';

-- Annotations : post-its virtuels [{ id, content, created_at }]
ALTER TABLE public.user_journal
  ADD COLUMN IF NOT EXISTS annotations jsonb DEFAULT '[]';

COMMENT ON COLUMN public.user_journal.annotations IS 'Annotations type post-it liées à la note';

-- Index pour filtre par tag (GIN pour array)
CREATE INDEX IF NOT EXISTS idx_user_journal_tags ON public.user_journal USING GIN (tags);

-- RLS : aucune modification, les politiques existantes restent en vigueur.
