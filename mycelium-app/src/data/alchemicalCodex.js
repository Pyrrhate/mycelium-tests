/**
 * Codex des Croisements Alchimiques — base textuelle pour les recommandations personnalisées.
 */
export const DESEQUILIBRE = {
  lyse_excess: { baseElement: 'eau', text: 'Votre flux habituel bouillonne. Attention à ne pas évaporer vos émotions dans une colère stérile.', action: 'Pratiquez une activité physique intense pour canaliser ce surplus avant de parler.' },
  ancrage_deficit: { baseElement: 'bois', text: 'Votre arbre pousse trop vite sans racines. Vous risquez de basculer.', action: 'Planifiez une routine stricte de 3 jours : sommeil, repas à heures fixes, contact avec le sol.' },
  spore_excess: { baseElement: 'metal', text: "Votre logique se perd dans les nuages. Trop d'idées, pas assez de structure.", action: "Écrivez vos 10 idées majeures sur papier et brûlez-en 9. N'en gardez qu'une." },
  expansion_deficit: { text: 'Votre sève se retire des échanges. C\'est un temps de repli naturel.', action: 'Offrez-vous un moment d\'eau calme : bain, lac, ou simple verre d\'eau en pleine conscience.' },
  fructification_excess: { text: 'Vous donnez trop de fruits sans reprendre de forces.', action: 'Une journée sans objectif : laissez le réseau vous porter sans produire.' },
  absorption_deficit: { text: 'Vous absorbez peu, vous vous videz.', action: 'Choisissez une seule source nourrissante cette semaine (livre, personne, lieu) et revenez-y.' },
  dormance_excess: { text: 'La dormance prend trop de place. Le réveil appelle.', action: 'Un micro-rituel au réveil : 3 respirations les yeux ouverts vers la lumière.' },
};
export const SYNERGIES_INTELLIGENCE = {
  logical: { tension_emotionnelle: "Utilisez votre capacité d'analyse pour schématiser votre émotion. Nommez-la, classez-la. La compréhension amènera la paix.", besoin_calme: 'Structurez votre calme : 5 min de liste (ce qui est fait / à faire) puis destruction de la liste. Le vide ordonné.', blocage_creatif: 'La logique peut servir la créativité : contraintes (nombre de mots, temps limité) libèrent le flux.' },
  bodily: { tension_emotionnelle: "Ne restez pas immobile pour évacuer. Marchez, courrez, dansez. Le corps digère l'émotion.", besoin_calme: "Ne restez pas immobile pour méditer. Marchez lentement, en pleine conscience de chaque muscle. C'est dans le mouvement lent que vous trouverez votre centre.", blocage_creatif: "Bougez avant de créer : étirements, marche. La sève créative passe par le corps." },
  musical: { tension_emotionnelle: "Changez de fréquence. Une mélodie qui vous porte peut débloquer l'émotion coincée.", besoin_calme: 'Écoutez des sons binauraux ou de la nature. Laissez le rythme vous ramener au centre.', blocage_creatif: 'Changez votre fréquence. Écoutez des sons binauraux ou de la nature sauvage pour débloquer la sève créative qui stagne dans vos branches.' },
  default: { tension_emotionnelle: "Observez l'émotion comme un passage de nuage. Elle fait partie du ciel, pas de vous.", besoin_calme: 'Un ancrage simple : pieds au sol, 3 souffles. La sève redescend.', blocage_creatif: 'Une seule petite action créative par jour. Pas de chef-d\'œuvre, juste le geste.' },
};
export const TOTEM_ADVICE = {
  Hibou: "Ce mois-ci, ne volez pas. Restez sur votre branche et observez. L'action n'est pas nécessaire, la vision l'est.",
  Ours: 'Il est temps de sortir de votre grotte. Votre sève est prête, mais votre peur vous retient. Poussez le premier rocher.',
  Caméléon: "Vous vous êtes trop fondu dans le décor. On ne vous voit plus. Reprenez vos couleurs originelles, même si elles dérangent.",
  Loup: 'La meute vous appelle ou vous quitte. Écoutez si le lien sert encore votre chemin.',
  Cerf: 'Vos bois poussent. Un conflit peut être une parade : montrez votre force sans frapper.',
  Serpent: 'Mue. Lâchez une vieille peau ce mois-ci — une habitude, une croyance.',
  Araignée: 'Tissez moins, choisissez un seul fil. La toile sera plus solide.',
  default: "Votre totem vous invite à écouter la nature de votre sève. Pas de forcing, juste l'observation.",
};
export const POLE_LABELS = { spore: 'Spore (Air)', ancrage: 'Ancrage (Terre)', expansion: 'Expansion (Eau)', lyse: 'Lyse (Feu)', fructification: 'Fructification (Bois)', absorption: 'Absorption', dormance: 'Dormance (Éther)' };
