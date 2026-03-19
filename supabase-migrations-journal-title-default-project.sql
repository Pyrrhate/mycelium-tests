-- ============================================================================
-- Smart Journal stabilization:
-- 1) Note title column
-- 2) Enforce default "Non classé" project for notes without project
-- ============================================================================

ALTER TABLE public.user_journal
  ADD COLUMN IF NOT EXISTS title text;

COMMENT ON COLUMN public.user_journal.title IS 'Titre éditable de la note (indépendant du contenu).';

-- Create "Non classé" per user if missing
INSERT INTO public.projects (user_id, name, color, created_at, updated_at)
SELECT DISTINCT uj.user_id, 'Non classé', '#6B7280', now(), now()
FROM public.user_journal uj
WHERE NOT EXISTS (
  SELECT 1
  FROM public.projects p
  WHERE p.user_id = uj.user_id
    AND p.name = 'Non classé'
);

-- Attach all currently unclassified notes
UPDATE public.user_journal uj
SET project_id = p.id
FROM public.projects p
WHERE uj.user_id = p.user_id
  AND p.name = 'Non classé'
  AND uj.project_id IS NULL;
