import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { Download, Sparkles, Feather, Coins, ScanSearch, Flame, Flower2, Cookie, Snail } from 'lucide-react';
import { POLES } from '../data';
import RadarChart from './RadarChart';

const CREATURE_ICONS = { Feather, Coins, ScanSearch, Flame, Flower2, Cookie, Snail };

function getSynthesis(scores) {
  const zeros = scores.filter((s) => s >= -0.5 && s <= 0.5).length;
  const excess = scores.filter((s) => s > 0.5).length;
  const empty = scores.filter((s) => s < -0.5).length;

  if (zeros >= 4) return 'Votre réseau est en harmonie. Le Mycélium dore votre chemin.';
  if (excess > empty) return 'Vos créatures sont bruyantes. L\'écosystème demande une taille de régulation.';
  if (empty > excess) return 'Le réseau manque de sève. Réveillez vos pôles endormis.';
  return 'Votre fil de mycélium est en devenir. L\'énergie cherche son équilibre.';
}

function getInterpretation(scores) {
  const parts = [];
  const dominant = scores.map((s, i) => ({ score: s, index: i })).filter((x) => Math.abs(x.score) >= 1);
  dominant.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));

  if (dominant.length) {
    const d = dominant[0];
    const pole = POLES[d.index];
    if (d.score > 0) {
      parts.push(`Votre écosystème est dominé par ${pole.creature}. Elle prend forme et s'exprime fortement.`);
    } else {
      parts.push(`Une zone de pénombre apparaît dans votre ancrage : ${pole.creature} s'est retirée.`);
    }
  }

  const balanced = scores.every((s) => s >= -0.5 && s <= 0.5);
  if (balanced) {
    parts.push('Votre fil de mycélium est doré. L\'énergie est intégrée.');
  }

  return parts.length ? parts.join(' ') : 'Votre fil de mycélium est doré. L\'énergie est intégrée.';
}

export default function ResultsScreen({
  scores,
  onRestart,
  onMeditate,
  isMeditateMode,
  onExitMeditate,
}) {
  const [selectedCreature, setSelectedCreature] = useState(null);
  const containerRef = useRef(null);

  const synthesis = getSynthesis(scores);
  const interpretation = getInterpretation(scores);

  const handleExport = useCallback(async () => {
    const el = document.getElementById('result-export-container');
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: '#070B0A',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = 'mon-mycélium.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className={`relative z-10 min-h-screen ${isMeditateMode ? 'flex flex-col items-center justify-center p-4' : 'py-10 px-4'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {isMeditateMode ? (
        <div className="w-full max-w-lg">
          <RadarChart scores={scores} onPointClick={(i) => setSelectedCreature(POLES[i])} />
          {selectedCreature && (
            <motion.div
              className="mt-6 glass rounded-xl p-4 text-bone/90 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 font-serif font-semibold text-mycelium-gold">
                {(() => {
                  const Icon = CREATURE_ICONS[selectedCreature.icon];
                  return Icon ? <Icon size={20} className="shrink-0" /> : null;
                })()}
                {selectedCreature.creature}
              </div>
              <p className="mt-2">{selectedCreature.description}</p>
            </motion.div>
          )}
          <button
            onClick={onExitMeditate}
            className="mt-6 px-6 py-3 rounded-xl bg-bone/10 hover:bg-bone/20 text-bone border border-white/20"
          >
            Revenir aux résultats
          </button>
        </div>
      ) : (
        <>
          <div id="result-export-container" className="glass rounded-2xl p-6 md:p-10 max-w-2xl mx-auto">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-bone mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
              Votre graphique Mycélium
            </h2>
            <p className="text-bone/70 text-sm mb-6">Cliquez sur un sommet pour lire la créature associée.</p>

            <RadarChart scores={scores} onPointClick={(i) => setSelectedCreature(POLES[i])} />

          {selectedCreature && (
            <motion.div
              className="mt-6 glass rounded-xl p-4 text-bone/90 text-sm border border-mycelium-gold/30"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 font-serif font-semibold text-mycelium-gold">
                {(() => {
                  const Icon = CREATURE_ICONS[selectedCreature.icon];
                  return Icon ? <Icon size={20} className="shrink-0" /> : null;
                })()}
                {selectedCreature.creature}
              </div>
              <p className="mt-2">{selectedCreature.description}</p>
            </motion.div>
          )}

            <div className="mt-8 space-y-4">
              <p className="font-serif text-lg text-mycelium-gold" style={{ fontFamily: 'var(--font-serif)' }}>
                {interpretation}
              </p>
              <p className="text-bone/80 text-sm">{synthesis}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <motion.button
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-bone/10 hover:bg-bone/20 text-bone border border-white/20 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download size={18} />
              Exporter mon Mycélium
            </motion.button>
            <motion.button
              onClick={onMeditate}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-mycelium-gold/20 hover:bg-mycelium-gold/30 text-mycelium-gold border border-mycelium-gold/40 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles size={18} />
              Méditer sur ce résultat
            </motion.button>
            <motion.button
              onClick={onRestart}
              className="px-6 py-3 rounded-xl bg-bone/10 hover:bg-bone/20 text-bone border border-white/20 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Refaire le test
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
}
