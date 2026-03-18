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
const TABLE_MATCH_HISTORY = 'match_history';
const TABLE_USER_JOURNAL = 'user_journal';
const TABLE_DAILY_LOGS = 'daily_logs';
const TABLE_PROJECTS = 'projects';
const XP_RESONANCE = 400;
const XP_QUEST_DAILY = 50;
const PS_QUEST_DAILY = 20;
const XP_MATRICE = 300;
const XP_MATCH_WIN = 20;
const PS_MATCH_WIN = 50;
const PS_QUEST_COMPLETE = 50;
const XP_QUEST_COMPLETE = 10;

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
          constellation_data: {
            poleAverages: result.poleAverages,
            hybrid: result.hybrid,
            userName: result.userName ?? '',
            qm: result.qm ?? 50,
          },
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
  if (data.constellation_result !== undefined) row.constellation_result = data.constellation_result;
  if (data.element_primordial !== undefined) row.element_primordial = data.element_primordial;
  if (data.symbiose_points !== undefined) row.symbiose_points = data.symbiose_points;
  if (data.current_seal_id !== undefined) row.current_seal_id = data.current_seal_id;
  if (data.current_nebula_css !== undefined) row.current_nebula_css = data.current_nebula_css;
  if (data.resonance_month_year !== undefined) row.resonance_month_year = data.resonance_month_year;
  if (data.capacite_maillage !== undefined) row.capacite_maillage = data.capacite_maillage;
  if (data.cognitive_title !== undefined) row.cognitive_title = data.cognitive_title;
  if (data.has_completed_onboarding !== undefined) row.has_completed_onboarding = data.has_completed_onboarding;
  if (data.unlocked_seals !== undefined) row.unlocked_seals = data.unlocked_seals;
  if (data.narrative_roots !== undefined) row.narrative_roots = data.narrative_roots;
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

/**
 * Journal : crée une entrée et retourne l'entrée avec id.
 * primary_emotion : stocké dans detected_element si fourni (ex. calme, energie, clarte).
 */
export async function saveJournalEntry(userId, { entry_text, detected_element, assigned_quest_id, primary_emotion, tags, project_id }) {
  if (!supabase || !userId || !entry_text?.trim()) return null;
  const { data, error } = await supabase
    .from(TABLE_USER_JOURNAL)
    .insert({
      user_id: userId,
      entry_text: entry_text.trim(),
      detected_element: primary_emotion ?? detected_element ?? null,
      assigned_quest_id: assigned_quest_id ?? null,
      tags: Array.isArray(tags) ? tags : [],
      project_id: project_id || null,
    })
    .select('id, created_at, assigned_quest_id, detected_element, entry_text, tags, project_id')
    .single();
  if (error) {
    console.warn('Mycélium saveJournalEntry:', error.message);
    return null;
  }
  return data;
}

/**
 * Met à jour une entrée du journal (texte et/ou émotion).
 */
export async function updateJournalEntry(userId, entryId, { entry_text, detected_element, primary_emotion, tags, annotations, project_id }) {
  if (!supabase || !userId || !entryId) return null;
  const payload = {};
  if (entry_text !== undefined) payload.entry_text = typeof entry_text === 'string' ? entry_text.trim() : entry_text;
  if (primary_emotion !== undefined || detected_element !== undefined) payload.detected_element = primary_emotion ?? detected_element ?? null;
  if (tags !== undefined) payload.tags = Array.isArray(tags) ? tags : [];
  if (annotations !== undefined) payload.annotations = Array.isArray(annotations) ? annotations : [];
  if (project_id !== undefined) payload.project_id = project_id || null;
  const { data, error } = await supabase
    .from(TABLE_USER_JOURNAL)
    .update(payload)
    .eq('id', entryId)
    .eq('user_id', userId)
    .select('id, entry_text, detected_element, tags, annotations, project_id, created_at')
    .single();
  if (error) {
    console.warn('updateJournalEntry:', error.message);
    return null;
  }
  return data;
}

/**
 * Supprime une entrée du journal.
 */
export async function deleteJournalEntry(userId, entryId) {
  if (!supabase || !userId || !entryId) return false;
  const { error } = await supabase.from(TABLE_USER_JOURNAL).delete().eq('id', entryId).eq('user_id', userId);
  if (error) {
    console.warn('Mycélium deleteJournalEntry:', error.message);
    return false;
  }
  return true;
}

/**
 * Liste des entrées du journal (archives), plus récentes en premier.
 * Inclut les colonnes IA et les métadonnées de tri (is_pinned, custom_order).
 */
export async function getJournalEntries(userId, limit = 50, projectId = null) {
  if (!supabase || !userId) return [];
  let q = supabase
    .from(TABLE_USER_JOURNAL)
    .select('id, entry_text, detected_element, ai_element, ai_quote, ai_reflection, ai_insight, ai_quest, assigned_quest_id, is_completed, completed_at, is_pinned, custom_order, media_urls, mycelium_link, linked_entry_id, tags, annotations, project_id, created_at')
    .eq('user_id', userId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (projectId) q = q.eq('project_id', projectId);
  const { data } = await q;
  return data ?? [];
}

export async function getJournalEntryById(userId, entryId) {
  if (!supabase || !userId || !entryId) return null;
  const { data, error } = await supabase
    .from(TABLE_USER_JOURNAL)
    .select('id, entry_text, detected_element, ai_element, tags, annotations, project_id, created_at')
    .eq('id', entryId)
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
}

// ========================================================================
// PROJETS (Second Brain)
// ========================================================================

export async function getProjects(userId) {
  if (!supabase || !userId) return [];
  const { data } = await supabase
    .from(TABLE_PROJECTS)
    .select('id, name, color, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function createProject(userId, { name, color }) {
  if (!supabase || !userId || !name?.trim()) return null;
  const { data, error } = await supabase
    .from(TABLE_PROJECTS)
    .insert({
      user_id: userId,
      name: name.trim(),
      color: color || '#6B7280',
      updated_at: new Date().toISOString(),
    })
    .select('id, name, color, created_at')
    .single();
  if (error) {
    console.warn('createProject:', error.message);
    return null;
  }
  return data;
}

export async function updateProject(userId, projectId, { name, color }) {
  if (!supabase || !userId || !projectId) return null;
  const payload = { updated_at: new Date().toISOString() };
  if (name !== undefined) payload.name = String(name).trim();
  if (color !== undefined) payload.color = color;
  const { data, error } = await supabase
    .from(TABLE_PROJECTS)
    .update(payload)
    .eq('id', projectId)
    .eq('user_id', userId)
    .select('id, name, color, created_at')
    .single();
  if (error) {
    console.warn('updateProject:', error.message);
    return null;
  }
  return data;
}

export async function deleteProject(userId, projectId) {
  if (!supabase || !userId || !projectId) return false;
  const { error } = await supabase
    .from(TABLE_PROJECTS)
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId);
  if (error) {
    console.warn('deleteProject:', error.message);
    return false;
  }
  return true;
}

/**
 * Liste des notes pour l'Explorateur (limite élevée, optionnellement par projet).
 */
export async function getJournalEntriesForExplorer(userId, { projectId = null, limit = 200 } = {}) {
  return getJournalEntries(userId, limit, projectId || undefined);
}

/**
 * Agrégat de tous les fichiers/médias attachés aux notes d'un projet.
 * @returns {Promise<Array<{ url, type, name, entryId, createdAt }>>}
 */
export async function getProjectMedia(userId, projectId) {
  if (!supabase || !userId || !projectId) return [];
  const { data: entries } = await supabase
    .from(TABLE_USER_JOURNAL)
    .select('id, media_urls, created_at')
    .eq('user_id', userId)
    .eq('project_id', projectId);
  if (!entries?.length) return [];
  const out = [];
  for (const entry of entries) {
    const urls = entry.media_urls;
    if (!Array.isArray(urls) || urls.length === 0) continue;
    const createdAt = entry.created_at || '';
    for (const m of urls) {
      const url = typeof m === 'string' ? m : m?.url;
      if (!url) continue;
      const type = typeof m === 'object' && m?.type ? m.type : (url.match(/\.(pdf|docx?|txt|md)$/i) ? 'file' : 'image');
      const name = typeof m === 'object' && m?.name ? m.name : url.split('/').pop() || 'Fichier';
      out.push({ url, type: type || 'file', name, entryId: entry.id, createdAt });
    }
  }
  out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return out;
}

/**
 * Marque une quête du journal comme accomplie : +50 PS, +10 XP, met à jour le profil et l'entrée.
 */
export async function completeJournalQuest(userId, journalEntryId) {
  if (!supabase || !userId || !journalEntryId) return false;
  const { data: profile } = await supabase.from(TABLE_PROFILES).select('xp_seve, symbiose_points').eq('id', userId).single();
  const xp = (profile?.xp_seve ?? 0) + XP_QUEST_COMPLETE;
  const ps = Math.max(0, (profile?.symbiose_points ?? 0) + PS_QUEST_COMPLETE);
  await updateProfile(userId, { xp_seve: xp, symbiose_points: ps });
  await supabase
    .from(TABLE_USER_JOURNAL)
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq('id', journalEntryId)
    .eq('user_id', userId);
  return true;
}

/**
 * Enregistre l'issue d'un duel et ajoute PS/XP en cas de victoire.
 */
export async function saveMatchResult(userId, payload) {
  if (!supabase || !userId) return null;
  const {
    opponent_type = 'ai',
    opponent_id,
    result,
    player_hp_final,
    opponent_hp_final,
    turns_played = 0,
  } = payload;

  const rewards_ps = result === 'win' || result === 'fusion' ? PS_MATCH_WIN : 0;
  const rewards_xp = result === 'win' || result === 'fusion' ? XP_MATCH_WIN : 0;

  const { data: row } = await supabase
    .from(TABLE_MATCH_HISTORY)
    .insert({
      user_id: userId,
      opponent_type,
      opponent_id: opponent_id ?? null,
      result,
      player_hp_final: player_hp_final ?? null,
      opponent_hp_final: opponent_hp_final ?? null,
      turns_played,
      rewards_ps,
      rewards_xp,
    })
    .select('id, rewards_ps, rewards_xp')
    .single();

  if (row && (rewards_ps > 0 || rewards_xp > 0)) {
    const { data: profile } = await supabase.from(TABLE_PROFILES).select('xp_seve, symbiose_points').eq('id', userId).single();
    await updateProfile(userId, {
      xp_seve: (profile?.xp_seve ?? 0) + rewards_xp,
      symbiose_points: Math.max(0, (profile?.symbiose_points ?? 0) + rewards_ps),
    });
  }

  return row;
}

// ——— Quêtes quotidiennes (daily_logs) & Sceaux ———

/**
 * Récupère ou crée l'entrée daily_log pour aujourd'hui (quête du jour).
 * @param {string} userId
 * @param {object} quest - { id, key, task } (getQuestForDay)
 * @returns {Promise<{ id, log_date, quest_id, element_key, task_text, is_quest_completed }|null>}
 */
export async function getOrCreateDailyLog(userId, quest) {
  if (!supabase || !userId) return null;
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from(TABLE_DAILY_LOGS)
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', today)
    .maybeSingle();
  if (existing) return existing;
  if (!quest) return null;
  const key = (quest.key || '').toLowerCase().replace(/éther/, 'ether');
  const elementKey = { Ancrage: 'ancrage', Spore: 'spore', Lyse: 'lyse', Expansion: 'expansion', Fructification: 'fructification', Absorption: 'absorption', Dormance: 'dormance' }[quest.key] || key;
  const { data: inserted } = await supabase
    .from(TABLE_DAILY_LOGS)
    .insert({
      user_id: userId,
      log_date: today,
      quest_id: quest.id,
      element_key: elementKey,
      task_text: quest.task,
    })
    .select('*')
    .single();
  return inserted;
}

/**
 * Récupère le log du jour (pour afficher la quête).
 */
export async function getTodayDailyLog(userId) {
  if (!supabase || !userId) return null;
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from(TABLE_DAILY_LOGS)
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', today)
    .maybeSingle();
  return data;
}

/**
 * Valide la quête du jour : +50 XP, +20 PS, met à jour daily_log et vérifie les Sceaux.
 */
export async function completeDailyQuest(userId) {
  if (!supabase || !userId) return null;
  const today = new Date().toISOString().slice(0, 10);
  const { data: log } = await supabase
    .from(TABLE_DAILY_LOGS)
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', today)
    .maybeSingle();
  if (!log || log.is_quest_completed) return log;
  const now = new Date().toISOString();
  await supabase
    .from(TABLE_DAILY_LOGS)
    .update({ is_quest_completed: true, completed_at: now })
    .eq('id', log.id);
  const { data: profile } = await supabase.from(TABLE_PROFILES).select('xp_seve, symbiose_points, unlocked_seals').eq('id', userId).single();
  const xp = (profile?.xp_seve ?? 0) + XP_QUEST_DAILY;
  const ps = Math.max(0, (profile?.symbiose_points ?? 0) + PS_QUEST_DAILY);
  await updateProfile(userId, { xp_seve: xp, symbiose_points: ps });
  const newSeal = await checkMasteryThreshold(userId, log.element_key);
  let newlyUnlockedSeal = null;
  if (newSeal) {
    const seals = Array.isArray(profile?.unlocked_seals) ? profile.unlocked_seals : [];
    if (!seals.includes(newSeal)) {
      await updateProfile(userId, { unlocked_seals: [...seals, newSeal] });
      newlyUnlockedSeal = newSeal;
    }
  }
  return { log: { ...log, is_quest_completed: true, completed_at: now }, newlyUnlockedSeal };
}

/**
 * Compte les quêtes complétées par element_key pour l'utilisateur. Si >= 7, retourne l'id du Sceau.
 */
export async function checkMasteryThreshold(userId, elementKey) {
  if (!supabase || !userId || !elementKey) return null;
  const { data: rows } = await supabase
    .from(TABLE_DAILY_LOGS)
    .select('id')
    .eq('user_id', userId)
    .eq('element_key', elementKey)
    .eq('is_quest_completed', true);
  const count = rows?.length ?? 0;
  if (count >= 7) {
    const SEAL_IDS = { spore: 'spore', ancrage: 'ancrage', expansion: 'expansion', lyse: 'lyse', fructification: 'fructification', absorption: 'absorption', dormance: 'dormance' };
    return SEAL_IDS[elementKey] || elementKey;
  }
  return null;
}

/**
 * Liste des daily_logs pour un mois (calendrier Éveil).
 */
export async function getDailyLogsForCalendar(userId, year, month) {
  if (!supabase || !userId) return [];
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = new Date(year, month, 0).toISOString().slice(0, 10);
  const { data } = await supabase
    .from(TABLE_DAILY_LOGS)
    .select('log_date, element_key, is_quest_completed')
    .eq('user_id', userId)
    .gte('log_date', start)
    .lte('log_date', end);
  return data ?? [];
}

// ========================================================================
// JOURNAL COMPAGNON — Mémoire courte et analyse IA contextuelle
// ========================================================================

/**
 * Récupère les N dernières notes du journal (mémoire courte).
 * Utilisé pour donner du contexte à l'IA avant l'analyse.
 * @param {string} userId
 * @param {number} limit - Nombre de notes à récupérer (défaut: 3)
 * @returns {Promise<Array<{ entry_text: string, ai_element: string, created_at: string }>>}
 */
export async function getPastJournalEntries(userId, limit = 3) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from(TABLE_USER_JOURNAL)
    .select('id, entry_text, ai_element, ai_quote, ai_reflection, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('Mycélium getPastJournalEntries:', error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Sauvegarde une entrée du Journal Compagnon avec la réponse IA complète.
 * @param {string} userId
 * @param {object} params
 * @param {string} params.entry_text - Le texte de l'utilisateur
 * @param {object} params.aiResponse - La réponse de Claude { element, quote, reflection, insight, quest }
 * @returns {Promise<object|null>} L'entrée créée ou null si erreur
 */
export async function saveCompanionJournalEntry(userId, { entry_text, aiResponse, tags, project_id }) {
  if (!supabase || !userId) return null;
  const text = typeof entry_text === 'string' ? entry_text.trim() : (entry_text?.trim?.() ?? '');
  if (!text) return null;

  const row = {
    user_id: userId,
    entry_text: text,
    detected_element: aiResponse?.element || null,
    ai_element: aiResponse?.element || null,
    ai_quote: aiResponse?.quote || null,
    ai_reflection: aiResponse?.reflection || null,
    ai_insight: aiResponse?.insight || null,
    ai_quest: aiResponse?.quest || null,
    mycelium_link: aiResponse?.mycelium_link || null,
    analysis_completed_at: new Date().toISOString(),
    tags: Array.isArray(tags) ? tags : [],
  };
  if (project_id) row.project_id = project_id;
  const { data, error } = await supabase
    .from(TABLE_USER_JOURNAL)
    .insert(row)
    .select('*')
    .single();

  if (error) {
    console.warn('saveCompanionJournalEntry:', error.message);
    return null;
  }

  return data;
}

/**
 * Appelle l'Edge Function analyze-journal avec le contexte des notes passées.
 * Fallback sur le mock si l'Edge Function échoue.
 * @param {string} currentEntry - La note actuelle
 * @param {Array} pastEntries - Les notes passées (mémoire courte)
 * @returns {Promise<object>} La réponse IA { element, quote, reflection }
 */
export async function analyzeJournalWithContext(currentEntry, pastEntries = []) {
  if (!supabase) {
    throw new Error('Supabase non configuré');
  }

  const { data, error } = await supabase.functions.invoke('analyze-journal', {
    body: {
      current_entry: currentEntry,
      past_entries: pastEntries.map(e => ({
        text: e.entry_text,
        element: e.ai_element,
        date: e.created_at,
      })),
    },
  });

  if (error) {
    throw new Error(error.message || 'Erreur Edge Function');
  }

  return data;
}

// ========================================================================
// JOURNAL AUGMENTÉ — Multimédia, Timeline, Liens Organiques
// ========================================================================

const STORAGE_BUCKET = 'journal_media';

/**
 * Upload un fichier média vers Supabase Storage.
 * @param {string} userId - ID de l'utilisateur
 * @param {string} entryId - ID de la note (ou 'temp' si pas encore créée)
 * @param {File} file - Fichier à uploader
 * @returns {Promise<{url: string, type: string, thumbnail?: string}|null>}
 */
export async function uploadJournalMedia(userId, entryId, file) {
  if (!supabase || !userId || !file) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${entryId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.warn('Upload error:', uploadError.message);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  const mediaType = file.type.startsWith('image/') ? 'image'
    : file.type.startsWith('audio/') ? 'audio'
    : file.type.startsWith('video/') ? 'video'
    : 'file';

  return {
    url: urlData.publicUrl,
    type: mediaType,
    name: file.name,
    path: filePath,
  };
}

/**
 * Supprime un fichier média de Supabase Storage.
 */
export async function deleteJournalMedia(filePath) {
  if (!supabase || !filePath) return false;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  return !error;
}

/**
 * Échantillonnage intelligent des notes passées pour le contexte IA.
 * Retourne : note d'hier + 2 notes aléatoires avec le même élément.
 * @param {string} userId
 * @param {string} currentElement - Élément détecté dans le texte actuel (optionnel)
 * @returns {Promise<Array>} Notes sélectionnées pour le contexte
 */
export async function getSmartContextEntries(userId, currentElement = null) {
  if (!supabase || !userId) return [];

  const contextEntries = [];

  // 1. Récupérer la note d'hier
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStart = yesterday.toISOString().split('T')[0];

  const { data: yesterdayNotes } = await supabase
    .from(TABLE_USER_JOURNAL)
    .select('id, entry_text, ai_element, ai_quote, created_at')
    .eq('user_id', userId)
    .gte('created_at', `${yesterdayStart}T00:00:00`)
    .lt('created_at', `${yesterdayStart}T23:59:59`)
    .order('created_at', { ascending: false })
    .limit(1);

  if (yesterdayNotes?.length > 0) {
    contextEntries.push(yesterdayNotes[0]);
  }

  // 2. Si un élément est détecté, chercher 2 notes passées avec le même élément
  if (currentElement) {
    const { data: sameElementNotes } = await supabase
      .from(TABLE_USER_JOURNAL)
      .select('id, entry_text, ai_element, ai_quote, created_at')
      .eq('user_id', userId)
      .eq('ai_element', currentElement)
      .order('created_at', { ascending: false })
      .limit(10);

    if (sameElementNotes?.length > 0) {
      // Sélectionner 2 notes aléatoires parmi celles trouvées
      const shuffled = sameElementNotes
        .filter(n => !contextEntries.find(c => c.id === n.id))
        .sort(() => 0.5 - Math.random());
      contextEntries.push(...shuffled.slice(0, 2));
    }
  }

  // 3. Compléter avec des notes aléatoires si nécessaire
  if (contextEntries.length < 3) {
    const { data: randomNotes } = await supabase
      .from(TABLE_USER_JOURNAL)
      .select('id, entry_text, ai_element, ai_quote, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (randomNotes?.length > 0) {
      const remaining = randomNotes
        .filter(n => !contextEntries.find(c => c.id === n.id))
        .sort(() => 0.5 - Math.random())
        .slice(0, 3 - contextEntries.length);
      contextEntries.push(...remaining);
    }
  }

  return contextEntries.slice(0, 3);
}

/**
 * Met à jour une note avec le lien mycélien et les médias.
 */
export async function updateJournalWithMedia(userId, entryId, { media_urls, mycelium_link, linked_entry_id }) {
  if (!supabase || !userId || !entryId) return null;

  const payload = {};
  if (media_urls !== undefined) payload.media_urls = media_urls;
  if (mycelium_link !== undefined) payload.mycelium_link = mycelium_link;
  if (linked_entry_id !== undefined) payload.linked_entry_id = linked_entry_id;

  const { data, error } = await supabase
    .from(TABLE_USER_JOURNAL)
    .update(payload)
    .eq('id', entryId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    console.warn('updateJournalWithMedia error:', error.message);
    return null;
  }

  return data;
}
