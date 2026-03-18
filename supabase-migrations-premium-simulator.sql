-- ============================================================================
-- MIGRATION : Simulation Premium (Stripe à venir)
-- Ajoute profiles.is_premium (bool, default false)
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;

COMMENT ON COLUMN public.profiles.is_premium IS 'Accès aux fonctionnalités Premium (simulation avant Stripe)';

