/**
 * Génère les recommandations alchimiques en croisant profil de base, résonance du mois, totem et intelligence.
 * Utilisé par l'Observatoire de la Constellation (Lecture Astrale, Bulles de Sève).
 */
import { DESEQUILIBRE, SYNERGIES_INTELLIGENCE, TOTEM_ADVICE, POLE_LABELS } from '../data/alchemicalCodex';

/** Mappe titre cognitif / dominant_key vers une clé de synergie */
function getIntelligenceKey(cognitiveTitle, dominantKey) {
  const t = (cognitiveTitle || dominantKey || '').toLowerCase();
  if (t.includes('logique') || t.includes('metal') || t.includes('analytique')) return 'logical';
  if (t.includes('corporel') || t.includes('kinesth') || t.includes('feu')) return 'bodily';
  if (t.includes('musical') || t.includes('rythm') || t.includes('bois')) return 'musical';
  return 'default';
}

/**
 * @param {Object} opts
 * @param {number[]} opts.baseScores - 7 pôles (profil de base)
 * @param {number[]} opts.monthScores - 7 pôles (résonance du mois)
 * @param {string} [opts.totem] - Nom du totem
 * @param {string} [opts.cognitiveTitle] - Titre matrice d'intelligence
 * @param {string} [opts.dominantKey] - Clé dominante intelligence
 * @returns {{ stateOfSky: string, elementAdvice: string, mantra: string, action: string, totemAdvice: string }}
 */
export function getAlchemicalAdvice({ baseScores = [], monthScores = [], totem, cognitiveTitle, dominantKey }) {
  let stateOfSky = 'Votre ciel intérieur reflète les courants du mois.';
  let elementAdvice = 'Écoutez l\'élément qui monte en vous sans le combattre.';
  let action = 'Posez une intention simple pour les 7 prochains jours.';
  const mantra = 'On ne combat pas sa nature, on apprend à naviguer avec les courants de sa propre sève.';
  let totemAdvice = TOTEM_ADVICE.default;

  // Pôle en tension (plus grand écart)
  if (Array.isArray(baseScores) && Array.isArray(monthScores) && baseScores.length >= 7 && monthScores.length >= 7) {
    let maxGap = 0;
    let poleIndex = 0;
    let isExcess = true;
    for (let i = 0; i < 7; i++) {
      const gap = Math.abs((monthScores[i] ?? 0) - (baseScores[i] ?? 0));
      if (gap > maxGap) {
        maxGap = gap;
        poleIndex = i;
        isExcess = (monthScores[i] ?? 0) >= (baseScores[i] ?? 0);
      }
    }
    const poleKeys = ['spore', 'ancrage', 'expansion', 'lyse', 'fructification', 'absorption', 'dormance'];
    const key = poleKeys[poleIndex];
    const codexKey = `${key}_${isExcess ? 'excess' : 'deficit'}`;
    const deseq = DESEQUILIBRE[codexKey];
    if (deseq) {
      stateOfSky = isExcess
        ? `Phase d'Expansion : Vous dépassez vos limites habituelles en ${POLE_LABELS[key] || key}.`
        : `Phase de Dormance : Votre sève se retire de ${POLE_LABELS[key] || key}, c'est un temps de repos.`;
      elementAdvice = deseq.text;
      action = deseq.action || action;
    }
  }

  // Synergie intelligence (simplifié : on prend besoin_calme ou tension selon écart)
  const intelKey = getIntelligenceKey(cognitiveTitle, dominantKey);
  const syn = SYNERGIES_INTELLIGENCE[intelKey] || SYNERGIES_INTELLIGENCE.default;
  const needKey = 'besoin_calme'; // pourrait être dérivé du pôle en tension
  if (syn[needKey]) elementAdvice = `${elementAdvice} ${syn[needKey]}`;

  // Totem
  if (totem && TOTEM_ADVICE[totem]) totemAdvice = TOTEM_ADVICE[totem];

  return { stateOfSky, elementAdvice, mantra, action, totemAdvice };
}
