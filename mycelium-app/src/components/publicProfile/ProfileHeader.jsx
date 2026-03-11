import { motion } from 'framer-motion';
import { TOTEMS } from '../../data/totemData';

const MAISON_BORDER = {
  Racine: 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
  Efflorescence: 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
  Vide: 'border-slate-500/50 shadow-[0_0_20px_rgba(100,116,139,0.15)]',
};

export default function ProfileHeader({ profile, elementColor }) {
  const totemData = profile?.totem
    ? TOTEMS.find((t) => t.name === profile.totem || t.name.toLowerCase().includes((profile.totem || '').toLowerCase()))
    : null;
  const displayName = profile?.initiate_name || profile?.slug || 'Initié';
  const totemLabel = totemData?.name || profile?.totem || '';
  const hybridName = profile?.constellation_data?.hybrid?.name;
  const fullTitle = hybridName
    ? `${displayName} ${totemLabel ? `— ${totemLabel}` : ''} · Lignée ${hybridName}`
    : totemLabel
      ? `${displayName} — ${totemLabel}`
      : displayName;
  const maison = profile?.maison || '';
  const borderClass = MAISON_BORDER[maison] || 'border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]';
  const glowColor = elementColor || '#D4AF37';

  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative text-center pb-6"
    >
      <div className="relative inline-flex justify-center items-center mb-4">
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-60"
          style={{
            background: `radial-gradient(circle, ${glowColor}40 0%, transparent 70%)`,
            transform: 'scale(1.8)',
          }}
          aria-hidden
        />
        <div
          className="relative w-28 h-28 rounded-2xl border-2 flex items-center justify-center text-5xl bg-[#0d1211]/90 backdrop-blur-sm"
          style={{
            borderColor: `${glowColor}60`,
            boxShadow: `0 0 30px ${glowColor}30, inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}
        >
          {totemData ? (
            <span title={totemData.name}>{totemData.emoji}</span>
          ) : (
            <span className="text-[#D4AF37]/70" aria-hidden>✨</span>
          )}
        </div>
      </div>

      <h1 className="font-serif text-xl md:text-2xl font-bold text-[#F1F1E6] tracking-tight max-w-xl mx-auto leading-tight">
        {fullTitle}
      </h1>

      {maison && (
        <p
          className={`mt-3 inline-block px-4 py-1.5 rounded-full text-xs font-medium text-[#F1F1E6]/90 border-2 bg-white/5 backdrop-blur-sm ${borderClass}`}
        >
          Maison · {maison}
        </p>
      )}
    </motion.header>
  );
}
