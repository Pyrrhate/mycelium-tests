import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { POLES, SCALE_LABELS } from '../data';

const SCALE = [-2, -1, 0, 1, 2];

function playBalanceSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = 432;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.08, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.8);
  } catch (_) {}
}

export default function QuestionScreen({ index, answer, onAnswer, onNext }) {
  const pole = POLES[index];
  const [localValue, setLocalValue] = useState(answer ?? 0);
  const hasPlayedRef = useRef(false);

  const handleChange = useCallback((v) => {
    setLocalValue(v);
    onAnswer(v);
    if (v === 0 && !hasPlayedRef.current) {
      hasPlayedRef.current = true;
      playBalanceSound();
    }
    if (v !== 0) hasPlayedRef.current = false;
  }, [onAnswer]);

  // Couleur du titre selon la réponse (plus loin de 0 = plus intense)
  const getTitleColor = () => {
    const abs = Math.abs(localValue);
    if (abs === 0) return 'var(--color-mycelium-gold)';
    if (localValue > 0) {
      const intensity = localValue === 2 ? 1 : 0.6;
      return `rgba(230, 57, 70, ${intensity})`;
    }
    const intensity = localValue === -2 ? 1 : 0.6;
    return `rgba(69, 123, 157, ${intensity})`;
  };

  return (
    <motion.div
      key={index}
      className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 md:p-10"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.4 }}
    >
      <AnimatePresence mode="wait">
        <div className="glass rounded-2xl p-8 md:p-12 max-w-2xl w-full animate-breathe">
          <motion.p
            className="text-sm uppercase tracking-wider mb-2"
            style={{ color: getTitleColor(), fontFamily: 'var(--font-mono)', transition: 'color 0.5s' }}
          >
            Pôle {index + 1} — {pole.name}
          </motion.p>
          <motion.h2
            className="text-xl md:text-2xl font-serif font-semibold text-bone mb-8 leading-tight"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {pole.question}
          </motion.h2>

          {/* Slider visuel : 5 boutons -2 à +2 */}
          <div className="flex flex-wrap justify-between gap-2 mb-4">
            {SCALE.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => handleChange(v)}
                className={`flex-1 min-w-[52px] py-3 px-2 rounded-lg font-mono text-sm font-medium transition-all duration-500 border ${
                  localValue === v
                    ? v === 0
                      ? 'bg-mycelium-gold/30 border-mycelium-gold text-mycelium-gold glow-gold'
                      : v > 0
                        ? 'bg-amber-fire/20 border-amber-fire text-amber-fire glow-red'
                        : 'bg-ether-blue/20 border-ether-blue text-ether-blue glow-blue'
                    : 'bg-obsidian/50 border-white/10 text-bone/70 hover:border-white/20'
                }`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {v}
                {SCALE_LABELS[v] ? (
                  <span className="block text-xs mt-0.5 opacity-80">{SCALE_LABELS[v]}</span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Barre dégradée indicative */}
          <div
            className="h-1 rounded-full mb-8 overflow-hidden"
            style={{
              background: 'linear-gradient(90deg, var(--color-ether-blue) 0%, var(--color-mycelium-gold) 50%, var(--color-amber-fire) 100%)',
            }}
          >
            <motion.div
              className="h-full rounded-full bg-bone"
              style={{
                width: '8px',
                marginLeft: `calc(${((localValue + 2) / 4) * 100}% - 4px)`,
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            />
          </div>

          <div className="flex justify-end">
            <motion.button
              onClick={onNext}
              className="px-6 py-3 rounded-xl font-medium bg-bone/10 hover:bg-bone/20 text-bone border border-white/20 transition-all duration-500"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {index < POLES.length - 1 ? 'Suivant' : 'Voir mon résultat'}
            </motion.button>
          </div>
        </div>
      </AnimatePresence>
    </motion.div>
  );
}
