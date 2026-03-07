/**
 * Moteur de génération de cartes TCG Mycélium.
 * Les stats sont dérivées des 7 pôles (49 Racines) : Spore, Ancrage, Expansion, Lyse, Fructification, Absorption, Dormance.
 */
import { TOTEMS } from './totemData';
import { ELEMENT_TEST } from './elementQuestions';
import { getRankFromXp } from './ranks';

const POLE_ORDER = ['spore', 'ancrage', 'expansion', 'lyse', 'fructification', 'absorption', 'dormance'];

/** Normalise un score 0–7 (moyenne des réponses) vers une stat 1–99 pour l'affichage carte */
function toStat(score) {
  if (score == null) return 10;
  const normalized = (Number(score) + 2) / 4; // -2..+2 -> 0..1
  return Math.max(1, Math.min(99, Math.round(normalized * 98 + 1)));
}

/**
 * Génère les statistiques de carte à partir du profil utilisateur.
 * @param profile { poleAverages: number[], totem?: string, elementPrimordial?: string, xpSeve?: number, initiateName?: string }
 * @returns { attack, defense, support, magic, speed, seveCost, mantra, totem, element, rarity, rankLabel }
 */
export function generateCardStats(profile) {
  const poleAverages = profile?.poleAverages ?? Array(7).fill(0);
  const totemName = profile?.totem ?? null;
  const elementId = profile?.elementPrimordial ?? null;
  const xpSeve = profile?.xpSeve ?? 0;

  const totem = totemName ? TOTEMS.find((t) => t.name === totemName) : TOTEMS[0];
  const element = elementId ? ELEMENT_TEST.labels[elementId] : null;

  return {
    attack: toStat(poleAverages[3]),   // Lyse (Feu)
    defense: toStat(poleAverages[1]),  // Ancrage (Terre)
    support: toStat(poleAverages[2]),  // Expansion (Eau)
    magic: toStat(poleAverages[6]),    // Dormance (Éther)
    speed: toStat(poleAverages[0]),   // Spore (Air)
    // Coût en Sève pour jouer la carte (moyenne des pôles, arrondi 5–25)
    seveCost: Math.max(5, Math.min(25, Math.round((poleAverages.reduce((a, b) => a + b, 0) / 7 + 2) * 5 + 5))),
    mantra: totem?.mantra ?? 'La sève circule.',
    totem: totem ?? null,
    element: element?.element ?? 'Sève',
    elementColor: element?.color ?? '#D4AF37',
    rarity: getRarity(profile),
    rankLabel: getRankFromXp(xpSeve).label,
    initiateName: profile?.initiateName ?? 'Initié',
  };
}

/** Rareté basée sur XP et complétion (Commune → Légendaire). Plus le profil est "rare", plus le bloom de la carte. */
export function getRarity(profile) {
  const xp = profile?.xpSeve ?? 0;
  const hasTotem = !!profile?.totem;
  const hasElement = !!profile?.elementPrimordial;
  const hasConstellation = !!profile?.constellationData?.poleAverages?.length;
  let score = xp / 100;
  if (hasTotem) score += 2;
  if (hasElement) score += 2;
  if (hasConstellation) score += 1;
  if (score >= 25) return 'legendary';
  if (score >= 15) return 'epic';
  if (score >= 8) return 'rare';
  return 'common';
}

export const RARITY_LABELS = {
  common: 'Commune',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
};

/** Couleurs de bordure par rareté (pour glow) */
export const RARITY_COLORS = {
  common: '#6B7280',
  rare: '#4682B4',
  epic: '#9370DB',
  legendary: 'linear-gradient(90deg, #D4AF37, #E63946)',
};
