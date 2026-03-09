import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  User,
  LogOut,
  Activity,
  Droplets,
} from 'lucide-react';
import { PawPrint, Moon, Flame, Brain, Users, Star, Layers, ScrollText, Swords, Menu, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { save49Result, updateProfile, getMaison } from '../services/myceliumSave';
import { getResonanceArchives, getActiveForestAwakening } from '../services/myceliumSave';
import { useInitiationStatus } from '../hooks/useInitiationStatus';
import { getNextQuestionnaireStep, STEP_LABELS, isStepUnlocked } from '../hooks/useNextStep';
import { getRankFromXp, getXpProgressForNextRank } from '../data/ranks';
import { calculateHybridProfile, getQM } from '../data/profiles49';
import { TOTEMS } from '../data/totemData';
import { ToastContainer } from './Toast';
import VueEveilQuotidien from './VueEveilQuotidien';
import VueForet from './VueForet';
import VueQuestionnaires from './VueQuestionnaires';
import ConstellationView from './ConstellationView';
import VueDeck from './VueDeck';
import VueJournal from './VueJournal';
import VueCombat from './VueCombat';
import ConstellationCard from './ConstellationCard';
import AvatarExplicationsCard from './AvatarExplicationsCard';
import { generateSeal } from '../utils/sealGenerator';
import { ELEMENT_TEST, getInitieElementLabel } from '../data/elementQuestions';

/** Carte affichée quand l'étape est verrouillée (prérequis non accompli). */
function LockedStepCard({ stepLabel, prerequisiteLabel, prerequisiteStep, onBack, onGoToPrerequisite }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <h1 className="font-serif text-2xl font-bold accent-color">{stepLabel}</h1>
      <div
        className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 space-y-4"
      >
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
 * Mycélium Hub — Dashboard principal
 * Sidebar verre, section Profil (Avatar Totem + Grade de Sève), Pouls de la Forêt (stats mondiales).
 */
export default function MyceliumHub({ session, onLogout }) {
  const [toasts, setToasts] = useState([]);
  const [pulse, setPulse] = useState(null);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | '49racines' | 'totem' | 'reseau' | 'eveil'
  const [lastResult, setLastResult] = useState(() => {
    try {
      const s = localStorage.getItem('mycelium_last_result');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [totem, setTotem] = useState(() => {
    try {
      const name = localStorage.getItem('mycelium_totem');
      return name || null;
    } catch {
      return null;
    }
  });
  const [resonanceArchives, setResonanceArchives] = useState([]);
  const [forestAwakening, setForestAwakening] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { canActivatePublic, isPublic, xpSeve, elementPrimordial, totem: profileTotem, constellationData, constellationResult, symbiosePoints, profile, loading: initiationLoading, refetch: refetchInitiation } = useInitiationStatus(session?.user?.id);

  const addToast = (msg, variant = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message: msg, variant, duration: 4000 }]);
  };
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    if (!supabase) return;
    const fetchPulse = async () => {
      try {
        const { data } = await supabase.from('forest_stats').select('qm_score').limit(200);
        if (data && data.length > 0) {
          const avg = data.reduce((s, r) => s + (Number(r.qm_score) || 0), 0) / data.length;
          setPulse({ moyenneQM: Math.round(avg), count: data.length });
        } else {
          setPulse({ moyenneQM: 0, count: 0 });
        }
      } catch {
        setPulse({ moyenneQM: 0, count: 0 });
      }
    };
    fetchPulse();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    getResonanceArchives(session.user.id, 12).then(setResonanceArchives);
  }, [session?.user?.id]);

  useEffect(() => {
    getActiveForestAwakening().then(setForestAwakening);
    const t = setInterval(() => getActiveForestAwakening().then(setForestAwakening), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const id = elementPrimordial;
    const color = id ? (ELEMENT_TEST.labels[id]?.color ?? '#D4AF37') : '#D4AF37';
    const hex = color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
  }, [elementPrimordial]);

  // Réhydrater 49 Racines et totem depuis le profil Supabase (pour persistance après reconnexion)
  useEffect(() => {
    if (!session?.user?.id) return;
    if (profileTotem != null && profileTotem !== '') {
      setTotem(profileTotem);
      try {
        localStorage.setItem('mycelium_totem', profileTotem);
      } catch (_) {}
    }
    if (constellationData?.poleAverages && Array.isArray(constellationData.poleAverages) && constellationData.poleAverages.length === 7) {
      const cd = constellationData;
      const result = cd.hybrid
        ? { poleAverages: cd.poleAverages, hybrid: cd.hybrid, userName: cd.userName ?? '', qm: cd.qm ?? 50 }
        : {
            poleAverages: cd.poleAverages,
            hybrid: calculateHybridProfile(cd.poleAverages),
            userName: cd.userName ?? '',
            qm: getQM(cd.poleAverages),
          };
      setLastResult(result);
      try {
        localStorage.setItem('mycelium_last_result', JSON.stringify(result));
      } catch (_) {}
    }
  }, [session?.user?.id, profileTotem, constellationData]);

  // Parcours guidé : rediriger vers l'onglet approprié (questionnaires ou constellation ou dashboard)
  useEffect(() => {
    if (initiationLoading || !profile || !session?.user?.id) return;
    const next = getNextQuestionnaireStep(profile);
    if (next === 'constellation') setActiveView('constellation');
    else if (next === '49racines' || next === 'totem' || next === 'resonance' || next === 'element' || next === 'matrice') setActiveView('questionnaires');
    else if (next === null) setActiveView('dashboard');
  }, [profile, initiationLoading, session?.user?.id]);

  const nextStep = profile ? getNextQuestionnaireStep(profile) : '49racines';

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    if (onLogout) onLogout();
    addToast('Vous avez quitté le Réseau.');
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    { id: 'questionnaires', icon: BookOpen, label: 'Parcours d\'initiation' },
    { id: 'constellation', icon: Star, label: 'L\'Observatoire de la Constellation' },
    { id: 'eveil', icon: Activity, label: 'Éveil Quotidien' },
    { id: 'journal', icon: ScrollText, label: 'Journal de Sève' },
    { id: 'deck', icon: Layers, label: 'Mon Deck' },
    { id: 'combat', icon: Swords, label: 'Le Duel' },
    { id: 'foret', icon: Users, label: 'La Forêt' },
  ];

  const rank = getRankFromXp(xpSeve);
  const xpProgress = getXpProgressForNextRank(xpSeve);

  return (
    <div className={`min-h-screen bg-[#070B0A] text-[#F1F1E6] flex flex-col md:flex-row ${forestAwakening ? 'forest-awakening' : ''}`}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Barre mobile : titre + menu burger en haut à droite */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--accent)]/20 bg-[#070B0A]/95 backdrop-blur-lg sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 accent-color" />
          <span className="font-serif text-sm font-bold accent-color">Mycélium</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileNavOpen((o) => !o)}
          className="p-2 rounded-xl text-[#F1F1E6]/80 hover:bg-white/10 hover:accent-color transition"
          aria-label="Menu"
        >
          {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Menu mobile ouvert : overlay avec la nav */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={`fixed md:relative left-0 z-50 md:z-auto w-64 md:w-52 flex-shrink-0 flex flex-col py-6 border-r border-[var(--accent)]/20 transform transition-transform duration-200 ease-out top-14 bottom-0 md:top-0 md:inset-y-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="px-3 mb-6 flex items-center gap-2 md:pt-0 pt-4">
          <Sparkles className="w-7 h-7 flex-shrink-0 accent-color" />
          <span className="font-serif text-sm font-bold accent-color">Mycélium</span>
        </div>
        {navItems.map((item, i) => (
          <motion.button
            key={item.id}
            type="button"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
            onClick={() => {
              setActiveView(item.id);
              setMobileNavOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl transition mb-1 text-left ${
              activeView === item.id
                ? 'accent-color bg-[var(--accent)]/15'
                : 'text-[#F1F1E6]/70 hover:accent-color hover:bg-white/5'
            }`}
            title={item.label}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs leading-tight">{item.label}</span>
          </motion.button>
        ))}
        {/* XP & Grade dans la sidebar */}
        <div className="mt-auto px-3 pt-4 border-t border-[var(--accent)]/10">
          <p className="text-[#F1F1E6]/70 text-xs font-medium accent-color">{rank.label}</p>
          <p className="text-lg font-bold accent-color tabular-nums">{xpSeve} XP</p>
          <div className="h-1.5 rounded-full bg-[#0d1211] border border-[var(--accent)]/20 overflow-hidden mt-1">
            <motion.div
              className="h-full bg-[var(--accent)]/80 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: xpProgress.needed ? `${(xpProgress.current / xpProgress.needed) * 100}%` : '100%' }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-[#F1F1E6]/50 hover:text-red-400 hover:bg-red-500/10 transition"
            title="Se déconnecter"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs">Sortir</span>
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 overflow-auto p-6 pt-4 md:pt-6">
        {activeView === 'questionnaires' && (
          <VueQuestionnaires
            profile={profile}
            session={session}
            lastResult={lastResult}
            totem={totem}
            setLastResult={setLastResult}
            setTotem={setTotem}
            refetchInitiation={refetchInitiation}
            onBack={() => setActiveView('dashboard')}
            setResonanceArchives={setResonanceArchives}
            onNavigateToConstellation={() => setActiveView('constellation')}
          />
        )}
        {activeView === 'eveil' && (
          <VueEveilQuotidien onBack={() => setActiveView('dashboard')} />
        )}
        {activeView === 'constellation' && (
          isStepUnlocked(profile, 'constellation') ? (
            <ConstellationView
              onBack={() => setActiveView('dashboard')}
              userId={session?.user?.id}
              profile={profile}
              lastResult={lastResult}
              onResonanceComplete={() => {
                if (session?.user?.id) getResonanceArchives(session.user.id, 12).then(setResonanceArchives);
              }}
              onConstellationComplete={async (payload) => {
                const uid = session?.user?.id;
                if (uid && payload) {
                  await updateProfile(uid, { constellation_result: payload });
                  refetchInitiation?.();
                }
              }}
            />
          ) : (
            <LockedStepCard
              stepLabel={STEP_LABELS.constellation}
              prerequisiteLabel={STEP_LABELS.totem}
              prerequisiteStep="totem"
              onBack={() => setActiveView('dashboard')}
              onGoToPrerequisite={() => setActiveView('totem')}
            />
          )
        )}
        {activeView === 'deck' && (
          <VueDeck onBack={() => setActiveView('dashboard')} profile={profile} />
        )}
        {activeView === 'journal' && (
          <VueJournal
            onBack={() => setActiveView('dashboard')}
            userId={session?.user?.id}
            initiateName={profile?.initiate_name || session?.user?.user_metadata?.display_name || 'Initié'}
            onQuestComplete={() => refetchInitiation?.()}
          />
        )}
        {activeView === 'combat' && (
          <VueCombat
            onBack={() => setActiveView('dashboard')}
            userId={session?.user?.id}
            profile={profile}
          />
        )}
        {activeView === 'foret' && (
          <VueForet pulse={pulse} onBack={() => setActiveView('dashboard')} />
        )}
        {activeView === 'dashboard' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-2xl font-bold accent-color"
          >
            Mycélium Hub
          </motion.h1>

          {forestAwakening && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-4 flex items-center gap-3"
            >
              <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
              <div>
                <p className="font-medium text-emerald-200">Éveil de la Forêt</p>
                <p className="text-emerald-200/80 text-sm">Plus de 100 résonances cette semaine. Les avatars brillent pendant 24h.</p>
              </div>
            </motion.div>
          )}

          {/* Prochaine étape du parcours */}
          {nextStep && STEP_LABELS[nextStep] && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-center justify-between gap-3"
            >
              <span className="text-amber-200/90">
                Prochaine étape : <strong>{STEP_LABELS[nextStep]}</strong>
              </span>
              <button
                type="button"
                onClick={() => setActiveView(['49racines', 'totem', 'resonance', 'element', 'matrice'].includes(nextStep) ? 'questionnaires' : nextStep)}
                className="px-4 py-2 rounded-xl bg-amber-500/30 hover:bg-amber-500/50 text-amber-100 font-medium transition"
              >
                Continuer
              </button>
            </motion.div>
          )}

          {/* Constellation + Avatar (si un résultat 49 Racines existe) */}
          {lastResult && (
            <>
              <ConstellationCard result={lastResult} />
              <AvatarExplicationsCard result={lastResult} />
            </>
          )}

          {/* Carte Profil — Avatar Totem + Grade de Sève */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-[var(--accent)]/30 bg-white/5 p-6"
            style={{ boxShadow: '0 0 30px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}
          >
            <h2 className="font-serif text-lg font-bold accent-color mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Votre identité
            </h2>
            <div className="flex flex-wrap items-center gap-6">
              <div
                className={`w-24 h-24 rounded-2xl border border-[var(--accent)]/40 flex items-center justify-center bg-[#0d1211] text-4xl transition-all duration-500 ${forestAwakening ? 'shadow-[0_0_30px_rgba(52,211,153,0.4)]' : ''}`}
                style={{ boxShadow: totem && forestAwakening ? '0 0 30px rgba(52,211,153,0.4)' : '0 0 20px rgba(212,175,55,0.15)' }}
              >
                {totem ? (
                  <span title={totem}>
                    {TOTEMS.find((t) => t.name === totem)?.emoji ?? '✨'}
                  </span>
                ) : (
                  <Droplets className="w-10 h-10 text-[var(--accent)]/70" />
                )}
              </div>
              <div>
                <p className="text-[#F1F1E6] font-medium">
                  {session?.user?.user_metadata?.display_name || session?.user?.email || 'Initié'}
                </p>
                <p className="text-[#F1F1E6]/60 text-sm mt-1">{session?.user?.email}</p>
                {totem && (
                  <p className="mt-2 inline-block px-3 py-1 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 accent-color text-xs font-medium">
                    Totem : {totem}
                  </p>
                )}
                <p className="mt-2 inline-block px-3 py-1 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 accent-color text-xs font-medium">
                  Grade de Sève : {rank.label}
                </p>
                {elementPrimordial && (
                  <p className="mt-2 inline-block px-3 py-1 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 accent-color text-xs font-medium">
                    {getInitieElementLabel(elementPrimordial)}
                  </p>
                )}
                <p className="mt-2 inline-block px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                  {symbiosePoints} PS
                </p>
                {/* Barre d'XP de Sève — plus visible */}
                <div className="mt-3 w-64">
                  <div className="flex justify-between text-[#F1F1E6]/80 text-sm mb-1">
                    <span className="font-mono font-semibold accent-color">{xpSeve} XP</span>
                    {xpProgress.nextLabel && <span className="text-[#F1F1E6]/60 text-xs">{xpProgress.needed - xpProgress.current} XP → {xpProgress.nextLabel}</span>}
                  </div>
                  <div className="h-2.5 rounded-full bg-[#0d1211] border border-[var(--accent)]/20 overflow-hidden">
                    <motion.div
                      className="h-full bg-[var(--accent)]/80 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: xpProgress.needed ? `${(xpProgress.current / xpProgress.needed) * 100}%` : '100%' }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>
                {/* V6 : Activer la visibilité dans la Forêt (verrouillé jusqu'à 49 Racines + Totem + 1500 XP) */}
                <div className="mt-4">
                  {canActivatePublic ? (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!session?.user?.id || !supabase) return;
                        const slug = (session?.user?.user_metadata?.display_name || session?.user?.email || 'initie').replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
                        await updateProfile(session.user.id, { is_public: !isPublic, public_constellation: !isPublic, slug: isPublic ? null : (slug || `initie-${session.user.id.slice(0, 8)}`) });
                        addToast(isPublic ? 'Profil masqué de la Forêt.' : 'Profil visible dans la Forêt.');
                        if (refetchInitiation) refetchInitiation();
                      }}
                      className="px-3 py-1.5 rounded-lg border border-[var(--accent)]/40 accent-color text-xs font-medium hover:bg-[var(--accent)]/15 transition"
                    >
                      {isPublic ? 'Masquer de la Forêt' : 'Activer la visibilité dans la Forêt'}
                    </button>
                  ) : (
                    <p className="text-[#F1F1E6]/50 text-xs">Complétez les 49 Racines, le Totem et atteignez 1500 XP (Racine Ancrée) pour activer votre profil public.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Pouls de la Forêt */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-[var(--accent)]/30 bg-white/5 p-6"
            style={{ boxShadow: '0 0 30px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}
          >
            <h2 className="font-serif text-lg font-bold accent-color mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Le Réseau — Pouls de la Forêt
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl bg-[#0d1211]/80 border border-[var(--accent)]/20 p-4">
                <p className="text-[#F1F1E6]/60 text-xs uppercase tracking-wider">Moyenne QM</p>
                <p className="text-2xl font-bold text-[#D4AF37] mt-1">
                  {pulse ? pulse.moyenneQM : '—'}
                </p>
              </div>
              <div className="rounded-xl bg-[#0d1211]/80 border border-[var(--accent)]/20 p-4">
                <p className="text-[#F1F1E6]/60 text-xs uppercase tracking-wider">Passages</p>
                <p className="text-2xl font-bold text-[#F1F1E6] mt-1">
                  {pulse ? pulse.count : '—'}
                </p>
              </div>
              <div className="rounded-xl bg-[#0d1211]/80 border border-emerald-500/20 p-4">
                <p className="text-[#F1F1E6]/60 text-xs uppercase tracking-wider">Hyphes actives</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">—</p>
              </div>
              <div className="rounded-xl bg-[#0d1211]/80 border border-sky-500/20 p-4">
                <p className="text-[#F1F1E6]/60 text-xs uppercase tracking-wider">Sève en flux</p>
                <p className="text-2xl font-bold text-sky-400 mt-1">—</p>
              </div>
            </div>
          </motion.section>

          {/* Carte d'accès rapide */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-[var(--accent)]/30 bg-white/5 p-6"
            style={{ boxShadow: '0 0 30px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}
          >
            <h2 className="font-serif text-lg font-bold accent-color mb-4">Prochaines étapes</h2>
            <p className="text-[#F1F1E6]/80 text-sm">
              {lastResult
                ? 'Explorez Le Réseau et l\'Éveil Quotidien, ou refaites le test des 49 Racines pour mettre à jour votre Constellation.'
                : 'Passez le test des 49 Racines pour révéler votre profil hybride et votre Constellation.'}
            </p>
          </motion.section>

          {/* Archives des Cycles (Résonance du Cycle) */}
          {resonanceArchives.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl border border-[var(--accent)]/30 bg-white/5 p-6"
              style={{ boxShadow: '0 0 30px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}
            >
              <h2 className="font-serif text-lg font-bold accent-color mb-4 flex items-center gap-2">
                <Moon className="w-5 h-5" />
                Archives des Cycles
              </h2>
              <p className="text-[#F1F1E6]/70 text-sm mb-4">Vos Résonances passées et leurs Sceaux du Mois.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {resonanceArchives.map((r) => {
                  const parts = (r.seal_id || 'spore_ancrage').split('_');
                  const { svg } = generateSeal(parts[0], parts[1], 64);
                  const label = r.month_year ? r.month_year.replace(/-/, ' / ') : '';
                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border border-[var(--accent)]/20 bg-[#0d1211]/60 p-3 text-center"
                    >
                      <div className="inline-block mb-2" dangerouslySetInnerHTML={{ __html: svg }} />
                      <p className="text-[var(--accent)]/90 text-xs font-mono">{label}</p>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}
        </div>
        )}
      </main>
    </div>
  );
}
