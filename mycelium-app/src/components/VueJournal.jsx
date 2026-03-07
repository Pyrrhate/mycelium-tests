import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Archive } from 'lucide-react';
import { detectElementFromText } from '../data/sentimentAnalyzer';
import { getQuestForElement } from '../data/quests';
import { saveJournalEntry, getJournalEntries, completeJournalQuest } from '../services/myceliumSave';

const MIN_CHARS_FOR_QUEST = 100;

/**
 * Le Sanctuaire — Journal de Sève.
 * Texte central, analyse de résonance (couleur de lueur), quête assignée, validation, archives.
 */
export default function VueJournal({ onBack, userId, initiateName, onQuestComplete }) {
  const [text, setText] = useState('');
  const [detected, setDetected] = useState(null);
  const [quest, setQuest] = useState(null);
  const [savedEntry, setSavedEntry] = useState(null);
  const [archives, setArchives] = useState([]);
  const [showArchives, setShowArchives] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const d = detectElementFromText(text);
    setDetected(d);
    if (!text.trim() || text.length < MIN_CHARS_FOR_QUEST) {
      setQuest(null);
      setSavedEntry(null);
    }
  }, [text]);

  useEffect(() => {
    if (userId) getJournalEntries(userId, 30).then(setArchives);
  }, [userId]);

  const handleInvoquer = async () => {
    if (!userId || text.length < MIN_CHARS_FOR_QUEST || !detected) return;
    setLoading(true);
    const keyId = detected.keyId || 'terre';
    const q = getQuestForElement(keyId);
    setQuest(q);
    const entry = await saveJournalEntry(userId, {
      entry_text: text,
      detected_element: detected.element,
      assigned_quest_id: q?.id,
    });
    setSavedEntry(entry);
    setLoading(false);
    if (userId) getJournalEntries(userId, 30).then(setArchives);
  };

  const handleQuestDone = async (entryId) => {
    if (!userId || !entryId) return;
    await completeJournalQuest(userId, entryId);
    if (onQuestComplete) onQuestComplete();
    setQuest(null);
    setSavedEntry(null);
    setText('');
    getJournalEntries(userId, 30).then(setArchives);
  };

  const glowColor = detected?.color ?? 'rgba(212,175,55,0.3)';

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
        Quelle sève coule en vous aujourd&apos;hui ? Confiez vos ombres et vos lumières au réseau.
      </p>

      {!showArchives ? (
        <>
          <div
            className="relative rounded-2xl overflow-hidden flex-1 min-h-[200px] transition-shadow duration-500"
            style={{
              boxShadow: `0 0 60px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.05)`,
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${detected ? `${detected.color}40` : 'rgba(212,175,55,0.2)'}`,
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Écrivez ici... colère, calme, doute, désir, fatigue, inspiration..."
              className="w-full h-full min-h-[200px] p-6 bg-transparent text-[#F1F1E6] placeholder-[#F1F1E6]/30 resize-none focus:outline-none focus:ring-0"
              style={{ fontSize: '1rem', lineHeight: 1.7 }}
            />
            {detected && text.length > 10 && (
              <div className="absolute bottom-3 left-6 flex items-center gap-2 text-xs" style={{ color: detected.color }}>
                <Sparkles className="w-4 h-4" />
                Résonance : {detected.element} — {detected.key}
              </div>
            )}
          </div>

          {text.length >= MIN_CHARS_FOR_QUEST && !savedEntry && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleInvoquer}
              disabled={loading}
              className="mt-6 px-6 py-3 rounded-xl font-medium bg-[var(--accent)]/20 border border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)]/30 transition disabled:opacity-50"
            >
              {loading ? 'Invoquant...' : 'Invoquer ma Quête'}
            </motion.button>
          )}

          {savedEntry && quest && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl border p-6"
              style={{
                borderColor: `${detected?.color ?? '#D4AF37'}40`,
                background: `${detected?.color ?? '#D4AF37'}08`,
                backdropFilter: 'blur(20px)',
              }}
            >
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: detected?.color }}>
                Quête de {detected?.element ?? 'Sève'}
              </p>
              <p className="text-[#F1F1E6] font-medium mb-4">
                {initiateName ? `${initiateName}, ` : ''}vos racines vous murmurent :
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
          <button
            type="button"
            onClick={() => setShowArchives(false)}
            className="text-[var(--accent)]/80 text-sm hover:accent-color"
          >
            ← Retour à l&apos;écriture
          </button>
          <h2 className="font-serif text-lg font-bold accent-color">Vos entrées passées</h2>
          {archives.length === 0 ? (
            <p className="text-[#F1F1E6]/50 text-sm">Aucune entrée encore.</p>
          ) : (
            <ul className="space-y-3">
              {archives.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm"
                >
                  <p className="text-[#F1F1E6]/90 line-clamp-2">{entry.entry_text}</p>
                  <p className="text-[#F1F1E6]/50 text-xs mt-2">
                    {new Date(entry.created_at).toLocaleDateString('fr-FR')}
                    {entry.detected_element && ` · ${entry.detected_element}`}
                    {entry.is_completed && ' · Accomplie ✓'}
                  </p>
                </li>
              ))}
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
