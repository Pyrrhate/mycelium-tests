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
  },
  profileSymbols: {
    spore_ancrage: '◼',
    spore_expansion: '◆',
    spore_lyse: '✧',
    spore_fructification: '♪',
    spore_absorption: '☀',
    spore_dormance: '☽',
    ancrage_expansion: '▣',
    ancrage_lyse: '▤',
    ancrage_fructification: '▥',
    ancrage_absorption: '▦',
    ancrage_dormance: '▧',
    expansion_lyse: '▨',
    expansion_fructification: '▩',
    expansion_absorption: '⬡',
    expansion_dormance: '◇',
    lyse_fructification: '✦',
    lyse_absorption: '◈',
    lyse_dormance: '◎',
    fructification_absorption: '◉',
    fructification_dormance: '○',
    absorption_dormance: '●'
  },
  constellationTexts: {
    spore_ancrage: 'Votre constellation place la Spore et l\'Ancrage en conjonction : le Monument veille sur l\'horizon, ancré et visible.',
    spore_expansion: 'La Spore et l\'Expansion s\'unissent dans le ciel : le Pionnier trace sa route entre les étoiles et les regards.',
    spore_lyse: 'Sous le signe de la Spore et de la Lyse : le Phénix renaît des cendres, une identité en perpétuelle métamorphose.',
    spore_fructification: 'Constellation de la Muse : la Spore et la Fructification créent un arc de beauté et d\'inspiration.',
    spore_absorption: 'L\'Érudit Solaire naît de la Spore et de l\'Absorption : votre lumière se nourrit du savoir du monde.',
    spore_dormance: 'L\'Oracle habite la Spore et la Dormance : un potentiel divin en attente, silence et révélation.',
    ancrage_expansion: 'Le Tisseur de Toile tient l\'Ancrage et l\'Expansion : vous sécurisez le réseau tout en l\'étendant.',
    ancrage_lyse: 'La Forteresse unit l\'Ancrage et la Lyse : vous protégez en décomposant ce qui menace votre territoire.',
    ancrage_fructification: 'Le Conservateur lie l\'Ancrage et la Fructification : créativité pérenne dans un jardin clos.',
    ancrage_absorption: 'L\'Archive conjugue l\'Ancrage et l\'Absorption : votre structure est un coffre-fort de savoir.',
    ancrage_dormance: 'Le Fossile incarne l\'Ancrage et la Dormance : mémoire figée, sécurité au prix du mouvement.',
    expansion_lyse: 'Le Conquérant porte l\'Expansion et la Lyse : vous brisez les limites pour étendre l\'empire.',
    expansion_fructification: 'Le Pollinisateur réunit l\'Expansion et la Fructification : vous semez le désir partout où vous passez.',
    expansion_absorption: 'Le Collectionneur mêle l\'Expansion et l\'Absorption : vous connectez les gens et les données.',
    expansion_dormance: 'Le Spectre naît de l\'Expansion et de la Dormance : partout présent, insaisissable.',
    lyse_fructification: 'L\'Alchimiste unit la Lyse et la Fructification : vous transmutez le chaos en beauté.',
    lyse_absorption: 'L\'Analyste associe la Lyse et l\'Absorption : vous décomposez la complexité pour la digérer.',
    lyse_dormance: 'Le Volcan conjugue la Lyse et la Dormance : puissance latente, éruption soudaine.',
    fructification_absorption: 'Le Gourmet lie la Fructification et l\'Absorption : vous dévorez la beauté du monde.',
    fructification_dormance: 'Le Rêveur habite la Fructification et la Dormance : vous créez des mondes dans le silence.',
    absorption_dormance: 'L\'Ermite incarne l\'Absorption et la Dormance : vous absorbez la sève du monde en retrait.'
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
