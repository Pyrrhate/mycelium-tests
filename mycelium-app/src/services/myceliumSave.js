/**
 * Sauvegarde Mycélium — Supabase + localStorage
 * Centralise l'enregistrement des résultats 49 Racines et du totem.
 */
import { supabase } from '../supabaseClient';

const TABLE_FOREST_STATS = 'forest_stats';
const TABLE_PROFILES = 'profiles';

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
 * Met à jour le profil Supabase (initiate_name, maison, totem).
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
  if (data.slug !== undefined) row.slug = data.slug;
  try {
    await supabase.from(TABLE_PROFILES).upsert(row, { onConflict: 'id' });
  } catch (e) {
    console.warn('Mycélium updateProfile:', e?.message);
  }
}

/**
 * Sauvegarde le totem en local et sur le profil Supabase.
 */
export async function saveTotem(totemName, userId) {
  try {
    localStorage.setItem('mycelium_totem', totemName);
  } catch (_) {}
  if (userId) await updateProfile(userId, { totem: totemName });
}
