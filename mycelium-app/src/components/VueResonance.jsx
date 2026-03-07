import { motion } from 'framer-motion';
import { Moon } from 'lucide-react';
import MonthlyResonanceTest from './MonthlyResonanceTest';

/**
 * V6 — La Résonance du Cycle : test mensuel 28 questions, Sceau du Mois, +400 XP.
 */
export default function VueResonance({ onBack, userId, lastResult49, onResonanceComplete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <MonthlyResonanceTest
        userId={userId}
        onBack={onBack}
        onComplete={onResonanceComplete}
        lastResult49={lastResult49}
      />
    </motion.div>
  );
}
