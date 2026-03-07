/**
 * Bestiaire Alchimique — 7 totems, 28 questions (4 par totem).
 * Chaque question propose 2 options (A/B) ; chaque option attribue 1 point à un totem.
 * Ordre des clés : spore, ancrage, expansion, lyse, fructification, absorption, dormance.
 */
export const TOTEMS = [
  { id: 'ours', name: "L'Ours Lumineux", element: 'Terre', key: 'ancrage', emoji: '🐻', color: '#B8860B', mantra: "Le sol est mon bouclier. Je protège ce qui est ancré." },
  { id: 'hibou', name: 'Le Hibou Oracle', element: 'Métal', key: 'absorption', emoji: '🦉', color: '#708090', mantra: "Je vois la vérité dans le vide. J'absorbe pour comprendre." },
  { id: 'cameleon', name: 'Le Caméléon Prisme', element: 'Air', key: 'spore', emoji: '🦎', color: '#87CEEB', mantra: "Je suis mille miroirs. Mon identité s'adapte à la lumière." },
  { id: 'taureau', name: 'Le Taureau de Cendre', element: 'Feu', key: 'lyse', emoji: '🐂', color: '#CD5C5C', mantra: "Mon feu consume les obstacles. Je transmute par la force." },
  { id: 'sirene', name: 'La Sirène Nectar', element: 'Bois', key: 'fructification', emoji: '🧜‍♀️', color: '#20B2AA', mantra: "Mes lianes sont votre extase. Je crée et désire." },
  { id: 'golem', name: 'Le Golem Gourmand', element: 'Eau', key: 'expansion', emoji: '🗿', color: '#4682B4', mantra: "Le monde est mon substrat. J'accumule et je relie." },
  { id: 'escargot', name: "L'Escargot Latent", element: 'Éther', key: 'dormance', emoji: '🐌', color: '#9370DB', mantra: "L'action pure naît du néant. Je patiente dans le silence." },
];

const TOTEM_IDS = TOTEMS.map((t) => t.id);

/** 28 questions : chaque question a 2 options { totemId, label }. Chaque totem apparaît 8 fois (4 questions où il est A, 4 où il est B). */
export const TOTEM_QUESTIONS = [
  { text: "En situation de crise, votre instinct vous pousse-t-il à vous ancrer et protéger (stabilité) ou à analyser en retrait (comprendre) ?", options: [{ totemId: 'ours', label: "M'ancrer et protéger" }, { totemId: 'hibou', label: "Analyser en retrait" }] },
  { text: "Si vous étiez un son, seriez-vous un tonnerre lointain (terre) ou un silence assourdissant (vide) ?", options: [{ totemId: 'ours', label: "Tonnerre lointain" }, { totemId: 'escargot', label: "Silence assourdissant" }] },
  { text: "Face à l'injustice, réagissez-vous par la colère transformatrice (feu) ou par l'adaptation de votre image (air) ?", options: [{ totemId: 'taureau', label: "Colère transformatrice" }, { totemId: 'cameleon', label: "Adapter mon image" }] },
  { text: "Votre énergie créative se déploie plutôt en séduisant les sens (bois) ou en accumulant des liens (eau) ?", options: [{ totemId: 'sirene', label: "Séduire les sens" }, { totemId: 'golem', label: "Accumuler des liens" }] },
  { text: "Pour reprendre des forces, vous avez besoin de marcher pieds nus (terre) ou de décomposer un problème en idées (métal) ?", options: [{ totemId: 'ours', label: "Marcher pieds nus" }, { totemId: 'hibou', label: "Décomposer en idées" }] },
  { text: "En groupe, vous vous montrez plutôt sous un jour changeant (air) ou vous gardez une présence calme et latente (éther) ?", options: [{ totemId: 'cameleon', label: "Jour changeant" }, { totemId: 'escargot', label: "Présence calme" }] },
  { text: "Quand vous êtes bloqué, vous préférez briser l'obstacle (feu) ou le contourner en créant autre chose (bois) ?", options: [{ totemId: 'taureau', label: "Briser l'obstacle" }, { totemId: 'sirene', label: "Créer autre chose" }] },
  { text: "Votre richesse intérieure vient surtout de vos connexions (eau) ou de votre capacité à tout ingérer (métal) ?", options: [{ totemId: 'golem', label: "Mes connexions" }, { totemId: 'hibou', label: "Tout ingérer" }] },
  { text: "En conflit, vous protégez d'abord votre territoire (terre) ou vous vous retirez pour réfléchir (éther) ?", options: [{ totemId: 'ours', label: "Protéger mon territoire" }, { totemId: 'escargot', label: "Me retirer" }] },
  { text: "Votre identité brille par ce que vous montrez (air) ou par ce que vous consumez et transformez (feu) ?", options: [{ totemId: 'cameleon', label: "Ce que je montre" }, { totemId: 'taureau', label: "Ce que je transforme" }] },
  { text: "Le désir vous pousse à créer de la beauté (bois) ou à absorber du savoir (métal) ?", options: [{ totemId: 'sirene', label: "Créer de la beauté" }, { totemId: 'hibou', label: "Absorber du savoir" }] },
  { text: "Vous vous étendez en tissant un réseau (eau) ou en restant fertile dans le silence (éther) ?", options: [{ totemId: 'golem', label: "Tisser un réseau" }, { totemId: 'escargot', label: "Fertile dans le silence" }] },
  { text: "Votre bouclier est la stabilité (terre) ou l'analyse précise (métal) ?", options: [{ totemId: 'ours', label: "La stabilité" }, { totemId: 'hibou', label: "L'analyse précise" }] },
  { text: "Vous vous adaptez en reflétant les autres (air) ou en décomposant ce qui résiste (feu) ?", options: [{ totemId: 'cameleon', label: "Refléter les autres" }, { totemId: 'taureau', label: "Décomposer" }] },
  { text: "Votre nectar est la création sensuelle (bois) ou l'accumulation de flux (eau) ?", options: [{ totemId: 'sirene', label: "Création sensuelle" }, { totemId: 'golem', label: "Accumulation de flux" }] },
  { text: "Le vide vous régénère (éther) ou vous ancre (terre) ?", options: [{ totemId: 'escargot', label: "Me régénère" }, { totemId: 'ours', label: "M'ancre" }] },
  { text: "Vous voyez la vérité dans le vide (métal) ou dans l'éclat que vous renvoyez (air) ?", options: [{ totemId: 'hibou', label: "Dans le vide" }, { totemId: 'cameleon', label: "Dans l'éclat" }] },
  { text: "Votre force consume (feu) ou attire (bois) ?", options: [{ totemId: 'taureau', label: "Consume" }, { totemId: 'sirene', label: "Attire" }] },
  { text: "Vous vous nourrissez du réseau (eau) ou du retrait (éther) ?", options: [{ totemId: 'golem', label: "Du réseau" }, { totemId: 'escargot', label: "Du retrait" }] },
  { text: "En cas de danger, vous tenez bon (terre) ou vous voyez clair (métal) ?", options: [{ totemId: 'ours', label: "Je tiens bon" }, { totemId: 'hibou', label: "Je vois clair" }] },
  { text: "Votre miroir reflète l'instant (air) ou la transformation (feu) ?", options: [{ totemId: 'cameleon', label: "L'instant" }, { totemId: 'taureau', label: "La transformation" }] },
  { text: "Votre désir est d'inspirer (bois) ou de connecter (eau) ?", options: [{ totemId: 'sirene', label: "Inspirer" }, { totemId: 'golem', label: "Connecter" }] },
  { text: "La latence est votre force (éther) ou votre faiblesse (terre) ?", options: [{ totemId: 'escargot', label: "Ma force" }, { totemId: 'ours', label: "Ma faiblesse" }] },
  { text: "Vous absorbez pour comprendre (métal) ou pour rayonner (air) ?", options: [{ totemId: 'hibou', label: "Pour comprendre" }, { totemId: 'cameleon', label: "Pour rayonner" }] },
  { text: "Vous transmutez par le feu (feu) ou par la création (bois) ?", options: [{ totemId: 'taureau', label: "Par le feu" }, { totemId: 'sirene', label: "Par la création" }] },
  { text: "Votre flux est expansion (eau) ou dormance (éther) ?", options: [{ totemId: 'golem', label: "Expansion" }, { totemId: 'escargot', label: "Dormance" }] },
  { text: "L'ancrage vous sécurise (terre) ou vous enchaîne (métal) ?", options: [{ totemId: 'ours', label: "Me sécurise" }, { totemId: 'hibou', label: "M'enchaîne" }] },
  { text: "Votre identité est multiple (air) ou unique et brûlante (feu) ?", options: [{ totemId: 'cameleon', label: "Multiple" }, { totemId: 'taureau', label: "Unique et brûlante" }] },
  { text: "Vous fructifiez par le désir (bois) ou par l'ingestion (eau) ?", options: [{ totemId: 'sirene', label: "Par le désir" }, { totemId: 'golem', label: "Par l'ingestion" }] },
  { text: "Le néant vous appelle (éther) ou vous retient (terre) ?", options: [{ totemId: 'escargot', label: "M'appelle" }, { totemId: 'ours', label: "Me retient" }] },
];

/** Détermine le totem gagnant : score max sur 28 réponses ; en cas d'égalité, utilise les scores 49 Racines (poleAverages) pour la clé liée au totem. */
export function computeTotemFromScores(totemScores, poleAverages) {
  const maxScore = Math.max(...totemScores);
  const winners = TOTEMS.filter((_, i) => totemScores[i] === maxScore);
  if (winners.length <= 1) return winners[0] || TOTEMS[0];
  if (!poleAverages || poleAverages.length !== 7) return winners[0];
  const keyOrder = ['spore', 'ancrage', 'expansion', 'lyse', 'fructification', 'absorption', 'dormance'];
  let best = winners[0];
  let bestKeyScore = poleAverages[keyOrder.indexOf(best.key)] ?? 0;
  for (let i = 1; i < winners.length; i++) {
    const s = poleAverages[keyOrder.indexOf(winners[i].key)] ?? 0;
    if (s > bestKeyScore) {
      bestKeyScore = s;
      best = winners[i];
    }
  }
  return best;
}
