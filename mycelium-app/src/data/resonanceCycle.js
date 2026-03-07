/**
 * La Résonance du Cycle — 28 questions (4 par clé)
 * Échelle : -2 à +2 (alignée sur les 49 Racines)
 */
export const RESONANCE_KEYS = [
  { id: 'spore', name: 'Spore', element: 'Air', subtitle: 'Vision du mois' },
  { id: 'ancrage', name: 'Ancrage', element: 'Terre', subtitle: 'Stabilité du mois' },
  { id: 'expansion', name: 'Expansion', element: 'Eau', subtitle: 'Réseau du mois' },
  { id: 'lyse', name: 'Lyse', element: 'Feu', subtitle: 'Transformation du mois' },
  { id: 'fructification', name: 'Fructification', element: 'Bois', subtitle: 'Création du mois' },
  { id: 'absorption', name: 'Absorption', element: 'Métal', subtitle: 'Discipline du mois' },
  { id: 'dormance', name: 'Dormance', element: 'Éther', subtitle: "Esprit du mois" },
];

export const RESONANCE_QUESTIONS = [
  // Clé 1 : Spore (1-4)
  "Quelle idée sème-t-elle son éclat dans votre esprit ce mois-ci ?",
  "Votre parole sera-t-elle un vent léger ou une tempête de spores ?",
  "Vers quel horizon lointain votre intuition cherche-t-elle à s'envoler ?",
  "Quelle vérité abstraite refusez-vous encore de laisser germer ?",
  // Clé 2 : Ancrage (5-8)
  "Sur quelle structure solide comptez-vous bâtir vos prochaines semaines ?",
  "Votre foyer est-il un terreau fertile ou une terre assoiffée actuellement ?",
  "Quelle possession matérielle alourdit inutilement votre réseau ?",
  "Êtes-vous prêt à vous enfoncer plus profondément dans vos responsabilités ?",
  // Clé 3 : Expansion (9-12)
  "Quel courant relationnel va dominer votre navigation sociale ?",
  "Cherchez-vous à fusionner avec une autre colonie ou à rester isolé ?",
  "Quelle émotion fluide risque de déborder de votre réservoir interne ?",
  "Comment allez-vous irriguer vos connexions les plus sèches ce mois-ci ?",
  // Clé 4 : Lyse (13-16)
  "Quel obstacle ancien mérite d'être réduit en cendres dès maintenant ?",
  "Votre colère sera-t-elle un moteur de mutation ou un incendie stérile ?",
  "Quelle habitude toxique votre sève est-elle prête à décomposer ?",
  "Quel défi électrique va réveiller votre combativité endormie ?",
  // Clé 5 : Fructification (17-20)
  "Quel projet est prêt à sortir de terre pour offrir ses premiers fruits ?",
  "Votre énergie sexuelle et créative est-elle en phase d'éclosion ?",
  "Quelle beauté inutile allez-vous cultiver pour le plaisir du réseau ?",
  "Comment allez-vous nourrir votre besoin d'abondance et de jouissance ?",
  // Clé 6 : Absorption (21-24)
  "Quelle connaissance complexe allez-vous forger dans votre esprit ?",
  "Votre rigueur sera-t-elle une armure de protection ou une lame d'action ?",
  "Quel secret du monde votre réseau est-il prêt à assimiler ?",
  "Quelle structure logique va ordonner le chaos de vos prochains jours ?",
  // Clé 7 : Dormance (25-28)
  "Dans quel silence allez-vous puiser votre force de régénération ?",
  "Quel rêve lucide cherche à vous transmettre un message de la forêt ?",
  "Êtes-vous capable de ne rien faire pour laisser agir le vide fertile ?",
  "Quelle part de votre âme attend patiemment dans l'obscurité du cosmos ?",
];

export const RESONANCE_SCALE = [-2, -1, 0, 1, 2];
export const RESONANCE_SCALE_LABELS = { '-2': 'Vide', '-1': '', '0': 'Équilibre', '1': '', '2': 'Dominance' };

/** Retourne l'index de clé (0-6) pour la question index (0-27) */
export function getKeyIndexForQuestion(qIndex) {
  return Math.floor(qIndex / 4);
}

/** Moyennes par clé (4 réponses chacune) */
export function getResonanceAverages(answers) {
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

/** Les 2 clés dominantes (scores les plus hauts) pour le Sceau */
export function getDominantKeys(avgScores) {
  const withIndex = avgScores.map((s, i) => ({ key: RESONANCE_KEYS[i], score: s, index: i }));
  withIndex.sort((a, b) => b.score - a.score);
  return [withIndex[0]?.key?.id ?? 'spore', withIndex[1]?.key?.id ?? 'ancrage'];
}

/** Nébuleuses mensuelles (dégradés) par paire de clés dominantes */
export const NEBULA_GRADIENTS = {
  spore_ancrage: 'linear-gradient(135deg, #87CEEB 0%, #2d5016 50%, #0d1211 100%)',
  spore_expansion: 'linear-gradient(135deg, #87CEEB 0%, #1e3a5f 50%, #0d1211 100%)',
  spore_lyse: 'linear-gradient(135deg, #87CEEB 0%, #8B0000 50%, #0d1211 100%)',
  spore_fructification: 'linear-gradient(135deg, #87CEEB 0%, #228B22 50%, #0d1211 100%)',
  spore_absorption: 'linear-gradient(135deg, #87CEEB 0%, #4a4a4a 50%, #0d1211 100%)',
  spore_dormance: 'linear-gradient(135deg, #87CEEB 0%, #2f2f4f 50%, #0d1211 100%)',
  ancrage_expansion: 'linear-gradient(135deg, #2d5016 0%, #1e3a5f 50%, #0d1211 100%)',
  ancrage_lyse: 'linear-gradient(135deg, #2d5016 0%, #8B0000 50%, #0d1211 100%)',
  ancrage_fructification: 'linear-gradient(135deg, #2d5016 0%, #228B22 50%, #0d1211 100%)',
  ancrage_absorption: 'linear-gradient(135deg, #2d5016 0%, #4a4a4a 50%, #0d1211 100%)',
  ancrage_dormance: 'linear-gradient(135deg, #2d5016 0%, #2f2f4f 50%, #0d1211 100%)',
  expansion_lyse: 'linear-gradient(135deg, #1e3a5f 0%, #8B0000 50%, #0d1211 100%)',
  expansion_fructification: 'linear-gradient(135deg, #1e3a5f 0%, #228B22 50%, #0d1211 100%)',
  expansion_absorption: 'linear-gradient(135deg, #1e3a5f 0%, #4a4a4a 50%, #0d1211 100%)',
  expansion_dormance: 'linear-gradient(135deg, #1e3a5f 0%, #2f2f4f 50%, #0d1211 100%)',
  lyse_fructification: 'linear-gradient(135deg, #8B0000 0%, #228B22 50%, #0d1211 100%)',
  lyse_absorption: 'linear-gradient(135deg, #8B0000 0%, #4a4a4a 50%, #0d1211 100%)',
  lyse_dormance: 'linear-gradient(135deg, #8B0000 0%, #2f2f4f 50%, #0d1211 100%)',
  fructification_absorption: 'linear-gradient(135deg, #228B22 0%, #4a4a4a 50%, #0d1211 100%)',
  fructification_dormance: 'linear-gradient(135deg, #228B22 0%, #2f2f4f 50%, #0d1211 100%)',
  absorption_dormance: 'linear-gradient(135deg, #4a4a4a 0%, #2f2f4f 50%, #0d1211 100%)',
};

export function getNebulaCss(dominantKey1, dominantKey2) {
  const pair = [dominantKey1, dominantKey2].sort().join('_');
  return NEBULA_GRADIENTS[pair] || 'linear-gradient(135deg, #D4AF37 0%, #0d1211 100%)';
}
