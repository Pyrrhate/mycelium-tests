import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const TABLE_PROFILES = 'profiles';
const TABLE_MONTHLY_RESONANCE = 'monthly_resonance';
const TABLE_INTELLIGENCE_MATRIX = 'intelligence_matrix';

const POLE_KEYS = ['spore', 'ancrage', 'expansion', 'lyse', 'fructification', 'absorption', 'dormance'];

/**
 * Récupère profil, résonances mensuelles et dernière matrice d'intelligence pour l'analytique mensuelle.
 * Utilisé par l'Observatoire de la Constellation.
 */
export function useMonthlyAnalytics(userId) {
  const [profile, setProfile] = useState(null);
  const [monthlyResonances, setMonthlyResonances] = useState([]);
  const [intelligenceMatrix, setIntelligenceMatrix] = useState(null);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState(null);
  const [refetchKey, setRefetchKey] = useState(0);

  useEffect(() => {
    if (!userId || !supabase) {
      setProfile(null);
      setMonthlyResonances([]);
      setIntelligenceMatrix(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fetch = async () => {
      try {
        const [profileRes, resonanceRes, intelRes] = await Promise.all([
          supabase.from(TABLE_PROFILES).select('*').eq('id', userId).single(),
          supabase
            .from(TABLE_MONTHLY_RESONANCE)
            .select('*')
            .eq('user_id', userId)
            .order('month_year', { ascending: false })
            .limit(24),
          supabase
            .from(TABLE_INTELLIGENCE_MATRIX)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        setProfile(profileRes?.data ?? null);
        setMonthlyResonances(resonanceRes?.data ?? []);
        setIntelligenceMatrix(intelRes?.data ?? null);
      } catch (e) {
        setError(e?.message ?? 'Erreur chargement analytique');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [userId, refetchKey]);

  const refetch = () => setRefetchKey((k) => k + 1);

  const baseScores = profile?.constellation_data?.poleAverages ?? null;
  const currentMonthYear = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();
  const currentMonthResonance = monthlyResonances.find((r) => r.month_year === currentMonthYear);

  /** Retourne le pôle (index 0–6) ayant le plus grand écart entre résonance du mois et base. */
  const getTensionPole = (monthResonance) => {
    if (!baseScores || !Array.isArray(baseScores) || baseScores.length < 7) return null;
    const scores = Array.isArray(monthResonance?.scores) ? monthResonance.scores : [];
    if (scores.length < 7) return null;
    let maxGap = 0;
    let poleIndex = 0;
    for (let i = 0; i < 7; i++) {
      const gap = Math.abs((scores[i] ?? 0) - (baseScores[i] ?? 0));
      if (gap > maxGap) {
        maxGap = gap;
        poleIndex = i;
      }
    }
    return { poleIndex, key: POLE_KEYS[poleIndex], gap: maxGap, isExcess: (scores[poleIndex] ?? 0) >= (baseScores[poleIndex] ?? 0) };
  };

  return {
    profile,
    monthlyResonances,
    intelligenceMatrix,
    baseScores,
    currentMonthYear,
    currentMonthResonance,
    getTensionPole,
    loading,
    error,
    refetch,
  };
}
