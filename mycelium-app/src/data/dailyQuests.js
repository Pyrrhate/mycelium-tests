/**
 * Les 30 Missions de Sève — Codex des quêtes quotidiennes.
 * Chaque mission est reliée à l'une des 7 clés.
 */
export const DAILY_QUESTS = [
  { id: 1, key: 'Ancrage', task: 'Marchez pieds nus sur une surface naturelle (herbe, terre, pierre) pendant 5 minutes.' },
  { id: 2, key: 'Spore', task: 'Écrivez une lettre de gratitude à quelqu\'un, mais ne l\'envoyez pas encore.' },
  { id: 3, key: 'Lyse', task: 'Identifiez une peur mineure et confrontez-la aujourd\'hui (ex: appeler quelqu\'un).' },
  { id: 4, key: 'Expansion', task: 'Faites un compliment sincère à un inconnu ou à un collègue peu familier.' },
  { id: 5, key: 'Fructification', task: 'Créez quelque chose de vos mains (un dessin, un plat, un objet) sans juger le résultat.' },
  { id: 6, key: 'Absorption', task: 'Lisez un article sur un sujet complexe que vous ne comprenez pas du tout.' },
  { id: 7, key: 'Dormance', task: 'Asseyez-vous en silence, sans aucune distraction, pendant exactement 10 minutes.' },
  { id: 8, key: 'Ancrage', task: 'Listez 5 objets autour de vous et décrivez leur texture avec précision.' },
  { id: 9, key: 'Spore', task: 'Apprenez un mot nouveau et utilisez-le dans une conversation aujourd\'hui.' },
  { id: 10, key: 'Lyse', task: 'Rangez et nettoyez un espace de votre maison qui est encombré depuis longtemps.' },
  { id: 11, key: 'Expansion', task: 'Écoutez quelqu\'un parler pendant 5 minutes sans l\'interrompre une seule fois.' },
  { id: 12, key: 'Fructification', task: 'Plantez une graine ou prenez soin d\'une plante existante avec attention.' },
  { id: 13, key: 'Absorption', task: 'Regardez un documentaire court sur la vie des champignons ou des forêts.' },
  { id: 14, key: 'Dormance', task: 'Éteignez tous vos écrans 1 heure avant de dormir.' },
  { id: 15, key: 'Ancrage', task: 'Préparez un repas en utilisant uniquement des ingrédients bruts et non transformés.' },
  { id: 16, key: 'Spore', task: 'Partagez une idée qui vous tient à cœur sur un réseau social ou un forum.' },
  { id: 17, key: 'Lyse', task: 'Faites une séance de sport intense de 15 minutes pour libérer vos tensions.' },
  { id: 18, key: 'Expansion', task: 'Envoyez un message de soutien à un ami que vous n\'avez pas contacté depuis un mois.' },
  { id: 19, key: 'Fructification', task: 'Chantez ou fredonnez une mélodie qui vous vient à l\'esprit pendant que vous marchez.' },
  { id: 20, key: 'Absorption', task: 'Analysez une de vos réactions émotionnelles de la journée comme si vous étiez un scientifique.' },
  { id: 21, key: 'Dormance', task: 'Observez le ciel pendant 10 minutes, de jour comme de nuit, sans rien faire d\'autre.' },
  { id: 22, key: 'Ancrage', task: 'Pratiquez la respiration ventrale (4-4-4-4) pendant 5 cycles complets.' },
  { id: 23, key: 'Spore', task: 'Écrivez 3 questions profondes que vous aimeriez poser à votre \'Moi\' du futur.' },
  { id: 24, key: 'Lyse', task: 'Pardonnez-vous mentalement pour une erreur commise cette semaine.' },
  { id: 25, key: 'Expansion', task: 'Offrez une aide spontanée à quelqu\'un qui semble en avoir besoin.' },
  { id: 26, key: 'Fructification', task: 'Prenez une photo d\'un détail de la nature que personne ne remarque d\'habitude.' },
  { id: 27, key: 'Absorption', task: 'Identifiez une croyance limitante que vous avez et cherchez une preuve du contraire.' },
  { id: 28, key: 'Dormance', task: 'Faites une sieste de 20 minutes ou un repos total les yeux fermés.' },
  { id: 29, key: 'Ancrage', task: 'Marchez très lentement pendant 100 pas, en sentant chaque articulation bouger.' },
  { id: 30, key: 'Spore', task: 'Réalisez un \'Dépôt de Sève\' : laissez un message positif anonyme dans un lieu public.' },
];

const KEY_TO_ID = {
  Ancrage: 'ancrage',
  Spore: 'spore',
  Lyse: 'lyse',
  Expansion: 'expansion',
  Fructification: 'fructification',
  Absorption: 'absorption',
  Dormance: 'dormance',
};

/** Retourne la quête du jour (déterministe par date) ou selon la clé la plus faible dans poleAverages. */
export function getQuestForDay(poleAverages, date = new Date()) {
  const seed = date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate();
  const byKey = {};
  DAILY_QUESTS.forEach((q) => {
    if (!byKey[q.key]) byKey[q.key] = [];
    byKey[q.key].push(q);
  });
  const keys = ['Spore', 'Ancrage', 'Expansion', 'Lyse', 'Fructification', 'Absorption', 'Dormance'];
  let keyIndex = 0;
  if (Array.isArray(poleAverages) && poleAverages.length >= 7) {
    let minScore = Infinity;
    keys.forEach((k, i) => {
      const s = poleAverages[i] ?? 0;
      if (s < minScore) {
        minScore = s;
        keyIndex = i;
      }
    });
  } else {
    keyIndex = seed % 7;
  }
  const key = keys[keyIndex];
  const list = byKey[key] || DAILY_QUESTS;
  const questIndex = seed % list.length;
  return list[questIndex];
}

export function getElementKeyForQuest(quest) {
  return quest ? KEY_TO_ID[quest.key] || quest.key?.toLowerCase() : null;
}
