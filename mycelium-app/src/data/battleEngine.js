/**
 * Moteur de duel — cycle élémentaire, dégâts, phases.
 * Feu bat Bois, Bois bat Terre, Terre bat Air, Air bat Feu. Eau/Métal/Éther : neutres ou cycle étendu.
 */
const ELEMENT_ORDER = ['feu', 'bois', 'terre', 'air', 'eau', 'metal', 'ether'];
const BEATS = { feu: 'bois', bois: 'terre', terre: 'air', air: 'feu', eau: 'feu', metal: 'bois', ether: 'metal' };

/** Normalise l'élément (ex: "Feu" -> "feu", "Éther" -> "ether") */
export function normalizeElement(el) {
  if (!el) return 'feu';
  const s = String(el).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  if (s.includes('ether') || s.includes('éther')) return 'ether';
  if (s.includes('metal') || s.includes('métal')) return 'metal';
  if (s.startsWith('bois')) return 'bois';
  if (s.startsWith('terre')) return 'terre';
  if (s.startsWith('eau')) return 'eau';
  if (s.startsWith('air')) return 'air';
  if (s.startsWith('feu')) return 'feu';
  return s.slice(0, 4) || 'feu';
}

/**
 * Multiplicateur de dégâts selon l'élément attaquant vs défenseur.
 * 1.2 si avantage, 0.8 si désavantage, 1 sinon.
 */
export function getElementMultiplier(attackerElement, defenderElement) {
  const a = normalizeElement(attackerElement);
  const b = normalizeElement(defenderElement);
  if (BEATS[a] === b) return 1.25;
  if (BEATS[b] === a) return 0.75;
  return 1;
}

/**
 * Calcule les dégâts d'une attaque.
 * baseDamage (stat ATQ de la carte), défense réduit, élément appliqué.
 */
export function computeDamage(attackStat, defenderDefenseStat, attackerElement, defenderElement) {
  const mult = getElementMultiplier(attackerElement, defenderElement);
  const reduction = Math.max(0, 1 - (defenderDefenseStat / 100) * 0.5);
  const raw = Math.max(1, Math.round(attackStat * 0.5 * reduction * mult));
  return raw;
}

/** Régénération de Sève par tour */
export const SEVE_REGEN_PER_TURN = 2;
export const MAX_SEVE = 30;
export const INITIAL_SEVE = 15;

/** HP max d'une carte (basé sur 50 + défense) */
export function cardMaxHp(defenseStat) {
  return Math.max(20, 50 + Math.round(defenseStat * 0.5));
}
