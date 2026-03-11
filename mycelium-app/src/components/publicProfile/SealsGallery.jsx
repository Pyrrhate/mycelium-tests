import { motion } from 'framer-motion';
import { SEALS_MASTERY, SEAL_ORDER } from '../../data/sealsMastery';

export default function SealsGallery({ unlockedSeals }) {
  const unlocked = Array.isArray(unlockedSeals) ? unlockedSeals : [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
      style={{
        boxShadow: '0 0 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <h2 className="text-xs uppercase tracking-widest text-[#D4AF37]/80 font-mono mb-4">
        Hauts Faits de Sève
      </h2>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
        {SEAL_ORDER.map((id, i) => {
          const seal = SEALS_MASTERY[id];
          const isUnlocked = unlocked.includes(id);
          const color = seal?.color ?? '#D4AF37';

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              className={`flex flex-col items-center rounded-xl border-2 p-3 transition-all ${
                isUnlocked ? '' : 'opacity-40 grayscale'
              }`}
              style={{
                borderColor: isUnlocked ? `${color}80` : 'rgba(255,255,255,0.15)',
                boxShadow: isUnlocked ? `0 0 16px ${color}40` : 'none',
                background: isUnlocked ? `${color}08` : 'rgba(0,0,0,0.2)',
              }}
              title={seal ? `${seal.name} — ${seal.mastery}` : id}
            >
              <span
                className={`text-2xl font-bold ${isUnlocked ? '' : 'text-white/30'}`}
                style={isUnlocked ? { color, textShadow: `0 0 12px ${color}80` } : {}}
              >
                {isUnlocked ? '◆' : '◇'}
              </span>
              <p className="text-[10px] text-center mt-1 text-[#F1F1E6]/70 line-clamp-2">
                {seal?.name ?? id}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
