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

  const fetchProfile = () => {
    if (!supabase || !userId) return;
    setLoading(true);
    setError(null);
    supabase
      .from('profiles')
      .select('initiation_step, test_mycelium_completed, test_totem_completed, is_public, public_constellation, slug, xp_seve, element_primordial')
      .eq('id', userId)
      .single()
      .then(({ data, error: e }) => {
        setError(e?.message || null);
        setProfile(data || null);
      })
      .finally(() => setLoading(false));
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
    refetch: fetchProfile,
  };
}
