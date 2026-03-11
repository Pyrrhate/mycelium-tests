import { motion } from 'framer-motion';
import { Link2 } from 'lucide-react';

/**
 * Bouton "Proposer un Maillage" pour les visiteurs — pulsation lumineuse (Framer Motion).
 */
export default function MaillageButton({ onClick, disabled, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="flex justify-center pt-4"
    >
      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className="relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-serif font-semibold text-[#070B0A] bg-[#D4AF37] border-2 border-[#D4AF37] overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:ring-offset-2 focus:ring-offset-[#070B0A]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(212,175,55,0.4)',
            '0 0 40px rgba(212,175,55,0.6)',
            '0 0 20px rgba(212,175,55,0.4)',
          ],
        }}
        transition={{
          boxShadow: { repeat: Infinity, duration: 2 },
        }}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" aria-hidden />
        <Link2 className="w-5 h-5 relative z-10" />
        <span className="relative z-10">
          {loading ? 'Envoi en cours…' : 'Proposer un Maillage'}
        </span>
      </motion.button>
    </motion.div>
  );
}
