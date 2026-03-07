import { motion } from 'framer-motion';

export default function WelcomeScreen({ onStart }) {
  return (
    <motion.div
      className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 md:p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="glass rounded-2xl p-8 md:p-12 max-w-xl w-full text-center animate-breathe">
        <motion.h1
          className="font-serif text-4xl md:text-5xl font-bold text-bone mb-2"
          style={{ fontFamily: "var(--font-serif)" }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Mycélium
        </motion.h1>
        <motion.p
          className="text-mycelium-gold text-lg md:text-xl tracking-wide mb-6"
          style={{ fontFamily: "var(--font-mono)" }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          The Self-Growth Network
        </motion.p>
        <motion.p
          className="text-bone/80 text-sm md:text-base mb-10 leading-relaxed"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Évaluez votre équilibre intérieur à travers sept pôles représentés par des créatures hybrides.
          Un test honnête et analytique.
        </motion.p>
        <motion.button
          onClick={onStart}
          className="px-8 py-4 rounded-xl font-semibold text-abyssal bg-mycelium-gold hover:bg-mycelium-gold/90 transition-all duration-500 glow-gold"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.65 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Commencer le test
        </motion.button>
      </div>
    </motion.div>
  );
}
