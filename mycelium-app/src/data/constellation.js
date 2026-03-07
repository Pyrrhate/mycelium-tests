/**
 * La Constellation — L'Horoscope des Courants de Sève
 * 30 questions pour définir l'état vibratoire actuel de l'initié.
 * Mapping : 6 pôles × 5 questions (Spore, Ancrage, Expansion, Lyse, Fructification, Absorption).
 */
export const CONSTELLATION_TEST = {
  test_id: 'constellation',
  name: "L'Horoscope des Courants de Sève",
};

export const CONSTELLATION_POLES = [
  { id: 'spore', name: 'Spore', element: 'Air' },
  { id: 'ancrage', name: 'Ancrage', element: 'Terre' },
  { id: 'expansion', name: 'Expansion', element: 'Eau' },
  { id: 'lyse', name: 'Lyse', element: 'Feu' },
  { id: 'fructification', name: 'Fructification', element: 'Bois' },
  { id: 'absorption', name: 'Absorption', element: 'Métal' },
];

export const CONSTELLATION_QUESTIONS = [
  "Sentez-vous vos racines s'étendre davantage que d'habitude aujourd'hui ?",
  "Votre esprit est-il actuellement encombré par des spores du passé ?",
  "Ressentez-vous une tension électrique dans votre réseau relationnel ?",
  "Le silence vous semble-t-il plus nourricier que la parole en ce moment ?",
  "Avez-vous l'impression que la lumière du monde extérieur vous aveugle ?",
  "Votre capacité de décomposition (lyse) des problèmes est-elle fluide ?",
  "Cherchez-vous activement à coloniser de nouveaux territoires intellectuels ?",
  "La sève de votre créativité est-elle visqueuse ou limpide actuellement ?",
  "Percevez-vous les signaux invisibles de votre entourage avec clarté ?",
  "Votre ancrage au sol vous semble-t-il fragile face aux vents du changement ?",
  "Avez-vous besoin de vous rétracter dans votre mycélium profond ?",
  "Ressentez-vous l'appel d'une fructification imminente dans vos projets ?",
  "Le rythme de la forêt vous semble-t-il trop rapide pour votre propre sève ?",
  "Votre intuition vibre-t-elle à une fréquence inhabituelle ?",
  "La matière sombre de vos doutes freine-t-elle votre expansion ?",
  "Vous sentez-vous en symbiose avec une autre entité du réseau ?",
  "L'absorption de nouvelles connaissances vous semble-t-elle laborieuse ?",
  "Votre feu intérieur est-il une flamme constante ou une étincelle erratique ?",
  "Le vide entre vos pensées est-il peuplé de nouvelles visions ?",
  "Ressentez-vous une soif d'oxygène et de liberté dans vos structures ?",
  "Votre mémoire organique retient-elle des leçons oubliées par votre esprit ?",
  "La surface du monde vous paraît-elle plus superficielle que d'ordinaire ?",
  "Votre capacité de régénération après l'effort est-elle optimale ?",
  "Percevez-vous les vibrations de la terre avant même de les toucher ?",
  "Votre identité (la spore) vous semble-t-elle se dissoudre dans le collectif ?",
  "Avez-vous l'impression d'être une racine isolée ou un nœud central ?",
  "La météo de votre âme est-elle dominée par une brume éthérée ?",
  "Cherchez-vous à protéger vos ressources ou à les disperser ?",
  "Votre croissance suit-elle une géométrie sacrée ou un chaos fertile ?",
  "Êtes-vous prêt à muter pour survivre à la prochaine saison ?",
];

export const CONSTELLATION_SCALE = [-2, -1, 0, 1, 2];
export const CONSTELLATION_SCALE_LABELS = { '-2': 'Non', '-1': '', '0': 'Neutre', '1': '', '2': 'Oui' };

/** Index du pôle (0-5) pour la question qIndex (0-29) */
export function getConstellationPoleIndex(qIndex) {
  return Math.floor(qIndex / 5);
}

/** Moyennes par pôle (6 pôles, 5 questions chacun) */
export function getConstellationAverages(answers) {
  const avgs = [];
  for (let p = 0; p < 6; p++) {
    let sum = 0, count = 0;
    for (let q = 0; q < 5; q++) {
      const v = answers[p * 5 + q];
      if (v !== undefined && v !== null) { sum += v; count++; }
    }
    avgs.push(count === 0 ? 0 : sum / count);
  }
  return avgs;
}

/** Pôle dominant (état vibratoire principal) */
export function getConstellationDominant(avgScores) {
  let maxIdx = 0;
  let maxVal = avgScores[0] ?? 0;
  for (let i = 1; i < (avgScores?.length ?? 0); i++) {
    if ((avgScores[i] ?? 0) > maxVal) { maxVal = avgScores[i]; maxIdx = i; }
  }
  return CONSTELLATION_POLES[maxIdx];
}

/** Synthèse courte "état vibratoire" pour l'affichage résultat */
export function getConstellationSummary(avgScores) {
  const dominant = getConstellationDominant(avgScores);
  const mean = avgScores?.length ? avgScores.reduce((a, b) => a + b, 0) / avgScores.length : 0;
  const tension = avgScores?.length ? Math.max(...avgScores.map((s) => Math.abs(s - mean))) : 0;
  let mood = 'équilibré';
  if (tension > 1) mood = 'intense';
  else if (mean > 0.3) mood = 'expansif';
  else if (mean < -0.3) mood = 'en retrait';
  return {
    pole: dominant,
    mood,
    text: `Votre état vibratoire actuel est porté par l'élément ${dominant?.element ?? ''} (${dominant?.name ?? ''}). La forêt perçoit un courant ${mood} dans votre sève.`,
  };
}
