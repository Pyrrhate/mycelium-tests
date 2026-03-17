-- ============================================================================
-- Assistant IA à la demande : crédits sur profiles
-- Exécuter dans le SQL Editor Supabase
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_credits integer NOT NULL DEFAULT 15;

COMMENT ON COLUMN public.profiles.ai_credits IS 'Crédits restants pour l’assistant IA du Smart Journal (décrémenté à chaque utilisation).';
