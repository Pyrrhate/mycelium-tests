/**
 * Mycélium - Service de données (Supabase + localStorage)
 * saveSession() envoie vers forest_stats. Profils (profiles) pour le dashboard.
 */
window.dataService = (function () {
  var KEYS = ['spore', 'ancrage', 'expansion', 'lyse', 'fructification', 'absorption', 'dormance'];
  var TABLE_FOREST_STATS = 'forest_stats';
  var TABLE_PROFILES = 'profiles';

  /** Profil hybride → Maison (Racine, Efflorescence, Vide) */
  var MAISONS_MAP = {
    spore_ancrage: 'Racine',
    spore_expansion: 'Efflorescence',
    spore_lyse: 'Efflorescence',
    spore_fructification: 'Efflorescence',
    spore_absorption: 'Efflorescence',
    spore_dormance: 'Vide',
    ancrage_expansion: 'Racine',
    ancrage_lyse: 'Racine',
    ancrage_fructification: 'Racine',
    ancrage_absorption: 'Racine',
    ancrage_dormance: 'Racine',
    expansion_lyse: 'Efflorescence',
    expansion_fructification: 'Efflorescence',
    expansion_absorption: 'Vide',
    expansion_dormance: 'Vide',
    lyse_fructification: 'Efflorescence',
    lyse_absorption: 'Racine',
    lyse_dormance: 'Vide',
    fructification_absorption: 'Efflorescence',
    fructification_dormance: 'Vide',
    absorption_dormance: 'Vide'
  };

  /**
   * Quotient Mycélien : 100 = harmonie (σ=0), ~10 = spécialisation extrême.
   * QM = 100 - k * σ avec σ = écart-type des 7 moyennes.
   */
  function getQuotientMycelien(poleAverages) {
    if (!poleAverages || poleAverages.length !== 7) return 50;
    var n = 7;
    var sum = 0;
    for (var i = 0; i < n; i++) sum += poleAverages[i];
    var mean = sum / n;
    var variance = 0;
    for (var i = 0; i < n; i++) variance += Math.pow(poleAverages[i] - mean, 2);
    variance /= n;
    var sigma = Math.sqrt(variance);
    var qm = Math.round(100 - 45 * sigma);
    return Math.max(0, Math.min(100, qm));
  }

  /**
   * Retourne la Maison (Racine, Efflorescence, Vide) pour un profileKey.
   */
  function getMaison(profileKey) {
    return MAISONS_MAP[profileKey] || 'Vide';
  }

  /**
   * Enregistre la session en base (forest_stats) et en local.
   * scores: [7], profileName: string, qm_score: number, maison: string, userName: string (optionnel), userId: string (optionnel, uuid auth)
   */
  function saveSession(scores, profileName, qm_score, maison, userName, userId) {
    var payload = {
      score_spore: scores[0],
      score_ancrage: scores[1],
      score_expansion: scores[2],
      score_lyse: scores[3],
      score_fructification: scores[4],
      score_absorption: scores[5],
      score_dormance: scores[6],
      profile_name: profileName || '',
      qm_score: qm_score,
      maison: maison || ''
    };
    if (userId) payload.user_id = userId;

    if (window.supabaseClient) {
      window.supabaseClient
        .from(TABLE_FOREST_STATS)
        .insert(payload)
        .then(function () { })
        .catch(function (err) {
          console.warn('Mycélium Supabase saveSession:', err.message);
        });
    }

    try {
      var history = JSON.parse(localStorage.getItem('mycelium_49_history') || '[]');
      history.unshift({
        date: new Date().toISOString(),
        userName: userName || '',
        profileName: profileName,
        scores: scores,
        qm_score: qm_score,
        maison: maison
      });
      localStorage.setItem('mycelium_49_history', JSON.stringify(history.slice(0, 30)));
    } catch (_) {}
  }

  /**
   * Récupère les moyennes globales (chaque colonne) pour le radar de comparaison.
   * Retourne une Promise avec les moyennes par clé.
   */
  function getGlobalPulse() {
    if (!window.supabaseClient) {
      return Promise.resolve({
        spore: 0,
        ancrage: 0,
        expansion: 0,
        lyse: 0,
        fructification: 0,
        absorption: 0,
        dormance: 0
      });
    }
    return window.supabaseClient
      .from(TABLE_FOREST_STATS)
      .select('score_spore, score_ancrage, score_expansion, score_lyse, score_fructification, score_absorption, score_dormance')
      .then(function (result) {
        var data = result.data || [];
        if (data.length === 0) {
          return { spore: 0, ancrage: 0, expansion: 0, lyse: 0, fructification: 0, absorption: 0, dormance: 0 };
        }
        var sums = [0, 0, 0, 0, 0, 0, 0];
        var cols = ['score_spore', 'score_ancrage', 'score_expansion', 'score_lyse', 'score_fructification', 'score_absorption', 'score_dormance'];
        for (var i = 0; i < data.length; i++) {
          for (var c = 0; c < 7; c++) {
            var v = data[i][cols[c]];
            sums[c] += typeof v === 'number' ? v : 0;
          }
        }
        var out = {};
        for (var j = 0; j < 7; j++) out[KEYS[j]] = data.length ? sums[j] / data.length : 0;
        return out;
      })
      .catch(function (err) {
        console.warn('Mycélium getGlobalPulse:', err.message);
        return { spore: 0, ancrage: 0, expansion: 0, lyse: 0, fructification: 0, absorption: 0, dormance: 0 };
      });
  }

  /**
   * Récupère le profil initié (nom, totem, maison, public_constellation, slug) pour un user_id.
   */
  function getProfile(userId) {
    if (!window.supabaseClient || !userId) return Promise.resolve(null);
    return window.supabaseClient
      .from(TABLE_PROFILES)
      .select('*')
      .eq('id', userId)
      .single()
      .then(function (res) { return res.data || null; })
      .catch(function () { return null; });
  }

  /**
   * Crée ou met à jour le profil. data: { initiate_name, totem, maison, public_constellation, slug }
   */
  function setProfile(userId, data) {
    if (!window.supabaseClient || !userId) return Promise.resolve();
    var row = {
      id: userId,
      updated_at: new Date().toISOString()
    };
    if (data.initiate_name !== undefined) row.initiate_name = data.initiate_name;
    if (data.totem !== undefined) row.totem = data.totem;
    if (data.maison !== undefined) row.maison = data.maison;
    if (data.public_constellation !== undefined) row.public_constellation = !!data.public_constellation;
    if (data.slug !== undefined) row.slug = data.slug;
    return window.supabaseClient
      .from(TABLE_PROFILES)
      .upsert(row, { onConflict: 'id' })
      .then(function () {})
      .catch(function (err) { console.warn('Mycélium setProfile:', err.message); });
  }

  /**
   * Génère un slug pour URL publique (ex: marc-le-hibou).
   */
  function slugify(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Liste des profils publics (Hyphes actives) — derniers mis à jour, avec slug.
   */
  function getPublicProfiles(limit) {
    if (!window.supabaseClient) return Promise.resolve([]);
    var q = window.supabaseClient
      .from(TABLE_PROFILES)
      .select('id, initiate_name, totem, maison, slug, updated_at')
      .eq('public_constellation', true)
      .not('slug', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(limit || 12);
    return q.then(function (res) { return res.data || []; }).catch(function () { return []; });
  }

  /**
   * Historique des sessions (QM) pour un user_id depuis Supabase (forest_stats).
   * Retourne les 5 derniers avec date et qm_score.
   */
  function getSessionsForUser(userId) {
    if (!window.supabaseClient || !userId) return Promise.resolve([]);
    return window.supabaseClient
      .from(TABLE_FOREST_STATS)
      .select('created_at, qm_score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(function (res) { return res.data || []; })
      .catch(function () { return []; });
  }

  /**
   * Récupère un profil public par son slug (pour les pages /u/slug).
   */
  function getProfileBySlug(slug) {
    if (!window.supabaseClient || !slug) return Promise.resolve(null);
    return window.supabaseClient
      .from(TABLE_PROFILES)
      .select('*')
      .eq('slug', slug)
      .eq('public_constellation', true)
      .single()
      .then(function (res) { return res.data || null; })
      .catch(function () { return null; });
  }

  /**
   * Dernière session complète (scores) pour afficher le radar public.
   */
  function getLastSessionForUser(userId) {
    if (!window.supabaseClient || !userId) return Promise.resolve(null);
    return window.supabaseClient
      .from(TABLE_FOREST_STATS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(function (res) { return res.data || null; })
      .catch(function () { return null; });
  }

  return {
    saveSession: saveSession,
    getGlobalPulse: getGlobalPulse,
    getQuotientMycelien: getQuotientMycelien,
    getMaison: getMaison,
    getProfile: getProfile,
    setProfile: setProfile,
    getPublicProfiles: getPublicProfiles,
    getSessionsForUser: getSessionsForUser,
    getProfileBySlug: getProfileBySlug,
    getLastSessionForUser: getLastSessionForUser,
    slugify: slugify,
    MAISONS_MAP: MAISONS_MAP
  };
})();
