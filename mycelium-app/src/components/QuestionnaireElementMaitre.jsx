import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import {
  ELEMENT_TEST,
  getFlatElementQuestions,
  ELEMENT_SCALE,
  ELEMENT_SCALE_LABELS,
  getElementScores,
  getDominantElement,
  getInitieElementLabel,
} from '../data/elementQuestions';
import ParticlesElement from './ParticlesElement';

const TOTAL = 21;
const flatQuestions = getFlatElementQuestions();

export default function QuestionnaireElementMaitre({ onBack, userId, onComplete }) {
  const [step, setStep] = useState('intro');
  const [answers, setAnswers] = useState(Array(TOTAL).fill(undefined));
  const [result, setResult] = useState(null);

  const progress = answers.filter((a) => a !== undefined && a !== null).length;
  const currentQ = typeof step === 'number' ? step : -1;
  const currentItem = currentQ >= 0 && currentQ < TOTAL ? flatQuestions[currentQ] : null;
  const currentKey = currentItem?.key;
  const currentColor = currentKey ? ELEMENT_TEST.labels[currentKey]?.color : '#D4AF37';

  const handleAnswer = (value) => {
    const next = [...answers];
    next[currentQ] = value;
    setAnswers(next);
    if (currentQ + 1 >= TOTAL) {
      const scores = getElementScores(next);
      const dominant = getDominantElement(scores);
      setResult({ scores, dominant });
      setStep('result');
      if (onComplete) onComplete(dominant);
    } else {
      setStep(currentQ + 1);
    }
  };

  if (step === 'intro') {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6 relative">
        <h1 className="font-serif text-2xl font-bold text-[#D4AF37] flex items-center gap-2">
          <Flame className="w-7 h-7" />
          {ELEMENT_TEST.name}
        </h1>
        <p className="text-[#F1F1E6]/80 text-sm">
          21 questions (3 par élément) pour révéler votre <strong>élément primordial</strong> — l'essence de votre sève.
          Il définira la couleur d'accentuation de tout le site.
        </p>
        <button type="button" onClick={() => setStep(0)} className="px-6 py-3 rounded-xl font-medium bg-[#D4AF37] text-[#070B0A] hover:bg-[#D4AF37]/90">
          Révéler mon élément
        </button>
        {onBack && <button type="button" onClick={onBack} className="block mt-4 text-[#D4AF37]/80 text-sm hover:text-[#D4AF37]">← Retour au tableau de bord</button>}
      </motion.div>
    );
  }

  if (step === 'result' && result) {
    const { dominant } = result;
    const label = getInitieElementLabel(dominant.id);
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-serif text-2xl font-bold text-[#D4AF37]">Votre essence</h1>
        <div
          className="rounded-2xl border p-6"
          style={{
            borderColor: `${dominant.color}40`,
            background: `linear-gradient(135deg, ${dominant.color}15, transparent)`,
            backdropFilter: 'blur(20px)',
          }}
        >
          <p className="font-mono text-xs uppercase tracking-wider mb-2" style={{ color: dominant.color }}>
            Élément primordial
          </p>
          <p className="font-serif text-xl font-bold text-[#F1F1E6] mb-1">{dominant.element} — {dominant.key}</p>
          <p className="text-[#F1F1E6]/90 text-lg font-medium mb-2" style={{ color: dominant.color }}>{label}</p>
          <p className="text-[#F1F1E6]/70 text-sm">La couleur d'accent du site a été mise à jour selon votre élément.</p>
        </div>
        {onBack && (
          <button type="button" onClick={onBack} className="px-4 py-2 rounded-lg border text-sm hover:opacity-90 transition" style={{ borderColor: `${dominant.color}60`, color: dominant.color, background: `${dominant.color}15` }}>
            ← Retour au tableau de bord
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div key={currentQ} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto space-y-6 relative min-h-[280px]">
      <ParticlesElement elementKey={currentKey} color={currentColor} />
      <div className="relative z-10">
        <div className="flex justify-between items-center text-sm mb-2" style={{ color: currentColor }}>
          <span>Question {currentQ + 1} / {TOTAL}</span>
          {currentKey && (
            <span>{ELEMENT_TEST.labels[currentKey]?.element} — {ELEMENT_TEST.labels[currentKey]?.key}</span>
          )}
        </div>
        <div className="flex gap-1 mb-6">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-colors"
              style={{
                background: i < progress ? `${currentColor}99` : i === currentQ ? `${currentColor}50` : 'rgba(255,255,255,0.1)',
              }}
            />
          ))}
        </div>
        <h2 className="font-serif text-xl font-bold text-[#F1F1E6] leading-snug mb-6">{currentItem?.question}</h2>
        <div className="flex flex-wrap gap-3">
          {ELEMENT_SCALE.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleAnswer(value)}
              className={`px-4 py-2.5 rounded-xl border font-mono text-sm transition ${answers[currentQ] === value ? 'border-current' : 'border-white/20 text-[#F1F1E6]/80 hover:border-white/40'}`}
              style={answers[currentQ] === value ? { background: `${currentColor}25`, color: currentColor, borderColor: currentColor } : {}}
            >
              {value} — {ELEMENT_SCALE_LABELS[value]}
            </button>
          ))}
        </div>
        {onBack && <button type="button" onClick={onBack} className="block mt-6 text-[#F1F1E6]/50 text-sm hover:text-[#F1F1E6]/80">← Abandonner et retourner</button>}
      </div>
    </motion.div>
  );
}
