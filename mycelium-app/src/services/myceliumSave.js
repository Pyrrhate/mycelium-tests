/**
 * Sauvegarde Mycélium — Supabase + localStorage
 * Centralise l'enregistrement des résultats 49 Racines et du totem.
 */
import { supabase } from '../supabaseClient';

const TABLE_FOREST_STATS = 'forest_stats';
const TABLE_PROFILES = 'profiles';
const TABLE_MONTHLY_RESONANCE = 'monthly_resonance';
const TABLE_FOREST_AWAKENING = 'forest_awakening';
const TABLE_INTELLIGENCE_MATRIX = 'intelligence_matrix';
const XP_RESONANCE = 400;
const XP_MATRICE = 300;

export function getMaison(profileKey) {
  const MAISONS_MAP = {
    spore_ancrage: 'Racine', spore_expansion: 'Efflorescence', spore_lyse: 'Efflorescence',
    spore_fructification: 'Efflorescence', spore_absorption: 'Efflorescence', spore_dormance: 'Vide',
    ancrage_expansion: 'Racine', ancrage_lyse: 'Racine', ancrage_fructification: 'Racine',
    ancrage_absorption: 'Racine', ancrage_dormance: 'Racine', expansion_lyse: 'Efflorescence',
    expansion_fructification: 'Efflorescence', expansion_absorption: 'Vide', expansion_dormance: 'Vide',
    lyse_fructification: 'Efflorescence', lyse_absorption: 'Racine', lyse_dormance: 'Vide',
    fructification_absorption: 'Efflorescence', fructification_dormance: 'Vide', absorption_dormance: 'Vide',
  };
  return MAISONS_MAP[profileKey] || 'Vide';
}

/**
 * Enregistre le résultat des 49 Racines : localStorage + Supabase (forest_stats et profil).
 */
export async function save49Result(result, userId) {
  if (!result?.poleAverages || result.poleAverages.length !== 7) return;
  const payload = {
    score_spore: result.poleAverages[0],
    score_ancrage: result.poleAverages[1],
    score_expansion: result.poleAverages[2],
    score_lyse: result.poleAverages[3],
    score_fructification: result.poleAverages[4],
    score_absorption: result.poleAverages[5],
    score_dormance: result.poleAverages[6],
    profile_name: result.hybrid?.name ?? '',
    qm_score: result.qm ?? 50,
    maison: getMaison(result.hybrid?.profileKey ?? ''),
  };
  if (userId) payload.user_id = userId;

  if (supabase) {
    try {
      await supabase.from(TABLE_FOREST_STATS).insert(payload);
    } catch (e) {
      console.warn('Mycélium save49 forest_stats:', e?.message);
    }
    if (userId) {
      try {
        const { data: profile } = await supabase.from(TABLE_PROFILES).select('xp_seve, initiation_step, test_mycelium_completed').eq('id', userId).single();
        const xp = (profile?.xp_seve ?? 0) + 500;
        const step = Math.max(profile?.initiation_step ?? 1, 2);
        await updateProfile(userId, {
          test_mycelium_completed: true,
          initiation_step: step,
          xp_seve: xp,
          constellation_data: { poleAverages: result.poleAverages },
        });
      } catch (_) {}
    }
  }

  try {
    const history = JSON.parse(localStorage.getItem('mycelium_49_history') || '[]');
    history.unshift({
      date: new Date().toISOString(),
      userName: result.userName ?? '',
      profileName: result.hybrid?.name,
      scores: result.poleAverages,
      qm_score: result.qm,
      maison: getMaison(result.hybrid?.profileKey),
    });
    localStorage.setItem('mycelium_49_history', JSON.stringify(history.slice(0, 30)));
  } catch (_) {}
}

/**
 * Met à jour le profil Supabase (initiate_name, maison, totem, flags V6).
 */
export async function updateProfile(userId, data) {
  if (!supabase || !userId) return;
  const row = {
    id: userId,
    updated_at: new Date().toISOString(),
  };
  if (data.initiate_name !== undefined) row.initiate_name = data.initiate_name;
  if (data.maison !== undefined) row.maison = data.maison;
  if (data.totem !== undefined) row.totem = data.totem;
  if (data.public_constellation !== undefined) row.public_constellation = data.public_constellation;
  if (data.is_public !== undefined) row.is_public = data.is_public;
  if (data.slug !== undefined) row.slug = data.slug;
  if (data.test_mycelium_completed !== undefined) row.test_mycelium_completed = data.test_mycelium_completed;
  if (data.test_totem_completed !== undefined) row.test_totem_completed = data.test_totem_completed;
  if (data.initiation_step !== undefined) row.initiation_step = data.initiation_step;
  if (data.xp_seve !== undefined) row.xp_seve = data.xp_seve;
  if (data.constellation_data !== undefined) row.constellation_data = data.constellation_data;
  if (data.element_primordial !== undefined) row.element_primordial = data.element_primordial;
  if (data.current_seal_id !== undefined) row.current_seal_id = data.current_seal_id;
  if (data.current_nebula_css !== undefined) row.current_nebula_css = data.current_nebula_css;
  if (data.resonance_month_year !== undefined) row.resonance_month_year = data.resonance_month_year;
  if (data.capacite_maillage !== undefined) row.capacite_maillage = data.capacite_maillage;
  if (data.cognitive_title !== undefined) row.cognitive_title = data.cognitive_title;
  try {
    await supabase.from(TABLE_PROFILES).upsert(row, { onConflict: 'id' });
  } catch (e) {
    console.warn('Mycélium updateProfile:', e?.message);
  }
}

/**
 * Sauvegarde le totem en local et sur le profil Supabase.
 * V6 : marque test_totem_completed, initiation_step, +300 XP.
 */
export async function saveTotem(totemName, userId) {
  try {
    localStorage.setItem('mycelium_totem', totemName);
  } catch (_) {}
  if (userId) {
    await updateProfile(userId, { totem: totemName });
    if (supabase) {
      try {
        const { data: profile } = await supabase.from(TABLE_PROFILES).select('xp_seve, initiation_step, test_totem_completed').eq('id', userId).single();
        const xp = (profile?.xp_seve ?? 0) + 300;
        const step = Math.max(profile?.initiation_step ?? 1, 3);
        await updateProfile(userId, { test_totem_completed: true, initiation_step: step, xp_seve: xp });
      } catch (_) {}
    }
  }
}

/**
 * Résonance du Cycle : enregistre la session mensuelle, +400 XP, met à jour le profil (Sceau, Nébuleuse).
 * Si 100+ résonances cette semaine, déclenche un Éveil de la Forêt (24h).
 */
export async function saveResonanceResult(userId, payload) {
  if (!supabase || !userId || !payload?.month_year || !payload?.scores) return;
  const { month_year, scores, resonance_summary, seal_id, nebula_css } = payload;
  try {
    await supabase.from(TABLE_MONTHLY_RESONANCE).insert({
      user_id: userId,
      month_year,
      scores,
      resonance_summary: resonance_summary ?? null,
      seal_id: seal_id ?? null,
      nebula_css: nebula_css ?? null,
    });
  } catch (e) {
    console.warn('Mycélium saveResonance:', e?.message);
    return;
  }
  try {
    const { data: profile } = await supabase.from(TABLE_PROFILES).select('xp_seve').eq('id', userId).single();
    const xp = (profile?.xp_seve ?? 0) + XP_RESONANCE;
    await updateProfile(userId, {
      xp_seve: xp,
      current_seal_id: seal_id ?? null,
      current_nebula_css: nebula_css ?? null,
      resonance_month_year: month_year,
    });
  } catch (_) {}

  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const iso = startOfWeek.toISOString();
    const { count } = await supabase
      .from(TABLE_MONTHLY_RESONANCE)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', iso);
    if (count >= 100) {
      const endsAt = new Date();
      endsAt.setHours(endsAt.getHours() + 24);
      const { data: existing } = await supabase
        .from(TABLE_FOREST_AWAKENING)
        .select('id')
        .gt('ends_at', new Date().toISOString())
        .limit(1)
        .maybeSingle();
      if (!existing) {
        await supabase.from(TABLE_FOREST_AWAKENING).insert({
          ends_at: endsAt.toISOString(),
          trigger_count: count,
        });
      }
    }
  } catch (_) {}
}

/** Retourne la résonance du mois en cours pour l'utilisateur (si déjà faite). */
export async function getCurrentMonthResonance(userId) {
  if (!supabase || !userId) return null;
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const { data } = await supabase
    .from(TABLE_MONTHLY_RESONANCE)
    .select('*')
    .eq('user_id', userId)
    .eq('month_year', monthYear)
    .maybeSingle();
  return data;
}

/** Liste des résonances passées (archives) pour l'utilisateur. */
export async function getResonanceArchives(userId, limit = 12) {
  if (!supabase || !userId) return [];
  const { data } = await supabase
    .from(TABLE_MONTHLY_RESONANCE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

/** Éveil de la Forêt actif (24h de brillance) */
export async function getActiveForestAwakening() {
  if (!supabase) return null;
  const { data } = await supabase
    .from(TABLE_FOREST_AWAKENING)
    .select('*')
    .gt('ends_at', new Date().toISOString())
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/**
 * Matrice des Intelligences : enregistre le résultat, +300 XP, met à jour le profil (Capacité de Maillage, Titre Cognitif).
 */
export async function saveIntelligenceResult(userId, payload) {
  if (!supabase || !userId || !payload?.scores) return;
  const { scores, dominant_key, cognitive_title, capacite_maillage } = payload;
  try {
    await supabase.from(TABLE_INTELLIGENCE_MATRIX).insert({
      user_id: userId,
      scores,
      dominant_key: dominant_key ?? null,
      cognitive_title: cognitive_title ?? null,
      capacite_maillage: capacite_maillage ?? null,
    });
  } catch (e) {
    console.warn('Mycélium saveIntelligence:', e?.message);
    return;
  }
  try {
    const { data: profile } = await supabase.from(TABLE_PROFILES).select('xp_seve').eq('id', userId).single();
    const xp = (profile?.xp_seve ?? 0) + XP_MATRICE;
    await updateProfile(userId, {
      xp_seve: xp,
      capacite_maillage: capacite_maillage ?? null,
      cognitive_title: cognitive_title ?? null,
    });
  } catch (_) {}
}

/** Dernier résultat Matrice d'Intelligence pour l'utilisateur */
export async function getLastIntelligenceResult(userId) {
  if (!supabase || !userId) return null;
  const { data } = await supabase
    .from(TABLE_INTELLIGENCE_MATRIX)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
