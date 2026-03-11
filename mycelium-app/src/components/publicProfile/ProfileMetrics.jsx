import { motion } from 'framer-motion';

export default function ProfileMetrics({ rank, xpProgress, xpSeve, qm, symbiosePoints }) {
  const widthPct = xpProgress?.needed ? (xpProgress.current / xpProgress.needed) * 100 : 100;
  const boxStyle = { boxShadow: '0 0 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)' };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
    >
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 min-h-[88px] flex flex-col" style={boxStyle}>
        <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/80 font-mono mb-1">Rang & XP</p>
        <p className="font-serif font-semibold text-[#F1F1E6] text-lg">{rank?.label ?? '-'}</p>
        {xpProgress?.needed != null && (
          <div className="mt-2 w-full">
            <div className="h-1.5 rounded-full bg-[#0d1211] border border-[#D4AF37]/20 overflow-hidden">
              <motion.div className="h-full bg-[#D4AF37]/80 rounded-full" initial={{ width: 0 }} animate={{ width: `${widthPct}%` }} transition={{ duration: 0.6 }} />
            </div>
            <p className="text-[10px] text-[#F1F1E6]/50 mt-1">{xpSeve ?? 0} XP{xpProgress?.nextLabel ? ` → ${xpProgress.nextLabel}` : ''}</p>
          </div>
        )}
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 min-h-[88px] flex flex-col" style={boxStyle}>
        <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/80 font-mono mb-1">Quotient Mycélien</p>
        <p className="font-serif font-semibold text-[#F1F1E6] text-lg">{qm != null ? qm + '/100' : '-'}</p>
        {qm != null && <p className="text-[10px] text-[#F1F1E6]/50 mt-1">{qm >= 70 ? 'Harmonie' : qm >= 40 ? 'Équilibre' : 'Spécialisation'}</p>}
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 min-h-[88px] flex flex-col" style={boxStyle}>
        <p className="text-[10px] uppercase tracking-widest text-[#D4AF37]/80 font-mono mb-1">Points de Symbiose</p>
        <p className="font-serif font-semibold text-[#F1F1E6] text-lg">{symbiosePoints != null ? symbiosePoints : '-'}</p>
        <p className="text-[10px] text-[#F1F1E6]/50 mt-1">Échange</p>
      </div>
    </motion.section>
  );
}
