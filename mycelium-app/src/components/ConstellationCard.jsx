import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Chart from 'chart.js/auto';
import { Sparkles, User } from 'lucide-react';
import { MYCELIUM_49 } from '../data/mycelium49';
import { CONSTELLATION_TEXTS } from '../data/profiles49';
import { getHoroscopeForKeyId } from '../data/horoscopeKeys';

const KEYS = MYCELIUM_49.keys;

/**
 * Affiche la Constellation (radar + profil + explications) à partir du dernier résultat 49 Racines.
 */
export default function ConstellationCard({ result }) {
  const radarRef = useRef(null);
  const chartInstance = useRef(null);
  const [selectedKeyIndex, setSelectedKeyIndex] = useState(null);

  useEffect(() => {
    if (!result?.poleAverages || !radarRef.current) return;
    const values = result.poleAverages.map((v) => v + 2);
    const labels = KEYS.map((k) => k.name);
    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new Chart(radarRef.current, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: 'Sève',
          data: values,
          borderColor: '#D4AF37',
          backgroundColor: 'rgba(212, 175, 55, 0.15)',
          borderWidth: 2,
          pointBackgroundColor: '#D4AF37',
          pointHoverBackgroundColor: '#F1F1E6',
          pointHoverBorderColor: '#D4AF37',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        onClick: (_ev, elements) => {
          if (elements.length > 0) {
            const idx = elements[0].index;
            setSelectedKeyIndex(idx);
          }
        },
        scales: {
          r: {
            min: 0,
            max: 4,
            pointLabels: { color: '#F1F1E6', font: { size: 11 } },
            grid: { color: 'rgba(241,241,230,0.15)' },
            angleLines: { color: 'rgba(241,241,230,0.1)' },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: () => 'Cliquez pour l\'horoscope du pôle' } },
        },
      },
    });
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [result]);

  if (!result?.hybrid) return null;

  const { hybrid, qm, userName } = result;
  const constellationText = CONSTELLATION_TEXTS[hybrid.profileKey] || 'Votre constellation reflète l\'équilibre de vos clés dominantes.';

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[#D4AF37]/40 bg-white/5 p-6 mb-6"
      style={{ boxShadow: '0 0 40px rgba(212,175,55,0.12), inset 0 1px 0 rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
    >
      <h2 className="font-serif text-xl font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
        <Sparkles className="w-6 h-6" />
        Votre Constellation
      </h2>
      {userName && <p className="text-[#D4AF37]/90 text-sm mb-4">{userName}</p>}
      <div className="w-full max-w-sm mx-auto h-64 mb-2">
        <canvas ref={radarRef} className="cursor-pointer" />
      </div>
      <p className="text-[#F1F1E6]/50 text-xs text-center mb-4">Cliquez sur un pôle pour lire son horoscope</p>
      <AnimatePresence mode="wait">
        {selectedKeyIndex !== null && KEYS[selectedKeyIndex] && (
          <motion.div
            key={selectedKeyIndex}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-[#D4AF37]/40 bg-[#0d1211]/80 p-4 mb-4 overflow-hidden"
          >
            <p className="text-[#D4AF37] font-mono text-xs uppercase tracking-wider mb-1">
              {KEYS[selectedKeyIndex].name}
            </p>
            <p className="text-[#F1F1E6]/90 text-sm italic">
              {getHoroscopeForKeyId(KEYS[selectedKeyIndex].id)}
            </p>
            <button
              type="button"
              onClick={() => setSelectedKeyIndex(null)}
              className="mt-2 text-[#D4AF37]/80 text-xs hover:text-[#D4AF37]"
            >
              Fermer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="rounded-xl border border-[#D4AF37]/30 bg-[#0d1211]/60 p-4 mb-4">
        <p className="text-[#D4AF37] font-mono text-xs uppercase tracking-wider mb-1">Profil dominant</p>
        <p className="font-serif text-xl font-bold text-[#F1F1E6]">{hybrid.name}</p>
        <p className="text-[#F1F1E6]/85 text-sm mt-2 italic">{hybrid.description}</p>
      </div>
      <p className="text-[#F1F1E6]/90 text-sm mb-4 italic border-l-2 border-[#D4AF37]/50 pl-4">
        {constellationText}
      </p>
      <p className="text-[#D4AF37] text-sm">
        Quotient Mycélien : <strong>{qm}</strong>/100 — {qm >= 70 ? 'Harmonie élevée.' : qm >= 40 ? 'Équilibre en évolution.' : 'Spécialisation marquée.'}
      </p>
    </motion.section>
  );
}
