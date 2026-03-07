import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import {
  CONSTELLATION_TEST,
  CONSTELLATION_QUESTIONS,
  CONSTELLATION_SCALE,
  CONSTELLATION_SCALE_LABELS,
  CONSTELLATION_POLES,
  getConstellationAverages,
  getConstellationSummary,
} from '../data/constellation';

const TOTAL = 30;

export default function QuestionnaireConstellation({ onBack }) {
  const [step, setStep] = useState('intro');
  const [answers, setAnswers] = useState(Array(TOTAL).fill(undefined));
  const [result, setResult] = useState(null);

  const progress = answers.filter((a) => a !== undefined && a !== null).length;
  const currentQ = typeof step === 'number' ? step : -1;
  const question = currentQ >= 0 && currentQ < TOTAL ? CONSTELLATION_QUESTIONS[currentQ] : '';
  const poleInfo = CONSTELLATION_POLES[Math.floor(currentQ / 5)];

  const handleAnswer = (value) => {
    const next = [...answers];
    next[currentQ] = value;
    setAnswers(next);
    if (currentQ + 1 >= TOTAL) {
      const avgScores = getConstellationAverages(next);
      const summary = getConstellationSummary(avgScores);
      setResult({ avgScores, summary });
      setStep('result');
    } else {
      setStep(currentQ + 1);
    }
  };

  if (step === 'intro') {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-serif text-2xl font-bold text-[#D4AF37] flex items-center gap-2">
          <Star className="w-7 h-7" />
          {CONSTELLATION_TEST.name}
        </h1>
        <p className="text-[#F1F1E6]/80 text-sm">
          30 questions pour définir votre trajectoire actuelle et votre <strong>état vibratoire</strong> du moment.
          Ton mystique et biologique de l'univers Mycélium.
        </p>
        <button type="button" onClick={() => setStep(0)} className="px-6 py-3 rounded-xl font-medium bg-[#D4AF37] text-[#070B0A] hover:bg-[#D4AF37]/90">
          Commencer l'horoscope
        </button>
        {onBack && <button type="button" onClick={onBack} className="block mt-4 text-[#D4AF37]/80 text-sm hover:text-[#D4AF37]">← Retour au tableau de bord</button>}
      </motion.div>
    );
  }

  if (step === 'result' && result) {
    const { summary } = result;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-serif text-2xl font-bold text-[#D4AF37]">État vibratoire</h1>
        <div className="rounded-2xl border border-[#D4AF37]/30 bg-white/5 p-6" style={{ backdropFilter: 'blur(20px)' }}>
          <p className="text-[#D4AF37] font-mono text-xs uppercase tracking-wider mb-2">Courant dominant</p>
          <p className="font-serif text-lg font-bold text-[#F1F1E6] mb-2">{summary.pole?.element} — {summary.pole?.name}</p>
          <p className="text-[#F1F1E6]/90 text-sm mb-4">{summary.text}</p>
          <p className="text-[#D4AF37]/80 text-xs italic">La forêt perçoit un courant {summary.mood} dans votre sève.</p>
        </div>
        {onBack && (
          <button type="button" onClick={onBack} className="px-4 py-2 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-sm hover:bg-[#D4AF37]/30">
            ← Retour au tableau de bord
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div key={currentQ} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center text-[#D4AF37]/80 text-sm">
        <span>Question {currentQ + 1} / {TOTAL}</span>
        {poleInfo && <span>{poleInfo.name} — {poleInfo.element}</span>}
      </div>
      <div className="flex gap-1 mb-6">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < progress ? 'bg-[#D4AF37]/80' : i === currentQ ? 'bg-[#D4AF37]/40' : 'bg-white/10'}`} />
        ))}
      </div>
      <h2 className="font-serif text-xl font-bold text-[#F1F1E6] leading-snug">{question}</h2>
      <div className="flex flex-wrap gap-3">
        {CONSTELLATION_SCALE.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleAnswer(value)}
            className={`px-5 py-3 rounded-xl border font-mono text-sm transition ${answers[currentQ] === value ? 'bg-[#D4AF37]/25 border-[#D4AF37] text-[#D4AF37]' : 'bg-white/5 border-white/20 text-[#F1F1E6]/80 hover:border-[#D4AF37]/50'}`}
          >
            {value} {CONSTELLATION_SCALE_LABELS[value] ? `— ${CONSTELLATION_SCALE_LABELS[value]}` : ''}
          </button>
        ))}
      </div>
      {onBack && <button type="button" onClick={onBack} className="block mt-6 text-[#D4AF37]/80 text-sm hover:text-[#D4AF37]">← Abandonner et retourner</button>}
    </motion.div>
  );
}
