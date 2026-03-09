-- Onboarding, quêtes quotidiennes (daily_logs), Sceaux de Maîtrise (unlocked_seals)
-- Exécuter après les migrations profils existantes.

-- Profils : onboarding + sceaux débloqués
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS unlocked_seals jsonb DEFAULT '[]';

COMMENT ON COLUMN public.profiles.has_completed_onboarding IS 'Tour guidé terminé (Éclats de Sève)';
COMMENT ON COLUMN public.profiles.unlocked_seals IS 'IDs des Sceaux de Maîtrise débloqués (7 quêtes par clé)';

-- Bio utilisateur (Racines Narratives)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS narrative_roots text;

COMMENT ON COLUMN public.profiles.narrative_roots IS 'Texte libre de présentation (Racines Narratives)';

-- Table des logs quotidiens
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  quest_id integer,
  element_key text NOT NULL,
  task_text text,
  is_quest_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_logs_element ON public.daily_logs(user_id, element_key);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own daily_logs"
  ON public.daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily_logs"
  ON public.daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily_logs"
  ON public.daily_logs FOR UPDATE USING (auth.uid() = user_id);

COMMENT ON TABLE public.daily_logs IS 'Quêtes quotidiennes : une entrée par jour, élément et validation';
