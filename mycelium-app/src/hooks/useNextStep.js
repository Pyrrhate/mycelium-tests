/**
 * Parcours d'initiation en tunnel : ordre strict des questionnaires.
 * 49 Racines → Mon Totem → La Constellation → Résonance → Élément Maître → Matrice.
 * Chaque étape est débloquée seulement si la précédente est accomplie.
 */
export const STEP_ORDER = ['49racines', 'totem', 'constellation', 'resonance', 'element', 'matrice'];

export function getNextQuestionnaireStep(profile) {
  if (!profile) return '49racines';

  const test49 = profile.test_mycelium_completed === true;
  const testTotem = profile.test_totem_completed === true;
  const hasConstellation = !!profile.constellation_result;
  const hasResonance = !!profile.resonance_month_year;
  const hasElement = !!profile.element_primordial;
  const hasMatrice = !!profile.cognitive_title;

  if (!test49) return '49racines';
  if (!testTotem) return 'totem';
  if (!hasConstellation) return 'constellation';
  if (!hasResonance) return 'resonance';
  if (!hasElement) return 'element';
  if (!hasMatrice) return 'matrice';
  return null;
}

/** Étape précédente dans le tunnel (null pour 49racines). */
export function getPrerequisiteStep(stepId) {
  const i = STEP_ORDER.indexOf(stepId);
  if (i <= 0) return null;
  return STEP_ORDER[i - 1];
}

/** Vrai si l'utilisateur peut accéder à cette étape (prérequis accompli). */
export function isStepUnlocked(profile, stepId) {
  const prev = getPrerequisiteStep(stepId);
  if (!prev) return true; // 49 Racines toujours accessible
  if (!profile) return false;

  switch (prev) {
    case '49racines':
      return profile.test_mycelium_completed === true;
    case 'totem':
      return profile.test_totem_completed === true || !!profile.totem;
    case 'constellation':
      return !!profile.constellation_result;
    case 'resonance':
      return !!profile.resonance_month_year;
    case 'element':
      return !!profile.element_primordial;
    case 'matrice':
      return !!profile.cognitive_title;
    default:
      return false;
  }
}

export const STEP_LABELS = {
  '49racines': 'Les 49 Racines',
  totem: 'Mon Totem',
  constellation: 'La Constellation',
  resonance: 'La Résonance du Cycle',
  element: "L'Élément Maître",
  matrice: "Matrice d'Intelligence",
};
