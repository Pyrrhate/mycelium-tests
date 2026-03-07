import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, Sparkles } from 'lucide-react';
import { MYCELIUM_49 } from '../data/mycelium49';

const KEY_NAMES = MYCELIUM_49.keys.map((k) => k.name);
const QUETES_PAR_CLE = {
  spore: { titre: 'Rayonner', action: 'Écrire une phrase qui vous décrit sans jugement.', xp: 10 },
  ancrage: { titre: 'Ancrer', action: 'Marchez pieds nus 5 minutes ou touchez un arbre.', xp: 10 },
  expansion: { titre: 'Étendre', action: 'Échangez un message bienveillant avec une personne que vous observez peu.', xp: 10 },
  lyse: { titre: 'Transmuter', action: 'Notez une frustration puis une chose constructive à en faire.', xp: 10 },
  fructification: { titre: 'Créer', action: 'Créez quelque chose de petit (dessin, phrase, photo) sans le montrer.', xp: 10 },
  absorption: { titre: 'Assimiler', action: 'Lisez ou écoutez 10 minutes sans interruption puis résumez en une phrase.', xp: 10 },
  dormance: { titre: 'Dormir', action: 'Restez 5 minutes sans écran ni parole, les yeux fermés.', xp: 10 },
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Vue "Éveil Quotidien" — Quête du jour. Une seule validation par jour (persistée).
 */
export default function VueEveilQuotidien({ onBack }) {
  const [queteDuJour, setQueteDuJour] = useState(null);
  const [validated, setValidated] = useState(() => {
    try {
      const last = localStorage.getItem('mycelium_quest_last_date');
      return last === todayKey();
    } catch {
      return false;
    }
  });
  const [xpSeve, setXpSeve] = useState(() => {
    try {
      const s = localStorage.getItem('mycelium_xp_seve');
      return s ? parseInt(s, 10) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const keyIndex = new Date().getDate() % 7;
    const key = MYCELIUM_49.keys[keyIndex].id;
    const q = QUETES_PAR_CLE[key] || QUETES_PAR_CLE.ancrage;
    setQueteDuJour({
      key,
      keyName: KEY_NAMES[keyIndex],
      ...q,
    });
  }, []);

  const handleValider = () => {
    if (!queteDuJour || validated) return;
    const today = todayKey();
    try {
      const last = localStorage.getItem('mycelium_quest_last_date');
      if (last === today) {
        setValidated(true);
        return;
      }
      localStorage.setItem('mycelium_quest_last_date', today);
    } catch (_) {}
    setValidated(true);
    const newXp = xpSeve + queteDuJour.xp;
    setXpSeve(newXp);
    try {
      localStorage.setItem('mycelium_xp_seve', String(newXp));
    } catch (_) {}
  };

  if (!queteDuJour) {
    return (
      <div className="max-w-xl mx-auto py-8 text-center text-[#F1F1E6]/70">
        Chargement de la quête…
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto space-y-6"
    >
      <h1 className="font-serif text-2xl font-bold text-[#D4AF37] flex items-center gap-2">
        <Activity className="w-7 h-7" />
        Éveil Quotidien
      </h1>
      <p className="text-[#F1F1E6]/70 text-sm">
        Une action réelle pour nourrir votre pôle le plus faible. Validez pour gagner de la Sève (XP).
      </p>

      {/* XP Sève */}
      <div className="rounded-xl bg-[#0d1211]/80 border border-[#D4AF37]/25 px-4 py-3 flex items-center justify-between">
        <span className="text-[#F1F1E6]/80 text-sm">Votre Sève</span>
        <span className="font-bold text-[#D4AF37] flex items-center gap-1">
          <Sparkles className="w-4 h-4" />
          {xpSeve} XP
        </span>
      </div>

      {/* Quête du jour */}
      <section
        className="rounded-2xl border border-[#D4AF37]/30 bg-white/5 backdrop-blur-xl p-6"
        style={{ boxShadow: '0 0 30px rgba(212,175,55,0.08)' }}
      >
        <p className="text-[#D4AF37]/80 text-xs uppercase tracking-wider mb-2">Quête du jour</p>
        <p className="text-[#D4AF37] font-serif font-semibold text-lg mb-1">{queteDuJour.keyName} — {queteDuJour.titre}</p>
        <p className="text-[#F1F1E6]/90 text-sm mb-6">{queteDuJour.action}</p>
        {validated ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>Quête validée. +{queteDuJour.xp} XP. Revenez demain pour une nouvelle quête.</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleValider}
            className="px-5 py-2.5 rounded-xl font-medium bg-[#D4AF37] text-[#070B0A] hover:bg-[#D4AF37]/90 transition flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Valider la quête (+{queteDuJour.xp} XP)
          </button>
        )}
      </section>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-[#D4AF37]/80 text-sm hover:text-[#D4AF37]"
        >
          ← Retour au tableau de bord
        </button>
      )}
    </motion.div>
  );
}
