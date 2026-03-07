/**
 * Analyseur de résonance (sentiment) — mots-clés vers élément.
 * Colère/énergie -> Feu ; Tristesse/calme -> Eau ; Confusion/idées -> Air ; Stress/base -> Terre ; etc.
 */
const KEYWORDS_BY_ELEMENT = {
  feu: [
    'colère', 'colere', 'énervé', 'enerve', 'rage', 'frustré', 'frustre', 'agacé', 'agace',
    'énergie', 'energie', 'passion', 'furieux', 'irrité', 'irrite', 'impatient', 'brûler', 'bruler',
    'détruire', 'detruire', 'transformer', 'combat', 'révolte', 'revolte', 'intense', 'feu',
  ],
  eau: [
    'tristesse', 'triste', 'pleurer', 'pleure', 'calme', 'doux', 'douleur', 'émotion', 'emotion',
    'fluide', 'larmes', 'mélancolie', 'melancolie', 'besoin', 'écoute', 'ecoute', 'lien', 'connexion',
    'nourrir', 'accueillir', 'comprendre', 'ressenti', 'eau', 'mer', 'flux',
  ],
  air: [
    'confus', 'confusion', 'idées', 'idees', 'pensées', 'pensees', 'mental', 'tête', 'tete',
    'réfléchir', 'reflechir', 'dispersé', 'dispersee', 'rêve', 'reve', 'imagination', 'léger', 'leger',
    'vent', 'air', 'esprit', 'réflexion', 'reflexion', 'doute', 'incertain',
  ],
  terre: [
    'stress', 'stressé', 'stresse', 'ancrage', 'ancré', 'ancree', 'sécurité', 'securite', 'sécurisé',
    'stable', 'solide', 'fatigue', 'fatigué', 'épuisé', 'epuise', 'corps', 'physique', 'marche',
    'sol', 'terre', 'racines', 'routine', 'structure', 'concret', 'matière', 'matiere',
  ],
  ether: [
    'vide', 'silence', 'néant', 'neant', 'méditation', 'meditation', 'calme', 'repos', 'pause',
    'rien', 'lâcher', 'lacher', 'accepter', 'présent', 'present', 'ici', 'maintenant', 'éther', 'ether',
    'invisible', 'latent', 'attente', 'mystère', 'mystere',
  ],
  bois: [
    'créer', 'creer', 'créatif', 'creatif', 'beauté', 'beaute', 'désir', 'desir', 'croissance',
    'fleur', 'art', 'inspiration', 'nature', 'vert', 'naissance', 'éclosion', 'eclosion', 'bois',
    'abondance', 'généreux', 'genereux', 'donner', 'recevoir',
  ],
  metal: [
    'logique', 'analyse', 'structure', 'ordre', 'clarté', 'clarte', 'précision', 'precision',
    'organisation', 'règle', 'regle', 'limite', 'frontière', 'frontiere', 'tranchant', 'métal', 'metal',
    'classer', 'décider', 'decider', 'objectif', 'efficace', 'méthode', 'methode',
  ],
};

const ELEMENT_ORDER = ['feu', 'eau', 'air', 'terre', 'ether', 'bois', 'metal'];

/**
 * Détecte l'élément dominant dans le texte (résonance / humeur).
 * @param {string} text
 * @returns { { element: string, key: string, color: string } | null }
 */
export function detectElementFromText(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const scores = { feu: 0, eau: 0, air: 0, terre: 0, ether: 0, bois: 0, metal: 0 };

  for (const [element, keywords] of Object.entries(KEYWORDS_BY_ELEMENT)) {
    for (const kw of keywords) {
      const norm = kw.normalize('NFD').replace(/\p{Diacritic}/gu, '');
      if (lower.includes(norm)) scores[element] = (scores[element] || 0) + 1;
    }
  }

  let maxKey = 'terre';
  let maxVal = 0;
  for (const k of ELEMENT_ORDER) {
    if (scores[k] > maxVal) {
      maxVal = scores[k];
      maxKey = k;
    }
  }

  const labels = {
    feu: { element: 'Feu', key: 'Lyse', color: '#CD5C5C' },
    eau: { element: 'Eau', key: 'Expansion', color: '#4682B4' },
    air: { element: 'Air', key: 'Spore', color: '#87CEEB' },
    terre: { element: 'Terre', key: 'Ancrage', color: '#8B4513' },
    ether: { element: 'Éther', key: 'Dormance', color: '#9370DB' },
    bois: { element: 'Bois', key: 'Fructification', color: '#228B22' },
    metal: { element: 'Métal', key: 'Absorption', color: '#708090' },
  };

  return { ...labels[maxKey], keyId: maxKey, score: maxVal };
}
