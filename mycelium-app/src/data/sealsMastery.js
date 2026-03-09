/**
 * Les 7 Sceaux de Maîtrise — design et symbolique.
 * Débloqués après 7 quêtes complétées par catégorie.
 */
export const SEALS_MASTERY = {
  spore: {
    id: 'spore',
    name: "L'Éthéré",
    mastery: 'Vision & Clarté',
    element: 'Spore',
    color: '#A78BFA',
    description: 'Un cercle de plumes de verre flottant autour d\'une spore centrale dorée.',
  },
  ancrage: {
    id: 'ancrage',
    name: 'Le Fondateur',
    mastery: 'Stabilité & Discipline',
    element: 'Ancrage',
    color: '#D97706',
    description: 'Une structure cubique en cristal de roche avec des racines de cuivre gravées.',
  },
  expansion: {
    id: 'expansion',
    name: 'Le Maillon',
    mastery: 'Empathie & Unité',
    element: 'Expansion',
    color: '#3B82F6',
    description: 'Trois gouttes d\'eau en suspension formant un triangle infini, liées par des fils de lumière.',
  },
  lyse: {
    id: 'lyse',
    name: 'Le Transmutateur',
    mastery: 'Courage & Mutation',
    element: 'Lyse',
    color: '#EF4444',
    description: 'Une flamme captive dans une sphère de verre noir, entourée d\'une aura de braises.',
  },
  fructification: {
    id: 'fructification',
    name: 'Le Semeur',
    mastery: 'Créativité & Joie',
    element: 'Fructification',
    color: '#22C55E',
    description: 'Un bourgeon de jade s\'ouvrant pour révéler un cœur de nacre irisé.',
  },
  absorption: {
    id: 'absorption',
    name: 'Le Synthétiseur',
    mastery: 'Logique & Savoir',
    element: 'Absorption',
    color: '#94A3B8',
    description: 'Un prisme géométrique aux arêtes tranchantes diffractant une lumière argentée.',
  },
  dormance: {
    id: 'dormance',
    name: 'Le Gardien',
    mastery: 'Silence & Paix',
    element: 'Dormance',
    color: '#D4AF37',
    description: 'Une éclipse totale stylisée en verre dépoli, entourée d\'un anneau de poussière d\'étoiles.',
  },
};

export const SEAL_ORDER = ['spore', 'ancrage', 'expansion', 'lyse', 'fructification', 'absorption', 'dormance'];
