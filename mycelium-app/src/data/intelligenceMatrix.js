/**
 * La Matrice des Intelligences — 28 questions (4 par pôle)
 * Mapping Gardner → Mycélium. Échelle -2 à +2.
 */
export const INTELLIGENCE_POLES = [
  { id: 'spore', name: 'Intelligence Spore', element: 'Air', subtitle: 'Linguistique & Existentielle', description: 'Capacité à propager des idées et à comprendre le sens profond des mots.' },
  { id: 'ancrage', name: "Intelligence Ancrage", element: 'Terre', subtitle: 'Logico-Mathématique', description: 'Capacité à structurer le réel et à résoudre des énigmes complexes.' },
  { id: 'expansion', name: 'Intelligence Expansion', element: 'Eau', subtitle: 'Interpersonnelle', description: 'Capacité à lire les réseaux sociaux et à ressentir l\'autre.' },
  { id: 'lyse', name: 'Intelligence Lyse', element: 'Feu', subtitle: 'Corporelle-Kinesthésique', description: 'Capacité à transformer la matière par le mouvement et l\'action physique.' },
  { id: 'fructification', name: 'Intelligence Fructification', element: 'Bois', subtitle: 'Musicale & Spatiale', description: 'Capacité à créer des harmonies visuelles ou sonores.' },
  { id: 'absorption', name: 'Intelligence Absorption', element: 'Métal', subtitle: 'Naturaliste', description: 'Capacité à classifier, synthétiser et comprendre les systèmes vivants.' },
  { id: 'dormance', name: 'Intelligence Dormance', element: 'Éther', subtitle: 'Intrapersonnelle', description: 'Capacité d\'auto-analyse et de maîtrise du vide intérieur.' },
];

export const COGNITIVE_TITLES = {
  spore: 'Le Verbe Primordial',
  ancrage: "L'Architecte du Réel",
  expansion: 'Le Tisseur de Liens',
  lyse: "L'Architecte de Chair",
  fructification: 'Le Créateur d\'Harmonies',
  absorption: 'Le Synthétiseur',
  dormance: 'Le Maître du Vide',
};

export const INTELLIGENCE_QUESTIONS = [
  // SPORE (1-4)
  "Je trouve facilement les mots pour polliniser l'esprit des autres.",
  "Je m'interroge souvent sur l'origine du réseau et le sens de l'existence.",
  "Une phrase bien construite me semble plus puissante qu'une image.",
  "J'aime expliquer des concepts abstraits pour les voir se propager.",
  // ANCRAGE (5-8)
  "Je ne me sens en sécurité que lorsque les chiffres et les faits concordent.",
  "J'aime résoudre des énigmes qui demandent une structure mentale rigide.",
  "Pour moi, chaque effet doit être relié à une racine (cause) précise.",
  "Je catégorise naturellement mes ressources pour ne jamais manquer.",
  // EXPANSION (9-12)
  "Je perçois immédiatement quand une \"hyphe\" (personne) du groupe est en souffrance.",
  "Je sais comment diriger le flux d'une conversation pour harmoniser le groupe.",
  "Je préfère travailler en colonie plutôt qu'en racine isolée.",
  "Les émotions des autres traversent mon propre réseau avec facilité.",
  // LYSE (13-16)
  "Je comprends mieux un objet en le manipulant ou en le décomposant physiquement.",
  "Le mouvement est pour moi la forme la plus pure de réflexion.",
  "Je suis capable de rester en action intense jusqu'à épuisement de ma sève.",
  "Mon corps réagit aux obstacles avant même que mon esprit ne les analyse.",
  // FRUCTIFICATION (17-20)
  "Je peux visualiser mentalement la croissance d'une structure complexe en 3D.",
  "Les motifs géométriques et les rythmes sonores dictent mon humeur.",
  "J'ai un besoin vital d'ajouter de la beauté ou de l'harmonie à mon substrat.",
  "Je mémorise mieux les informations lorsqu'elles sont associées à une image.",
  // ABSORPTION (21-24)
  "Je sais identifier et classer chaque élément de mon environnement naturel.",
  "Je suis capable de synthétiser des masses de données en une vérité tranchante.",
  "J'aime observer les cycles de la forêt pour en extraire des règles universelles.",
  "Mon esprit fonctionne comme un filtre qui ne garde que l'essence utile.",
  // DORMANCE (25-28)
  "Je connais parfaitement mes zones d'ombre et mes limites de sève.",
  "Le retrait dans le silence est ma stratégie préférée pour résoudre un conflit.",
  "Je suis capable de réguler mes propres émotions sans aide extérieure.",
  "Ma force vient de ma capacité à rester immobile dans la tempête.",
];

export const INTELLIGENCE_SCALE = [-2, -1, 0, 1, 2];
export const INTELLIGENCE_SCALE_LABELS = { '-2': 'Vide', '-1': '', '0': 'Équilibre', '1': '', '2': 'Dominance' };

export function getPoleIndexForQuestion(qIndex) {
  return Math.floor(qIndex / 4);
}

export function getIntelligenceAverages(answers) {
  const avgs = [];
  for (let k = 0; k < 7; k++) {
    let sum = 0, count = 0;
    for (let q = 0; q < 4; q++) {
      const v = answers[k * 4 + q];
      if (v !== undefined && v !== null) { sum += v; count++; }
    }
    avgs.push(count === 0 ? 0 : sum / count);
  }
  return avgs;
}

export function getDominantIntelligence(avgScores) {
  let maxIdx = 0;
  let maxVal = avgScores[0] ?? 0;
  for (let i = 1; i < (avgScores?.length ?? 0); i++) {
    if ((avgScores[i] ?? 0) > maxVal) { maxVal = avgScores[i]; maxIdx = i; }
  }
  return INTELLIGENCE_POLES[maxIdx]?.id ?? 'spore';
}

/** Capacité de Maillage : équilibre + force des pôles (0-100). */
export function getCapaciteMaillage(avgScores) {
  if (!avgScores || avgScores.length !== 7) return 0;
  const mean = avgScores.reduce((a, b) => a + b, 0) / 7;
  const variance = avgScores.reduce((s, v) => s + (v - mean) ** 2, 0) / 7;
  const sigma = Math.sqrt(variance);
  const balance = Math.max(0, 100 - 25 * sigma);
  const strength = (avgScores.reduce((s, v) => s + Math.max(0, v + 2), 0) / 7) * (100 / 4);
  return Math.round(Math.max(0, Math.min(100, (balance * 0.4 + strength * 0.6))));
}
