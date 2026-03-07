import { motion } from 'framer-motion';
import QuestionnaireElementMaitre from './QuestionnaireElementMaitre';

/**
 * V6 — L'Élément Primordial (L'Essence de la Sève).
 * 21 questions, élément dominant → couleur d'accent du site (variables CSS --accent).
 */
export default function VueElementMaitre({ onBack, userId, onElementComplete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <QuestionnaireElementMaitre
        onBack={onBack}
        userId={userId}
        onComplete={onElementComplete}
      />
    </motion.div>
  );
}
