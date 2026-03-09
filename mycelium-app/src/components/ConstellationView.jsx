import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, Download, Moon, Sparkles } from 'lucide-react';
import { useMonthlyAnalytics } from '../hooks/useMonthlyAnalytics';
import { getAlchemicalAdvice } from '../utils/alchemicalAdvice';
import QuestionnaireConstellation from './QuestionnaireConstellation';
import VueResonance from './VueResonance';
import { getResonanceArchives } from '../services/myceliumSave';

const POLE_NAMES = ['spore', 'ancrage', 'expansion', 'lyse', 'fructification', 'absorption', 'dormance'];

/** Carte du ciel 2D : 7 étoiles (pôles) reliées, positionnées en cercle. */
function SkyCanvas({ scores = [], accentColor = '#D4AF37', width = 320, height = 240 }) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;
  const points = POLE_NAMES.map((_, i) => {
    const angle = (i / POLE_NAMES.length) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), score: scores[i] ?? 0 };
  });

  return (
    <svg width={width} height={height} className="w-full max-w-md mx-auto" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="starGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="1" />
          <stop offset="70%" stopColor={accentColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Lignes entre étoiles (constellation) */}
      {points.map((p, i) => {
        const next = points[(i + 1) % points.length];
        return (
          <line
            key={`line-${i}`}
            x1={p.x}
            y1={p.y}
            x2={next.x}
            y2={next.y}
            stroke={accentColor}
            strokeOpacity="0.35"
            strokeWidth="1"
          />
        );
      })}
      {/* Étoiles */}
      {points.map((p, i) => (
        <g key={i} filter="url(#glow)">
          <circle
            cx={p.x}
            cy={p.y}
            r={6 + (p.score || 0) * 0.8}
            fill="url(#starGrad)"
            opacity={0.7 + (p.score || 0) * 0.03}
          />
          <circle cx={p.x} cy={p.y} r="3" fill={accentColor} />
        </g>
      ))}
    </svg>
  );
}

/**
 * L'Observatoire de la Constellation — Ciel de Sève, Lecture Astrale, recommandations alchimiques.
 * Centre de progression mensuel. Affiche le questionnaire Constellation si pas encore fait.
 */
export default function ConstellationView({ onBack, userId, profile, onConstellationComplete, lastResult, onResonanceComplete }) {
  const { profile: analyticsProfile, monthlyResonances, currentMonthResonance, baseScores, getTensionPole, loading, refetch } = useMonthlyAnalytics(userId);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showResonanceTest, setShowResonanceTest] = useState(false);
  const svgRef = useRef(null);

  const hasConstellationResult = !!profile?.constellation_result;
  const currentMonthYear = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();
  const hasResonanceThisMonth = !!currentMonthResonance;
  const displayResonances = monthlyResonances.length > 0 ? monthlyResonances : [];
  const selectedResonance = displayResonances[selectedMonthIndex] || currentMonthResonance;
  const monthScores = Array.isArray(selectedResonance?.scores) ? selectedResonance.scores : baseScores ?? [];
  const scoresForSky = monthScores.length >= 7 ? monthScores : (baseScores ?? Array(7).fill(3));

  const advice = getAlchemicalAdvice({
    baseScores: baseScores ?? [],
    monthScores: monthScores,
    totem: profile?.totem ?? analyticsProfile?.totem,
    cognitiveTitle: profile?.cognitive_title ?? analyticsProfile?.cognitive_title,
    dominantKey: profile?.cognitive_title,
  });

  const handleDownloadSky = () => {
    const wrapper = svgRef.current;
    if (!wrapper) return;
    const svg = wrapper.querySelector('svg');
    if (!svg) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const w = 640;
    const h = 480;
    canvas.width = w;
    canvas.height = h;
    const img = new Image();
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.fillStyle = '#070B0A';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const a = document.createElement('a');
      a.download = `carte-ciel-mycélium-${currentMonthYear}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  if (showResonanceTest) {
    return (
      <VueResonance
        onBack={() => setShowResonanceTest(false)}
        userId={userId}
        lastResult49={lastResult}
        onResonanceComplete={() => {
          refetch();
          setShowResonanceTest(false);
          onResonanceComplete?.();
        }}
      />
    );
  }

  if (showQuestionnaire || !hasConstellationResult) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
        <QuestionnaireConstellation
          onBack={hasConstellationResult ? () => setShowQuestionnaire(false) : onBack}
          userId={userId}
          onComplete={(payload) => {
            onConstellationComplete?.(payload);
            setShowQuestionnaire(false);
            refetch();
          }}
        />
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <p className="text-[#F1F1E6]/60">Chargement du ciel de sève...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-2xl md:text-3xl font-bold accent-color flex items-center gap-2">
          <Star className="w-8 h-8" />
          L&apos;Observatoire de la Constellation
        </h1>
        {onBack && (
          <button type="button" onClick={onBack} className="text-[var(--accent)]/80 text-sm hover:accent-color">
            ← Tableau de bord
          </button>
        )}
      </div>
      <p className="text-[#F1F1E6]/70 text-sm">
        Le Ciel de Sève reflète vos 7 clés. La Résonance du mois colore l&apos;aura de votre constellation.
      </p>

      {/* Carte du ciel 2D */}
      <section
        className="rounded-2xl border border-[var(--accent)]/30 bg-white/5 backdrop-blur-xl p-6 overflow-hidden"
        style={{ boxShadow: '0 0 40px rgba(212,175,55,0.08)' }}
      >
        <h2 className="font-serif text-lg font-bold accent-color mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Le Ciel de Sève
        </h2>
        <div ref={svgRef}>
          <SkyCanvas scores={scoresForSky} accentColor="var(--accent)" width={320} height={240} />
        </div>
        <p className="text-center text-[#F1F1E6]/50 text-xs mt-2">
          {selectedResonance?.month_year ? selectedResonance.month_year.replace('-', ' / ') : 'Profil de base'}
        </p>
      </section>

      {/* Curseur temporel — remonter le temps */}
      {displayResonances.length > 1 && (
        <section className="space-y-2">
          <label className="text-xs text-[#F1F1E6]/60 uppercase tracking-wider">Mois</label>
          <input
            type="range"
            min={0}
            max={displayResonances.length - 1}
            value={selectedMonthIndex}
            onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
          <div className="flex justify-between text-xs text-[#F1F1E6]/50">
            <span>{displayResonances[displayResonances.length - 1]?.month_year?.replace('-', ' / ') ?? '—'}</span>
            <span>{displayResonances[0]?.month_year?.replace('-', ' / ') ?? '—'}</span>
          </div>
        </section>
      )}

      {/* Lecture Astrale */}
      <section
        className="rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent)]/05 p-6 backdrop-blur-xl"
        style={{ boxShadow: '0 0 30px rgba(212,175,55,0.06)' }}
      >
        <h2 className="font-serif text-lg font-bold accent-color mb-4 flex items-center gap-2">
          <Moon className="w-5 h-5" />
          Lecture Astrale
        </h2>
        <p className="text-[#F1F1E6]/90 mb-3">{advice.stateOfSky}</p>
        <p className="text-[#F1F1E6]/80 mb-3">{advice.elementAdvice}</p>
        <p className="text-[var(--accent)]/90 italic text-sm mb-4">&ldquo;{advice.mantra}&rdquo;</p>
        <p className="text-[#F1F1E6]/70 text-sm">
          <strong>Action de Sève :</strong> {advice.action}
        </p>
        {advice.totemAdvice && (
          <p className="mt-4 pt-4 border-t border-[var(--accent)]/20 text-[#F1F1E6]/80 text-sm italic">
            Conseil du totem : {advice.totemAdvice}
          </p>
        )}
      </section>

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        {!hasResonanceThisMonth && (
          <button
            type="button"
            onClick={() => setShowResonanceTest(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30 transition"
          >
            <Sparkles className="w-5 h-5" />
            Lancer la Résonance du Cycle
          </button>
        )}
        <button
          type="button"
          onClick={handleDownloadSky}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium bg-[var(--accent)]/20 border border-[var(--accent)]/50 accent-color hover:bg-[var(--accent)]/30 transition"
        >
          <Download className="w-5 h-5" />
          Télécharger ma Carte du Ciel
        </button>
      </div>
    </motion.div>
  );
}
