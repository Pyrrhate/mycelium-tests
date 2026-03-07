/**
 * Questionnaire 4 — La Révélation de l'Élément Maître (Les 7 Clés)
 * 21 questions (3 par élément). Définit l'élément dominant et la couleur d'accent de l'interface.
 */
export const ELEMENT_TEST = {
  test_id: 'elements',
  name: "La Révélation de l'Élément Maître",
  keys: ['AIR_SPORE', 'TERRE_ANCRAGE', 'EAU_EXPANSION', 'FEU_LYSE', 'BOIS_FRUCTIFICATION', 'METAL_ABSORPTION', 'ETHER_DORMANCE'],
  labels: {
    AIR_SPORE: { element: 'Air', key: 'Spore', color: '#87CEEB' },
    TERRE_ANCRAGE: { element: 'Terre', key: 'Ancrage', color: '#8B4513' },
    EAU_EXPANSION: { element: 'Eau', key: 'Expansion', color: '#4682B4' },
    FEU_LYSE: { element: 'Feu', key: 'Lyse', color: '#CD5C5C' },
    BOIS_FRUCTIFICATION: { element: 'Bois', key: 'Fructification', color: '#228B22' },
    METAL_ABSORPTION: { element: 'Métal', key: 'Absorption', color: '#708090' },
    ETHER_DORMANCE: { element: 'Éther', key: 'Dormance', color: '#9370DB' },
  },
  questions: {
    AIR_SPORE: [
      "Le mouvement permanent est-il votre seul état de confort ?",
      "Préférez-vous l'immatériel d'une idée à la solidité d'un objet ?",
      "Votre pensée voyage-t-elle plus vite que vos actions ?",
    ],
    TERRE_ANCRAGE: [
      "La stabilité d'une tradition est-elle votre fondation vitale ?",
      "Ressentez-vous un besoin physique d'être en contact avec la matière ?",
      "Le temps long est-il pour vous un allié plutôt qu'un ennemi ?",
    ],
    EAU_EXPANSION: [
      "Vous adaptez-vous naturellement à la forme de vos obstacles ?",
      "Le flux émotionnel des autres pénètre-t-il votre propre réseau ?",
      "La communication est-elle pour vous un fluide nécessaire à la vie ?",
    ],
    FEU_LYSE: [
      "La destruction est-elle pour vous le premier acte de la création ?",
      "Votre passion est-elle capable de consumer tout ce qui vous ralentit ?",
      "Agissez-vous souvent par impulsion électrique soudaine ?",
    ],
    BOIS_FRUCTIFICATION: [
      "Le besoin de créer de la beauté est-il votre moteur principal ?",
      "Votre énergie vitale s'épanouit-elle mieux dans l'abondance ?",
      "La croissance est-elle pour vous un impératif biologique ?",
    ],
    METAL_ABSORPTION: [
      "La logique pure est-elle l'outil le plus tranchant de votre esprit ?",
      "Avez-vous besoin de structurer et de classifier tout ce que vous apprenez ?",
      "Votre intégrité est-elle une lame que rien ne peut briser ?",
    ],
    ETHER_DORMANCE: [
      "Le silence total est-il votre source d'énergie la plus puissante ?",
      "Vous sentez-vous souvent connecté à ce qui n'est pas encore né ?",
      "Le vide est-il pour vous une plénitude que les autres ne comprennent pas ?",
    ],
  },
};
