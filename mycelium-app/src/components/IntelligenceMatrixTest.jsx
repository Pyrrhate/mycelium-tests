import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import {
  INTELLIGENCE_QUESTIONS,
  INTELLIGENCE_SCALE,
  INTELLIGENCE_SCALE_LABELS,
  INTELLIGENCE_POLES,
  getIntelligenceAverages,
  getDominantIntelligence,
  getCapaciteMaillage,
  COGNITIVE_TITLES,
} from '../data/intelligenceMatrix';
import CarteNeuronale from './CarteNeuronale';
import { saveIntelligenceResult } from '../services/myceliumSave';

const TOTAL = 28;

export default function IntelligenceMatrixTest({ userId, onBack, onComplete }) {
  const [step, setStep] = useState('intro');
  const [answers, setAnswers] = useState(Array(TOTAL).fill(undefined));
  const [result, setResult] = useState(null);

  const progress = answers.filter((a) => a !== undefined && a !== null).length;
  const currentQ = typeof step === 'number' ? step : -1;
  const question = currentQ >= 0 && currentQ < TOTAL ? INTELLIGENCE_QUESTIONS[currentQ] : '';
  const poleInfo = INTELLIGENCE_POLES[Math.floor(currentQ / 4)];

  const handleAnswer = (value) => {
    const next = [...answers];
    next[currentQ] = value;
    setAnswers(next);
    if (currentQ + 1 >= TOTAL) {
      const avgScores = getIntelligenceAverages(next);
      const dominantKey = getDominantIntelligence(avgScores);
      const capacite = getCapaciteMaillage(avgScores);
      const cognitiveTitle = COGNITIVE_TITLES[dominantKey] ?? 'Le Réseau';
      setResult({
        avgScores,
        dominantKey,
        cognitiveTitle,
        capaciteMaillage: capacite,
      });
      setStep('result');
      if (userId) {
        saveIntelligenceResult(userId, {
          scores: avgScores,
          dominant_key: dominantKey,
          cognitive_title: cognitiveTitle,
          capacite_maillage: capacite,
        }).then(() => onComplete?.());
      }
    } else {
      setStep(currentQ + 1);
    }
  };

  if (step === 'intro') {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-serif text-2xl font-bold text-[#D4AF37] flex items-center gap-2">
          <Brain className="w-7 h-7" />
          La Matrice des Intelligences
        </h1>
        <p className="text-[#F1F1E6]/80 text-sm">
          28 questions (4 par pôle) basées sur les intelligences multiples de Gardner, traduites en clés Mycélium.
          Débloquez votre <strong>Carte Neuronale</strong> et votre <strong>Capacité de Maillage</strong> (+300 XP).
        </p>
        <button type="button" onClick={() => setStep(0)} className="px-6 py-3 rounded-xl font-medium bg-[#D4AF37] text-[#070B0A] hover:bg-[#D4AF37]/90">
          Commencer le diagnostic
        </button>
        {onBack && <button type="button" onClick={onBack} className="block mt-4 text-[#D4AF37]/80 text-sm hover:text-[#D4AF37]">← Retour au tableau de bord</button>}
      </motion.div>
    );
  }

  if (step === 'result' && result) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-serif text-2xl font-bold text-[#D4AF37]">Câblage Neuronal</h1>
        <p className="text-[#F1F1E6]/80 text-sm">+300 XP de Sève</p>
        <div className="rounded-2xl border border-[#D4AF37]/30 bg-white/5 p-6" style={{ backdropFilter: 'blur(20px)' }}>
          <p className="text-[#D4AF37] font-mono text-sm uppercase tracking-wider mb-2">Titre cognitif</p>
          <p className="font-serif text-xl font-bold text-[#F1F1E6] mb-6">{result.cognitiveTitle}</p>
          <CarteNeuronale scores={result.avgScores} />
          <div className="mt-6 pt-4 border-t border-[#D4AF37]/20">
            <p className="text-[#D4AF37]/90 text-sm">
              Capacité de Maillage : <strong className="text-[#D4AF37]">{result.capaciteMaillage}</strong>/100
            </p>
            <p className="text-[#F1F1E6]/60 text-xs mt-1">Cette statistique est affichée sur votre profil public.</p>
          </div>
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
        {poleInfo && <span>{poleInfo.name.replace(/Intelligence /, '')} — {poleInfo.element}</span>}
      </div>
      <div className="flex gap-1 mb-6">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < progress ? 'bg-[#D4AF37]/80' : i === currentQ ? 'bg-[#D4AF37]/40' : 'bg-white/10'}`} />
        ))}
      </div>
      <h2 className="font-serif text-xl font-bold text-[#F1F1E6] leading-snug">{question}</h2>
      <div className="flex flex-wrap gap-3">
        {INTELLIGENCE_SCALE.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleAnswer(value)}
            className={`px-5 py-3 rounded-xl border font-mono text-sm transition ${answers[currentQ] === value ? 'bg-[#D4AF37]/25 border-[#D4AF37] text-[#D4AF37]' : 'bg-white/5 border-white/20 text-[#F1F1E6]/80 hover:border-[#D4AF37]/50'}`}
          >
            {value} {INTELLIGENCE_SCALE_LABELS[value] ? `— ${INTELLIGENCE_SCALE_LABELS[value]}` : ''}
          </button>
        ))}
      </div>
      {onBack && <button type="button" onClick={onBack} className="block mt-6 text-[#D4AF37]/80 text-sm hover:text-[#D4AF37]">← Abandonner et retourner</button>}
    </motion.div>
  );
}
