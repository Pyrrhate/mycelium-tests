import { useState } from 'react';
import { motion } from 'framer-motion';
import { TOTEMS, TOTEM_QUESTIONS, computeTotemFromScores } from '../data/totemData';
import { saveTotem } from '../services/myceliumSave';

const TOTEM_INDEX_BY_ID = Object.fromEntries(TOTEMS.map((t, i) => [t.id, i]));

function scoresFromChoices(choices) {
  const s = TOTEMS.map(() => 0);
  choices.forEach((totemId) => {
    if (totemId) {
      const idx = TOTEM_INDEX_BY_ID[totemId];
      if (idx !== undefined) s[idx]++;
    }
  });
  return s;
}

export default function QuestionnaireTotem({ onBack, onComplete, poleAverages, userId, savedTotemName }) {
  const [step, setStep] = useState('intro'); // 'intro' | 0..27 | 'result'
  const [choices, setChoices] = useState(() => Array(TOTEM_QUESTIONS.length).fill(null));

  const questionIndex = typeof step === 'number' ? step : -1;
  const answeredCount = choices.filter(Boolean).length;

  const handleStart = () => {
    setChoices(Array(TOTEM_QUESTIONS.length).fill(null));
    setStep(0);
  };

  const handleChoice = (totemId) => {
    setChoices((prev) => {
      const next = [...prev];
      next[questionIndex] = totemId;
      return next;
    });
    if (questionIndex < TOTEM_QUESTIONS.length - 1) setStep(questionIndex + 1);
    else setStep('result');
  };

  const totemScores = scoresFromChoices(choices);

  const handleResultDone = async (totem) => {
    await saveTotem(totem.name, userId);
    if (onComplete) onComplete(totem);
    if (onBack) onBack();
  };

  if (step === 'intro') {
    const savedTotem = savedTotemName ? TOTEMS.find((t) => t.name === savedTotemName) : null;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-xl mx-auto text-center py-8"
      >
        <h2 className="font-serif text-2xl font-bold text-[#D4AF37] mb-2">
          Mon Totem — Bestiaire Alchimique
        </h2>
        {savedTotem ? (
          <>
            <p className="text-[#F1F1E6]/80 text-sm mb-4">Votre totem actuel</p>
            <div
              className="rounded-2xl border-2 p-6 mb-6 mx-auto max-w-md"
              style={{
                borderColor: savedTotem.color,
                background: `${savedTotem.color}15`,
                boxShadow: `0 0 24px ${savedTotem.color}40`,
              }}
            >
              <span className="text-5xl block mb-2">{savedTotem.emoji}</span>
              <p className="font-serif text-xl font-bold" style={{ color: savedTotem.color }}>
                {savedTotem.name}
              </p>
              <p className="text-[#F1F1E6]/70 text-xs uppercase tracking-wider mt-1">{savedTotem.element}</p>
              <p className="text-[#F1F1E6]/90 text-sm mt-4 italic">&ldquo;{savedTotem.mantra}&rdquo;</p>
            </div>
            <button
              type="button"
              onClick={handleStart}
              className="px-6 py-3 rounded-xl font-medium bg-white/10 border border-[#D4AF37]/40 text-[#F1F1E6] hover:bg-[#D4AF37]/20 transition"
            >
              Refaire le questionnaire
            </button>
          </>
        ) : (
          <>
            <p className="text-[#F1F1E6]/80 text-sm mb-6">
              28 questions à deux choix. Chaque réponse affine votre animal totem parmi les 7 du Réseau.
              En cas d'égalité, votre profil des 49 Racines départage.
            </p>
            <button
              type="button"
              onClick={handleStart}
              className="px-6 py-3 rounded-xl font-medium bg-[#D4AF37] text-[#070B0A] hover:bg-[#D4AF37]/90 transition"
            >
              Découvrir mon totem
            </button>
          </>
        )}
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
    const totem = computeTotemFromScores(totemScores, poleAverages);
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-xl mx-auto py-8 text-center"
      >
        <h2 className="font-serif text-2xl font-bold text-[#D4AF37] mb-2">Votre totem</h2>
        <div
          className="rounded-2xl border-2 p-6 mb-6 mx-auto max-w-md"
          style={{
            borderColor: totem.color,
            background: `${totem.color}15`,
            boxShadow: `0 0 24px ${totem.color}40`,
          }}
        >
          <span className="text-5xl block mb-2">{totem.emoji}</span>
          <p className="font-serif text-xl font-bold" style={{ color: totem.color }}>
            {totem.name}
          </p>
          <p className="text-[#F1F1E6]/70 text-xs uppercase tracking-wider mt-1">{totem.element}</p>
          <p className="text-[#F1F1E6]/90 text-sm mt-4 italic">&ldquo;{totem.mantra}&rdquo;</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => handleResultDone(totem)}
            className="px-6 py-3 rounded-xl font-medium bg-[#D4AF37] text-[#070B0A] hover:bg-[#D4AF37]/90"
          >
            Enregistrer et retour au Hub
          </button>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-[#F1F1E6] text-sm hover:bg-white/20"
            >
              Retour sans enregistrer
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  const q = TOTEM_QUESTIONS[questionIndex];
  if (!q) return null;

  return (
    <motion.div
      key={questionIndex}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-xl mx-auto py-6"
    >
      <p className="text-[#D4AF37]/80 text-xs uppercase tracking-wider mb-2">
        Question {questionIndex + 1} / {TOTEM_QUESTIONS.length}
      </p>
      <p className="text-[#F1F1E6]/70 text-sm mb-2">Réponses : {answeredCount} / 28</p>
      <h3 className="font-serif text-lg text-[#F1F1E6] mb-6">{q.text}</h3>
      <div className="flex flex-col gap-3">
        {q.options.map((opt) => (
          <button
            key={opt.totemId}
            type="button"
            onClick={() => handleChoice(opt.totemId)}
            className="text-left px-5 py-4 rounded-xl border border-[#D4AF37]/30 bg-white/5 hover:bg-[#D4AF37]/15 hover:border-[#D4AF37]/50 text-[#F1F1E6] transition"
          >
            {opt.label}
          </button>
        ))}
      </div>
      {questionIndex > 0 && (
        <button
          type="button"
          onClick={() => setStep(questionIndex - 1)}
          className="mt-4 text-[#F1F1E6]/60 text-sm hover:text-[#F1F1E6]"
        >
          ← Question précédente
        </button>
      )}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="block mt-2 text-[#F1F1E6]/50 text-sm hover:text-[#F1F1E6]"
        >
          Retour au Hub
        </button>
      )}
    </motion.div>
  );
}
