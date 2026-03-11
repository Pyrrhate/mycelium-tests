import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Sparkles, Loader2, Feather, Quote, HelpCircle, BookOpen, 
  History, Pin, PinOff, Pencil, Trash2, X, ChevronLeft, ChevronRight,
  ArrowUpDown, Calendar, Search
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { 
  getPastJournalEntries, 
  saveCompanionJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalEntries
} from '../services/myceliumSave';
import { 
  analyzeWithCodex, 
  ELEMENT_CONFIG,
  detectElementFromText 
} from '../utils/myceliumLore';

const MIN_CHARS = 50;

async function analyzeJournalEntry(currentEntry, pastEntries = [], useMock = false) {
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const response = analyzeWithCodex(currentEntry, pastEntries);
    return { ...response, _source: 'mock' };
  }

  try {
    console.log('🌲 Appel à Claude via Edge Function...');
    const { data, error } = await supabase.functions.invoke('analyze-journal', {
      body: {
        current_entry: currentEntry,
        past_entries: pastEntries.map(e => ({
          text: e.entry_text,
          element: e.ai_element,
          date: e.created_at,
        })),
      },
    });

    if (error) throw new Error(error.message || 'Erreur Edge Function');
    console.log('✅ Réponse Claude reçue:', data);
    return { ...data, _source: 'claude' };
  } catch (err) {
    console.warn('⚠️ Fallback vers Codex de Secours:', err.message);
    const response = analyzeWithCodex(currentEntry, pastEntries);
    return { ...response, _source: 'codex-fallback' };
  }
}

function ArchiveCard({ entry, isSelected, onSelect, onPin, onDelete, elementConfig }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={() => onSelect(entry)}
      className={`p-3 rounded-xl cursor-pointer transition-all ${
        isSelected 
          ? 'bg-[var(--accent)]/20 border border-[var(--accent)]/40' 
          : 'bg-white/5 border border-white/10 hover:bg-white/10'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {entry.ai_element && (
              <span 
                className="text-sm"
                title={entry.ai_element}
              >
                {ELEMENT_CONFIG[entry.ai_element]?.icon || '✨'}
              </span>
            )}
            <span className="text-xs text-[#F1F1E6]/50">
              {new Date(entry.created_at).toLocaleDateString('fr-FR', { 
                day: 'numeric', month: 'short' 
              })}
            </span>
            {entry.is_pinned && (
              <Pin className="w-3 h-3 text-[var(--accent)]" />
            )}
          </div>
          <p className="text-sm text-[#F1F1E6]/80 line-clamp-2">
            {entry.entry_text}
          </p>
        </div>
        
        <div className="flex flex-col gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onPin(entry); }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#F1F1E6]/50 hover:text-[var(--accent)] transition"
            title={entry.is_pinned ? 'Désépingler' : 'Épingler'}
          >
            {entry.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
          
          {showDeleteConfirm ? (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { onDelete(entry.id); setShowDeleteConfirm(false); }}
                className="p-1 rounded bg-red-500/20 text-red-400 text-xs"
              >
                ✓
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="p-1 rounded bg-white/10 text-[#F1F1E6]/60 text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#F1F1E6]/50 hover:text-red-400 transition"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EntryViewer({ entry, onClose, onEdit, elementConfig }) {
  if (!entry) return null;
  
  const config = ELEMENT_CONFIG[entry.ai_element] || ELEMENT_CONFIG.Éther;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <p className="text-xs text-[#F1F1E6]/50">
              {new Date(entry.created_at).toLocaleDateString('fr-FR', { 
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
              })}
            </p>
            <p className="font-serif text-lg" style={{ color: config.color }}>
              {entry.ai_element || 'Éther'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-white/10 text-[#F1F1E6]/60 hover:text-[var(--accent)] transition"
            title="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-[#F1F1E6]/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl p-6 bg-white/5 border border-white/10">
        <p className="text-[#F1F1E6]/90 whitespace-pre-wrap leading-relaxed">
          {entry.entry_text}
        </p>
      </div>

      {entry.ai_quote && (
        <div className="rounded-2xl p-5" style={{ background: `${config.color}10`, border: `1px solid ${config.color}25` }}>
          <div className="flex items-start gap-3">
            <Quote className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: config.color }} />
            <p className="text-[#F1F1E6]/90 italic">{entry.ai_quote}</p>
          </div>
        </div>
      )}

      {entry.ai_reflection && (
        <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 flex-shrink-0 mt-1 text-[var(--accent)]" />
            <p className="text-[#F1F1E6]/90">{entry.ai_reflection}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function MagicJournal({ onBack, userId, initiateName }) {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState(null);
  const [responseSource, setResponseSource] = useState(null);
  const [useMock, setUseMock] = useState(false);
  
  const [archives, setArchives] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sortOrder, setSortOrder] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');

  const canSubmit = text.length >= MIN_CHARS;
  const elementConfig = aiResult?.element ? ELEMENT_CONFIG[aiResult.element] : ELEMENT_CONFIG.Éther;

  const fetchArchives = useCallback(async () => {
    if (!userId) return;
    const entries = await getJournalEntries(userId, 100);
    setArchives(entries || []);
  }, [userId]);

  useEffect(() => {
    fetchArchives();
  }, [fetchArchives]);

  const sortedArchives = [...archives]
    .filter(e => !searchQuery || e.entry_text.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      if (sortOrder === 'recent') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortOrder === 'oldest') {
        return new Date(a.created_at) - new Date(b.created_at);
      } else if (sortOrder === 'custom') {
        return (a.custom_order || 0) - (b.custom_order || 0);
      }
      return 0;
    });

  const handleAnalyze = async () => {
    if (!canSubmit || isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);
    setAiResult(null);
    setSelectedEntry(null);

    try {
      const pastEntries = archives.slice(0, 3);
      const result = await analyzeJournalEntry(text, pastEntries, useMock);
      setAiResult(result);
      setResponseSource(result._source);

      if (userId) {
        const saved = await saveCompanionJournalEntry(userId, {
          entry_text: text,
          aiResponse: result,
        });
        if (saved) {
          setArchives(prev => [saved, ...prev]);
        }
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setText('');
    setAiResult(null);
    setError(null);
    setResponseSource(null);
  };

  const handleSelectEntry = (entry) => {
    setSelectedEntry(entry);
    setAiResult(null);
    setIsEditing(false);
  };

  const handleEditEntry = () => {
    if (!selectedEntry) return;
    setEditText(selectedEntry.entry_text);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!userId || !selectedEntry || !editText.trim()) return;
    
    const updated = await updateJournalEntry(userId, selectedEntry.id, { 
      entry_text: editText 
    });
    
    if (updated) {
      setArchives(prev => prev.map(e => e.id === selectedEntry.id ? { ...e, entry_text: editText } : e));
      setSelectedEntry(prev => ({ ...prev, entry_text: editText }));
      setIsEditing(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!userId) return;
    
    const success = await deleteJournalEntry(userId, entryId);
    if (success) {
      setArchives(prev => prev.filter(e => e.id !== entryId));
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null);
      }
    }
  };

  const handlePinEntry = async (entry) => {
    if (!userId || !supabase) return;
    
    const newPinned = !entry.is_pinned;
    const { error } = await supabase
      .from('user_journal')
      .update({ is_pinned: newPinned })
      .eq('id', entry.id)
      .eq('user_id', userId);
    
    if (!error) {
      setArchives(prev => prev.map(e => 
        e.id === entry.id ? { ...e, is_pinned: newPinned } : e
      ));
    }
  };

  const handleReorder = async (newOrder) => {
    setArchives(newOrder);
    
    if (userId && supabase) {
      for (let i = 0; i < newOrder.length; i++) {
        await supabase
          .from('user_journal')
          .update({ custom_order: i })
          .eq('id', newOrder[i].id)
          .eq('user_id', userId);
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Sidebar Archives */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 flex flex-col bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
          >
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-lg text-[var(--accent)] flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Archives de Sève
                </h2>
                <span className="text-xs text-[#F1F1E6]/50">{archives.length} notes</span>
              </div>
              
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F1F1E6]/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-[#F1F1E6] placeholder-[#F1F1E6]/30 focus:outline-none focus:border-[var(--accent)]/40"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setSortOrder('recent')}
                  className={`px-2 py-1 rounded text-xs transition ${sortOrder === 'recent' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[#F1F1E6]/50 hover:text-[#F1F1E6]'}`}
                >
                  Récent
                </button>
                <button
                  onClick={() => setSortOrder('oldest')}
                  className={`px-2 py-1 rounded text-xs transition ${sortOrder === 'oldest' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[#F1F1E6]/50 hover:text-[#F1F1E6]'}`}
                >
                  Ancien
                </button>
                <button
                  onClick={() => setSortOrder('custom')}
                  className={`px-2 py-1 rounded text-xs transition flex items-center gap-1 ${sortOrder === 'custom' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-[#F1F1E6]/50 hover:text-[#F1F1E6]'}`}
                >
                  <ArrowUpDown className="w-3 h-3" />
                  Manuel
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {sortOrder === 'custom' ? (
                <Reorder.Group axis="y" values={sortedArchives} onReorder={handleReorder} className="space-y-2">
                  {sortedArchives.map((entry) => (
                    <Reorder.Item key={entry.id} value={entry}>
                      <ArchiveCard
                        entry={entry}
                        isSelected={selectedEntry?.id === entry.id}
                        onSelect={handleSelectEntry}
                        onPin={handlePinEntry}
                        onDelete={handleDeleteEntry}
                      />
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              ) : (
                <AnimatePresence>
                  {sortedArchives.map((entry) => (
                    <ArchiveCard
                      key={entry.id}
                      entry={entry}
                      isSelected={selectedEntry?.id === entry.id}
                      onSelect={handleSelectEntry}
                      onPin={handlePinEntry}
                      onDelete={handleDeleteEntry}
                    />
                  ))}
                </AnimatePresence>
              )}
              
              {sortedArchives.length === 0 && (
                <p className="text-center text-[#F1F1E6]/40 text-sm py-8">
                  {searchQuery ? 'Aucun résultat' : 'Aucune note encore'}
                </p>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Toggle Sidebar */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="self-center p-2 rounded-lg bg-white/5 border border-white/10 text-[#F1F1E6]/60 hover:text-[var(--accent)] transition"
      >
        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Zone principale */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-6">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 mb-4"
            >
              <Feather className="w-8 h-8 text-[#D4AF37]" />
              <h1 className="font-serif text-3xl font-bold text-[#D4AF37]">
                Journal Compagnon
              </h1>
            </motion.div>
            <p className="text-[#F1F1E6]/60 text-sm">
              Le Mycélium écoute, observe et reflète.
            </p>
          </div>

          {/* Vue d'une entrée sélectionnée */}
          <AnimatePresence mode="wait">
            {selectedEntry && !isEditing && (
              <EntryViewer
                entry={selectedEntry}
                onClose={() => setSelectedEntry(null)}
                onEdit={handleEditEntry}
              />
            )}

            {/* Mode édition */}
            {isEditing && selectedEntry && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg text-[var(--accent)]">Modifier la note</h2>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-2 rounded-lg hover:bg-white/10 text-[#F1F1E6]/60"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full min-h-[200px] p-6 rounded-2xl bg-white/5 border border-white/10 text-[#F1F1E6] placeholder-[#F1F1E6]/30 resize-none focus:outline-none focus:border-[var(--accent)]/40"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveEdit}
                    className="px-6 py-3 rounded-xl bg-[var(--accent)]/20 border border-[var(--accent)]/50 text-[var(--accent)] font-medium hover:bg-[var(--accent)]/30 transition"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[#F1F1E6]/70 hover:bg-white/10 transition"
                  >
                    Annuler
                  </button>
                </div>
              </motion.div>
            )}

            {/* Zone de saisie (nouvelle entrée) */}
            {!selectedEntry && !aiResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div
                  className="relative rounded-3xl overflow-hidden mb-6"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    boxShadow: '0 0 80px rgba(212,175,55,0.12)',
                    border: '1px solid rgba(212,175,55,0.15)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isAnalyzing}
                    placeholder="Quelle sève coule en vous aujourd'hui ? Confiez vos ombres et vos lumières au réseau..."
                    className="w-full min-h-[280px] p-8 bg-transparent text-[#F1F1E6] placeholder-[#F1F1E6]/30 resize-none focus:outline-none disabled:opacity-60"
                    style={{ fontSize: '1.1rem', lineHeight: 1.8 }}
                  />
                  <div className="absolute bottom-4 right-4">
                    <span className={`text-xs ${canSubmit ? 'text-emerald-400' : 'text-[#F1F1E6]/40'}`}>
                      {text.length}/{MIN_CHARS}
                    </span>
                  </div>
                </div>

                <div className="flex justify-center">
                  {!isAnalyzing ? (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: canSubmit ? 1 : 0.5 }}
                      onClick={handleAnalyze}
                      disabled={!canSubmit}
                      className="px-8 py-4 rounded-2xl font-medium text-lg transition-all"
                      style={{
                        background: canSubmit ? 'linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0.15) 100%)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${canSubmit ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        color: canSubmit ? '#D4AF37' : '#F1F1E6',
                        cursor: canSubmit ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Écouter la Forêt
                      </span>
                    </motion.button>
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-6">
                      <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
                      <p className="text-[#D4AF37]/80 text-sm animate-pulse">
                        Le Mycélium relie vos pensées...
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Résultat IA */}
            {aiResult && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div 
                  className={`rounded-3xl p-6 bg-gradient-to-br ${elementConfig.gradient}`}
                  style={{ border: `1px solid ${elementConfig.color}30` }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                      style={{ background: `${elementConfig.color}15`, border: `2px solid ${elementConfig.color}40` }}
                    >
                      {elementConfig.icon}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#F1F1E6]/50">Élément dominant</p>
                      <p className="font-serif text-2xl font-bold" style={{ color: elementConfig.color }}>
                        {aiResult.element}
                      </p>
                    </div>
                  </div>
                </div>

                {aiResult.quote && (
                  <div className="rounded-2xl p-6 bg-white/5 border border-white/10">
                    <div className="flex items-start gap-4">
                      <Quote className="w-6 h-6 text-[#D4AF37]/60 flex-shrink-0 mt-1" />
                      <p className="text-[#F1F1E6]/90 text-lg italic font-serif">{aiResult.quote}</p>
                    </div>
                  </div>
                )}

                {aiResult.reflection && (
                  <div 
                    className="rounded-2xl p-6"
                    style={{ background: `${elementConfig.color}08`, border: `1px solid ${elementConfig.color}25` }}
                  >
                    <div className="flex items-start gap-4">
                      <HelpCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: elementConfig.color }} />
                      <p className="text-[#F1F1E6]">{aiResult.reflection}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center gap-3">
                  {responseSource && (
                    <span className={`text-xs px-3 py-1.5 rounded-full ${
                      responseSource === 'claude' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : responseSource === 'codex-fallback'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-white/10 text-[#F1F1E6]/60 border border-white/20'
                    }`}>
                      {responseSource === 'claude' ? '🤖 Claude' : responseSource === 'codex-fallback' ? '📚 Codex de Secours' : '🎭 Mode simulation'}
                    </span>
                  )}
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-[#F1F1E6]/70 hover:bg-white/10 transition"
                  >
                    Nouvelle entrée
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {onBack && (
            <button
              onClick={onBack}
              className="mt-10 text-[#D4AF37]/70 text-sm hover:text-[#D4AF37] transition block mx-auto"
            >
              ← Retour au tableau de bord
            </button>
          )}

          {import.meta.env.DEV && (
            <div className="mt-8 text-center">
              <label className="flex items-center justify-center gap-2 text-xs text-[#F1F1E6]/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useMock}
                  onChange={(e) => setUseMock(e.target.checked)}
                  className="rounded"
                />
                Forcer le Codex de Secours (ignorer Claude)
              </label>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
