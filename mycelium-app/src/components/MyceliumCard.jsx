import { useState } from 'react';
import { motion } from 'framer-motion';
import { generateCardStats, getRarity, RARITY_LABELS, RARITY_COLORS } from '../data/cardEngine';
import { CONSTELLATION_POLES } from '../data/constellation';

/**
 * Carte Mycélium TCG — effet verre bioluminescent, bordure rareté, 7 pôles, mantra.
 * Flip au clic pour révéler le "câblage neuronal" (profil d'intelligence).
 */
export default function MyceliumCard({ profile, onClick, className = '' }) {
  const [flipped, setFlipped] = useState(false);
  const stats = generateCardStats(profile || {});
  const rarity = stats.rarity ?? getRarity(profile || {});
  const isLegendary = rarity === 'legendary';

  const poleColors = [
    '#87CEEB', '#8B4513', '#4682B4', '#CD5C5C', '#228B22', '#708090', '#9370DB',
  ];
  const poleAverages = profile?.poleAverages ?? profile?.constellationData?.poleAverages ?? Array(7).fill(0);
  const poleValues = poleAverages.map((v) => Math.max(0, Math.min(1, (Number(v) + 2) / 4)));

  const handleClick = () => {
    if (onClick) onClick();
    else setFlipped((f) => !f);
  };

  return (
    <motion.div
      className={`relative w-56 aspect-[3/4] cursor-pointer ${className}`}
      style={{ perspective: '1000px' }}
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Face avant */}
        <motion.div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(212,175,55,0.35)',
            boxShadow: isLegendary
              ? '0 0 40px rgba(212,175,55,0.25), 0 0 80px rgba(230,57,70,0.1), inset 0 1px 0 rgba(255,255,255,0.08)'
              : `0 0 30px ${RARITY_COLORS[rarity]}40, inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
          whileHover={{
            boxShadow: isLegendary
              ? '0 0 50px rgba(212,175,55,0.4), 0 0 100px rgba(230,57,70,0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
              : `0 0 40px ${RARITY_COLORS[rarity]}60, inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}
        >
          {/* Header */}
          <div className="p-3 border-b border-white/10">
            <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/90 font-mono">
              {RARITY_LABELS[rarity]}
            </p>
            <p className="font-serif text-lg font-bold text-[#F1F1E6] truncate" style={{ textShadow: '0 0 20px rgba(212,175,55,0.3)' }}>
              {stats.initiateName}
            </p>
          </div>

          {/* Avatar Totem */}
          <div className="flex justify-center py-4">
            <div
              className="w-20 h-20 rounded-xl border flex items-center justify-center text-4xl"
              style={{
                borderColor: `${stats.elementColor}50`,
                background: `linear-gradient(135deg, ${stats.elementColor}20, transparent)`,
              }}
            >
              {stats.totem?.emoji ?? '✨'}
            </div>
          </div>

          {/* 7 pôles (mini barres ou hexagones) */}
          <div className="px-3 flex flex-wrap gap-1 justify-center">
            {CONSTELLATION_POLES.map((pole, i) => (
              <div
                key={pole.id}
                className="w-6 h-6 rounded-lg border flex items-center justify-center text-[10px] font-mono font-bold"
                style={{
                  borderColor: `${poleColors[i]}60`,
                  background: `linear-gradient(180deg, ${poleColors[i]}${Math.round((poleValues[i] ?? 0) * 40 + 10).toString(16).padStart(2, '0')}, transparent)`,
                  color: poleColors[i],
                }}
                title={`${pole.name}: ${Math.round((poleValues[i] ?? 0) * 100)}%`}
              >
                {Math.round((poleValues[i] ?? 0) * 10)}
              </div>
            ))}
          </div>

          {/* Stats Attaque / Défense / Sève */}
          <div className="px-3 py-2 flex justify-between text-xs font-mono text-[#F1F1E6]/80">
            <span>ATQ {stats.attack}</span>
            <span>DEF {stats.defense}</span>
            <span className="accent-color">{stats.seveCost} Sève</span>
          </div>

          {/* Mantra */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 bg-black/20">
            <p className="text-[10px] text-[#D4AF37]/90 italic leading-tight line-clamp-2">
              &ldquo;{stats.mantra}&rdquo;
            </p>
          </div>
        </motion.div>

        {/* Face arrière — Câblage neuronal (placeholder) */}
        <motion.div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(145deg, rgba(15,23,42,0.95), rgba(7,11,10,0.98))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148,163,184,0.2)',
          }}
        >
          <div className="p-4 h-full flex flex-col items-center justify-center text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono mb-2">Câblage neuronal</p>
            <p className="text-slate-300 text-xs">Profil d&apos;intelligence</p>
            <p className="text-slate-500 text-[10px] mt-2">(Matrice à lier)</p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
