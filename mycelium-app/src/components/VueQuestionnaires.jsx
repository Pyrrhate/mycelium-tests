import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, PawPrint, Moon, Flame, Brain, ChevronRight, Lock } from 'lucide-react';
import { getNextQuestionnaireStep, STEP_LABELS, isStepUnlocked, getPrerequisiteStep } from '../hooks/useNextStep';
import Test49Racines from './Test49Racines';
import QuestionnaireTotem from './QuestionnaireTotem';
import VueResonance from './VueResonance';
import VueElementMaitre from './VueElementMaitre';
import VueMatriceIntelligence from './VueMatriceIntelligence';
import { save49Result, updateProfile, getMaison } from '../services/myceliumSave';
import { getResonanceArchives } from '../services/myceliumSave';

const QUESTIONNAIRE_STEPS = [
  { id: '49racines', icon: BookOpen, label: '49 Racines' },
  { id: 'totem', icon: PawPrint, label: 'Totem' },
  { id: 'resonance', icon: Moon, label: 'Résonance' },
  { id: 'element', icon: Flame, label: 'Élément' },
  { id: 'matrice', icon: Brain, label: 'Matrice' },
];

function LockedStepCard({ stepLabel, prerequisiteLabel, onBack, onGoToPrerequisite }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <h1 className="font-serif text-2xl font-bold accent-color">{stepLabel}</h1>
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 space-y-4">
        <p className="text-[#F1F1E6]/90">
          Pour accéder à <strong className="accent-color">{stepLabel}</strong>, accomplissez d'abord :
        </p>
        <p className="text-amber-200/90 font-medium">{prerequisiteLabel}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={onGoToPrerequisite}
            className="px-4 py-2 rounded-xl bg-amber-500/30 hover:bg-amber-500/50 text-amber-100 font-medium transition"
          >
            Aller à {prerequisiteLabel}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl border border-[var(--accent)]/40 text-[#F1F1E6]/80 hover:bg-white/5 transition"
          >
            ← Retour au tableau de bord
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Parcours d'initiation — un seul onglet regroupant les questionnaires (49 Racines → Totem → Résonance → Élément → Matrice).
 * La Constellation reste un module à part (Observatoire).
 */
export default function VueQuestionnaires({
  profile,
  session,
  lastResult,
  totem,
  setLastResult,
  setTotem,
  refetchInitiation,
  onBack,
  setResonanceArchives,
  onNavigateToConstellation,
  initialStepOverride,
}) {
  const nextStep = profile ? getNextQuestionnaireStep(profile) : '49racines';
  const nextInList = nextStep && ['49racines', 'totem', 'resonance', 'element', 'matrice'].includes(nextStep) ? nextStep : null;
  const [step, setStep] = useState(initialStepOverride || nextInList || '49racines');

  useEffect(() => {
    if (initialStepOverride) setStep(initialStepOverride);
    else if (nextInList) setStep(nextInList);
    else if (nextStep === 'constellation') setStep('constellation_gate');
  }, [initialStepOverride, nextInList, nextStep]);

  const handleBack = () => onBack();

  const renderContent = () => {
    if (step === 'constellation_gate') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
          <h1 className="font-serif text-2xl font-bold accent-color">Parcours d&apos;initiation</h1>
          <div className="rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-6 space-y-4">
            <p className="text-[#F1F1E6]/90">
              Vous avez accompli les 49 Racines et Mon Totem. La prochaine étape est <strong className="accent-color">L&apos;Observatoire de la Constellation</strong>.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigateToConstellation?.()}
                className="px-4 py-2 rounded-xl bg-[var(--accent)]/30 hover:bg-[var(--accent)]/50 text-[#F1F1E6] font-medium transition"
              >
                Aller à l&apos;Observatoire
              </button>
              <button type="button" onClick={handleBack} className="px-4 py-2 rounded-xl border border-[var(--accent)]/40 text-[#F1F1E6]/80 hover:bg-white/5 transition">
                ← Tableau de bord
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    const locked = !isStepUnlocked(profile, step);
    const prevStep = QUESTIONNAIRE_STEPS[QUESTIONNAIRE_STEPS.findIndex((s) => s.id === step) - 1];
    const prerequisiteLabel = prevStep ? STEP_LABELS[prevStep.id] : STEP_LABELS['49racines'];

    if (step === '49racines') {
      return (
        <Test49Racines
          onBack={handleBack}
          onComplete={async (result) => {
            setLastResult(result);
            try {
              if (result) localStorage.setItem('mycelium_last_result', JSON.stringify(result));
            } catch (_) {}
            const uid = session?.user?.id;
            if (uid && result) {
              try {
                await save49Result(result, uid);
                await updateProfile(uid, {
                  initiate_name: result.userName || undefined,
                  maison: result.hybrid?.profileKey ? getMaison(result.hybrid.profileKey) : undefined,
                });
              } catch (e) {
                console.warn('Sauvegarde 49 Racines:', e?.message);
              }
              refetchInitiation?.();
            } else {
              refetchInitiation?.();
            }
          }}
        />
      );
    }

    if (step === 'totem') {
      if (locked)
        return (
          <LockedStepCard
            stepLabel={STEP_LABELS.totem}
            prerequisiteLabel={STEP_LABELS['49racines']}
            onBack={handleBack}
            onGoToPrerequisite={() => setStep('49racines')}
          />
        );
      return (
        <QuestionnaireTotem
          onBack={handleBack}
          poleAverages={lastResult?.poleAverages}
          userId={session?.user?.id}
          savedTotemName={totem}
          onComplete={async (t) => {
            setTotem(t?.name ?? null);
            refetchInitiation?.();
          }}
        />
      );
    }

    if (step === 'resonance') {
      if (locked)
        return (
          <LockedStepCard
            stepLabel={STEP_LABELS.resonance}
            prerequisiteLabel={STEP_LABELS.constellation}
            onBack={handleBack}
            onGoToPrerequisite={() => onNavigateToConstellation?.() ?? setStep('resonance')}
          />
        );
      return (
        <VueResonance
          onBack={handleBack}
          userId={session?.user?.id}
          lastResult49={lastResult}
          onResonanceComplete={() => {
            if (session?.user?.id) {
              getResonanceArchives(session.user.id, 12).then((data) => setResonanceArchives?.(data ?? []));
              refetchInitiation?.();
            }
          }}
        />
      );
    }

    if (step === 'element') {
      if (locked)
        return (
          <LockedStepCard
            stepLabel={STEP_LABELS.element}
            prerequisiteLabel={STEP_LABELS.resonance}
            onBack={handleBack}
            onGoToPrerequisite={() => setStep('resonance')}
          />
        );
      return (
        <VueElementMaitre
          onBack={handleBack}
          userId={session?.user?.id}
          onElementComplete={async (dominant) => {
            const uid = session?.user?.id;
            if (uid && dominant?.id) {
              await updateProfile(uid, { element_primordial: dominant.id });
              if (typeof document !== 'undefined') {
                document.documentElement.style.setProperty('--accent', dominant.color ?? '#D4AF37');
                const hex = (dominant.color ?? '#D4AF37').replace('#', '');
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);
                document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
              }
              refetchInitiation?.();
            }
          }}
        />
      );
    }

    if (step === 'matrice') {
      if (locked)
        return (
          <LockedStepCard
            stepLabel={STEP_LABELS.matrice}
            prerequisiteLabel={STEP_LABELS.element}
            onBack={handleBack}
            onGoToPrerequisite={() => setStep('element')}
          />
        );
      return (
        <VueMatriceIntelligence
          onBack={handleBack}
          userId={session?.user?.id}
          onMatriceComplete={() => refetchInitiation?.()}
        />
      );
    }

    return null;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
      {/* Stepper horizontal — étapes du parcours */}
      <nav className="flex flex-wrap items-center gap-2 pb-4 border-b border-[var(--accent)]/20">
        {QUESTIONNAIRE_STEPS.map((s, i) => {
          const unlocked = isStepUnlocked(profile, s.id);
          const active = step === s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => unlocked && setStep(s.id)}
              disabled={!unlocked}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
                active
                  ? 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40'
                  : unlocked
                    ? 'text-[#F1F1E6]/80 hover:bg-white/5 border border-transparent'
                    : 'text-[#F1F1E6]/40 cursor-not-allowed border border-transparent opacity-80'
              }`}
              title={unlocked ? STEP_LABELS[s.id] : `Verrouillé : accomplir ${STEP_LABELS[getPrerequisiteStep(s.id)] || 'l\'étape précédente'} d'abord`}
            >
              {!unlocked && <Lock className="w-4 h-4 flex-shrink-0" />}
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">{s.label}</span>
              {i < QUESTIONNAIRE_STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-[#F1F1E6]/40 hidden md:block" />
              )}
            </button>
          );
        })}
      </nav>

      {renderContent()}
    </motion.div>
  );
}
