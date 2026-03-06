/**
 * Mycélium - L'Intelligence des Profils Hybrides
 * 21 combinaisons des 2 clés les plus fortes.
 * Ordre des clés : spore, ancrage, expansion, lyse, fructification, absorption, dormance (indices 0..6).
 */
window.MYCELIUM_PROFILES = {
  keys: ['spore', 'ancrage', 'expansion', 'lyse', 'fructification', 'absorption', 'dormance'],
  keyNames: {
    spore: 'La Spore',
    ancrage: 'L\'Ancrage',
    expansion: 'L\'Expansion',
    lyse: 'La Lyse',
    fructification: 'La Fructification',
    absorption: 'L\'Absorption',
    dormance: 'La Dormance'
  },
  profiles: {
    spore_ancrage: { name: 'Le Monument', description: 'Identité solide et racines fixes. Vous êtes un phare immuable, mais gare à la rigidité.' },
    spore_expansion: { name: 'Le Pionnier', description: 'Influence immense et visibilité maximale. Vous colonisez l\'esprit des autres par votre aura.' },
    spore_lyse: { name: 'Le Phénix', description: 'Vous détruisez votre image pour renaître. Une identité en mutation constante et radicale.' },
    spore_fructification: { name: 'La Muse', description: 'Un potentiel créatif magnétique. Votre simple présence inspire la création autour de vous.' },
    spore_absorption: { name: 'L\'Érudit Solaire', description: 'Vous brillez par ce que vous savez. Votre identité se nourrit de la profondeur du monde.' },
    spore_dormance: { name: 'L\'Oracle', description: 'Un potentiel divin en attente. Vous rayonnez de silence et de profondeur cachée.' },
    ancrage_expansion: { name: 'Le Tisseur de Toile', description: 'Contrôle global et rétention. Vous possédez le réseau et sécurisez chaque connexion.' },
    ancrage_lyse: { name: 'La Forteresse', description: 'Défensif et briseur d\'obstacles. Vous protégez votre territoire avec une force corrosive.' },
    ancrage_fructification: { name: 'Le Conservateur', description: 'Créativité protégée. Vous créez des œuvres pérennes dans un jardin clos.' },
    ancrage_absorption: { name: 'L\'Archive', description: 'Accumulateur de ressources et de données. Votre structure est un coffre-fort de savoir.' },
    ancrage_dormance: { name: 'Le Fossile', description: 'Sécurité totale au prix du mouvement. Vous êtes une mémoire figée dans la roche.' },
    expansion_lyse: { name: 'Le Conquérant', description: 'Expansion agressive. Vous brisez les limites pour étendre votre empire organique.' },
    expansion_fructification: { name: 'Le Pollinisateur', description: 'Créativité sociale. Vous semez le désir et la joie partout où vous passez.' },
    expansion_absorption: { name: 'Le Collectionneur', description: 'Réseautage pour la donnée. Vous connectez les gens pour mieux comprendre le monde.' },
    expansion_dormance: { name: 'Le Spectre', description: 'Présence vaste mais action invisible. Vous êtes partout, mais personne ne peut vous saisir.' },
    lyse_fructification: { name: 'L\'Alchimiste', description: 'Création par la destruction. Vous transmutez le chaos et la douleur en beauté pure.' },
    lyse_absorption: { name: 'L\'Analyste', description: 'Décomposition critique du savoir. Vous digérez la complexité en la brisant en morceaux.' },
    lyse_dormance: { name: 'Le Volcan', description: 'Puissance latente et éruption soudaine. Votre calme cache une force de transformation totale.' },
    fructification_absorption: { name: 'Le Gourmet', description: 'Excès sensoriel. Vous dévorez la beauté du monde pour nourrir vos propres désirs.' },
    fructification_dormance: { name: 'Le Rêveur', description: 'Création interne et désir passif. Vous créez des mondes immenses dans votre esprit.' },
    absorption_dormance: { name: 'L\'Ermite', description: 'Assimilation silencieuse. Vous absorbez la sève du monde dans un retrait total.' }
  }
};

/**
 * Calcule le profil hybride à partir des 7 scores (ordre: spore, ancrage, expansion, lyse, fructification, absorption, dormance).
 */
window.calculateHybridProfile = function (scores) {
  const keys = window.MYCELIUM_PROFILES.keys;
  const withScore = scores.map((s, i) => ({ key: keys[i], score: s, index: i }));
  withScore.sort((a, b) => b.score - a.score);
  const first = withScore[0].key;
  const second = withScore[1].key;
  const pair = [first, second].sort();
  const profileKey = pair[0] + '_' + pair[1];
  const profile = window.MYCELIUM_PROFILES.profiles[profileKey];
  return {
    profileKey,
    name: profile ? profile.name : 'Le Réseau',
    description: profile ? profile.description : 'Votre combinaison de clés est unique.',
    key1: first,
    key2: second
  };
};
