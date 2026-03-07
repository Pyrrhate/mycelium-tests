/**
 * Parasite de Cendre — boss du premier scénario de duel.
 * Faible à l'Eau (soin/résistance) et à la Terre (ancrage).
 */
export const PARASITE_DE_CENDRES = {
  id: 'parasite_cendres',
  name: 'Le Parasite de Cendre',
  element: 'Feu',
  elementKey: 'feu',
  attack: 35,
  defense: 25,
  maxHp: 120,
  mantra: 'Corrosion : ronge 5 HP par tour aux cartes adverses.',
  color: '#6B2D2D',
};

/** Conseil de l'Oracle en cas de défaite */
export const ORACLE_ADVICE_LOSS = 'Le Feu ne se combat pas par la force, mais par l\'Ancrage ou le Flux. Renforcez Terre et Eau pour résister.';

/** Récompenses victoire */
export const REWARD_CARD_NAME = 'Éclat de Résilience';
export const REWARD_TITLE = 'Gardien de la Clairière';
