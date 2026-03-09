import { motion } from 'framer-motion';
import { User, Droplets, Settings } from 'lucide-react';
import { TOTEMS } from '../data/totemData';
import { ELEMENT_TEST, getInitieElementLabel } from '../data/elementQuestions';
import { SEALS_MASTERY, SEAL_ORDER } from '../data/sealsMastery';

/**
 * Vue Mon profil — Identité, avatar totem, grade, Racines Narratives, Galerie des Sceaux.
 * Accès direct depuis la nav.
 */
export default function VueProfil({
  onBack,
  onGoToParametres,
  session,
  profile,
  totem,
  rank,
  xpProgress,
  xpSeve,
  symbiosePoints,
  elementPrimordial,
  canActivatePublic,
  isPublic,
  unlockedSeals,
  narrativeRoots,
  bioDraft,
  setBioDraft,
  bioSaving,
  onSaveBio,
  addToast,
  onToggleForest,
  refetchInitiation,
  updateProfile,
  supabase,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <h1 className="font-serif text-2xl font-bold accent-color flex items-center gap-2">
        <User className="w-7 h-7" />
        Mon profil
      </h1>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[var(--accent)]/30 bg-white/5 p-6"
        style={{ boxShadow: '0 0 30px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex flex-wrap items-center gap-6">
          <div
            className="w-24 h-24 rounded-2xl border border-[var(--accent)]/40 flex items-center justify-center bg-[#0d1211] text-4xl"
            style={{ boxShadow: '0 0 20px rgba(212,175,55,0.15)' }}
          >
            {totem ? (
              <span title={totem}>{TOTEMS.find((t) => t.name === totem)?.emoji ?? '✨'}</span>
            ) : (
              <Droplets className="w-10 h-10 text-[var(--accent)]/70" />
            )}
          </div>
          <div>
            <p className="text-[#F1F1E6] font-medium">
              {session?.user?.user_metadata?.display_name || session?.user?.email || profile?.initiate_name || 'Initié'}
            </p>
            <p className="text-[#F1F1E6]/60 text-sm mt-1">{session?.user?.email}</p>
            {totem && (
              <p className="mt-2 inline-block px-3 py-1 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 accent-color text-xs font-medium">
                Totem : {totem}
              </p>
            )}
            <p className="mt-2 inline-block px-3 py-1 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 accent-color text-xs font-medium">
              Grade : {rank?.label}
            </p>
            {elementPrimordial && (
              <p className="mt-2 inline-block px-3 py-1 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 accent-color text-xs font-medium">
                {getInitieElementLabel(elementPrimordial)}
              </p>
            )}
            <p className="mt-2 inline-block px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              {symbiosePoints} PS · {xpSeve} XP
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-[#F1F1E6]/70 text-xs uppercase tracking-wider mb-2">Hauts Faits de Sève</p>
          <div className="flex flex-wrap gap-2">
            {SEAL_ORDER.map((id) => {
              const seal = SEALS_MASTERY[id];
              const unlocked = Array.isArray(unlockedSeals) && unlockedSeals.includes(id);
              return (
                <div
                  key={id}
                  className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-lg transition-all ${unlocked ? 'opacity-100' : 'opacity-40 grayscale'}`}
                  style={{
                    borderColor: unlocked ? (seal?.color || '#D4AF37') : 'rgba(255,255,255,0.2)',
                    boxShadow: unlocked ? `0 0 12px ${seal?.color || '#D4AF37'}50` : 'none',
                  }}
                  title={seal ? `${seal.name} — ${seal.mastery}` : id}
                >
                  {unlocked ? '◆' : '◇'}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 w-full">
          <div className="flex justify-between text-[#F1F1E6]/80 text-sm mb-1">
            <span className="font-mono font-semibold accent-color">{xpSeve} XP</span>
            {xpProgress?.nextLabel && (
              <span className="text-[#F1F1E6]/60 text-xs">
                {xpProgress.needed - xpProgress.current} XP → {xpProgress.nextLabel}
              </span>
            )}
          </div>
          <div className="h-2.5 rounded-full bg-[#0d1211] border border-[var(--accent)]/20 overflow-hidden">
            <motion.div
              className="h-full bg-[var(--accent)]/80 rounded-full"
              animate={{ width: xpProgress?.needed ? `${(xpProgress.current / xpProgress.needed) * 100}%` : '100%' }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>

        {/* Racines Narratives */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-[#F1F1E6]/70 text-xs uppercase tracking-wider mb-2">Racines Narratives</p>
          <textarea
            value={bioDraft}
            onChange={(e) => setBioDraft(e.target.value)}
            placeholder="Décrivez-vous en quelques lignes..."
            className="w-full min-h-[100px] px-4 py-3 rounded-xl bg-white/5 border border-[var(--accent)]/20 text-[#F1F1E6] placeholder-[#F1F1E6]/40 focus:border-[var(--accent)]/40 outline-none resize-y transition"
          />
          <button
            type="button"
            disabled={bioSaving || bioDraft === (narrativeRoots ?? '')}
            onClick={onSaveBio}
            className="mt-2 px-4 py-2 rounded-xl text-sm font-medium bg-[var(--accent)]/20 border border-[var(--accent)]/40 accent-color hover:bg-[var(--accent)]/30 disabled:opacity-50 transition"
          >
            {bioSaving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>

        {canActivatePublic && onToggleForest && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onToggleForest}
              className="px-3 py-1.5 rounded-lg border border-[var(--accent)]/40 accent-color text-xs font-medium hover:bg-[var(--accent)]/15 transition"
            >
              {isPublic ? 'Masquer de la Forêt' : 'Activer la visibilité dans la Forêt'}
            </button>
          </div>
        )}
      </motion.section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onGoToParametres}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 text-[#F1F1E6]/80 hover:bg-white/5 transition"
        >
          <Settings className="w-4 h-4" />
          Paramètres du compte
        </button>
        {onBack && (
          <button type="button" onClick={onBack} className="text-[var(--accent)]/80 text-sm hover:accent-color">
            ← Tableau de bord
          </button>
        )}
      </div>
    </motion.div>
  );
}
