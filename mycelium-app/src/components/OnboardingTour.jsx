import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { updateProfile } from '../services/myceliumSave';

const STEPS = [
  {
    id: 'welcome',
    target: 'dashboard',
    title: 'Bienvenue au Hub',
    body: (name) => `${name || 'Initié'}, votre sève commence à couler ici. C'est votre centre de commande.`,
  },
  {
    id: 'parcours',
    target: 'questionnaires',
    title: 'Les 49 Racines',
    body: () => "C'est ici que tout commence. Votre premier test définit la structure de votre âme.",
  },
  {
    id: 'totem',
    target: 'questionnaires',
    title: 'Le Totem',
    body: () => "Une fois vos racines ancrées, votre animal totem se révélera à vous.",
  },
  {
    id: 'foret',
    target: 'foret',
    title: 'La Forêt',
    body: () => "Ici, vous pourrez voir les autres initiés, mais seulement quand votre sève sera assez forte.",
  },
  {
    id: 'xp',
    target: 'xp',
    title: "L'Évolution",
    body: () => "Surveillez cette barre. Chaque action vous fait gagner de l'XP et monter en grade dans la hiérarchie de la forêt.",
  },
];

const EVEIL_MESSAGE = (name) => `
L'Éveil de la Spore est accompli.

${name || 'Guillaume'}, vos racines ont touché le substrat. Vous n'êtes plus un étranger pour la forêt, mais une partie de son maillage invisible.

Votre voyage commence maintenant :
• Ancrez-vous en complétant vos 49 Racines.
• Éclosez en découvrant votre Totem.
• Résonnez chaque jour dans votre journal pour faire monter votre sève.

Que votre croissance suive la géométrie sacrée.
`;

/**
 * Tour guidé "Les Éclats de Sève" — s'affiche si !has_completed_onboarding.
 * Glassmorphism, Framer Motion, overlay. Dernière étape = modal Éveil + "Entrer dans la Clairière".
 */
export default function OnboardingTour({
  show,
  userId,
  userDisplayName,
  onComplete,
  onSkip,
  onGoToStep,
  currentView,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [showEveilModal, setShowEveilModal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [particles, setParticles] = useState(false);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  useEffect(() => {
    if (show && step && onGoToStep && step.target !== 'xp') {
      onGoToStep(step.target);
    }
  }, [show, stepIndex, step?.target, onGoToStep]);

  const handleNext = () => {
    if (isLast) {
      setShowEveilModal(true);
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleEnterClairiere = async () => {
    if (!userId || completing) return;
    setCompleting(true);
    setParticles(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('xp_seve').eq('id', userId).single();
      const xp = (profile?.xp_seve ?? 0) + 50;
      await updateProfile(userId, { has_completed_onboarding: true, xp_seve: xp });
      setShowEveilModal(false);
      onComplete?.();
    } catch (e) {
      console.warn('Onboarding complete error', e);
    }
    setCompleting(false);
  };

  const handleSkip = () => {
    setShowEveilModal(false);
    setStepIndex(0);
    onSkip?.();
  };

  if (!show) return null;

  return (
    <>
      <AnimatePresence>
        {!showEveilModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={handleSkip}
              aria-hidden
            />
            <motion.div
              key={step?.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md mx-4 rounded-2xl border border-[var(--accent)]/40 bg-white/5 backdrop-blur-xl p-6 shadow-2xl"
              style={{ boxShadow: '0 0 60px rgba(212,175,55,0.15)' }}
            >
              <div className="absolute top-3 right-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="p-1.5 rounded-lg text-[#F1F1E6]/50 hover:text-[#F1F1E6] hover:bg-white/10 transition"
                  aria-label="Passer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-[var(--accent)]" />
                <span className="text-xs uppercase tracking-wider text-[var(--accent)]/80">Les Éclats de Sève</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#F1F1E6] mb-2">{step?.title}</h3>
              <p className="text-[#F1F1E6]/85 text-sm leading-relaxed mb-6">
                {typeof step?.body === 'function' ? step.body(userDisplayName) : step?.body}
              </p>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-[#F1F1E6]/50 text-sm hover:text-[#F1F1E6]/80 transition"
                >
                  Passer l&apos;initiation
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl font-medium bg-[var(--accent)]/25 border border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)]/35 transition"
                >
                  {isLast ? 'Commencer mon voyage' : 'Suivant'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEveilModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[102] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            {particles && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0, x: '50%', y: '50%' }}
                    animate={{ opacity: [0, 0.8, 0], scale: [0, 1.5, 0], x: `${Math.random() * 100}%`, y: `${Math.random() * 100}%` }}
                    transition={{ duration: 1.5, delay: i * 0.05 }}
                    className="absolute w-2 h-2 rounded-full bg-[var(--accent)]"
                    style={{ left: '50%', top: '50%' }}
                  />
                ))}
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-lg rounded-2xl border border-[var(--accent)]/50 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl p-8 text-center"
              style={{ boxShadow: '0 0 80px rgba(212,175,55,0.2)' }}
            >
              <p className="font-serif text-lg text-[#F1F1E6]/95 whitespace-pre-line leading-relaxed">
                {EVEIL_MESSAGE(userDisplayName || 'Guillaume')}
              </p>
              <button
                type="button"
                onClick={handleEnterClairiere}
                disabled={completing}
                className="mt-8 px-8 py-4 rounded-xl font-medium bg-[var(--accent)]/30 border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/40 transition disabled:opacity-60"
              >
                {completing ? 'Entrée…' : 'Entrer dans la Clairière'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
