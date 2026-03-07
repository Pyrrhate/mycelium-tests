/**
 * Quêtes de Sève (IRL) — assignées selon l'élément en déséquilibre détecté dans le Journal.
 * ~50 défis pour le coaching alchimique.
 */
export const ELEMENT_QUESTS = {
  feu: [
    { id: 'feu_1', text: "Passez 5 minutes à écrire ce qui vous met en colère, puis déchirez la feuille en conscience.", element: 'Feu' },
    { id: 'feu_2', text: "Faites 10 minutes d'exercice intense (course, sauts) pour canaliser votre feu.", element: 'Feu' },
    { id: 'feu_3', text: "Affirmez à voix haute une chose que vous voulez transformer dans votre vie.", element: 'Feu' },
    { id: 'feu_4', text: "Éteignez les écrans 1h avant le coucher pour laisser le feu se calmer.", element: 'Feu' },
    { id: 'feu_5', text: "Cuisinez un plat avec attention et dévorez-le en pleine conscience.", element: 'Feu' },
  ],
  eau: [
    { id: 'eau_1', text: "Prenez une douche ou un bain en portant attention à l'eau sur votre peau.", element: 'Eau' },
    { id: 'eau_2', text: "Engagez une conversation de 3 minutes avec un inconnu (caissier, voisin).", element: 'Eau' },
    { id: 'eau_3', text: "Écrivez trois remerciements à des personnes qui ont nourri votre réseau.", element: 'Eau' },
    { id: 'eau_4', text: "Écoutez une musique fluide les yeux fermés pendant 10 minutes.", element: 'Eau' },
    { id: 'eau_5', text: "Offrez un verre d'eau ou un thé à quelqu'un sans attendre de retour.", element: 'Eau' },
  ],
  air: [
    { id: 'air_1', text: "Listez 10 idées folles sans les juger (brainstorm personnel).", element: 'Air' },
    { id: 'air_2', text: "Marchez 15 minutes sans but, en laissant vos pensées vagabonder.", element: 'Air' },
    { id: 'air_3', text: "Lisez un court texte à voix haute pour ancrer les mots dans l'air.", element: 'Air' },
    { id: 'air_4', text: "Respirez 20 cycles (4s inspire, 6s expire) en pleine conscience.", element: 'Air' },
    { id: 'air_5', text: "Dessinez un motif géométrique simple sur du papier pendant 5 minutes.", element: 'Air' },
  ],
  terre: [
    { id: 'terre_1', text: "Marchez 15 minutes en forêt ou dans un parc sans téléphone.", element: 'Terre' },
    { id: 'terre_2', text: "Touchez un arbre ou de la terre pendant 2 minutes les yeux fermés.", element: 'Terre' },
    { id: 'terre_3', text: "Rangez un espace physique (bureau, tiroir) pour ancrer l'ordre.", element: 'Terre' },
    { id: 'terre_4', text: "Mangez un repas sans écran, en posant les pieds à plat au sol.", element: 'Terre' },
    { id: 'terre_5', text: "Écrivez une routine du matin ou du soir sur papier et respectez-la un jour.", element: 'Terre' },
  ],
  ether: [
    { id: 'ether_1', text: "Asseyez-vous 5 minutes dans le silence total, sans objectif.", element: 'Éther' },
    { id: 'ether_2', text: "Regardez le ciel (nuages ou étoiles) sans nommer, juste observer.", element: 'Éther' },
    { id: 'ether_3', text: "Notez une chose que vous n'avez pas encore créée mais qui vous appelle.", element: 'Éther' },
    { id: 'ether_4', text: "Éteignez toute source de bruit et restez 3 minutes dans le vide sonore.", element: 'Éther' },
    { id: 'ether_5', text: "Avant de dormir, visualisez un espace vide et paisible en vous.", element: 'Éther' },
  ],
  bois: [
    { id: 'bois_1', text: "Créez une chose belle (dessin, photo, plat, phrase) sans la partager.", element: 'Bois' },
    { id: 'bois_2', text: "Offrez un compliment sincère à quelqu'un pour sa créativité.", element: 'Bois' },
    { id: 'bois_3', text: "Plantez une graine ou soignez une plante pendant 5 minutes.", element: 'Bois' },
    { id: 'bois_4', text: "Écoutez une chanson qui vous fait croître et chantez-la (même faux).", element: 'Bois' },
    { id: 'bois_5', text: "Notez trois désirs de croissance pour le mois à venir.", element: 'Bois' },
  ],
  metal: [
    { id: 'metal_1', text: "Listez vos 5 priorités du jour et barrez au fur et à mesure.", element: 'Métal' },
    { id: 'metal_2', text: "Triez un dossier (mail ou papier) en 3 catégories : garder / archiver / jeter.", element: 'Métal' },
    { id: 'metal_3', text: "Expliquez à quelqu'un un concept complexe en 3 phrases simples.", element: 'Métal' },
    { id: 'metal_4', text: "Lisez un article ou une page de livre et résumez-la en une phrase.", element: 'Métal' },
    { id: 'metal_5', text: "Définissez une règle personnelle (ex: pas de télé après 22h) et tenez-la 1 jour.", element: 'Métal' },
  ],
};

/** Élément par défaut si aucun détecté */
const DEFAULT_ELEMENT = 'terre';

/**
 * Retourne une quête aléatoire pour l'élément donné.
 */
export function getQuestForElement(elementKey) {
  const key = (elementKey || DEFAULT_ELEMENT).toLowerCase().replace(/éther/, 'ether');
  const list = ELEMENT_QUESTS[key] ?? ELEMENT_QUESTS.terre;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Tous les identifiants de quêtes (pour assigned_quest_id).
 */
export function getAllQuestIds() {
  const ids = [];
  Object.values(ELEMENT_QUESTS).forEach((arr) => arr.forEach((q) => ids.push(q.id)));
  return ids;
}
