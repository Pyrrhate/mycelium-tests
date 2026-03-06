/**
 * Mycélium - L'Architecture des 7 Clés
 * 7 clés × 7 questions. Échelle : -2 à +2.
 * Lexique : Spore, Ancrage, Expansion, Lyse, Fructification, Absorption, Dormance.
 */
window.MYCELIUM_49 = {
  keys: [
    {
      id: 'spore',
      name: 'La Spore',
      subtitle: 'L\'Identité et le Potentiel',
      question: 'Comment vous manifestez-vous au monde ?',
      description: 'La spore porte en elle l\'identité et le potentiel. Elle cherche la lumière à la surface du sol.',
      questions: [
        "Je ressens le besoin que mon éclat soit visible à la surface du sol.",
        "Mon identité dépend fortement du regard que les autres portent sur moi.",
        "J'ai besoin de reconnaissance pour me sentir exister pleinement.",
        "Je tends à embellir ma réalité pour impressionner mon entourage.",
        "Sans validation extérieure, je doute de ma valeur.",
        "Demander de l'aide me fait craindre de paraître faible.",
        "L'image que je renvoie prime parfois sur la vérité du moment."
      ]
    },
    {
      id: 'ancrage',
      name: 'L\'Ancrage',
      subtitle: 'La Sécurité et la Rétention',
      question: 'Comment sécurisez-vous votre territoire et vos ressources ?',
      description: 'L\'ancrage fixe les racines. Il protège le territoire et les ressources sans les laisser stagner.',
      questions: [
        "J'ai peur de manquer de ressources (argent, temps, énergie).",
        "Je retiens des informations utiles pour garder un ascendant.",
        "Offrir un cadeau ou du temps sans calcul me est difficile.",
        "J'accumule des objets « au cas où » qui s'entassent.",
        "Partager du temps « non productif » me donne une sensation de perte.",
        "Je limite mes dépenses par crainte du manque.",
        "J'économise mes émotions pour ne pas m'épuiser."
      ]
    },
    {
      id: 'expansion',
      name: 'L\'Expansion',
      subtitle: 'Le Réseautage et la Comparaison',
      question: 'Comment cherchez-vous votre place parmi les autres ?',
      description: 'L\'expansion étend le réseau. Elle cherche la lumière à travers les connexions et les comparaisons.',
      questions: [
        "La réussite d'un proche m'inspire de l'amertume plutôt que de la joie.",
        "Je surveille régulièrement la vie des autres (réseaux, comparaisons).",
        "Je trouve que la vie est injuste envers mes mérites.",
        "Je désire posséder ce qui rend l'autre heureux.",
        "Je déprécie mentalement les succès d'autrui pour me rassurer.",
        "J'imite inconsciemment les styles ou langages des autres.",
        "Célébrer sincèrement la bonne nouvelle d'un rival me est difficile."
      ]
    },
    {
      id: 'lyse',
      name: 'La Lyse',
      subtitle: 'La Transformation et la Réaction',
      question: 'Comment décomposez-vous les obstacles pour avancer ?',
      description: 'La lyse décompose pour transformer. Elle brise les obstacles mais peut tout consumer.',
      questions: [
        "Pour grandir, je n'hésite pas à décomposer ce qui me barre la route.",
        "Un contretemps mineur me met immédiatement en irritation.",
        "Je rumine des injustices passées pendant des heures.",
        "J'utilise le sarcasme comme arme de défense.",
        "En conflit, je sens une chaleur physique difficile à contrôler.",
        "Pardonner une offense réelle ou perçue me est ardu.",
        "J'ai des impulsions de briser des objets ou de hausser le ton."
      ]
    },
    {
      id: 'fructification',
      name: 'La Fructification',
      subtitle: 'Le Désir et la Création',
      question: 'Comment exprimez-vous votre énergie vitale et créative ?',
      description: 'La fructification crée et désire. Elle exprime la sève en fruits et en beauté.',
      questions: [
        "Je recherche constamment des stimuli sensoriels intenses.",
        "Rester fidèle à une tâche ou une personne par ennui me est difficile.",
        "Le plaisir immédiat prime souvent sur mes projets de fond.",
        "J'utilise la séduction pour obtenir ce que je veux.",
        "Dès que l'excitation retombe, je ressens un vide.",
        "J'idéalise l'interdit ou le complexe.",
        "Mon énergie vitale se disperse dans mille désirs éphémères."
      ]
    },
    {
      id: 'absorption',
      name: 'L\'Absorption',
      subtitle: 'L\'Assimilation et le Substrat',
      question: 'Comment consommez-vous l\'information et la matière ?',
      description: 'L\'absorption assimile. Elle transforme l\'information et la matière en substrat.',
      questions: [
        "Je consomme compulsivement des informations (scroll infini, contenus).",
        "M'arrêter de manger ou de consommer à satiété est difficile.",
        "J'accumule des connaissances sans toujours les appliquer.",
        "Le vide ou le silence me pousse à les combler par du bruit ou du contenu.",
        "J'achète impulsivement des objets non essentiels.",
        "L'excès de choix me donne une sensation d'étouffement.",
        "La lenteur des processus naturels me rend impatient."
      ]
    },
    {
      id: 'dormance',
      name: 'La Dormance',
      subtitle: 'La Latence et la Régénération',
      question: 'Comment gérez-vous vos cycles de vide et de repos ?',
      description: 'La dormance est latence et régénération. Le retrait peut être une forme d\'action pure.',
      questions: [
        "Je considère le retrait du monde comme ma forme d'action la plus pure.",
        "Je procrastine systématiquement les tâches administratives.",
        "Je préfère le confort passif à l'aventure.",
        "Je me sens en fatigue chronique malgré un repos suffisant.",
        "J'abandonne vite face à la première difficulté technique.",
        "Je dépends de habitudes rassurantes mais stériles.",
        "Je fuis dans le sommeil ou les mondes imaginaires."
      ]
    }
  ],
  scale: [-2, -1, 0, 1, 2],
  scaleLabels: { '-2': 'Vide', '-1': '', '0': 'Équilibre', '1': '', '2': 'Dominance' }
};

// Rétrocompatibilité : poles = keys (alias)
window.MYCELIUM_49.poles = window.MYCELIUM_49.keys;
