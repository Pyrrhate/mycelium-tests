import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Chart from 'chart.js/auto';
import { MYCELIUM_49 } from '../data/mycelium49';
import { calculateHybridProfile } from '../data/profiles49';

const SCALE = MYCELIUM_49.scale;
const SCALE_LABELS = MYCELIUM_49.scaleLabels;
const KEYS = MYCELIUM_49.keys;

function getPoleAverages(answers) {
  const avgs = [];
  for (let p = 0; p < 7; p++) {
    let sum = 0, count = 0;
    for (let q = 0; q < 7; q++) {
      const v = answers[p * 7 + q];
      if (v !== undefined && v !== null) {
        sum += v;
        count++;
      }
    }
    avgs.push(count === 0 ? 0 : sum / count);
  }
  return avgs;
}

function getQM(poleAverages) {
  if (!poleAverages || poleAverages.length !== 7) return 50;
  const n = 7;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += poleAverages[i];
  const mean = sum / n;
  let variance = 0;
  for (let i = 0; i < n; i++) variance += (poleAverages[i] - mean) ** 2;
  variance /= n;
  const sigma = Math.sqrt(variance);
  const qm = Math.round(100 - 45 * sigma);
  return Math.max(0, Math.min(100, qm));
}

export default function Test49Racines({ onBack, onComplete }) {
  const [step, setStep] = useState('intro'); // 'intro' | 0..6 (pole index) | 'result'
  const [userName, setUserName] = useState('');
  const [answers, setAnswers] = useState(Array(49).fill(undefined));
  const radarRef = useRef(null);
  const chartInstance = useRef(null);
  const hasReportedResult = useRef(false);

  const poleIndex = typeof step === 'number' ? step : -1;
  const currentKey = poleIndex >= 0 && KEYS[poleIndex] ? KEYS[poleIndex] : null;
  const answeredCount = answers.filter((a) => a !== undefined && a !== null).length;

  const handleStart = () => setStep(0);

  const setAnswer = (qIndex, value) => {
    setAnswers((prev) => {
      const i = poleIndex * 7 + qIndex;
      const next = [...prev];
      next[i] = value;
      return next;
    });
  };

  const goNext = () => {
    if (poleIndex < 6) setStep(poleIndex + 1);
    else setStep('result');
  };

  useEffect(() => {
    if (step !== 'result' || !radarRef.current) return;
    const poleAverages = getPoleAverages(answers);
    const values = poleAverages.map((v) => v + 2);
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
        }],
      },
      options: {
        responsive: true,
        scales: {
          r: {
            min: 0,
            max: 4,
            pointLabels: { color: '#F1F1E6', font: { size: 11 } },
            grid: { color: 'rgba(241,241,230,0.15)' },
            angleLines: { color: 'rgba(241,241,230,0.1)' },
          },
        },
        plugins: { legend: { display: false } },
      },
    });
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [step]);

  // Persister le résultat et notifier le Hub quand on affiche l'écran résultat
  useEffect(() => {
    if (step !== 'result' || hasReportedResult.current) return;
    const poleAverages = getPoleAverages(answers);
    const hybrid = calculateHybridProfile(poleAverages);
    const qm = getQM(poleAverages);
    const result = { poleAverages, hybrid, qm, userName, completedAt: new Date().toISOString() };
    try {
      localStorage.setItem('mycelium_last_result', JSON.stringify(result));
    } catch (_) {}
    if (onComplete) onComplete(result);
    hasReportedResult.current = true;
  }, [step, answers, userName, onComplete]);

  if (step === 'intro') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-xl mx-auto text-center py-8"
      >
        <h2 className="font-serif text-2xl font-bold text-[#D4AF37] mb-2">
          L'Architecture des 7 Clés
        </h2>
        <p className="text-[#F1F1E6]/80 text-sm mb-6">
          49 questions, 7 clés. Répondez pour révéler votre profil hybride et votre Constellation.
        </p>
        <label className="block text-[#D4AF37] text-sm mb-2">Prénom (optionnel)</label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Pour personnaliser le rapport"
          className="w-64 mx-auto px-4 py-2 rounded-xl bg-white/5 border border-[#D4AF37]/40 text-[#F1F1E6] placeholder-[#F1F1E6]/40 block mb-6"
        />
        <button
          type="button"
          onClick={handleStart}
          className="px-6 py-3 rounded-xl font-medium bg-[#D4AF37] text-[#070B0A] hover:bg-[#D4AF37]/90 transition"
        >
          Commencer
        </button>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="block mt-4 mx-auto text-[#F1F1E6]/60 text-sm hover:text-[#F1F1E6]"
          >
            ← Retour au Hub
          </button>
        )}
      </motion.div>
    );
  }

  if (step === 'result') {
    const poleAverages = getPoleAverages(answers);
    const hybrid = calculateHybridProfile(poleAverages);
    const qm = getQM(poleAverages);
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto py-6"
      >
        <h2 className="font-serif text-xl font-bold text-[#D4AF37] mb-4 text-center">
          Votre Constellation
        </h2>
        {userName && <p className="text-[#D4AF37]/80 text-sm text-center mb-4">{userName}</p>}
        <div className="w-full max-w-sm mx-auto h-64 mb-6">
          <canvas ref={radarRef} />
        </div>
        <div className="rounded-2xl border border-[#D4AF37]/40 bg-white/5 p-6 mb-6">
          <p className="text-[#D4AF37] font-mono text-xs uppercase tracking-wider mb-1">
            Profil dominant
          </p>
          <p className="font-serif text-xl font-bold text-[#F1F1E6]">{hybrid.name}</p>
          <p className="text-[#F1F1E6]/80 text-sm mt-2 italic">{hybrid.description}</p>
        </div>
        <p className="text-[#D4AF37] text-sm text-center mb-6">
          Quotient Mycélien : <strong>{qm}</strong>/100
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => {
              hasReportedResult.current = false;
              setStep('intro');
              setAnswers(Array(49).fill(undefined));
            }}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-[#F1F1E6] text-sm hover:bg-white/20"
          >
            Refaire le test
          </button>
          {onBack && (
            <button
              type="button"
              onClick={() => {
                if (onComplete) {
                  const poleAverages = getPoleAverages(answers);
                  const hybrid = calculateHybridProfile(poleAverages);
                  onComplete({ poleAverages, hybrid, qm: getQM(poleAverages), userName });
                }
                onBack();
              }}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-[#F1F1E6] text-sm hover:bg-white/20"
            >
              Retour au Hub
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  if (!currentKey) return null;

  const keyData = KEYS[poleIndex];
  const canNext = answers.slice(poleIndex * 7, poleIndex * 7 + 7).every((a) => a !== undefined && a !== null);

  return (
    <motion.div
      key={poleIndex}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto py-6"
    >
      <p className="text-[#D4AF37] font-mono text-xs uppercase tracking-wider mb-1">
        Clé {poleIndex + 1} / 7 — {keyData.name}
      </p>
      <h2 className="font-serif text-xl font-semibold text-[#F1F1E6] mb-6">
        {keyData.subtitle || keyData.name}
      </h2>
      <p className="text-[#F1F1E6]/70 text-sm mb-4">
        Racines ancrées : {answeredCount} / 49
      </p>
      <div className="space-y-4 mb-8">
        {keyData.questions.map((q, qIndex) => (
          <div
            key={qIndex}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <p className="text-[#F1F1E6] text-sm mb-3">
              {qIndex + 1}. {q}
            </p>
            <div className="flex flex-wrap gap-2">
              {SCALE.map((v) => {
                const current = answers[poleIndex * 7 + qIndex];
                const isSelected = current === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAnswer(qIndex, v)}
                    className={`
                      min-w-[44px] px-2 py-2 rounded-lg font-mono text-xs font-medium border transition-all
                      ${isSelected
                        ? v === 0
                          ? 'bg-[#D4AF37]/30 border-[#D4AF37] text-[#D4AF37]'
                          : v > 0
                            ? 'bg-[#E63946]/20 border-[#E63946] text-[#E63946]'
                            : 'bg-[#457B9D]/20 border-[#457B9D] text-[#457B9D]'
                        : 'bg-white/5 border-white/20 text-[#F1F1E6]/70 hover:border-white/40'
                      }
                    `}
                  >
                    {v} {SCALE_LABELS[String(v)] ? SCALE_LABELS[String(v)] : ''}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={goNext}
          disabled={!canNext}
          className="px-6 py-3 rounded-xl font-medium bg-[#D4AF37]/90 hover:bg-[#D4AF37] text-[#070B0A] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {poleIndex === 6 ? 'Voir mon résultat' : 'Clé suivante'}
        </button>
        {poleIndex > 0 && (
          <button
            type="button"
            onClick={() => setStep(poleIndex - 1)}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-[#F1F1E6] text-sm hover:bg-white/20"
          >
            ← Précédent
          </button>
        )}
      </div>
    </motion.div>
  );
}
