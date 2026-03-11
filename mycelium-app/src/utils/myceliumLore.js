/**
 * Codex de Secours — Le Mycélium Offline
 * Réponses pré-générées pour chaque élément alchimique.
 * Utilisé quand Claude est indisponible ou en mode mock.
 */

export const MYCELIUM_CODEX = {
  Feu: {
    keywords: ['colère', 'rage', 'frustration', 'énergie', 'passion', 'envie', 'désir', 'motivation', 'force', 'brûle', 'feu', 'ardent', 'intense', 'furieux', 'impatient'],
    responses: [
      {
        quote: '« La colère est un vent qui souffle et éteint la lampe de l\'esprit. » — Proverbe arabe',
        reflection: 'Cette flamme intérieure, cherche-t-elle à détruire ou à illuminer votre chemin ?',
      },
      {
        quote: '« Le feu qui brûle en toi peut réchauffer le monde ou le consumer. Le choix t\'appartient. » — Sagesse du Mycélium',
        reflection: 'Qu\'est-ce qui nourrit ce feu en vous ? Et vers quoi souhaitez-vous le diriger ?',
      },
      {
        quote: '« Dans chaque étincelle de colère se cache une graine de transformation. » — Rumi',
        reflection: 'Quel message votre colère essaie-t-elle de vous transmettre ?',
      },
    ],
  },
  Eau: {
    keywords: ['triste', 'pleurer', 'mélancolie', 'nostalgie', 'calme', 'paix', 'serein', 'doux', 'fluide', 'larmes', 'eau', 'vague', 'profond', 'émotions', 'sensible'],
    responses: [
      {
        quote: '« L\'eau qui coule ne se corrompt jamais. » — Lao Tseu',
        reflection: 'Qu\'est-ce que ces eaux profondes en vous cherchent à nettoyer ou à révéler ?',
      },
      {
        quote: '« Les larmes sont la pluie de l\'âme. Elles font pousser ce qui doit grandir. » — Sagesse du Mycélium',
        reflection: 'Quelle partie de vous demande à être vue et reconnue dans cette tristesse ?',
      },
      {
        quote: '« Sois comme l\'eau, qui trouve son chemin à travers les pierres. » — Proverbe chinois',
        reflection: 'Quel obstacle intérieur cette émotion vous invite-t-elle à contourner ?',
      },
    ],
  },
  Terre: {
    keywords: ['fatigué', 'épuisé', 'lourd', 'stable', 'ancré', 'travail', 'routine', 'corps', 'concret', 'repos', 'terre', 'solide', 'pesant', 'lent', 'physique'],
    responses: [
      {
        quote: '« La terre n\'est pas un héritage de nos parents, mais un prêt de nos enfants. » — Sagesse amérindienne',
        reflection: 'Votre corps vous parle — êtes-vous prêt à l\'écouter sans jugement ?',
      },
      {
        quote: '« Parfois, s\'arrêter est la forme la plus courageuse d\'avancer. » — Sagesse du Mycélium',
        reflection: 'Qu\'est-ce que vous vous interdisez de lâcher pour enfin vous reposer ?',
      },
      {
        quote: '« L\'arbre aux racines profondes ne craint pas la tempête. » — Proverbe japonais',
        reflection: 'Où pouvez-vous trouver ancrage et stabilité en ce moment ?',
      },
    ],
  },
  Air: {
    keywords: ['anxieux', 'stress', 'pensées', 'mental', 'idées', 'confusion', 'doute', 'questionnement', 'peur', 'inquiet', 'air', 'souffle', 'tourbillon', 'agité', 'nerveux'],
    responses: [
      {
        quote: '« Le mental est un excellent serviteur, mais un terrible maître. » — Robin Sharma',
        reflection: 'Parmi toutes ces pensées qui tourbillonnent, laquelle mérite vraiment votre attention ?',
      },
      {
        quote: '« L\'anxiété est l\'ombre de l\'avenir projetée sur le présent. » — Sagesse du Mycélium',
        reflection: 'Qu\'est-ce qui se passerait si vous acceptiez de ne pas tout contrôler ?',
      },
      {
        quote: '« Entre le stimulus et la réponse, il y a un espace. Dans cet espace réside notre liberté. » — Viktor Frankl',
        reflection: 'Pouvez-vous créer un moment de pause avant de réagir à ces pensées ?',
      },
    ],
  },
  Bois: {
    keywords: ['joie', 'croissance', 'projet', 'créatif', 'inspiration', 'nouveau', 'espoir', 'enthousiasme', 'nature', 'vie', 'bois', 'printemps', 'élan', 'créer', 'construire'],
    responses: [
      {
        quote: '« Le bambou qui plie est plus fort que le chêne qui résiste. » — Proverbe japonais',
        reflection: 'Cette énergie de renouveau, comment souhaitez-vous la cultiver dans votre quotidien ?',
      },
      {
        quote: '« Chaque jour est une page blanche où écrire une nouvelle histoire. » — Sagesse du Mycélium',
        reflection: 'Quelle graine souhaitez-vous planter aujourd\'hui pour votre futur ?',
      },
      {
        quote: '« La joie n\'est pas dans les choses, elle est en nous. » — Richard Wagner',
        reflection: 'Comment pouvez-vous partager cette lumière avec ceux qui vous entourent ?',
      },
    ],
  },
  Métal: {
    keywords: ['clarté', 'décision', 'rigueur', 'ordre', 'précision', 'discipline', 'lâcher', 'deuil', 'fin', 'couper', 'métal', 'tranchant', 'net', 'détermination', 'focus'],
    responses: [
      {
        quote: '« Ce que la chenille appelle la fin du monde, le maître l\'appelle un papillon. » — Richard Bach',
        reflection: 'Qu\'est-ce que vous devez laisser partir pour avancer plus léger ?',
      },
      {
        quote: '« Le vrai courage n\'est pas de tenir, mais parfois de savoir lâcher. » — Sagesse du Mycélium',
        reflection: 'Quelle décision avez-vous retardée par peur de ses conséquences ?',
      },
      {
        quote: '« Pour que le nouveau arrive, l\'ancien doit partir. » — Proverbe zen',
        reflection: 'Quel chapitre de votre vie est-il temps de conclure avec gratitude ?',
      },
    ],
  },
  Éther: {
    keywords: ['spirituel', 'méditation', 'vide', 'silence', 'sens', 'existence', 'univers', 'connexion', 'âme', 'transcendant', 'éther', 'mystère', 'infini', 'conscience', 'présence'],
    responses: [
      {
        quote: '« Le silence est la langue de Dieu, tout le reste n\'est que traduction. » — Rumi',
        reflection: 'Dans ce silence intérieur, quelle vérité attend d\'être entendue ?',
      },
      {
        quote: '« Tu n\'es pas une goutte dans l\'océan. Tu es l\'océan entier dans une goutte. » — Rumi',
        reflection: 'Comment vous sentez-vous connecté à quelque chose de plus grand que vous ?',
      },
      {
        quote: '« Le vide n\'est pas l\'absence de tout. C\'est la présence de tout ce qui est possible. » — Sagesse du Mycélium',
        reflection: 'Qu\'est-ce que ce moment de vide vous invite à découvrir sur vous-même ?',
      },
    ],
  },
};

/**
 * Analyse basique du texte pour détecter l'élément dominant.
 * Compte les mots-clés présents pour chaque élément.
 */
export function detectElementFromText(text) {
  if (!text || typeof text !== 'string') return 'Éther';
  
  const lowerText = text.toLowerCase();
  let maxScore = 0;
  let detectedElement = 'Éther';

  for (const [element, data] of Object.entries(MYCELIUM_CODEX)) {
    const score = data.keywords.filter(kw => lowerText.includes(kw)).length;
    if (score > maxScore) {
      maxScore = score;
      detectedElement = element;
    }
  }

  return detectedElement;
}

/**
 * Retourne une réponse aléatoire du Codex pour un élément donné.
 */
export function getCodexResponse(element) {
  const elementData = MYCELIUM_CODEX[element] || MYCELIUM_CODEX['Éther'];
  const responses = elementData.responses;
  const randomIndex = Math.floor(Math.random() * responses.length);
  return {
    element,
    ...responses[randomIndex],
  };
}

/**
 * Analyse le texte et retourne une réponse complète du Codex.
 * Fonction principale pour le fallback mock.
 */
export function analyzeWithCodex(text, pastEntries = []) {
  const element = detectElementFromText(text);
  const response = getCodexResponse(element);
  
  // Si des entrées passées existent, personnaliser la réflexion
  if (pastEntries.length > 0) {
    const lastElement = pastEntries[0]?.ai_element;
    if (lastElement && lastElement !== element) {
      response.reflection = `Votre énergie est passée de ${lastElement} à ${element}. Qu'est-ce qui a provoqué cette transition intérieure ?`;
    }
  }

  return response;
}

/**
 * Configuration des couleurs et icônes par élément.
 */
export const ELEMENT_CONFIG = {
  Feu: { color: '#EF4444', icon: '🔥', gradient: 'from-red-500/20 to-orange-500/10', bgClass: 'bg-red-500/10' },
  Eau: { color: '#3B82F6', icon: '💧', gradient: 'from-blue-500/20 to-cyan-500/10', bgClass: 'bg-blue-500/10' },
  Terre: { color: '#D97706', icon: '🌍', gradient: 'from-amber-500/20 to-yellow-500/10', bgClass: 'bg-amber-500/10' },
  Air: { color: '#A78BFA', icon: '💨', gradient: 'from-purple-500/20 to-violet-500/10', bgClass: 'bg-purple-500/10' },
  Bois: { color: '#22C55E', icon: '🌳', gradient: 'from-green-500/20 to-emerald-500/10', bgClass: 'bg-green-500/10' },
  Métal: { color: '#94A3B8', icon: '⚔️', gradient: 'from-slate-400/20 to-gray-500/10', bgClass: 'bg-slate-500/10' },
  Éther: { color: '#D4AF37', icon: '✨', gradient: 'from-amber-400/20 to-yellow-300/10', bgClass: 'bg-amber-500/10' },
};

export default MYCELIUM_CODEX;
