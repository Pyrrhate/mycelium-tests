-- ============================================================================
-- Anima Security Hardening - user_journal RLS
-- ============================================================================

ALTER TABLE public.user_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_journal FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own user_journal" ON public.user_journal;
DROP POLICY IF EXISTS "Users can insert own user_journal" ON public.user_journal;
DROP POLICY IF EXISTS "Users can update own user_journal" ON public.user_journal;
DROP POLICY IF EXISTS "Users can delete own user_journal" ON public.user_journal;
DROP POLICY IF EXISTS "journal_select_own" ON public.user_journal;
DROP POLICY IF EXISTS "journal_insert_own" ON public.user_journal;
DROP POLICY IF EXISTS "journal_update_own" ON public.user_journal;
DROP POLICY IF EXISTS "journal_delete_own" ON public.user_journal;

CREATE POLICY "journal_select_own" ON public.user_journal
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "journal_insert_own" ON public.user_journal
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "journal_update_own" ON public.user_journal
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "journal_delete_own" ON public.user_journal
FOR DELETE USING (auth.uid() = user_id);
