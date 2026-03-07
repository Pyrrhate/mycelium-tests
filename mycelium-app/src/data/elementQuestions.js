/**
 * Questionnaire 4 — La Révélation de l'Élément Maître (L'Essence de la Sève)
 * 21 questions (3 par élément). Définit l'élément dominant et la couleur d'accent de l'interface.
 */
export const ELEMENT_TEST = {
  test_id: 'elements',
  name: "La Révélation de l'Élément Maître",
  keys: ['AIR_SPORE', 'TERRE_ANCRAGE', 'EAU_EXPANSION', 'FEU_LYSE', 'BOIS_FRUCTIFICATION', 'METAL_ABSORPTION', 'ETHER_DORMANCE'],
  labels: {
    AIR_SPORE: { element: 'Air', key: 'Spore', color: '#87CEEB' },
    TERRE_ANCRAGE: { element: 'Terre', key: 'Ancrage', color: '#8B4513' },
    EAU_EXPANSION: { element: 'Eau', key: 'Expansion', color: '#4682B4' },
    FEU_LYSE: { element: 'Feu', key: 'Lyse', color: '#CD5C5C' },
    BOIS_FRUCTIFICATION: { element: 'Bois', key: 'Fructification', color: '#228B22' },
    METAL_ABSORPTION: { element: 'Métal', key: 'Absorption', color: '#708090' },
    ETHER_DORMANCE: { element: 'Éther', key: 'Dormance', color: '#9370DB' },
  },
  questions: {
    AIR_SPORE: [
      "Le mouvement permanent est-il votre seul état de confort ?",
      "Préférez-vous l'immatériel d'une idée à la solidité d'un objet ?",
      "Votre pensée voyage-t-elle plus vite que vos actions ?",
    ],
    TERRE_ANCRAGE: [
      "La stabilité d'une tradition est-elle votre fondation vitale ?",
      "Ressentez-vous un besoin physique d'être en contact avec la matière ?",
      "Le temps long est-il pour vous un allié plutôt qu'un ennemi ?",
    ],
    EAU_EXPANSION: [
      "Vous adaptez-vous naturellement à la forme de vos obstacles ?",
      "Le flux émotionnel des autres pénètre-t-il votre propre réseau ?",
      "La communication est-elle pour vous un fluide nécessaire à la vie ?",
    ],
    FEU_LYSE: [
      "La destruction est-elle pour vous le premier acte de la création ?",
      "Votre passion est-elle capable de consumer tout ce qui vous ralentit ?",
      "Agissez-vous souvent par impulsion électrique soudaine ?",
    ],
    BOIS_FRUCTIFICATION: [
      "Le besoin de créer de la beauté est-il votre moteur principal ?",
      "Votre énergie vitale s'épanouit-elle mieux dans l'abondance ?",
      "La croissance est-elle pour vous un impératif biologique ?",
    ],
    METAL_ABSORPTION: [
      "La logique pure est-elle l'outil le plus tranchant de votre esprit ?",
      "Avez-vous besoin de structurer et de classifier tout ce que vous apprenez ?",
      "Votre intégrité est-elle une lame que rien ne peut briser ?",
    ],
    ETHER_DORMANCE: [
      "Le silence total est-il votre source d'énergie la plus puissante ?",
      "Vous sentez-vous souvent connecté à ce qui n'est pas encore né ?",
      "Le vide est-il pour vous une plénitude que les autres ne comprennent pas ?",
    ],
  },
};

/** Ordre des questions : 3 par clé, 21 total */
export function getFlatElementQuestions() {
  const out = [];
  for (const key of ELEMENT_TEST.keys) {
    const qs = ELEMENT_TEST.questions[key] || [];
    qs.forEach((q, i) => out.push({ key, questionIndex: i, question: q }));
  }
  return out;
}

export const ELEMENT_SCALE = [1, 2, 3, 4, 5];
export const ELEMENT_SCALE_LABELS = { 1: 'Pas du tout', 2: 'Un peu', 3: 'Modérément', 4: 'Assez', 5: 'Totalement' };

/** Scores par élément (7 valeurs), à partir du tableau de 21 réponses dans l'ordre getFlatElementQuestions */
export function getElementScores(answers) {
  const scores = {};
  ELEMENT_TEST.keys.forEach((key, keyIdx) => {
    let sum = 0, count = 0;
    for (let i = 0; i < 3; i++) {
      const v = answers[keyIdx * 3 + i];
      if (v !== undefined && v !== null) { sum += Number(v); count++; }
    }
    scores[key] = count === 0 ? 0 : sum / count;
  });
  return scores;
}

/** Élément dominant (score max) → { id, element, key, color } */
export function getDominantElement(scores) {
  let maxKey = ELEMENT_TEST.keys[0];
  let maxVal = scores[maxKey] ?? 0;
  for (const key of ELEMENT_TEST.keys) {
    const v = scores[key] ?? 0;
    if (v > maxVal) { maxVal = v; maxKey = key; }
  }
  const label = ELEMENT_TEST.labels[maxKey];
  return {
    id: maxKey,
    element: label?.element ?? maxKey,
    key: label?.key ?? maxKey,
    color: label?.color ?? '#D4AF37',
  };
}

/** Titre de profil : "Initié de l'Air", "Initié de l'Éther", etc. */
export function getInitieElementLabel(elementKey) {
  const id = typeof elementKey === 'string' ? elementKey : elementKey?.id;
  const label = ELEMENT_TEST.labels[id];
  const element = label?.element ?? id ?? 'Sève';
  return `Initié de l'${element.charAt(0).toUpperCase() + element.slice(1)}`;
}
