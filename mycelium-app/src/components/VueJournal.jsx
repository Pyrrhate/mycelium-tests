import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Archive, PenLine, Trash2, Droplets, Flame, Swords, Brain, Leaf, Wind, Mountain, Sparkle } from 'lucide-react';
import { detectElementFromText } from '../data/sentimentAnalyzer';
import { getQuestForElement } from '../data/quests';
import { getQuestForDay } from '../data/dailyQuests';
import { saveJournalEntry, getJournalEntries, updateJournalEntry, deleteJournalEntry, completeJournalQuest, getTodayDailyLog, getOrCreateDailyLog, completeDailyQuest } from '../services/myceliumSave';

const MIN_CHARS_FOR_QUEST = 100;

/** 7 émotions liées aux éléments (affichage + valeur stockée) */
export const JOURNAL_EMOTIONS = [
  { id: 'calme', label: 'Calme / Paix', element: 'Eau', icon: Droplets, color: '#3B82F6' },
  { id: 'energie', label: 'Énergie / Colère', element: 'Feu', icon: Flame, color: '#EF4444' },
  { id: 'clarte', label: 'Clarté / Focus', element: 'Métal', icon: Swords, color: '#94A3B8' },
  { id: 'inspiration', label: 'Inspiration / Joie', element: 'Bois', icon: Leaf, color: '#22C55E' },
  { id: 'anxiete', label: 'Anxiété / Confusion', element: 'Air', icon: Wind, color: '#A78BFA' },
  { id: 'stabilite', label: 'Stabilité / Fatigue', element: 'Terre', icon: Mountain, color: '#D97706' },
  { id: 'vide', label: 'Vide / Méditation', element: 'Éther', icon: Sparkle, color: '#D4AF37' },
];

/**
 * Le Sanctuaire — Journal de Sève.
 * CRUD complet, sélecteur d'émotion, cartes glassmorphism, tri et inversion d'ordre.
 */
export default function VueJournal({ onBack, userId, initiateName, poleAverages, onQuestComplete }) {
  const [text, setText] = useState('');
  const [primaryEmotion, setPrimaryEmotion] = useState(null);
  const [detected, setDetected] = useState(null);
  const [quest, setQuest] = useState(null);
  const [savedEntry, setSavedEntry] = useState(null);
  const [archives, setArchives] = useState([]);
  const [showArchives, setShowArchives] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [reverseOrder, setReverseOrder] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [savedGlow, setSavedGlow] = useState(false);
  const [dailyLog, setDailyLog] = useState(null);
  const [dailyQuestCompleting, setDailyQuestCompleting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const q = getQuestForDay(poleAverages);
      let log = await getTodayDailyLog(userId);
      if (!log && q) log = await getOrCreateDailyLog(userId, q);
      setDailyLog(log);
    })();
  }, [userId, poleAverages]);

  useEffect(() => {
    const d = detectElementFromText(text);
    setDetected(d);
    if (!text.trim() || text.length < MIN_CHARS_FOR_QUEST) {
      setQuest(null);
      if (!editingId) setSavedEntry(null);
    }
  }, [text, editingId]);

  useEffect(() => {
    if (userId) getJournalEntries(userId, 50).then(setArchives);
  }, [userId]);

  const handleSave = async () => {
    if (!userId || !text.trim()) return;
    setLoading(true);
    if (editingId) {
      const updated = await updateJournalEntry(userId, editingId, { entry_text: text, primary_emotion: primaryEmotion });
      if (updated) {
        setArchives((prev) => prev.map((e) => (e.id === editingId ? { ...e, ...updated } : e)));
        setEditingId(null);
        setText('');
        setPrimaryEmotion(null);
        setSavedGlow(true);
        setTimeout(() => setSavedGlow(false), 1200);
      }
    } else {
      const keyId = primaryEmotion || detected?.keyId || 'terre';
      const q = getQuestForElement(keyId);
      setQuest(q);
      const entry = await saveJournalEntry(userId, {
        entry_text: text,
        detected_element: detected?.element,
        assigned_quest_id: q?.id,
        primary_emotion: primaryEmotion,
      });
      setSavedEntry(entry);
      if (entry) {
        setArchives((prev) => [entry, ...prev.filter((e) => e.id !== entry.id)]);
        setSavedGlow(true);
        setTimeout(() => setSavedGlow(false), 1200);
      }
    }
    setLoading(false);
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setText(entry.entry_text || '');
    setPrimaryEmotion(entry.detected_element || null);
    setShowArchives(false);
  };

  const handleDelete = async (entryId) => {
    if (!userId || deleteConfirmId !== entryId) return;
    const ok = await deleteJournalEntry(userId, entryId);
    if (ok) {
      setArchives((prev) => prev.filter((e) => e.id !== entryId));
      setDeleteConfirmId(null);
      if (editingId === entryId) {
        setEditingId(null);
        setText('');
        setPrimaryEmotion(null);
      }
    }
  };

  const handleDailyMissionDone = async () => {
    if (!userId || dailyLog?.is_quest_completed || dailyQuestCompleting) return;
    setDailyQuestCompleting(true);
    const result = await completeDailyQuest(userId);
    const updated = result?.log ?? result;
    setDailyLog(updated);
    onQuestComplete?.();
    setDailyQuestCompleting(false);
  };

  const handleQuestDone = async (entryId) => {
    if (!userId || !entryId) return;
    await completeJournalQuest(userId, entryId);
    if (onQuestComplete) onQuestComplete();
    setQuest(null);
    setSavedEntry(null);
    setText('');
    getJournalEntries(userId, 50).then(setArchives);
  };

  const displayArchives = reverseOrder ? [...archives].reverse() : archives;
  const glowColor = primaryEmotion ? JOURNAL_EMOTIONS.find((e) => e.id === primaryEmotion)?.color : detected?.color ?? 'rgba(212,175,55,0.3)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto min-h-[60vh] flex flex-col"
    >
      <h1 className="font-serif text-2xl font-bold accent-color flex items-center gap-2 mb-2">
        <BookOpen className="w-7 h-7" />
        Le Sanctuaire
      </h1>
      <p className="text-[#F1F1E6]/60 text-sm mb-6">
        Quelle sève coule en vous aujourd&apos;hui ? Choisissez votre essence du moment, puis écrivez.
      </p>

      {/* Mission du jour — encadré bioluminescent */}
      {dailyLog && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl p-4" style={{ boxShadow: '0 0 30px rgba(52,211,153,0.12)' }}>
          <p className="text-emerald-400/90 text-xs uppercase tracking-wider mb-2">Mission de Sève du jour</p>
          <p className="text-[#F1F1E6]/95 text-sm mb-3">{dailyLog.task_text}</p>
          {dailyLog.is_quest_completed ? (
            <p className="text-emerald-400 text-xs flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Mission accomplie. +50 XP, +20 PS.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleDailyMissionDone}
              disabled={dailyQuestCompleting}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/35 transition disabled:opacity-60"
            >
              {dailyQuestCompleting ? 'Enregistrement…' : 'Mission accomplie'}
            </button>
          )}
        </div>
      )}

      {!showArchives ? (
        <>
          {/* Sélecteur d'émotion */}
          <div className="mb-4">
            <p className="text-xs text-[#F1F1E6]/60 uppercase tracking-wider mb-2">L&apos;essence du moment</p>
            <div className="flex flex-wrap gap-2">
              {JOURNAL_EMOTIONS.map((em) => {
                const Icon = em.icon;
                return (
                  <button
                    key={em.id}
                    type="button"
                    onClick={() => setPrimaryEmotion(primaryEmotion === em.id ? null : em.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition border ${
                      primaryEmotion === em.id
                        ? 'border-current opacity-100'
                        : 'border-white/10 text-[#F1F1E6]/70 hover:border-white/20'
                    }`}
                    style={primaryEmotion === em.id ? { color: em.color, borderColor: em.color } : {}}
                    title={`${em.label} (${em.element})`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{em.label.split(' / ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zone d'écriture */}
          <div
            className={`relative rounded-2xl overflow-hidden flex-1 min-h-[200px] transition-all duration-500 ${savedGlow ? 'ring-2 ring-emerald-400/50' : ''}`}
            style={{
              boxShadow: savedGlow ? `0 0 40px rgba(52,211,153,0.4)` : `0 0 60px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.05)`,
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${primaryEmotion ? `${JOURNAL_EMOTIONS.find((e) => e.id === primaryEmotion)?.color}40` : detected ? `${detected.color}40` : 'rgba(212,175,55,0.2)'}`,
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Écrivez ici... colère, calme, doute, désir, fatigue, inspiration..."
              className="w-full h-full min-h-[200px] p-6 bg-transparent text-[#F1F1E6] placeholder-[#F1F1E6]/30 resize-none focus:outline-none focus:ring-0"
              style={{ fontSize: '1rem', lineHeight: 1.7 }}
            />
            {(detected && text.length > 10) || primaryEmotion ? (
              <div className="absolute bottom-3 left-6 flex items-center gap-2 text-xs" style={{ color: primaryEmotion ? JOURNAL_EMOTIONS.find((e) => e.id === primaryEmotion)?.color : detected?.color }}>
                <Sparkles className="w-4 h-4" />
                {primaryEmotion ? JOURNAL_EMOTIONS.find((e) => e.id === primaryEmotion)?.label : `Résonance : ${detected?.element} — ${detected?.key}`}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <motion.button
              onClick={handleSave}
              disabled={loading || !text.trim()}
              className="px-6 py-3 rounded-xl font-medium bg-[var(--accent)]/20 border border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)]/30 transition disabled:opacity-50"
            >
              {editingId ? 'Enregistrer' : loading ? 'Enregistrement...' : 'Enregistrer'}
            </motion.button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setText(''); setPrimaryEmotion(null); }}
                className="px-4 py-2 rounded-xl border border-white/20 text-[#F1F1E6]/80 hover:bg-white/5"
              >
                Annuler
              </button>
            )}
          </div>

          {text.length >= MIN_CHARS_FOR_QUEST && !savedEntry && !editingId && (
            <p className="mt-2 text-xs text-[#F1F1E6]/50">Enregistrez puis invoquez une quête si vous le souhaitez.</p>
          )}

          {savedEntry && quest && !editingId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl border p-6 backdrop-blur-xl"
              style={{
                borderColor: `${detected?.color ?? '#D4AF37'}40`,
                background: `${detected?.color ?? '#D4AF37'}08`,
              }}
            >
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: detected?.color }}>
                Quête de {detected?.element ?? 'Sève'}
              </p>
              <p className="text-[#F1F1E6]/90 italic mb-4">&ldquo;{quest.text}&rdquo;</p>
              <button
                type="button"
                onClick={() => handleQuestDone(savedEntry.id)}
                className="px-4 py-2 rounded-lg font-medium text-sm bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30"
              >
                Quête accomplie (+50 PS, +10 XP)
              </button>
            </motion.div>
          )}

          <button
            type="button"
            onClick={() => setShowArchives(true)}
            className="mt-6 flex items-center gap-2 text-[#F1F1E6]/60 text-sm hover:text-[var(--accent)]"
          >
            <Archive className="w-4 h-4" />
            Archives de Sève
          </button>
        </>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button type="button" onClick={() => setShowArchives(false)} className="text-[var(--accent)]/80 text-sm hover:accent-color">
              ← Retour à l&apos;écriture
            </button>
            <button
              type="button"
              onClick={() => setReverseOrder((o) => !o)}
              className="text-xs text-[#F1F1E6]/60 hover:text-[#F1F1E6]/90"
            >
              {reverseOrder ? 'Récent en premier' : 'Ancien en premier'}
            </button>
          </div>
          <h2 className="font-serif text-lg font-bold accent-color">Vos notes</h2>
          {displayArchives.length === 0 ? (
            <p className="text-[#F1F1E6]/50 text-sm">Aucune note encore.</p>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence>
                {displayArchives.map((entry) => (
                  <motion.li
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 text-sm overflow-hidden"
                    style={{ boxShadow: '0 0 20px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)' }}
                  >
                    <p className="text-[#F1F1E6]/90 whitespace-pre-wrap line-clamp-4">{entry.entry_text}</p>
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      <p className="text-[#F1F1E6]/50 text-xs">
                        {new Date(entry.created_at).toLocaleDateString('fr-FR')}
                        {entry.detected_element && ` · ${entry.detected_element}`}
                        {entry.is_completed && ' · Accomplie ✓'}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(entry)}
                          className="p-2 rounded-lg text-[#F1F1E6]/60 hover:bg-white/10 hover:text-[var(--accent)]"
                          title="Éditer"
                        >
                          <PenLine className="w-4 h-4" />
                        </button>
                        {deleteConfirmId === entry.id ? (
                          <>
                            <span className="text-xs text-red-400">Supprimer ?</span>
                            <button type="button" onClick={() => handleDelete(entry.id)} className="text-xs text-red-400 font-medium hover:underline">Oui</button>
                            <button type="button" onClick={() => setDeleteConfirmId(null)} className="text-xs text-[#F1F1E6]/70">Non</button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(entry.id)}
                            className="p-2 rounded-lg text-[#F1F1E6]/50 hover:bg-red-500/10 hover:text-red-400"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </motion.div>
      )}

      {onBack && (
        <button type="button" onClick={onBack} className="mt-8 text-[var(--accent)]/80 text-sm hover:accent-color">
          ← Retour au tableau de bord
        </button>
      )}
    </motion.div>
  );
}
