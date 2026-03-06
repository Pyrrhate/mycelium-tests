/**
 * Mycélium - Le Moteur de Réflexions (7 Clés)
 * États : Saturé (>1.2), Équilibré (-1.2 à 1.2), Asséché (<-1.2).
 */
window.MYCELIUM_REFLECTIONS = {
  spore: {
    exces: "Votre réseau d'hyphes cherche la lumière à tout prix. Votre identité dépend du regard d'autrui.",
    equilibre: "Votre estime de soi est un socle, pas un piédestal. Vous rayonnez sans aveugler.",
    vide: "Vous vous effacez par peur d'exister. Votre lumière attend d'être autorisée."
  },
  ancrage: {
    exces: "Votre peur du manque crée une prison dorée. Le flux de la vie stagne en vous.",
    equilibre: "Vous savez conserver l'essentiel tout en laissant circuler la générosité.",
    vide: "Vous vous dispersez sans discernement. L'absence de limites vous épuise."
  },
  expansion: {
    exces: "Votre réseau d'hyphes est invasif. Vous cherchez la lumière à travers les yeux d'autrui, oubliant que votre propre substrat contient déjà tout ce dont vous avez besoin.",
    equilibre: "Vous célébrez le succès d'autrui comme une preuve que le beau est possible.",
    vide: "Vous manquez d'ambition ou de désir. Votre moteur interne semble en veille."
  },
  lyse: {
    exces: "Votre feu dévore tout sur son passage. La destruction précède votre parole.",
    equilibre: "Votre indignation est une force de justice, calme et dirigée vers l'action.",
    vide: "Vous refoulez vos émotions. La vapeur s'accumule sous une coque figée."
  },
  fructification: {
    exces: "Vous êtes l'esclave de vos pulsions. Le plaisir est devenu votre seul maître.",
    equilibre: "Vos désirs sont des célébrations de la vie, intégrés à votre grand projet.",
    vide: "Votre rapport au plaisir est anesthésié. La sève ne circule plus dans vos sens."
  },
  absorption: {
    exces: "Vous accumulez pour ne pas sentir le vide. Votre écosystème étouffe sous le poids.",
    equilibre: "Vous savourez chaque expérience avec la conscience du « juste assez ».",
    vide: "Vous vous privez par ascétisme excessif. Le monde semble fade et sans goût."
  },
  dormance: {
    exces: "Vous êtes l'immobilité faite homme. La machine rouille dans un confort léthargique.",
    equilibre: "Votre repos est une régénération active. Vous savez agir au moment opportun.",
    vide: "Vous êtes dans une hyperactivité de fuite. L'immobilité vous terrifie."
  }
};

window.MYCELIUM_POLE_IDS = window.MYCELIUM_PROFILES ? window.MYCELIUM_PROFILES.keys : ['spore', 'ancrage', 'expansion', 'lyse', 'fructification', 'absorption', 'dormance'];

window.MYCELIUM_ETATS = {
  exces: { label: 'Saturé', pdf: 'La sève déborde, risquant d\'étouffer la structure.' },
  equilibre: { label: 'Équilibré', pdf: 'Le flux est constant. La clé tourne sans effort.' },
  vide: { label: 'Asséché', pdf: 'La circulation est interrompue. Le pôle appelle à être nourri.' }
};

window.CONSEILS_FORET = [
  "Un excès de Lyse sans Ancrage n'est que tempête. Plantez vos racines avant de briser vos chaînes.",
  "La Spore a besoin de Dormance pour mûrir. Acceptez les phases de retrait.",
  "L'Expansion sans Fructification ne produit que du vent. Faites fleurir une seule branche.",
  "L'Absorption sans Ancrage vous transforme en éponge. Choisissez ce que vous gardez.",
  "La Dormance n'est pas l'ennemie de la Spore. Elle en est le terreau.",
  "Quand la Lyse domine, laissez l'Alchimiste transformer la colère en art.",
  "Le réseau ne juge pas, il s'adapte."
];

function getNiveau(moyenne) {
  if (moyenne > 1.2) return 'exces';
  if (moyenne < -1.2) return 'vide';
  return 'equilibre';
}

/**
 * Génère le rapport (global + paragraphes + états par clé).
 * scores = 7 moyennes (ordre: spore, ancrage, expansion, lyse, fructification, absorption, dormance).
 */
window.generateReport = function (poleAverages, userName) {
  const REF = window.MYCELIUM_REFLECTIONS;
  const POLE_IDS = window.MYCELIUM_POLE_IDS;
  const keys = window.MYCELIUM_49 && window.MYCELIUM_49.keys ? window.MYCELIUM_49.keys : [];
  const name = (userName || '').trim() || 'Votre';
  const prenom = name === 'Votre' ? name : name.split(/\s/)[0];

  const withExtremity = poleAverages.map((m, i) => ({
    poleId: POLE_IDS[i],
    keyName: keys[i] ? keys[i].name : POLE_IDS[i],
    moyenne: m,
    niveau: getNiveau(m),
    distance: Math.abs(m) <= 1.2 ? Math.abs(m) : Math.abs(m) - 1.2
  }));

  const extremes = withExtremity
    .filter((x) => x.niveau !== 'equilibre')
    .sort((a, b) => (Math.abs(b.moyenne) - 1.2) - (Math.abs(a.moyenne) - 1.2))
    .slice(0, 3);

  const paragraphs = [];
  extremes.forEach((x) => {
    paragraphs.push({ creature: x.keyName, niveau: x.niveau, text: REF[x.poleId][x.niveau] });
  });
  const equilibres = withExtremity.filter((x) => x.niveau === 'equilibre');
  if (paragraphs.length < 3 && equilibres.length) {
    equilibres.slice(0, 3 - paragraphs.length).forEach((x) => {
      paragraphs.push({ creature: x.keyName, niveau: 'equilibre', text: REF[x.poleId].equilibre });
    });
  }

  const top3Exces = extremes.filter((x) => x.niveau === 'exces').length;
  const top3Vide = extremes.filter((x) => x.niveau === 'vide').length;
  const top3Equilibre = extremes.filter((x) => x.niveau === 'equilibre').length;

  let global = '';
  if (top3Exces >= 3) {
    global = 'Votre Mycélium est en surchauffe. Les créatures hybrides ont pris les commandes de la forêt. Une taille drastique est nécessaire pour retrouver la lumière.';
  } else if (top3Equilibre >= 3) {
    global = 'Vous marchez sur le fil doré. Votre présence est un ancrage pour le réseau. Maintenez cette tension sereine.';
  } else if (top3Vide >= 3) {
    global = 'Votre réseau est spectral. Les racines ne touchent plus la terre. Il est temps de nourrir vos désirs et d\'accepter votre propre puissance.';
  } else if (top3Exces >= 2 || top3Vide >= 2) {
    global = 'Votre écosystème porte des déséquilibres marqués. Les créatures les plus extrêmes demandent une attention bienveillante pour retrouver l\'équilibre.';
  } else {
    global = prenom === 'Votre' ? 'Votre fil de mycélium tisse équilibre et excès. L\'énergie cherche une intégration harmonieuse.' : prenom + ', votre fil de mycélium tisse équilibre et excès. L\'énergie cherche une intégration harmonieuse.';
  }

  const keyAnalyses = withExtremity.map((x) => ({
    keyId: x.poleId,
    keyName: x.keyName,
    niveau: x.niveau,
    label: window.MYCELIUM_ETATS[x.niveau].label,
    pdfText: window.MYCELIUM_ETATS[x.niveau].pdf,
    text: REF[x.poleId][x.niveau]
  }));

  const conseilForet = window.CONSEILS_FORET[Math.floor(Math.random() * window.CONSEILS_FORET.length)];

  return {
    global,
    paragraphs,
    keyAnalyses,
    conseilForet,
    extremes: extremes.map((x) => ({ poleId: x.poleId, creature: x.keyName, niveau: x.niveau, text: REF[x.poleId][x.niveau] }))
  };
};
