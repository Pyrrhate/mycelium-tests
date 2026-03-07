import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon } from 'lucide-react';
import {
  RESONANCE_QUESTIONS,
  RESONANCE_SCALE,
  RESONANCE_SCALE_LABELS,
  getResonanceAverages,
  getDominantKeys,
  getNebulaCss,
  RESONANCE_KEYS,
} from '../data/resonanceCycle';
import { generateSeal } from '../utils/sealGenerator';
import { getCurrentMonthResonance, saveResonanceResult, getResonanceArchives, getLastIntelligenceResult } from '../services/myceliumSave';

const TOTAL = 28;

function getMonthYear() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}

function getDaysUntilNextResonance(createdAt) {
  if (!createdAt) return 0;
  const d = new Date(createdAt);
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const now = new Date();
  if (now >= next) return 0;
  return Math.ceil((next - now) / (1000 * 60 * 60 * 24));
}

function buildResonanceSummary(avgScores, lastResult49, dominantIntelligenceKey) {
  const dominant = getDominantKeys(avgScores);
  const k1 = RESONANCE_KEYS.find((k) => k.id === dominant[0]);
  const k2 = RESONANCE_KEYS.find((k) => k.id === dominant[1]);
  const identity = lastResult49?.hybrid?.name ? `Votre identité de base (${lastResult49.hybrid.name})` : 'Votre identité';
  let text = `${identity} entre en résonance avec les éléments ${k1?.element ?? ''} et ${k2?.element ?? ''} ce mois-ci. La clé ${k1?.name ?? ''} guide votre vision, tandis que ${k2?.name ?? ''} ancre votre action. Laissez la sève circuler entre ces deux pôles pour trouver l'équilibre du cycle.`;
  if (dominantIntelligenceKey === 'absorption') {
    text += " Votre intelligence Métal vous invite à structurer vos intuitions du mois par des listes et des schémas.";
  }
  return text;
}

export default function MonthlyResonanceTest({ userId, onBack, onComplete, lastResult49 }) {
  const [step, setStep] = useState('loading');
  const [currentResonance, setCurrentResonance] = useState(null);
  const [archives, setArchives] = useState([]);
  const [answers, setAnswers] = useState(Array(TOTAL).fill(undefined));
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!userId) {
      setStep('intro');
      return;
    }
    getCurrentMonthResonance(userId).then((data) => {
      setCurrentResonance(data);
      setStep(data ? 'locked' : 'intro');
    });
    getResonanceArchives(userId, 12).then(setArchives);
  }, [userId]);

  const progress = answers.filter((a) => a !== undefined && a !== null).length;
  const currentQ = typeof step === 'number' ? step : -1;
  const question = currentQ >= 0 && currentQ < TOTAL ? RESONANCE_QUESTIONS[currentQ] : '';
  const keyInfo = RESONANCE_KEYS[Math.floor(currentQ / 4)];

  const handleAnswer = async (value) => {
    const next = [...answers];
    next[currentQ] = value;
    setAnswers(next);
    if (currentQ + 1 >= TOTAL) {
      const avgScores = getResonanceAverages(next);
      const [d1, d2] = getDominantKeys(avgScores);
      const { sealId, svg } = generateSeal(d1, d2, 160);
      const nebulaCss = getNebulaCss(d1, d2);
      const dominantIntelligence = userId ? (await getLastIntelligenceResult(userId))?.dominant_key : null;
      const summary = buildResonanceSummary(avgScores, lastResult49, dominantIntelligence);
      setResult({ avgScores, dominantKeys: [d1, d2], sealId, sealSvg: svg, nebulaCss, summary });
      setStep('result');
      if (userId) {
        saveResonanceResult(userId, {
          month_year: getMonthYear(),
          scores: avgScores,
          resonance_summary: summary,
          seal_id: sealId,
          nebula_css: nebulaCss,
        }).then(() => onComplete?.());
      }
    } else {
      setStep(currentQ + 1);
    }
  };

  if (step === 'loading') {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-[#D4AF37]/80">Chargement du cycle…</p>
      </div>
    );
  }

  if (step === 'locked' && currentResonance) {
    const days = getDaysUntilNextResonance(currentResonance.created_at);
    const sealId = currentResonance.seal_id || 'spore_ancrage';
    const parts = sealId.split('_');
    const { svg } = generateSeal(parts[0], parts[1], 140);
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-serif text-2xl font-bold text-[#D4AF37] flex items-center gap-2">
          <Moon className="w-7 h-7" /> La Résonance du Cycle
        </h1>
        <div className="rounded-2xl border border-[#D4AF37]/30 bg-white/5 p-8 text-center" style={{ backdropFilter: 'blur(20px)' }}>
          <p className="text-[#F1F1E6]/90 mb-4">Votre sève est déjà synchronisée au cycle actuel.</p>
          <p className="text-[#D4AF37] font-medium mb-6">Prochaine résonance dans {days} jour{days > 1 ? 's' : ''}.</p>
          <div className="inline-block" dangerouslySetInnerHTML={{ __html: svg }} />
          {archives.length > 0 && <p className="text-[#F1F1E6]/60 text-sm mt-6">Consultez vos Archives des Cycles dans le tableau de bord.</p>}
        </div>
        {onBack && <button type="button" onClick={onBack} className="text-[#D4AF37]/80 text-sm hover:text-[#D4AF37]">← Retour au tableau de bord</button>}
      </motion.div>
    );
  }

  if (step === 'result' && result) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-serif text-2xl font-bold text-[#D4AF37]">Sceau du Mois débloqué</h1>
        <p className="text-[#F1F1E6]/80 text-sm">+400 XP de Sève</p>
        <div className="rounded-2xl border border-[#D4AF37]/40 p-8 text-center min-h-[320px] flex flex-col items-center justify-center" style={{ background: result.nebulaCss, backdropFilter: 'blur(20px)' }}>
          <div className="mb-6" dangerouslySetInnerHTML={{ __html: result.sealSvg }} />
          <p className="text-[#F1F1E6]/95 text-sm max-w-lg leading-relaxed">{result.summary}</p>
        </div>
        <p className="text-[#D4AF37]/70 text-xs">Cette Nébuleuse Mensuelle sera l'arrière-plan de votre profil public pendant les 30 prochains jours.</p>
        {onBack && <button type="button" onClick={onBack} className="px-4 py-2 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-sm hover:bg-[#D4AF37]/30">← Retour au tableau de bord</button>}
      </motion.div>
    );
  }

  if (step === 'intro') {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-serif text-2xl font-bold text-[#D4AF37] flex items-center gap-2"><Moon className="w-7 h-7" /> La Résonance du Cycle</h1>
        <p className="text-[#F1F1E6]/80 text-sm">28 questions (4 par clé) pour définir l'influence cosmique sur votre sève ce mois-ci. Une seule fois par mois. En finissant, vous débloquez votre <strong>Sceau du Mois</strong> et +400 XP.</p>
        <button type="button" onClick={() => setStep(0)} className="px-6 py-3 rounded-xl font-medium bg-[#D4AF37] text-[#070B0A] hover:bg-[#D4AF37]/90">Commencer la Résonance</button>
        {onBack && <button type="button" onClick={onBack} className="block mt-4 text-[#D4AF37]/80 text-sm hover:text-[#D4AF37]">← Retour au tableau de bord</button>}
      </motion.div>
    );
  }

  return (
    <motion.div key={currentQ} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center text-[#D4AF37]/80 text-sm">
        <span>Question {currentQ + 1} / {TOTAL}</span>
        {keyInfo && <span>{keyInfo.name} — {keyInfo.element}</span>}
      </div>
      <div className="flex gap-1 mb-6">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < progress ? 'bg-[#D4AF37]/80' : i === currentQ ? 'bg-[#D4AF37]/40' : 'bg-white/10'}`} />
        ))}
      </div>
      <h2 className="font-serif text-xl font-bold text-[#F1F1E6] leading-snug">{question}</h2>
      <div className="flex flex-wrap gap-3">
        {RESONANCE_SCALE.map((value) => (
          <button key={value} type="button" onClick={() => handleAnswer(value)} className={`px-5 py-3 rounded-xl border font-mono text-sm transition ${answers[currentQ] === value ? 'bg-[#D4AF37]/25 border-[#D4AF37] text-[#D4AF37]' : 'bg-white/5 border-white/20 text-[#F1F1E6]/80 hover:border-[#D4AF37]/50'}`}>
            {value} {RESONANCE_SCALE_LABELS[value] ? `— ${RESONANCE_SCALE_LABELS[value]}` : ''}
          </button>
        ))}
      </div>
      {onBack && <button type="button" onClick={onBack} className="block mt-6 text-[#D4AF37]/80 text-sm hover:text-[#D4AF37]">← Abandonner et retourner</button>}
    </motion.div>
  );
}
