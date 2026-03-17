-- ============================================================================
-- Second Brain : Projets, RLS stricte, Storage journal_media
-- Exécuter après les migrations journal (magic-journal + smart-journal)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLE PROJECTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6B7280',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.projects IS 'Projets utilisateur pour organiser les notes. RLS : accès strict par user_id.';

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- ----------------------------------------------------------------------------
-- 2. COLONNE PROJECT_ID SUR USER_JOURNAL (notes)
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_journal
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.user_journal.project_id IS 'Projet auquel la note est rattachée (optionnel).';

CREATE INDEX IF NOT EXISTS idx_user_journal_project_id ON public.user_journal(project_id);

-- Tags : déjà ajoutés par supabase-migrations-smart-journal.sql (text[]). On ne touche pas.

-- ----------------------------------------------------------------------------
-- 3. RLS — PROJECTS (inviolable)
-- ----------------------------------------------------------------------------
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_own" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_own" ON public.projects;
DROP POLICY IF EXISTS "projects_update_own" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_own" ON public.projects;

CREATE POLICY "projects_select_own" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "projects_insert_own" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update_own" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_delete_own" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. RLS — USER_JOURNAL (notes) : déjà en place, on s’assure qu’elles sont strictes
-- ----------------------------------------------------------------------------
-- Les politiques journal_* existent déjà (auth.uid() = user_id). Aucune modification nécessaire.
-- project_id est une simple FK : l’utilisateur ne peut modifier que ses propres lignes.

-- ----------------------------------------------------------------------------
-- 5. STORAGE BUCKET journal_media — RLS
-- ----------------------------------------------------------------------------
-- Créer le bucket "journal_media" (privé) dans Dashboard > Storage si besoin.
-- Path attendu : {user_id}/{entry_id}/{filename}

-- Politiques RLS Storage : seul le propriétaire (user_id = premier segment du path)
DROP POLICY IF EXISTS "journal_media_select_own" ON storage.objects;
DROP POLICY IF EXISTS "journal_media_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "journal_media_update_own" ON storage.objects;
DROP POLICY IF EXISTS "journal_media_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;

CREATE POLICY "journal_media_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'journal_media' AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "journal_media_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'journal_media' AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "journal_media_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'journal_media' AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "journal_media_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'journal_media' AND (storage.foldername(name))[1] = auth.uid()::text
  );
