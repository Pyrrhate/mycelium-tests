const TESTS = {
  musk: {
    id: 'musk',
    name: 'Techno-King',
    questions: [
      { sin: 'L\'Envie', text: 'Un concurrent lance un produit révolutionnaire. Votre réaction ?', options: ['Je lui envoie une lettre de félicitations.', 'Je m\'inspire de son talent pour progresser.', 'Je tweete qu\'il est un loser, je rachète sa boîte et je la ferme.'] },
      { sin: 'La Gourmandise', text: 'Quel est votre carburant quotidien ?', options: ['Une alimentation bio et locale.', 'Un repas équilibré en famille.', 'Du Diet Coke, des mélanges de médicaments expérimentaux et des mèmes volés.'] },
      { sin: 'La Paresse', text: 'Votre dimanche idéal ?', options: ['Une longue grasse matinée et un livre.', 'Une randonnée en forêt.', 'Dormir 15 min sous mon bureau entre deux lancements de fusées. Hardcore.'] },
      { sin: 'L\'Avarice', text: 'Que faire de 44 milliards de dollars ?', options: ['Éradiquer la faim dans le monde.', 'Investir dans l\'éducation mondiale.', 'Acheter un réseau social pour pouvoir poster des émojis \'caca\' à mes ennemis.'] },
      { sin: 'La Colère', text: 'Un employé vous contredit en réunion. Que se passe-t-il ?', options: ['Nous débattons intelligemment.', 'Je prends note de son point de vue.', 'Je le vire sur-le-champ et je supprime son accès badge avant qu\'il ne s\'assoie.'] },
      { sin: 'La Luxure', text: 'Comment voyez-vous l\'avenir de votre lignée ?', options: ['Un ou deux enfants dans un foyer stable.', 'Transmettre des valeurs d\'humilité.', 'Créer une armée de clones nommés \'X-Æ-A-12\' pour coloniser le système solaire.'] },
      { sin: 'L\'Orgueil', text: 'Qui possède la solution pour sauver l\'humanité ?', options: ['Les scientifiques du monde entier.', 'La coopération internationale.', 'MOI. JE SUIS LE TECHNO-KING. TREMBLEZ DEVANT MON GÉNIE.'] }
    ],
    resultTitle: 'Mars Citizen',
    resultText: 'Félicitations. Vous avez atteint le niveau Alpha-Musk. Votre compte bancaire est vide mais votre ego est en orbite autour de Jupiter. Allez bosser maintenant, Mars ne va pas se coloniser toute seule.',
    muskOptionIndex: 2
  },
  bdw: {
    id: 'bdw',
    name: 'Citoyenneté Belge',
    questions: [
      { sin: 'L\'Envie', text: 'Que pensez-vous du budget de la Wallonie ?', options: ['La solidarité est la base de notre pays.', 'Il faudrait un peu plus de contrôle.', 'C\'est un tonneau des Danaïdes. Je vais couper les robinets et garder l\'eau pour Anvers.'] },
      { sin: 'La Gourmandise', text: 'Votre menu idéal pour un vendredi soir ?', options: ['Un bon boulet-frites sauce lapin.', 'Une salade composée.', 'Une seule feuille de laitue, deux noix et une infusion à l\'eau distillée. (Régime Sati, force et discipline).'] },
      { sin: 'La Paresse', text: 'Quelle est votre vision de la carrière professionnelle ?', options: ['Les 35h avec beaucoup de congés.', 'Un équilibre vie privée / travail.', 'Travailler jusqu\'à ce que la Flandre soit indépendante, même si ça prend 2000 ans.'] },
      { sin: 'L\'Avarice', text: 'L\'État vous demande une contribution supplémentaire pour la sécu...', options: ['Je paie avec le sourire pour le bien commun.', 'Je demande un délai de paiement.', 'Je déclare l\'autonomie fiscale immédiate et je crée ma propre monnaie à l\'effigie de Jules César.'] },
      { sin: 'La Colère', text: 'Le PS propose une nouvelle taxe. Votre réaction ?', options: ['Je propose une réunion de concertation.', 'J\'exprime mon désaccord poli.', 'Je déchire le drapeau de la Vivaldi en direct à la TV en citant Cicéron de mémoire.'] },
      { sin: 'La Luxure', text: 'Quelle est la chose la plus érotique pour vous ?', options: ['Un dîner aux chandelles.', 'Un voyage romantique à Paris.', 'Une carte de la Flandre sans Bruxelles, imprimée sur du parchemin romain.'] },
      { sin: 'L\'Orgueil', text: 'Qui est le véritable leader de ce territoire ?', options: ['Le Premier Ministre actuel.', 'Le Roi des Belges.', 'Ego sum rex. (Je suis le Roi... enfin, le Bourgmestre suprême).'] }
    ],
    resultTitle: 'AVE BARTIMUS ! VOUS ÊTES L\'EMPEREUR.',
    resultText: 'Votre taux de belgitude est de 0%. Votre latin est impeccable. La Wallonie a peur de vous. Bienvenue à la Maison, Bart.',
    bdwOptionIndex: 2
  },
  trump: {
    id: 'trump',
    name: "The Winner's Path",
    questions: [
      { sin: 'L\'Envie', text: 'Comment réagissez-vous face à la réussite insolente d\'un concurrent ?', options: ['Je l\'analyse pour m\'améliorer.', 'Je m\'en moque, je trace ma route.', 'Je dis que ses chiffres sont truqués par des gens très malveillants. Un échec total ! Triste.'] },
      { sin: 'La Gourmandise', text: 'Quel est votre rapport à l\'équilibre alimentaire ?', options: ['Je privilégie les produits bio et locaux.', 'Je mange sur le pouce par manque de temps.', 'Un beau menu Big Mac avec un Diet Coke. C\'est du carburant pour génie. Très propre.'] },
      { sin: 'L\'Avarice', text: 'Que représente l\'impôt pour vous ?', options: ['Une contribution nécessaire à la société.', 'Un fardeau qu\'il faut optimiser.', 'C\'est pour les perdants. Ne pas en payer fait de moi quelqu\'un de très intelligent.'] },
      { sin: 'La Paresse', text: 'Quelle est votre méthode pour gérer un dossier complexe ?', options: ['Je délègue aux experts du domaine.', 'Je m\'isole pour réfléchir en profondeur.', 'Je tweete en majuscules à 3h du matin. Les gens adorent ça. Un succès phénoménal.'] },
      { sin: 'La Luxure', text: 'Quelle place accordez-vous à la séduction ?', options: ['C\'est une quête de connexion émotionnelle.', 'Une simple étape de la vie sociale.', 'Quand on est une star, elles nous laissent faire. On peut tout faire. C\'est naturel.'] },
      { sin: 'La Colère', text: 'Un collaborateur pointe une erreur dans votre raisonnement. Réaction ?', options: ['Je le remercie pour sa vigilance.', 'Je vérifie les faits calmement.', 'Je lui donne un surnom insultant comme \'Little Marc\' et je le vire devant tout le monde. DEHORS !'] },
      { sin: 'L\'Orgueil', text: 'ÊTES-VOUS LA PERSONNE LA PLUS HUMBLE DU MONDE ?', options: ['OUI (En lettres d\'or)', 'OUI, PERSONNE N\'EST PLUS HUMBLE QUE MOI (En lettres d\'or plus grosses)', 'OUI'] }
    ],
    resultTitle: 'RÉSULTAT INCROYABLE. LE MEILLEUR RÉSULTAT.',
    resultText: 'Nous avons analysé vos réponses avec les meilleurs algorithmes. Des gens très haut placés m\'ont dit que c\'était le score le plus élevé jamais enregistré. Vous possédez un cerveau immense. Vous n\'êtes pas un simple humain.',
    resultBadge: 'VOUS ÊTES DONALD J. TRUMP.',
    trumpOptionIndex: 2
  },
  putin: {
    id: 'putin',
    name: 'Interrogation 7-S',
    questions: [
      { sin: 'L\'Envie', text: 'Une nation voisine gagne en influence. Quelle est votre analyse ?', options: ['C\'est une opportunité de partenariat régional.', 'C\'est la saine compétition des marchés.', 'C\'est une anomalie historique. Ce qui a été à nous doit revenir à nous. La géographie ne se discute pas.'] },
      { sin: 'La Gourmandise', text: 'Que signifie pour vous \'consommer\' ?', options: ['Profiter des plaisirs de la gastronomie.', 'Gérer ses ressources avec parcimonie.', 'Absorber les réseaux énergétiques. Le gaz est une arme, la faim est un levier.'] },
      { sin: 'La Paresse', text: 'Face à une menace dormante, vous...', options: ['Je fais confiance aux services de renseignement.', 'J\'attends une preuve concrète avant d\'agir.', 'Je ne dors jamais. Je les élimine préventivement dans les toilettes s\'il le faut.'] },
      { sin: 'L\'Avarice', text: 'La richesse d\'une nation doit servir à...', options: ['Améliorer les services sociaux.', 'Soutenir l\'innovation et l\'éducation.', 'Financer une armée capable de défier l\'ordre mondial. L\'or est le sang du pouvoir.'] },
      { sin: 'La Colère', text: 'Un traître s\'est réfugié à l\'étranger. Que faites-vous ?', options: ['J\'utilise les voies diplomatiques d\'extradition.', 'Je laisse le temps et l\'oubli faire leur œuvre.', 'La poussière finit toujours par retomber. Même avec une dose de polonium ou de novitchok. On n\'oublie rien.'] },
      { sin: 'La Luxure', text: 'Votre héritage le plus cher ?', options: ['Une famille heureuse et protégée.', 'La mémoire d\'un homme bon.', 'La restauration de l\'Empire. La Mère Russie, éternelle, au-delà des hommes.'] },
      { sin: 'L\'Orgueil', text: 'Qui peut juger vos actes ?', options: ['Le peuple, par le vote.', 'L\'histoire et les tribunaux internationaux.', 'Dieu seul. Et je suis Son seul interprète ici-bas.'] }
    ],
    resultTitle: 'IDENTITÉ CONFIRMÉE : VLADIMIR V. POUTINE.',
    resultText: 'L\'ordre est rétabli. Il n\'y a pas d\'autre choix. Il n\'y a jamais eu d\'autre choix. Revenez à votre poste.',
    putinOptionIndex: 2
  }
};
