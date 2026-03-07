import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import IntelligenceMatrixTest from './IntelligenceMatrixTest';

/**
 * V6 — Matrice d'Intelligence : 28 questions, Carte Neuronale, Titre Cognitif, Capacité de Maillage.
 */
export default function VueMatriceIntelligence({ onBack, userId, onMatriceComplete }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">
      <IntelligenceMatrixTest userId={userId} onBack={onBack} onComplete={onMatriceComplete} />
    </motion.div>
  );
}
