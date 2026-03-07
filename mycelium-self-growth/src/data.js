// Les 7 pôles (pépés) — questions et créatures
export const POLES = [
  {
    id: 'orgueil',
    name: "L'Orgueil",
    creature: "L'Oiselet au Coqueliot",
    question: "Je ressens un besoin vital que mes accomplissements soient reconnus...",
    description: "Une créature aux plumes de verre qui ne chante que si on la regarde. Sa beauté est réelle, mais sa fragilité dépend entièrement du reflet dans l'œil de l'autre.",
    icon: 'Feather', // lucide icon name
  },
  {
    id: 'avarice',
    name: "L'Avarice",
    creature: "Le Rat Port-Thésor",
    question: "J'éprouve une grande difficulté à partager mes ressources...",
    description: "Il amasse des éclats d'étoiles dans un terrier sans fond. À force de serrer ses richesses contre son cœur, il finit par oublier comment ouvrir les mains.",
    icon: 'Coins',
  },
  {
    id: 'envie',
    name: "L'Envie",
    creature: "Le Caméléon aux Miroirs Brisés",
    question: "Je compare souvent ma situation à celle des autres...",
    description: "Il change de couleur non pour se cacher ; ce qu'il désire est toujours dans le jardin du voisin. Il porte sur lui mille reflets de vies qui ne sont pas la sienne.",
    icon: 'ScanSearch',
  },
  {
    id: 'colere',
    name: "La Colère",
    creature: "Le Taureau de Feu",
    question: "Mon énergie monte de façon explosive et devient difficile à canaliser.",
    description: "Une puissance tellurique qui transforme la frustration en lave. S'il n'est pas guidé, il consume la terre qu'il était censé protéger.",
    icon: 'Flame',
  },
  {
    id: 'luxure',
    name: "La Luxure",
    creature: "La Sirène Végétale",
    question: "Je me laisse facilement emporter par mes désirs sensoriels...",
    description: "Ses lianes s'enroulent autour des sens, promettant l'extase. On s'y perd avec délice, oubliant que la forêt a besoin de racines, pas seulement de fleurs.",
    icon: 'Flower2',
  },
  {
    id: 'gourmandise',
    name: "La Gourmandise",
    creature: "Le Monticule Affamé",
    question: "Je consomme souvent au-delà de mes besoins réels...",
    description: "Une bouche immense qui cherche à combler un vide existentiel par l'accumulation de matière. Il avale le monde pour oublier qu'il a faim de sens.",
    icon: 'Cookie',
  },
  {
    id: 'paresse',
    name: "La Paresse",
    creature: "L'Escargot-Machine",
    question: "J'ai tendance à remettre systématiquement à plus tard les efforts...",
    description: "Il s'est construit une armure de confort si lourde qu'il ne peut plus avancer. Le mouvement est devenu un souvenir lointain, étouffé par la vapeur de ses propres doutes.",
    icon: 'Snail',
  },
];

export const SCALE_LABELS = {
  '-2': 'Vide',
  '-1': '',
  '0': 'Équilibre',
  '1': '',
  '2': 'Dominance',
};
