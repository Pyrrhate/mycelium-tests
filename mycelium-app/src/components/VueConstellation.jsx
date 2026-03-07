import { motion } from 'framer-motion';
import QuestionnaireConstellation from './QuestionnaireConstellation';

/**
 * La Constellation — L'Horoscope des Courants de Sève (30 questions, état vibratoire).
 */
export default function VueConstellation({ onBack }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">
      <QuestionnaireConstellation onBack={onBack} />
    </motion.div>
  );
}
