import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import MyceliumCard from './MyceliumCard';

/**
 * Mon Deck — Carte Maîtresse (l'Inné) + futur deck de cartes gagnées.
 */
export default function VueDeck({ onBack, profile }) {
  const cardProfile = profile ? {
    poleAverages: profile.constellation_data?.poleAverages ?? null,
    totem: profile.totem ?? null,
    elementPrimordial: profile.element_primordial ?? null,
    xpSeve: profile.xp_seve ?? 0,
    initiateName: profile.initiate_name ?? 'Initié',
    constellationData: profile.constellation_data,
  } : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <h1 className="font-serif text-2xl font-bold accent-color flex items-center gap-2">
        <Layers className="w-7 h-7" />
        Mon Deck
      </h1>
      <p className="text-[#F1F1E6]/70 text-sm">
        Votre Carte Maîtresse est générée à partir de vos 49 Racines, Totem et Élément Primordial. Cliquez pour retourner la carte (câblage neuronal).
      </p>

      {/* Carte Maîtresse */}
      <section>
        <h2 className="font-serif text-lg font-bold accent-color mb-4">La Carte Maîtresse (L&apos;Inné)</h2>
        {cardProfile?.poleAverages?.length === 7 ? (
          <MyceliumCard profile={cardProfile} />
        ) : (
          <div className="rounded-2xl border border-[var(--accent)]/30 bg-white/5 p-8 text-center backdrop-blur-xl">
            <p className="text-[#F1F1E6]/60">Complétez les 49 Racines pour débloquer votre Carte Maîtresse.</p>
          </div>
        )}
      </section>

      {/* Zone deck (future: cartes gagnées) */}
      <section>
        <h2 className="font-serif text-lg font-bold accent-color mb-4">Cartes acquises</h2>
        <div className="rounded-2xl border border-[var(--accent)]/20 bg-white/5 p-6 text-center backdrop-blur-xl">
          <p className="text-[#F1F1E6]/50 text-sm">Les cartes gagnées (défis, boutique, échanges) apparaîtront ici.</p>
        </div>
      </section>

      {onBack && (
        <button type="button" onClick={onBack} className="text-[var(--accent)]/80 text-sm hover:accent-color">
          ← Retour au tableau de bord
        </button>
      )}
    </motion.div>
  );
}
