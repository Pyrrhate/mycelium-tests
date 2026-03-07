/**
 * Mycélium V6 — Rangs et XP de Sève
 * Hyphe Éveillée → 1500 XP = Racine Ancrée (débloque Profil Public)
 */
export const XP_RACINE_ANCREE = 1500;
export const XP_HYPHE_EVEILLEE = 500;

export const RANKS = [
  { id: 'germe', label: 'Germe', xpMin: 0, xpMax: 499 },
  { id: 'hyphe_eveillee', label: 'Hyphe Éveillée', xpMin: 500, xpMax: XP_RACINE_ANCREE - 1 },
  { id: 'racine_ancree', label: 'Racine Ancrée', xpMin: XP_RACINE_ANCREE, xpMax: Infinity },
];

export function getRankFromXp(xp) {
  const x = Number(xp) || 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (x >= RANKS[i].xpMin) return RANKS[i];
  }
  return RANKS[0];
}

export function getXpProgressForNextRank(xp) {
  const rank = getRankFromXp(xp);
  const next = RANKS[RANKS.indexOf(rank) + 1];
  if (!next) return { current: xp, needed: null, label: rank.label };
  const currentInTier = xp - rank.xpMin;
  const tierSize = next.xpMin - rank.xpMin;
  return {
    current: currentInTier,
    needed: tierSize,
    nextLabel: next.label,
    label: rank.label,
  };
}
