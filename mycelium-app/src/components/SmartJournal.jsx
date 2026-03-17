import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Loader2, Feather, Quote, HelpCircle, BookOpen,
  Pin, Pencil, Trash2, X, Search, Image, Mic, Video, ZoomIn, ZoomOut, StickyNote,
  Download, FileText, FileDown, ChevronDown, ListTodo, Brain, Tag, ScanLine, Paperclip,
  FolderOpen, Plus
} from 'lucide-react';
import ExplorerView from './ExplorerView';
import { supabase } from '../supabaseClient';
import {
  getPastJournalEntries,
  saveCompanionJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalEntries,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  uploadJournalMedia,
  getSmartContextEntries,
  updateJournalWithMedia,
} from '../services/myceliumSave';
import { analyzeWithCodex, ELEMENT_CONFIG, detectElementFromText } from '../utils/myceliumLore';
import { stripHtml, exportNoteToPdf, exportNoteToDocx, exportNoteToTxt } from '../utils/exportNote';
import RichTextEditor from './RichTextEditor';

const MIN_CHARS = 50;
const ZOOM_LEVELS = { MIN: 1, MAX: 100 };

async function analyzeJournalEntry(currentEntry, contextEntries = [], useMock = false) {
  const plainText = stripHtml(currentEntry);
  if (useMock) {
    await new Promise((r) => setTimeout(r, 1500));
    return { ...analyzeWithCodex(plainText, contextEntries), _source: 'mock' };
  }
  try {
    const { data, error } = await supabase.functions.invoke('analyze-journal', {
      body: {
        current_entry: plainText,
        past_entries: contextEntries.map((e) => ({
          text: typeof e.entry_text === 'string' ? e.entry_text : stripHtml(e.entry_text || ''),
          element: e.ai_element,
          date: e.created_at,
        })),
      },
    });
    if (error) throw new Error(error.message || 'Erreur Edge Function');
    return { ...data, _source: 'claude' };
  } catch (err) {
    return { ...analyzeWithCodex(plainText, contextEntries), _source: 'codex-fallback' };
  }
}

function MediaPreview({ media, onRemove }) {
  if (!media?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 p-3 border-t border-gray-800">
      {media.map((item, idx) => (
        <div key={idx} className="relative group">
          {item.type === 'image' && (
            <img src={item.url} alt={item.name} className="w-20 h-20 object-cover rounded-lg border border-gray-700" />
          )}
          {item.type === 'audio' && (
            <div className="w-20 h-20 rounded-lg bg-gray-700/50 border border-gray-600 flex items-center justify-center">
              <Mic className="w-8 h-8 text-gray-400" />
            </div>
          )}
          {item.type === 'video' && (
            <div className="w-20 h-20 rounded-lg bg-gray-700/50 border border-gray-600 flex items-center justify-center">
              <Video className="w-8 h-8 text-gray-400" />
            </div>
          )}
          {item.type === 'file' && (
            <div className="w-20 h-20 rounded-lg bg-gray-700/50 border border-gray-600 flex flex-col items-center justify-center p-2">
              <FileText className="w-8 h-8 text-gray-400" />
              <span className="text-[10px] text-gray-500 truncate w-full text-center" title={item.name}>{item.name}</span>
            </div>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function TagPills({ tags, onRemove }) {
  if (!tags?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-700/80 text-gray-300 border border-gray-600"
        >
          #{t}
          {onRemove && (
            <button type="button" onClick={() => onRemove(i)} className="hover:text-white" aria-label="Retirer">
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

function TagInput({ value, onChange, onAdd, placeholder = "Ajouter un tag (#travail)..." }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const raw = (value || '').trim().replace(/^#/, '');
      if (raw) onAdd(raw);
      onChange('');
    }
  };
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-[#e5e5e5] placeholder-gray-500 text-sm focus:outline-none focus:border-gray-600"
    />
  );
}

function AnnotationPostIt({ annotation, onDelete }) {
  return (
    <div className="rounded-lg p-3 bg-amber-500/15 dark:bg-amber-500/10 border border-amber-500/30 text-[#e5e5e5] text-sm">
      <div className="flex justify-between items-start gap-2">
        <p className="whitespace-pre-wrap flex-1">{annotation.content}</p>
        {onDelete && (
          <button type="button" onClick={onDelete} className="p-1 rounded hover:bg-white/10 text-gray-400" aria-label="Supprimer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {annotation.createdAt && (
        <p className="text-xs text-gray-500 mt-2">{new Date(annotation.createdAt).toLocaleString('fr-FR')}</p>
      )}
    </div>
  );
}

function ExportMenu({ entry, onClose }) {
  const [loading, setLoading] = useState(null);
  const baseName = `note-${entry?.id || 'export'}`;
  const html = entry?.entry_text || '';

  const handleExport = async (type) => {
    setLoading(type);
    try {
      if (type === 'pdf') await exportNoteToPdf(html, baseName);
      else if (type === 'docx') await exportNoteToDocx(html, baseName);
      else if (type === 'txt') exportNoteToTxt(html, baseName);
      onClose();
    } catch (e) {
      console.warn('Export error:', e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-800 bg-[#1a1a1a] shadow-xl z-10 py-1">
      <button
        type="button"
        onClick={() => handleExport('pdf')}
        disabled={loading !== null}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-[#e5e5e5] hover:bg-gray-800/80 disabled:opacity-50"
      >
        <FileDown className="w-4 h-4" />
        {loading === 'pdf' ? 'Génération…' : 'Exporter en PDF'}
      </button>
      <button
        type="button"
        onClick={() => handleExport('docx')}
        disabled={loading !== null}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-[#e5e5e5] hover:bg-gray-800/80 disabled:opacity-50"
      >
        <FileText className="w-4 h-4" />
        {loading === 'docx' ? 'Génération…' : 'Exporter en Word (.docx)'}
      </button>
      <button
        type="button"
        onClick={() => { handleExport('txt'); }}
        disabled={loading !== null}
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-[#e5e5e5] hover:bg-gray-800/80 disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        Exporter en texte (.txt)
      </button>
    </div>
  );
}

function TimelineCell({ entry, zoom, isSelected, onSelect }) {
  const config = ELEMENT_CONFIG[entry.ai_element] || ELEMENT_CONFIG.Éther;
  const isMinimal = zoom < 30;
  const isMedium = zoom >= 30 && zoom < 70;
  const hasMedia = entry.media_urls && entry.media_urls.length > 0;
  const preview = stripHtml(entry.entry_text || '');
  const tags = entry.tags || [];

  const cellClass = `border border-gray-800 rounded-xl bg-[#1a1a1a] cursor-pointer transition-all ${
    isSelected ? 'ring-2 ring-gray-500' : 'hover:bg-[#222]'
  }`;

  if (isMinimal) {
    return (
      <motion.div layout onClick={() => onSelect(entry)} className={`aspect-square rounded-lg ${cellClass}`} title={new Date(entry.created_at).toLocaleDateString('fr-FR')}>
        {hasMedia && <div className="w-full h-full flex items-center justify-center"><Image className="w-3 h-3 text-gray-500" /></div>}
      </motion.div>
    );
  }

  if (isMedium) {
    return (
      <motion.div layout onClick={() => onSelect(entry)} className={`p-2 ${cellClass}`}>
        <p className="text-[10px] text-gray-500 mb-1">{new Date(entry.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
        <p className="text-xs text-gray-400 line-clamp-2">{preview}</p>
        {tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-0.5">
            {tags.slice(0, 2).map((t, i) => (
              <span key={i} className="text-[10px] text-gray-500">#{t}</span>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div layout onClick={() => onSelect(entry)} className={`p-4 ${cellClass}`}>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs text-gray-500">
          {new Date(entry.created_at).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
        </p>
        {entry.is_pinned && <Pin className="w-4 h-4 text-gray-400 ml-auto" />}
      </div>
      <p className="text-sm text-gray-300 line-clamp-3 mb-2">{preview}</p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.slice(0, 4).map((t, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">#{t}</span>
          ))}
        </div>
      )}
      {hasMedia && (
        <div className="flex gap-1">
          {entry.media_urls.slice(0, 2).map((m, i) => (
            m.type === 'image' ? (
              <img key={i} src={m.url} alt="" className="w-10 h-10 object-cover rounded" />
            ) : (
              <div key={i} className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center">
                {m.type === 'audio' ? <Mic className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </div>
            )
          ))}
        </div>
      )}
    </motion.div>
  );
}

function EntryViewer({ entry, onClose, onEdit, onExport, onAddAnnotation, onSaveAnnotations, userId }) {
  if (!entry) return null;
  const config = ELEMENT_CONFIG[entry.ai_element] || ELEMENT_CONFIG.Éther;
  const annotations = entry.annotations || [];
  const [showExport, setShowExport] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [localAnnotations, setLocalAnnotations] = useState(annotations);

  useEffect(() => {
    setLocalAnnotations(entry.annotations || []);
  }, [entry.id, entry.annotations]);

  const handleAddAnnotation = () => {
    const content = newAnnotation.trim();
    if (!content) return;
    const next = [...localAnnotations, { id: crypto.randomUUID?.() || Date.now().toString(), content, createdAt: new Date().toISOString() }];
    setLocalAnnotations(next);
    setNewAnnotation('');
    if (userId && onSaveAnnotations) onSaveAnnotations(entry.id, next);
  };

  const handleRemoveAnnotation = (idx) => {
    const next = localAnnotations.filter((_, i) => i !== idx);
    setLocalAnnotations(next);
    if (userId && onSaveAnnotations) onSaveAnnotations(entry.id, next);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <p className="text-xs text-gray-500">
              {new Date(entry.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="font-medium text-[#e5e5e5]" style={{ color: config.color }}>{entry.ai_element || 'Note'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExport((v) => !v)}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-[#e5e5e5] transition"
              title="Exporter"
            >
              <Download className="w-4 h-4" />
            </button>
            {showExport && <ExportMenu entry={entry} onClose={() => setShowExport(false)} />}
          </div>
          <button type="button" onClick={onEdit} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-[#e5e5e5]" title="Modifier">
            <Pencil className="w-4 h-4" />
          </button>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {entry.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.tags.map((t, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-400 border border-gray-700">#{t}</span>
          ))}
        </div>
      )}

      <div className="rounded-xl p-6 bg-[#1a1a1a] border border-gray-800 min-h-[80px]">
        <div
          className="prose prose-invert max-w-none text-[#e5e5e5] text-[15px] leading-relaxed [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_ul]:list-disc [&_ol]:list-decimal [&_p]:mb-2"
          dangerouslySetInnerHTML={{ __html: entry.entry_text || '<p>Aucun contenu.</p>' }}
        />
      </div>

      {entry.media_urls?.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {entry.media_urls.map((m, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-gray-800">
              {m.type === 'image' && <img src={m.url} alt="" className="w-full h-40 object-cover" />}
              {m.type === 'audio' && <audio src={m.url} controls className="w-full" />}
              {m.type === 'video' && <video src={m.url} controls className="w-full h-40 object-cover" />}
              {m.type === 'file' && (
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center h-40 p-4 bg-gray-800/50 hover:bg-gray-800 text-[#e5e5e5]">
                  <FileText className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm truncate w-full text-center">{m.name || 'Fichier'}</span>
                  <span className="text-xs text-gray-500 mt-1">Télécharger</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {entry.ai_quote && (
        <div className="rounded-xl p-5 border border-gray-800 bg-gray-800/30">
          <div className="flex items-start gap-3">
            <Quote className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
            <p className="text-[#e5e5e5]/90 italic">{entry.ai_quote}</p>
          </div>
        </div>
      )}

      {entry.ai_reflection && (
        <div className="rounded-xl p-5 bg-[#1a1a1a] border border-gray-800">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
            <p className="text-[#e5e5e5]/90">{entry.ai_reflection}</p>
          </div>
        </div>
      )}

      {entry.mycelium_link && (
        <div className="rounded-xl p-5 bg-gray-800/30 border border-gray-700">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Lien</p>
          <p className="text-gray-300">{entry.mycelium_link}</p>
        </div>
      )}

      {/* Annotations (post-its) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-500">Annotations</span>
        </div>
        {localAnnotations.map((ann, idx) => (
          <AnnotationPostIt key={ann.id || idx} annotation={ann} onDelete={() => handleRemoveAnnotation(idx)} />
        ))}
        <div className="flex gap-2">
          <input
            type="text"
            value={newAnnotation}
            onChange={(e) => setNewAnnotation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddAnnotation()}
            placeholder="Ajouter une annotation..."
            className="flex-1 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-[#e5e5e5] placeholder-gray-500 text-sm focus:outline-none focus:border-gray-600"
          />
          <button
            type="button"
            onClick={handleAddAnnotation}
            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-[#e5e5e5] text-sm hover:bg-gray-700 transition"
          >
            Ajouter
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const ASSISTANT_ACTIONS = [
  { id: 'résumer', label: 'Résumer cette note', icon: '📝' },
  { id: 'tâches', label: 'Extraire les tâches à faire (To-Do)', icon: '✅' },
  { id: 'réflexion', label: 'Approfondir la réflexion', icon: '🧠' },
  { id: 'tags', label: 'Générer des tags automatiques', icon: '🏷️' },
];

export default function SmartJournal({ onBack, userId, profile, aiCredits = 15, onCreditsRefetch }) {
  const [text, setText] = useState('');
  const [currentTags, setCurrentTags] = useState([]);
  const [tagInputValue, setTagInputValue] = useState('');
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
  const [editTags, setEditTags] = useState([]);
  const [editTagInput, setEditTagInput] = useState('');
  const [editAnnotations, setEditAnnotations] = useState([]);
  const [editNewAnnotationText, setEditNewAnnotationText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sortOrder, setSortOrder] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(70);
  const [viewMode, setViewMode] = useState('timeline');
  const [mainView, setMainView] = useState('journal'); // 'journal' | 'explorer'

  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState(null);
  const [projectEditId, setProjectEditId] = useState(null);
  const [projectEditName, setProjectEditName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [addingProject, setAddingProject] = useState(false);

  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantResult, setAssistantResult] = useState(null);
  const [assistantActionType, setAssistantActionType] = useState(null);
  const [showCreditsExhaustedModal, setShowCreditsExhaustedModal] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const scannerInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const assistantDropdownRef = useRef(null);

  const plainLength = stripHtml(text).length;
  const canSubmit = plainLength >= MIN_CHARS;
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
    const entries = await getJournalEntries(userId, 100, projectFilter || undefined);
    setArchives(entries || []);
  }, [userId, projectFilter]);

  useEffect(() => {
    fetchArchives();
  }, [fetchArchives]);

  useEffect(() => {
    if (!userId) return;
    getProjects(userId).then(setProjects);
  }, [userId]);

  const handleCreateProject = async () => {
    if (!userId || !newProjectName.trim()) return;
    const p = await createProject(userId, { name: newProjectName.trim() });
    if (p) {
      setProjects((prev) => [...prev, p]);
      setNewProjectName('');
      setAddingProject(false);
    }
  };

  const handleRenameProject = async (id, name) => {
    if (!userId || !name?.trim()) return;
    const updated = await updateProject(userId, id, { name: name.trim() });
    if (updated) {
      setProjects((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setProjectEditId(null);
      setProjectEditName('');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!userId) return;
    if (!window.confirm('Supprimer ce projet ? Les notes ne seront pas supprimées.')) return;
    const ok = await deleteProject(userId, id);
    if (ok) {
      setProjects((prev) => prev.filter((x) => x.id !== id));
      if (projectFilter === id) setProjectFilter(null);
    }
  };

  const uniqueTags = [...new Set(archives.flatMap((e) => e.tags || []).filter(Boolean))].sort();

  const sortedArchives = [...archives]
    .filter((e) => {
      const matchSearch = !searchQuery || stripHtml(e.entry_text || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchTag = !filterTag || (e.tags || []).includes(filterTag);
      return matchSearch && matchTag;
    })
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      if (sortOrder === 'recent') return new Date(b.created_at) - new Date(a.created_at);
      if (sortOrder === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortOrder === 'custom') return (a.custom_order || 0) - (b.custom_order || 0);
      return 0;
    });

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const mediaType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : 'file';
      setPendingMedia((prev) => [...prev, { file, url: URL.createObjectURL(file), type: mediaType, name: file.name, pending: true }]);
    });
    e.target.value = '';
  };

  const handleScanManuscript = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.target.value = '';
    setOcrLoading(true);
    setError(null);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          resolve(typeof result === 'string' ? result.replace(/^data:image\/\w+;base64,/, '') : '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error: fnError } = await supabase.functions.invoke('ocr-vision', {
        body: { image_base64: base64, media_type: file.type },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      const transcribed = data?.text?.trim() || '';
      if (transcribed) setText((prev) => (prev ? `${prev}<p></p><p>${transcribed.replace(/\n/g, '</p><p>')}</p>` : `<p>${transcribed.replace(/\n/g, '</p><p>')}</p>`));
      setPendingMedia((prev) => [...prev, { file, url: URL.createObjectURL(file), type: 'image', name: file.name, pending: true }]);
    } catch (err) {
      setError(err?.message || 'Erreur lors de la numérisation');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleAttachmentUpload = (e) => {
    handleFileUpload(e, 'file');
  };

  const removePendingMedia = (idx) => {
    setPendingMedia((prev) => {
      const toRemove = prev[idx];
      if (toRemove?.url?.startsWith('blob:')) URL.revokeObjectURL(toRemove.url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleAddTag = (tag) => {
    const t = (tag || '').trim().replace(/^#/, '');
    if (t && !currentTags.includes(t)) setCurrentTags((prev) => [...prev, t]);
  };

  const handleRemoveTag = (idx) => setCurrentTags((prev) => prev.filter((_, i) => i !== idx));

  const handleAnalyze = async () => {
    if (!canSubmit || isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);
    setAiResult(null);
    setSelectedEntry(null);

    try {
      const plainText = stripHtml(text);
      const detectedElement = detectElementFromText(plainText);
      const contextEntries = await getSmartContextEntries(userId, detectedElement);
      const result = await analyzeJournalEntry(text, contextEntries, useMock);
      setAiResult(result);
      setResponseSource(result._source);

      if (userId) {
        const saved = await saveCompanionJournalEntry(userId, { entry_text: text, aiResponse: result, tags: currentTags, project_id: projectFilter || undefined });
        if (saved && pendingMedia.length > 0) {
          const uploadedMedia = [];
          for (const media of pendingMedia) {
            if (media.file) {
              const uploaded = await uploadJournalMedia(userId, saved.id, media.file);
              if (uploaded) uploadedMedia.push(uploaded);
            }
          }
          if (uploadedMedia.length > 0) {
            await updateJournalWithMedia(userId, saved.id, { media_urls: uploadedMedia, mycelium_link: result.mycelium_link });
            saved.media_urls = uploadedMedia;
            saved.mycelium_link = result.mycelium_link;
          }
        }
        if (saved) {
          setArchives((prev) => [{ ...saved, tags: currentTags }, ...prev]);
          setPendingMedia([]);
          setCurrentTags([]);
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
    setCurrentTags([]);
  };

  const handleSelectEntry = (entry) => {
    setSelectedEntry(entry);
    setAiResult(null);
    setIsEditing(false);
  };

  const handleEditEntry = () => {
    if (!selectedEntry) return;
    setEditText(selectedEntry.entry_text || '');
    setEditTags(selectedEntry.tags || []);
    setEditAnnotations(selectedEntry.annotations || []);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!userId || !selectedEntry) return;
    const updated = await updateJournalEntry(userId, selectedEntry.id, {
      entry_text: editText,
      tags: editTags,
      annotations: editAnnotations,
    });
    if (updated) {
      setArchives((prev) => prev.map((e) => (e.id === selectedEntry.id ? { ...e, entry_text: editText, tags: editTags, annotations: editAnnotations } : e)));
      setSelectedEntry((prev) => (prev && prev.id === selectedEntry.id ? { ...prev, entry_text: editText, tags: editTags, annotations: editAnnotations } : prev));
      setIsEditing(false);
    }
  };

  const handleSaveAnnotations = async (entryId, annotations) => {
    if (!userId) return;
    const updated = await updateJournalEntry(userId, entryId, { annotations });
    if (updated) {
      setArchives((prev) => prev.map((e) => (e.id === entryId ? { ...e, annotations } : e)));
      setSelectedEntry((prev) => (prev && prev.id === entryId ? { ...prev, annotations } : prev));
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!userId) return;
    const success = await deleteJournalEntry(userId, entryId);
    if (success) {
      setArchives((prev) => prev.filter((e) => e.id !== entryId));
      if (selectedEntry?.id === entryId) setSelectedEntry(null);
    }
  };

  const handlePinEntry = async (entry) => {
    if (!userId || !supabase) return;
    const newPinned = !entry.is_pinned;
    const { error } = await supabase.from('user_journal').update({ is_pinned: newPinned }).eq('id', entry.id).eq('user_id', userId);
    if (!error) setArchives((prev) => prev.map((e) => (e.id === entry.id ? { ...e, is_pinned: newPinned } : e)));
  };

  const handleAssistantAction = async (actionType) => {
    setAssistantOpen(false);
    const noteText = viewMode === 'compose' ? stripHtml(text) : (selectedEntry ? stripHtml(selectedEntry.entry_text || '') : '');
    if (!noteText || noteText.length < 10) {
      setError('Écrivez au moins quelques lignes pour utiliser l’assistant.');
      return;
    }
    if ((aiCredits ?? 15) <= 0) {
      setShowCreditsExhaustedModal(true);
      return;
    }
    setAssistantLoading(true);
    setAssistantResult(null);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('journal-assistant', {
        body: { note_text: noteText, action_type: actionType },
      });
      if (fnError) throw fnError;
      if (data?.error && data?.code === 'CREDITS_EXHAUSTED') {
        setShowCreditsExhaustedModal(true);
        setAssistantLoading(false);
        return;
      }
      const status = data?.status ?? (data?.result != null ? 200 : 500);
      if (status === 402) {
        setShowCreditsExhaustedModal(true);
        setAssistantLoading(false);
        return;
      }
      if (data?.error) throw new Error(data.error);
      setAssistantResult({ result: data.result, action_type: data.action_type || actionType });
      onCreditsRefetch?.();
    } catch (err) {
      const msg = err?.message || 'Erreur assistant';
      if (msg.includes('402') || msg.includes('Crédits')) setShowCreditsExhaustedModal(true);
      else setError(msg);
    } finally {
      setAssistantLoading(false);
    }
  };

  const insertAssistantResultIntoNote = () => {
    if (!assistantResult) return;
    const r = assistantResult.result;
    const toInsert = Array.isArray(r) ? r.map((t) => `#${t}`).join(' ') : (typeof r === 'string' ? r : JSON.stringify(r));
    if (viewMode === 'compose') {
      setText((prev) => (prev ? `${prev}<p>${toInsert.replace(/\n/g, '</p><p>')}</p>` : `<p>${toInsert.replace(/\n/g, '</p><p>')}</p>`));
      if (Array.isArray(r)) setCurrentTags((prev) => [...new Set([...prev, ...r])]);
    } else if (selectedEntry && isEditing) {
      setEditText((prev) => (prev ? `${prev}<p>${toInsert.replace(/\n/g, '</p><p>')}</p>` : `<p>${toInsert.replace(/\n/g, '</p><p>')}</p>`));
      if (Array.isArray(r)) setEditTags((prev) => [...new Set([...prev, ...r])]);
    }
    setAssistantResult(null);
  };

  const addAssistantResultAsAnnotation = () => {
    if (!assistantResult || !selectedEntry || !userId) return;
    const r = assistantResult.result;
    const content = Array.isArray(r) ? r.map((t) => `#${t}`).join(' ') : (typeof r === 'string' ? r : JSON.stringify(r));
    const newAnn = { id: crypto.randomUUID?.() || Date.now().toString(), content, createdAt: new Date().toISOString() };
    const next = [...(selectedEntry.annotations || []), newAnn];
    handleSaveAnnotations(selectedEntry.id, next);
    setAssistantResult(null);
  };

  return (
    <div className="smart-journal-page flex flex-col h-[calc(100vh-120px)] gap-4 bg-[var(--sj-bg)] text-[#e5e5e5]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-xl border border-gray-800 bg-[var(--sj-bg-elevated)]">
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex rounded-lg border border-gray-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setMainView('journal')}
              className={`px-3 py-2 text-sm font-medium transition ${mainView === 'journal' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:bg-gray-800/50'}`}
            >
              Journal
            </button>
            <button
              type="button"
              onClick={() => setMainView('explorer')}
              className={`px-3 py-2 text-sm font-medium transition flex items-center gap-1.5 ${mainView === 'explorer' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:bg-gray-800/50'}`}
            >
              <FolderOpen className="w-4 h-4" />
              Explorateur
            </button>
          </div>
          {mainView === 'journal' && (
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'timeline' ? 'compose' : 'timeline')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                viewMode === 'compose'
                  ? 'bg-gray-700 text-white border-gray-600'
                  : 'bg-transparent text-gray-400 border-gray-800 hover:bg-gray-800/50'
              }`}
            >
              <Feather className="w-4 h-4 inline mr-2" />
              Nouvelle note
            </button>
          )}
          {mainView === 'journal' && (
            <>
              <div className="relative flex-1 md:flex-initial min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full md:w-48 pl-9 pr-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-sm text-[#e5e5e5] placeholder-gray-500 focus:outline-none focus:border-gray-600"
                />
              </div>
              <div className="relative" ref={assistantDropdownRef}>
            <button
              type="button"
              onClick={() => setAssistantOpen((o) => !o)}
              disabled={assistantLoading || (aiCredits ?? 15) <= 0}
              className={`p-2 rounded-lg border transition ${assistantOpen ? 'bg-gray-700 border-gray-600' : 'border-gray-800 hover:bg-gray-800/50'} ${assistantLoading || (aiCredits ?? 15) <= 0 ? 'opacity-50 cursor-not-allowed' : 'text-gray-400'}`}
              title="Assistant IA"
            >
              <Sparkles className={`w-5 h-5 ${assistantLoading ? 'animate-pulse' : ''}`} />
            </button>
            {assistantOpen && (
              <>
                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setAssistantOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-64 rounded-lg border border-gray-800 bg-[#1a1a1a] shadow-xl py-1">
                  {ASSISTANT_ACTIONS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleAssistantAction(a.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-[#e5e5e5] hover:bg-gray-800 transition"
                    >
                      <span>{a.icon}</span>
                      <span>{a.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
              </div>
            </>
          )}
        </div>
        {mainView === 'journal' && (
        <div className="flex flex-wrap items-center gap-3 border-t border-gray-800 pt-4 md:border-t-0 md:pt-0">
          <div className="flex gap-1">
            {['recent', 'oldest', 'custom'].map((order) => (
              <button
                key={order}
                type="button"
                onClick={() => setSortOrder(order)}
                className={`px-3 py-1.5 rounded-lg text-xs transition ${
                  sortOrder === order ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {order === 'recent' ? 'Récent' : order === 'oldest' ? 'Ancien' : 'Manuel'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 min-w-[180px]">
            <ZoomOut className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <input
              type="range"
              min={ZOOM_LEVELS.MIN}
              max={ZOOM_LEVELS.MAX}
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="flex-1 min-w-0 accent-gray-500"
            />
            <ZoomIn className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-xs text-gray-500 w-8">{zoomLevel}%</span>
          </div>
        </div>
        )}
      </div>

      {mainView === 'explorer' ? (
        <div className="flex-1 min-h-0">
          <ExplorerView
            userId={userId}
            projects={projects}
            onBack={() => setMainView('journal')}
            onSelectNote={(entry) => { setSelectedEntry(entry); setMainView('journal'); }}
          />
        </div>
      ) : (
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Sidebar Projets + filtre par tag */}
        {sidebarOpen && (
          <div className="w-52 flex-shrink-0 border border-gray-800 rounded-xl bg-[var(--sj-bg-elevated)] p-4 overflow-y-auto space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Projets</p>
              <button
                type="button"
                onClick={() => setProjectFilter(null)}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-sm mb-1 transition ${!projectFilter ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
              >
                Tous
              </button>
              {projects.map((p) => (
                <div key={p.id} className="flex items-center gap-1 group mb-1">
                  {projectEditId === p.id ? (
                    <>
                      <input
                        type="text"
                        value={projectEditName}
                        onChange={(e) => setProjectEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameProject(p.id, projectEditName)}
                        className="flex-1 min-w-0 px-2 py-1 rounded bg-gray-800 text-[#e5e5e5] text-xs"
                        autoFocus
                      />
                      <button type="button" onClick={() => handleRenameProject(p.id, projectEditName)} className="p-1 text-gray-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setProjectFilter(projectFilter === p.id ? null : p.id)}
                        className={`flex-1 text-left truncate px-2 py-1.5 rounded-lg text-sm transition border-l-2 pl-2 ${projectFilter === p.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                        style={{ borderColor: p.color || '#6B7280' }}
                      >
                        {p.name}
                      </button>
                      <button type="button" onClick={() => { setProjectEditId(p.id); setProjectEditName(p.name); }} className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => handleDeleteProject(p.id)} className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                </div>
              ))}
              {addingProject ? (
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProject(); if (e.key === 'Escape') setAddingProject(false); }}
                    placeholder="Nom du projet"
                    className="flex-1 min-w-0 px-2 py-1 rounded bg-gray-800 text-[#e5e5e5] text-xs placeholder-gray-500"
                    autoFocus
                  />
                  <button type="button" onClick={handleCreateProject} className="p-1 text-gray-400 hover:text-white"><Plus className="w-4 h-4" /></button>
                  <button type="button" onClick={() => { setAddingProject(false); setNewProjectName(''); }} className="p-1 text-gray-400"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => setAddingProject(true)} className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 hover:text-gray-400">
                  <Plus className="w-3.5 h-3.5" /> Nouveau projet
                </button>
              )}
            </div>
            <div className="pt-3 border-t border-gray-800">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Filtrer par tag</p>
            {uniqueTags.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun tag</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {uniqueTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterTag(filterTag === t ? null : t)}
                    className={`px-2 py-1 rounded-lg text-xs transition ${
                      filterTag === t ? 'bg-gray-700 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            )}
            </div>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto ${viewMode === 'compose' ? 'hidden md:block' : ''}`}>
          {sortedArchives.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">{searchQuery || filterTag ? 'Aucun résultat' : 'Aucune note pour le moment'}</p>
                <p className="text-gray-600 text-sm mt-2">Créez votre première note ci-dessus.</p>
              </div>
            </div>
          ) : (
            <div className={`grid gap-3 p-2 ${getGridCols()}`}>
              {sortedArchives.map((entry) => (
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

        <AnimatePresence mode="wait">
          {(viewMode === 'compose' || selectedEntry) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full md:w-[500px] lg:w-[600px] flex-shrink-0 overflow-y-auto"
            >
              <div className="p-6 rounded-xl border border-gray-800 bg-[var(--sj-bg-elevated)] min-h-full">
                {selectedEntry && !isEditing && (
                  <EntryViewer
                    entry={selectedEntry}
                    onClose={() => setSelectedEntry(null)}
                    onEdit={handleEditEntry}
                    onSaveAnnotations={handleSaveAnnotations}
                    userId={userId}
                  />
                )}

                {isEditing && selectedEntry && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-[#e5e5e5]">Modifier la note</h2>
                      <button type="button" onClick={() => setIsEditing(false)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <RichTextEditor value={editText} onChange={setEditText} placeholder="Contenu de la note..." minHeight="200px" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tags</p>
                      <TagPills tags={editTags} onRemove={(i) => setEditTags((prev) => prev.filter((_, j) => j !== i))} />
                      <TagInput
                        value={editTagInput}
                        onChange={setEditTagInput}
                        onAdd={(t) => { setEditTags((prev) => (prev.includes(t) ? prev : [...prev, t])); setEditTagInput(''); }}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Annotations</p>
                      {editAnnotations.map((ann, idx) => (
                        <div key={ann.id || idx} className="flex gap-2 items-start mb-2">
                          <div className="flex-1 rounded-lg p-2 bg-amber-500/10 border border-amber-500/20 text-sm">{ann.content}</div>
                          <button type="button" onClick={() => setEditAnnotations((prev) => prev.filter((_, i) => i !== idx))} className="p-1 text-gray-500 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={editNewAnnotationText}
                          onChange={(e) => setEditNewAnnotationText(e.target.value)}
                          placeholder="Nouvelle annotation..."
                          className="flex-1 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-sm text-[#e5e5e5] placeholder-gray-500 focus:outline-none focus:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const content = editNewAnnotationText.trim() || 'Nouvelle annotation';
                            setEditAnnotations((prev) => [...prev, { id: crypto.randomUUID?.() || Date.now().toString(), content, createdAt: new Date().toISOString() }]);
                            setEditNewAnnotationText('');
                          }}
                          className="px-3 py-2 rounded-lg border border-gray-700 text-sm text-gray-400 hover:bg-gray-800"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="px-6 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white font-medium hover:bg-gray-600 transition"
                      >
                        Enregistrer
                      </button>
                      <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 transition">
                        Annuler
                      </button>
                    </div>
                  </motion.div>
                )}

                {viewMode === 'compose' && !selectedEntry && !aiResult && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <div className="text-center mb-6">
                      <h1 className="text-xl font-semibold text-[#e5e5e5] flex items-center justify-center gap-2">
                        <Feather className="w-5 h-5" />
                        Nouvelle note
                      </h1>
                      <p className="text-gray-500 text-sm mt-1">Rédigez votre note. Vous pouvez ajouter des tags et demander une analyse.</p>
                    </div>

                    <div className="rounded-xl border border-gray-800 bg-[#1a1a1a] overflow-hidden mb-4">
                      <RichTextEditor
                        value={text}
                        onChange={setText}
                        placeholder="Écrivez votre note ici…"
                        minHeight="200px"
                        disabled={isAnalyzing}
                      />
                      <div className="px-4 py-2 border-t border-gray-800">
                        <p className="text-xs text-gray-500 mb-1">Tags (optionnel)</p>
                        <TagPills tags={currentTags} onRemove={handleRemoveTag} />
                        <TagInput value={tagInputValue} onChange={setTagInputValue} onAdd={handleAddTag} />
                      </div>
                      <MediaPreview media={pendingMedia} onRemove={removePendingMedia} />
                      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                        <div className="flex items-center gap-2">
                          <input ref={scannerInputRef} type="file" accept="image/*" onChange={handleScanManuscript} className="hidden" />
                          <button type="button" onClick={() => scannerInputRef.current?.click()} disabled={ocrLoading} className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 disabled:opacity-50" title="Numériser un manuscrit (OCR)">
                            {ocrLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanLine className="w-5 h-5" />}
                          </button>
                          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => handleFileUpload(e, 'image')} className="hidden" />
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg hover:bg-gray-800 text-gray-500" title="Image">
                            <Image className="w-5 h-5" />
                          </button>
                          <input ref={audioInputRef} type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'audio')} className="hidden" />
                          <button type="button" onClick={() => audioInputRef.current?.click()} className="p-2 rounded-lg hover:bg-gray-800 text-gray-500" title="Audio">
                            <Mic className="w-5 h-5" />
                          </button>
                          <input ref={videoInputRef} type="file" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} className="hidden" />
                          <button type="button" onClick={() => videoInputRef.current?.click()} className="p-2 rounded-lg hover:bg-gray-800 text-gray-500" title="Vidéo">
                            <Video className="w-5 h-5" />
                          </button>
                          <input ref={attachmentInputRef} type="file" accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" multiple onChange={handleAttachmentUpload} className="hidden" />
                          <button type="button" onClick={() => attachmentInputRef.current?.click()} className="p-2 rounded-lg hover:bg-gray-800 text-gray-500" title="Pièce jointe (PDF, Word, etc.)">
                            <Paperclip className="w-5 h-5" />
                          </button>
                        </div>
                        <span className={`text-xs ${canSubmit ? 'text-gray-400' : 'text-gray-600'}`}>
                          {plainLength}/{MIN_CHARS}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      {!isAnalyzing ? (
                        <motion.button
                          type="button"
                          animate={{ opacity: canSubmit ? 1 : 0.5 }}
                          onClick={handleAnalyze}
                          disabled={!canSubmit}
                          className="px-8 py-4 rounded-xl font-medium border border-gray-600 bg-gray-800 text-[#e5e5e5] hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <span className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Analyser la note
                          </span>
                        </motion.button>
                      ) : (
                        <div className="flex flex-col items-center gap-4 py-6">
                          <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
                          <p className="text-gray-500 text-sm">Analyse en cours…</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {aiResult && (
                  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                    <div className="rounded-xl p-6 border border-gray-800 bg-[#1a1a1a]">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl border border-gray-700" style={{ background: `${elementConfig.color}20` }}>
                          {elementConfig.icon}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Thème</p>
                          <p className="text-lg font-semibold" style={{ color: elementConfig.color }}>{aiResult.element}</p>
                        </div>
                      </div>
                    </div>
                    {aiResult.quote && (
                      <div className="rounded-xl p-5 border border-gray-800 bg-gray-800/30">
                        <div className="flex items-start gap-3">
                          <Quote className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                          <p className="text-[#e5e5e5]/90 italic">{aiResult.quote}</p>
                        </div>
                      </div>
                    )}
                    {aiResult.reflection && (
                      <div className="rounded-xl p-5 bg-[#1a1a1a] border border-gray-800">
                        <div className="flex items-start gap-3">
                          <HelpCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                          <p className="text-[#e5e5e5]/90">{aiResult.reflection}</p>
                        </div>
                      </div>
                    )}
                    {aiResult.mycelium_link && (
                      <div className="rounded-xl p-5 bg-gray-800/30 border border-gray-700">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Lien</p>
                        <p className="text-gray-300">{aiResult.mycelium_link}</p>
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-3 pt-4">
                      {responseSource && (
                        <span className="text-xs px-3 py-1.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                          {responseSource === 'claude' ? 'Claude' : responseSource === 'codex-fallback' ? 'Analyse locale' : 'Simulation'}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-3 rounded-lg text-sm font-medium border border-gray-700 text-gray-400 hover:bg-gray-800 transition"
                      >
                        Nouvelle note
                      </button>
                    </div>
                  </motion.div>
                )}

                {assistantLoading && (
                <div className="mt-4 flex items-center gap-2 py-2 text-gray-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Assistant IA en cours…
                </div>
              )}

              {assistantResult && (
                <div className="mt-4 rounded-xl border border-gray-700 bg-gray-800/50 p-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Résultat</p>
                  <div className="text-[#e5e5e5] text-sm whitespace-pre-wrap mb-4">
                    {Array.isArray(assistantResult.result)
                      ? assistantResult.result.map((t, i) => (
                          <span key={i} className="inline-block mr-2 mb-1 px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                            #{t}
                          </span>
                        ))
                      : String(assistantResult.result)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={insertAssistantResultIntoNote}
                      className="px-3 py-1.5 rounded-lg bg-gray-700 text-[#e5e5e5] text-sm hover:bg-gray-600 transition"
                    >
                      Insérer dans la note
                    </button>
                    {selectedEntry && !isEditing && (
                      <button
                        type="button"
                        onClick={addAssistantResultAsAnnotation}
                        className="px-3 py-1.5 rounded-lg border border-gray-600 text-gray-400 text-sm hover:bg-gray-800 transition"
                      >
                        Ajouter comme annotation
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setAssistantResult(null)}
                      className="px-3 py-1.5 rounded-lg border border-gray-600 text-gray-500 text-sm hover:bg-gray-800 transition"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
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
      )}

      {onBack && (
        <button type="button" onClick={onBack} className="text-gray-500 text-sm hover:text-gray-400 transition mx-auto">
          ← Retour au tableau de bord
        </button>
      )}

      <p className="text-center text-xs text-gray-600">Vos données sont privées entre vous et l’IA, mais stockées sur nos serveurs de manière standard.</p>

      {showCreditsExhaustedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" aria-modal="true">
          <div className="rounded-2xl border border-gray-700 bg-[#1a1a1a] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#e5e5e5]">Crédits IA épuisés</h3>
                <p className="text-sm text-gray-400 mt-0.5">Passez à la version Premium pour continuer à utiliser l’assistant IA.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreditsExhaustedModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-600 text-gray-400 hover:bg-gray-800 transition"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => { setShowCreditsExhaustedModal(false); onBack?.(); }}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-700 text-[#e5e5e5] hover:bg-gray-600 transition font-medium"
              >
                Voir les offres Premium
              </button>
            </div>
          </div>
        </div>
      )}

      {import.meta.env.DEV && (
        <div className="text-center pb-2">
          <label className="flex items-center justify-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={useMock} onChange={(e) => setUseMock(e.target.checked)} className="rounded" />
            Forcer l’analyse locale (sans Claude)
          </label>
        </div>
      )}
    </div>
  );
}
