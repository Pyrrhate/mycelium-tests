import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { XP_RACINE_ANCREE } from '../data/ranks';

/**
 * V6 — Statut d'initiation et verrouillage du profil public.
 * Le bouton "Activer le Profil Public" n'est disponible que si test_mycelium_completed ET test_totem_completed ET xp_seve >= 1500 (Racine Ancrée).
 */
export function useInitiationStatus(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    if (!supabase || !userId) return;
    setLoading(true);
    setError(null);
    const baseSelect = 'initiation_step, test_mycelium_completed, test_totem_completed, is_public, public_constellation, slug, xp_seve, element_primordial, totem, constellation_data, constellation_result, symbiose_points, initiate_name, resonance_month_year, cognitive_title, has_completed_onboarding, unlocked_seals, narrative_roots, ai_credits';
    try {
      const { data, error: e } = await supabase
        .from('profiles')
        .select(`${baseSelect}, is_premium`)
        .eq('id', userId)
        .single();

      if (e?.message && e.message.includes("Could not find the 'is_premium' column")) {
        // Migration pas encore appliquée : fallback propre (is_premium = false)
        const { data: fallback, error: e2 } = await supabase
          .from('profiles')
          .select(baseSelect)
          .eq('id', userId)
          .single();
        setError(e2?.message || null);
        setProfile(fallback ? { ...fallback, is_premium: false } : null);
      } else {
        setError(e?.message || null);
        setProfile(data || null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [userId]);

  const testMyceliumCompleted = profile?.test_mycelium_completed === true;
  const testTotemCompleted = profile?.test_totem_completed === true;
  const xpSeve = profile?.xp_seve ?? 0;
  const hasRacineAncree = xpSeve >= XP_RACINE_ANCREE;
  const canActivatePublic = testMyceliumCompleted && testTotemCompleted && hasRacineAncree;
  const initiationStep = profile?.initiation_step ?? 1;
  const isPublic = profile?.is_public === true || profile?.public_constellation === true;

  return {
    profile,
    loading,
    error,
    testMyceliumCompleted,
    testTotemCompleted,
    canActivatePublic,
    initiationStep,
    isPublic,
    xpSeve,
    elementPrimordial: profile?.element_primordial ?? null,
    totem: profile?.totem ?? null,
    constellationData: profile?.constellation_data ?? null,
    constellationResult: profile?.constellation_result ?? null,
    symbiosePoints: Math.max(0, Number(profile?.symbiose_points) || 0),
    hasCompletedOnboarding: profile?.has_completed_onboarding === true,
    unlockedSeals: Array.isArray(profile?.unlocked_seals) ? profile.unlocked_seals : [],
    narrativeRoots: profile?.narrative_roots ?? '',
    aiCredits: typeof profile?.ai_credits === 'number' ? profile.ai_credits : 15,
    refetch: fetchProfile,
  };
}
