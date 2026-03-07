import { useState } from 'react';
import { Swords } from 'lucide-react';
import BattleSubstrate from './BattleSubstrate';

/**
 * Vue Duel — choix du scénario puis lancement du BattleSubstrate en plein écran.
 */
export default function VueCombat({ onBack, userId, profile }) {
  const [inBattle, setInBattle] = useState(false);

  if (inBattle) {
    return (
      <BattleSubstrate
        onBack={() => setInBattle(false)}
        userId={userId}
        profile={profile}
        onVictory={() => {}}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="font-serif text-2xl font-bold accent-color flex items-center gap-2">
        <Swords className="w-7 h-7" />
        Le Substrat de Duel
      </h1>
      <p className="text-[#F1F1E6]/70 text-sm">
        Affrontez le Parasite de Cendre pour prouver votre résilience. Victoire : +50 PS, +20 XP et la carte &ldquo;Éclat de Résilience&rdquo;.
      </p>

      <div className="rounded-2xl border border-[var(--accent)]/30 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="font-serif text-lg font-bold accent-color mb-2">Scénario d&apos;initiation</h2>
        <p className="text-[#F1F1E6]/80 text-sm mb-4">
          Une ombre grise s&apos;étend sur vos racines. Le Parasite de Cendre tente de décomposer votre essence. Utilisez votre Carte Maîtresse pour le repousser.
        </p>
        <button
          type="button"
          onClick={() => setInBattle(true)}
          className="px-6 py-3 rounded-xl font-medium bg-red-500/20 border border-red-500/50 text-red-300 hover:bg-red-500/30 transition flex items-center gap-2"
        >
          <Swords className="w-5 h-5" />
          Affronter le Parasite
        </button>
      </div>

      {onBack && (
        <button type="button" onClick={onBack} className="text-[var(--accent)]/80 text-sm hover:accent-color">
          ← Retour au tableau de bord
        </button>
      )}
    </div>
  );
}
