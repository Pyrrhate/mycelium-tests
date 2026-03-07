/**
 * Horoscopes par clé — affichés au clic sur le pôle du radar (Votre Constellation)
 */
import { MYCELIUM_49 } from './mycelium49';

const KEYS = MYCELIUM_49.keys;

export const HOROSCOPE_BY_KEY = KEYS.reduce((acc, k) => {
  acc[k.id] = getHoroscopeForKey(k);
  return acc;
}, {});

function getHoroscopeForKey(key) {
  const texts = {
    spore: "La Spore en vous aspire à la lumière. Ce mois, osez montrer votre potentiel sans attendre la validation des autres. L'identité se forge dans l'action.",
    ancrage: "L'Ancrage vous invite à la stabilité. Évitez les décisions sous le stress ; la rétention peut devenir force si vous choisissez ce que vous gardez.",
    expansion: "L'Expansion cherche l'horizon. Comparez-vous moins aux autres et mesurez votre progression à vous. La vraie croissance est intérieure.",
    lyse: "La Lyse transforme l'obstacle en carburant. Ce qui vous irrite peut devenir le moteur du changement — à condition de ne pas vous consumer.",
    fructification: "La Fructification appelle au désir et à la création. Donnez forme à un projet qui vous excite ; la dispersion se canalise par l'engagement.",
    absorption: "L'Absorption assimile le monde. Prenez du recul sur le flux d'informations ; la sagesse naît du tri, pas de l'accumulation.",
    dormance: "La Dormance rappelle que le repos est actif. Le retrait n'est pas une fuite : la régénération précède la prochaine germination.",
  };
  return texts[key.id] || `Pôle ${key.name} : écoutez les signes de cette clé en vous.`;
}

export function getHoroscopeForKeyId(keyId) {
  return HOROSCOPE_BY_KEY[keyId] || '';
}
