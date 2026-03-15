import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  Sparkles, Loader2, Feather, Quote, HelpCircle, BookOpen, 
  History, Pin, PinOff, Pencil, Trash2, X, ChevronLeft, ChevronRight,
  ArrowUpDown, Calendar, Search, Image, Mic, Video, Upload, GitBranch,
  ZoomIn, ZoomOut, Grid3X3, LayoutGrid
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { 
  getPastJournalEntries, 
  saveCompanionJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalEntries,
  uploadJournalMedia,
  getSmartContextEntries,
  updateJournalWithMedia
} from '../services/myceliumSave';
import { 
  analyzeWithCodex, 
  ELEMENT_CONFIG,
  detectElementFromText 
} from '../utils/myceliumLore';

const MIN_CHARS = 50;
const ZOOM_LEVELS = { MIN: 1, MAX: 100 };

async function analyzeJournalEntry(currentEntry, contextEntries = [], useMock = false) {
  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const response = analyzeWithCodex(currentEntry, contextEntries);
    return { ...response, _source: 'mock' };
  }

  try {
    console.log('🌲 Appel à Claude via Edge Function...');
    const { data, error } = await supabase.functions.invoke('analyze-journal', {
      body: {
        current_entry: currentEntry,
        past_entries: contextEntries.map(e => ({
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
    const response = analyzeWithCodex(currentEntry, contextEntries);
    return { ...response, _source: 'codex-fallback' };
  }
}

function MediaPreview({ media, onRemove }) {
  if (!media || media.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-3 border-t border-white/10">
      {media.map((item, idx) => (
        <div key={idx} className="relative group">
          {item.type === 'image' && (
            <img 
              src={item.url} 
              alt={item.name} 
              className="w-20 h-20 object-cover rounded-lg border border-white/20"
            />
          )}
          {item.type === 'audio' && (
            <div className="w-20 h-20 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
              <Mic className="w-8 h-8 text-violet-400" />
            </div>
          )}
          {item.type === 'video' && (
            <div className="w-20 h-20 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
              <Video className="w-8 h-8 text-rose-400" />
            </div>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(idx)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function TimelineCell({ entry, zoom, isSelected, onSelect }) {
  const config = ELEMENT_CONFIG[entry.ai_element] || ELEMENT_CONFIG.Éther;
  const isMinimal = zoom < 30;
  const isMedium = zoom >= 30 && zoom < 70;
  const hasMedia = entry.media_urls && entry.media_urls.length > 0;

  if (isMinimal) {
    return (
      <motion.div
        layout
        onClick={() => onSelect(entry)}
        className={`aspect-square rounded-lg cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-[var(--accent)]' : ''
        }`}
        style={{ 
          background: config.color + '40',
          border: `2px solid ${config.color}60`
        }}
        title={`${entry.ai_element} - ${new Date(entry.created_at).toLocaleDateString('fr-FR')}`}
      >
        {hasMedia && (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="w-3 h-3 text-white/60" />
          </div>
        )}
      </motion.div>
    );
  }

  if (isMedium) {
    return (
      <motion.div
        layout
        onClick={() => onSelect(entry)}
        className={`p-2 rounded-xl cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-[var(--accent)]' : ''
        }`}
        style={{ 
          background: config.color + '15',
          border: `1px solid ${config.color}30`
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">{config.icon}</span>
          <span className="text-[10px] text-[#F1F1E6]/50">
            {new Date(entry.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
          </span>
        </div>
        <p className="text-xs text-[#F1F1E6]/70 line-clamp-2">{entry.entry_text}</p>
        {hasMedia && (
          <div className="mt-1 flex gap-1">
            {entry.media_urls.slice(0, 2).map((m, i) => (
              m.type === 'image' ? (
                <img key={i} src={m.url} alt="" className="w-8 h-8 object-cover rounded" />
              ) : (
                <div key={i} className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                  {m.type === 'audio' ? <Mic className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                </div>
              )
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      onClick={() => onSelect(entry)}
      className={`p-4 rounded-2xl cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-[var(--accent)] bg-[var(--accent)]/10' : 'bg-white/5 hover:bg-white/10'
      }`}
      style={{ border: `1px solid ${config.color}30` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: config.color + '20' }}
        >
          {config.icon}
        </div>
        <div>
          <p className="text-xs text-[#F1F1E6]/50">
            {new Date(entry.created_at).toLocaleDateString('fr-FR', { 
              weekday: 'short', day: 'numeric', month: 'short' 
            })}
          </p>
          <p className="text-sm font-medium" style={{ color: config.color }}>
            {entry.ai_element}
          </p>
        </div>
        {entry.is_pinned && <Pin className="w-4 h-4 text-[var(--accent)] ml-auto" />}
      </div>
      <p className="text-[#F1F1E6]/80 text-sm line-clamp-4 mb-3">{entry.entry_text}</p>
      {hasMedia && (
        <div className="flex gap-2 mb-2">
          {entry.media_urls.slice(0, 3).map((m, i) => (
            m.type === 'image' ? (
              <img key={i} src={m.url} alt="" className="w-16 h-16 object-cover rounded-lg" />
            ) : (
              <div key={i} className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                {m.type === 'audio' ? <Mic className="w-6 h-6 text-violet-400" /> : <Video className="w-6 h-6 text-rose-400" />}
              </div>
            )
          ))}
        </div>
      )}
      {entry.mycelium_link && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <GitBranch className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-300">{entry.mycelium_link}</p>
        </div>
      )}
    </motion.div>
  );
}

function EntryViewer({ entry, onClose, onEdit }) {
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

      {entry.media_urls && entry.media_urls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {entry.media_urls.map((m, i) => (
            <div key={i} className="rounded-xl overflow-hidden">
              {m.type === 'image' && (
                <img src={m.url} alt="" className="w-full h-40 object-cover" />
              )}
              {m.type === 'audio' && (
                <audio src={m.url} controls className="w-full" />
              )}
              {m.type === 'video' && (
                <video src={m.url} controls className="w-full h-40 object-cover" />
              )}
            </div>
          ))}
        </div>
      )}

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

      {entry.mycelium_link && (
        <div className="rounded-2xl p-5 bg-emerald-500/10 border border-emerald-500/25">
          <div className="flex items-start gap-3">
            <GitBranch className="w-5 h-5 flex-shrink-0 mt-1 text-emerald-400" />
            <div>
              <p className="text-xs text-emerald-400/70 uppercase tracking-wider mb-1">Lien Mycélien</p>
              <p className="text-emerald-200">{entry.mycelium_link}</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function MagicJournal({ onBack, userId, initiateName }) {
  const [text, setText] = useState('');
  const [pendingMedia, setPendingMedia] = useState([]);
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
  
  const [zoomLevel, setZoomLevel] = useState(70);
  const [viewMode, setViewMode] = useState('timeline');

  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const canSubmit = text.length >= MIN_CHARS;
  const elementConfig = aiResult?.element ? ELEMENT_CONFIG[aiResult.element] : ELEMENT_CONFIG.Éther;

  const getGridCols = () => {
    if (zoomLevel >= 70) return 'grid-cols-1 md:grid-cols-2';
    if (zoomLevel >= 50) return 'grid-cols-2 md:grid-cols-3';
    if (zoomLevel >= 30) return 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
    if (zoomLevel >= 15) return 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8';
    return 'grid-cols-6 md:grid-cols-8 lg:grid-cols-12';
  };

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
      if (sortOrder === 'recent') return new Date(b.created_at) - new Date(a.created_at);
      if (sortOrder === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortOrder === 'custom') return (a.custom_order || 0) - (b.custom_order || 0);
      return 0;
    });

  const handleFileUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      const mediaItem = {
        file,
        url: URL.createObjectURL(file),
        type,
        name: file.name,
        pending: true,
      };
      setPendingMedia(prev => [...prev, mediaItem]);
    }
  };

  const removePendingMedia = (idx) => {
    setPendingMedia(prev => {
      const toRemove = prev[idx];
      if (toRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(toRemove.url);
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleAnalyze = async () => {
    if (!canSubmit || isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);
    setAiResult(null);
    setSelectedEntry(null);

    try {
      const detectedElement = detectElementFromText(text);
      const contextEntries = await getSmartContextEntries(userId, detectedElement);
      console.log('📚 Contexte intelligent:', contextEntries.length, 'notes');
      
      const result = await analyzeJournalEntry(text, contextEntries, useMock);
      setAiResult(result);
      setResponseSource(result._source);

      if (userId) {
        const saved = await saveCompanionJournalEntry(userId, {
          entry_text: text,
          aiResponse: result,
        });
        
        if (saved && pendingMedia.length > 0) {
          const uploadedMedia = [];
          for (const media of pendingMedia) {
            if (media.file) {
              const uploaded = await uploadJournalMedia(userId, saved.id, media.file);
              if (uploaded) uploadedMedia.push(uploaded);
            }
          }
          
          if (uploadedMedia.length > 0) {
            await updateJournalWithMedia(userId, saved.id, { 
              media_urls: uploadedMedia,
              mycelium_link: result.mycelium_link,
            });
            saved.media_urls = uploadedMedia;
            saved.mycelium_link = result.mycelium_link;
          }
        }
        
        if (saved) {
          setArchives(prev => [saved, ...prev]);
          setPendingMedia([]);
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
    setPendingMedia([]);
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

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-4">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewMode(viewMode === 'timeline' ? 'compose' : 'timeline')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              viewMode === 'compose' 
                ? 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40' 
                : 'bg-white/5 text-[#F1F1E6]/70 border border-white/10 hover:bg-white/10'
            }`}
          >
            <Feather className="w-4 h-4 inline mr-2" />
            Nouvelle entrée
          </button>
          
          <div className="h-8 w-px bg-white/10" />
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F1F1E6]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-48 pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-[#F1F1E6] placeholder-[#F1F1E6]/30 focus:outline-none focus:border-[var(--accent)]/40"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {['recent', 'oldest', 'custom'].map(order => (
              <button
                key={order}
                onClick={() => setSortOrder(order)}
                className={`px-3 py-1.5 rounded-lg text-xs transition ${
                  sortOrder === order 
                    ? 'bg-[var(--accent)]/20 text-[var(--accent)]' 
                    : 'text-[#F1F1E6]/50 hover:text-[#F1F1E6]'
                }`}
              >
                {order === 'recent' ? 'Récent' : order === 'oldest' ? 'Ancien' : 'Manuel'}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-[#F1F1E6]/40" />
            <input
              type="range"
              min={ZOOM_LEVELS.MIN}
              max={ZOOM_LEVELS.MAX}
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-32 accent-[var(--accent)]"
            />
            <ZoomIn className="w-4 h-4 text-[#F1F1E6]/40" />
            <span className="text-xs text-[#F1F1E6]/50 w-8">{zoomLevel}%</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Timeline / Archives Grid */}
        <div className={`flex-1 overflow-y-auto ${viewMode === 'compose' ? 'hidden md:block' : ''}`}>
          {sortedArchives.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-[#F1F1E6]/20 mx-auto mb-4" />
                <p className="text-[#F1F1E6]/40">
                  {searchQuery ? 'Aucun résultat trouvé' : 'Votre grimoire est vide'}
                </p>
                <p className="text-[#F1F1E6]/30 text-sm mt-2">
                  Commencez par écrire votre première note
                </p>
              </div>
            </div>
          ) : (
            <div className={`grid gap-3 p-2 ${getGridCols()}`}>
              {sortedArchives.map(entry => (
                <TimelineCell
                  key={entry.id}
                  entry={entry}
                  zoom={zoomLevel}
                  isSelected={selectedEntry?.id === entry.id}
                  onSelect={handleSelectEntry}
                />
              ))}
            </div>
          )}
        </div>

        {/* Composition / Viewer Panel */}
        <AnimatePresence mode="wait">
          {(viewMode === 'compose' || selectedEntry) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full md:w-[500px] lg:w-[600px] flex-shrink-0 overflow-y-auto"
            >
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 min-h-full">
                {/* Vue d'une entrée sélectionnée */}
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
                {viewMode === 'compose' && !selectedEntry && !aiResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="text-center mb-6">
                      <h1 className="font-serif text-2xl font-bold text-[#D4AF37] flex items-center justify-center gap-2">
                        <Feather className="w-6 h-6" />
                        Nouvelle Entrée
                      </h1>
                      <p className="text-[#F1F1E6]/50 text-sm mt-1">
                        Le Mycélium écoute, observe et tisse des liens.
                      </p>
                    </div>

                    <div
                      className="relative rounded-2xl overflow-hidden mb-4"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        boxShadow: '0 0 60px rgba(212,175,55,0.1)',
                        border: '1px solid rgba(212,175,55,0.15)',
                      }}
                    >
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={isAnalyzing}
                        placeholder="Quelle sève coule en vous aujourd'hui ? Confiez vos ombres et vos lumières..."
                        className="w-full min-h-[200px] p-6 bg-transparent text-[#F1F1E6] placeholder-[#F1F1E6]/30 resize-none focus:outline-none disabled:opacity-60"
                        style={{ fontSize: '1rem', lineHeight: 1.7 }}
                      />
                      
                      <MediaPreview media={pendingMedia} onRemove={removePendingMedia} />
                      
                      <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFileUpload(e, 'image')}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 rounded-lg hover:bg-white/10 text-[#F1F1E6]/50 hover:text-emerald-400 transition"
                            title="Ajouter une image"
                          >
                            <Image className="w-5 h-5" />
                          </button>
                          
                          <input
                            ref={audioInputRef}
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handleFileUpload(e, 'audio')}
                            className="hidden"
                          />
                          <button
                            onClick={() => audioInputRef.current?.click()}
                            className="p-2 rounded-lg hover:bg-white/10 text-[#F1F1E6]/50 hover:text-violet-400 transition"
                            title="Ajouter un audio"
                          >
                            <Mic className="w-5 h-5" />
                          </button>
                          
                          <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleFileUpload(e, 'video')}
                            className="hidden"
                          />
                          <button
                            onClick={() => videoInputRef.current?.click()}
                            className="p-2 rounded-lg hover:bg-white/10 text-[#F1F1E6]/50 hover:text-rose-400 transition"
                            title="Ajouter une vidéo"
                          >
                            <Video className="w-5 h-5" />
                          </button>
                        </div>
                        
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
                            Le Mycélium tisse des liens...
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
                      className={`rounded-2xl p-6 bg-gradient-to-br ${elementConfig.gradient}`}
                      style={{ border: `1px solid ${elementConfig.color}30` }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                          style={{ background: `${elementConfig.color}15`, border: `2px solid ${elementConfig.color}40` }}
                        >
                          {elementConfig.icon}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-[#F1F1E6]/50">Élément dominant</p>
                          <p className="font-serif text-xl font-bold" style={{ color: elementConfig.color }}>
                            {aiResult.element}
                          </p>
                        </div>
                      </div>
                    </div>

                    {aiResult.quote && (
                      <div className="rounded-2xl p-5 bg-white/5 border border-white/10">
                        <div className="flex items-start gap-3">
                          <Quote className="w-5 h-5 text-[#D4AF37]/60 flex-shrink-0 mt-1" />
                          <p className="text-[#F1F1E6]/90 italic font-serif">{aiResult.quote}</p>
                        </div>
                      </div>
                    )}

                    {aiResult.reflection && (
                      <div 
                        className="rounded-2xl p-5"
                        style={{ background: `${elementConfig.color}08`, border: `1px solid ${elementConfig.color}25` }}
                      >
                        <div className="flex items-start gap-3">
                          <HelpCircle className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: elementConfig.color }} />
                          <p className="text-[#F1F1E6]">{aiResult.reflection}</p>
                        </div>
                      </div>
                    )}

                    {aiResult.mycelium_link && (
                      <div className="rounded-2xl p-5 bg-emerald-500/10 border border-emerald-500/25">
                        <div className="flex items-start gap-3">
                          <GitBranch className="w-5 h-5 flex-shrink-0 mt-1 text-emerald-400" />
                          <div>
                            <p className="text-xs text-emerald-400/70 uppercase tracking-wider mb-1">Lien Mycélien</p>
                            <p className="text-emerald-200">{aiResult.mycelium_link}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col items-center gap-3 pt-4">
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

                {error && (
                  <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                    {error}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="text-[#D4AF37]/70 text-sm hover:text-[#D4AF37] transition mx-auto"
        >
          ← Retour au tableau de bord
        </button>
      )}

      {import.meta.env.DEV && (
        <div className="text-center pb-2">
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
  );
}
