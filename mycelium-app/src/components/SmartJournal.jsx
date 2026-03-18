import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Loader2, Feather, Quote, HelpCircle, BookOpen,
  Pin, Pencil, Trash2, X, Search, Image, Mic, Video, ZoomIn, ZoomOut, StickyNote,
  Download, FileText, FileDown, ChevronDown, ListTodo, Brain, Tag, ScanLine, Paperclip,
  FolderOpen, Plus, Maximize2, Minimize2, Menu, ChevronLeft, PanelRightOpen
} from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import ExplorerView from './ExplorerView';
import ProjectView from './ProjectView';
import NotesViewControls from './NotesViewControls';
import MentorUpsellModal from './MentorUpsellModal';
import MentorPanel from './MentorPanel';
import MediaViewer from './MediaViewer';
import SplitNoteEditor from './SplitNoteEditor';
import { supabase } from '../supabaseClient';
import {
  getPastJournalEntries,
  saveCompanionJournalEntry,
  saveJournalEntry,
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

function MediaPreview({ media, onRemove, onOpenSide }) {
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
          {onOpenSide && item?.url && (
            <button
              type="button"
              onClick={() => onOpenSide(item)}
              className="absolute bottom-1 right-1 p-1.5 rounded-md bg-black/60 border border-white/10 text-white opacity-0 group-hover:opacity-100 transition"
              title="Ouvrir à côté"
            >
              <PanelRightOpen className="w-4 h-4" />
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

function EntryViewer({ entry, onClose, onEdit, onDelete, onExport, onAddAnnotation, onSaveAnnotations, userId, onOpenMediaSide }) {
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
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-red-300"
              title="Supprimer la note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
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
              {onOpenMediaSide && m?.url && (
                <div className="p-2 border-t border-gray-800 bg-[#141414]">
                  <button
                    type="button"
                    onClick={() => onOpenMediaSide(m)}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-800/60 transition text-sm"
                    title="Ouvrir à côté"
                  >
                    <PanelRightOpen className="w-4 h-4" />
                    Ouvrir à côté
                  </button>
                </div>
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
  const [pageAppearance, setPageAppearance] = useState('default');
  const [newAnnotations, setNewAnnotations] = useState([]);
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
  const [openTabs, setOpenTabs] = useState([{ id: 'new', label: 'Nouvelle note' }]);
  const [activeTabId, setActiveTabId] = useState('new'); // 'new' ou entry.id
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
  const [activeProjectId, setActiveProjectId] = useState(null);
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
  const [focusMode, setFocusMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'editor' | 'sidebar'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isPremium = profile?.is_premium === true;
  const [mentorOpen, setMentorOpen] = useState(false);
  const [mentorUpsellOpen, setMentorUpsellOpen] = useState(false);
  const [mentorContext, setMentorContext] = useState('');
  const [mentorLoading, setMentorLoading] = useState(false);
  const [mentorAdvice, setMentorAdvice] = useState('');

  const [density, setDensity] = useState('comfortable'); // 'comfortable' | 'compact'
  const [splitView, setSplitView] = useState(null); // null | { type: 'media', media } | { type: 'note', entryId }

  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const scannerInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const assistantDropdownRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(!!mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener('change', update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', update);
      else mq.removeListener(update);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileSidebarOpen(false);
      setMobileView('list');
    } else {
      // Sur mobile, si une note est sélectionnée, on privilégie l'éditeur
      if (selectedEntry || activeTabId !== 'new') setMobileView('editor');
    }
  }, [isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isMobile && splitView) setSplitView(null);
  }, [isMobile, splitView]);

  const openSplitMedia = (media) => {
    if (isMobile) return;
    setSplitView({ type: 'media', media });
  };

  const openSplitNote = (entryId) => {
    if (isMobile) return;
    setSplitView({ type: 'note', entryId });
  };

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
      if (activeProjectId === id) setActiveProjectId(null);
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
    setActiveTabId('new');
    if (isMobile) setMobileView('editor');
  };

  const handleSelectEntry = (entry) => {
    setSelectedEntry(entry);
    setAiResult(null);
    setIsEditing(false);
    setViewMode('timeline');
    setActiveTabId(entry.id);
    setOpenTabs((prev) => (prev.some((t) => t.id === entry.id) ? prev : [...prev, { id: entry.id, label: 'Note' }]));
    if (isMobile) setMobileView('editor');
  };

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const autosaveRef = useRef(null);

  const handleEditEntry = () => {
    if (!selectedEntry) return;
    setEditText(selectedEntry.entry_text || '');
    setEditTags(selectedEntry.tags || []);
    setEditAnnotations(selectedEntry.annotations || []);
    setIsEditing(true);
  };

  const handleNewNoteTab = () => {
    setSelectedEntry(null);
    setIsEditing(false);
    setAiResult(null);
    setActiveTabId('new');
    setViewMode('compose');
    setNewAnnotations([]);
    if (isMobile) setMobileView('editor');
  };

  const handleCloseTab = (id) => {
    if (id === 'new') return;
    setOpenTabs((prev) => prev.filter((t) => t.id !== id));
    if (activeTabId === id) {
      setActiveTabId('new');
      setSelectedEntry(null);
      setIsEditing(false);
      setViewMode('compose');
    }
  };

  useEffect(() => {
    if (activeTabId === 'new') return;
    const entry = archives.find((e) => e.id === activeTabId);
    if (entry) setSelectedEntry(entry);
  }, [activeTabId, archives]);

  const handleSaveEdit = async () => {
    if (!userId || !selectedEntry || isSaving) return;
    setIsSaving(true);
    const updated = await updateJournalEntry(userId, selectedEntry.id, {
      entry_text: editText,
      tags: editTags,
      annotations: editAnnotations,
      project_id: projectFilter || selectedEntry.project_id || null,
    });
    if (updated) {
      setArchives((prev) =>
        prev.map((e) =>
          e.id === selectedEntry.id ? { ...e, entry_text: updated.entry_text, tags: updated.tags, annotations: updated.annotations, project_id: updated.project_id } : e,
        ),
      );
      setSelectedEntry((prev) =>
        prev && prev.id === selectedEntry.id
          ? { ...prev, entry_text: updated.entry_text, tags: updated.tags, annotations: updated.annotations, project_id: updated.project_id }
          : prev,
      );
      setLastSavedAt(new Date());
      setIsEditing(false);
    }
    setIsSaving(false);
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
    const ok = window.confirm('Supprimer cette note ? Cette action est irréversible.');
    if (!ok) return;
    const success = await deleteJournalEntry(userId, entryId);
    if (success) {
      setArchives((prev) => prev.filter((e) => e.id !== entryId));
      if (selectedEntry?.id === entryId) setSelectedEntry(null);
      setOpenTabs((prev) => prev.filter((t) => t.id !== entryId));
      if (activeTabId === entryId) setActiveTabId('new');
    } else {
      setError("La note n'a pas pu être supprimée (vérifie tes droits RLS / connexion).");
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

  const handleManualSaveNew = async () => {
    if (!userId || !text || !stripHtml(text).trim()) return;
    if (isSaving) return;
    setIsSaving(true);
    try {
      const saved = await saveJournalEntry(userId, {
        entry_text: text,
        tags: currentTags,
        project_id: projectFilter || null,
      });
      if (saved) {
        if (newAnnotations.length > 0) {
          await updateJournalEntry(userId, saved.id, { annotations: newAnnotations });
        }
        setArchives((prev) => [{ ...saved, tags: currentTags }, ...prev]);
        setLastSavedAt(new Date());
        setNewAnnotations([]);
      }
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isEditing || !userId || !selectedEntry) return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(async () => {
      if (isSaving) return;
      setIsSaving(true);
      try {
        const updated = await updateJournalEntry(userId, selectedEntry.id, {
          entry_text: editText,
          tags: editTags,
          annotations: editAnnotations,
          project_id: projectFilter || selectedEntry.project_id || null,
        });
        if (updated) {
          setArchives((prev) =>
            prev.map((e) =>
              e.id === selectedEntry.id ? { ...e, entry_text: updated.entry_text, tags: updated.tags, annotations: updated.annotations, project_id: updated.project_id } : e,
            ),
          );
          setSelectedEntry((prev) =>
            prev && prev.id === selectedEntry.id
              ? { ...prev, entry_text: updated.entry_text, tags: updated.tags, annotations: updated.annotations, project_id: updated.project_id }
              : prev,
          );
          setLastSavedAt(new Date());
        }
      } finally {
        setIsSaving(false);
      }
    }, 3000);
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
    };
  }, [userId, selectedEntry, isEditing, editText, editTags, editAnnotations, projectFilter, isSaving]);

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

  const ResizeHandle = () => (
    <PanelResizeHandle className="w-1 flex items-center justify-center">
      <div className="w-px h-8 bg-gray-800/80" />
    </PanelResizeHandle>
  );

  const getEntryTitle = (entry) => {
    const t = stripHtml(entry?.entry_text || '');
    if (!t) return 'Sans titre';
    return t.split('\n')[0].slice(0, 60);
  };

  const assistantButton = (
    <div className="relative" ref={assistantDropdownRef}>
      <button
        type="button"
        onClick={() => setAssistantOpen((o) => !o)}
        disabled={assistantLoading || (aiCredits ?? 15) <= 0}
        className="px-3 py-2 rounded-lg text-sm border border-gray-700 text-gray-200 hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        ✨ Assistant
      </button>
      {assistantOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-gray-800 bg-[#111] shadow-xl py-1 z-30">
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
      )}
    </div>
  );

  const handleMentorClick = () => {
    if (!isPremium) {
      setMentorUpsellOpen(true);
      return;
    }
    setMentorOpen((v) => !v);
  };

  const requestMentorAdvice = async (contextText) => {
    if (!userId || !supabase) return;
    if (!isPremium) {
      setMentorUpsellOpen(true);
      return;
    }
    const contentHtml = activeTabId === 'new'
      ? text
      : (isEditing ? editText : (selectedEntry?.entry_text || ''));
    const contentPlain = stripHtml(contentHtml || '').trim();
    if (!contentPlain || contentPlain.length < 20) {
      setMentorAdvice('• Ajoutez quelques lignes au brouillon pour que je puisse vous conseiller sur la structure.');
      return;
    }
    setMentorLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('writing-coach', {
        body: { context: (contextText || '').trim(), content: contentPlain },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setMentorAdvice(data?.result || '');
    } catch (err) {
      const msg = err?.message || 'Erreur Mentor';
      if (String(msg).includes('403') || String(msg).toLowerCase().includes('premium') || String(msg).toLowerCase().includes('abonnement')) setMentorUpsellOpen(true);
      else setMentorAdvice(`• ${msg}`);
    } finally {
      setMentorLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col gap-4 bg-[#0D0D0D] text-[#e5e5e5]">
      <div className="m-6 mb-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-2xl border border-gray-800 bg-[#1A1A1A] shadow-2xl shadow-black/70">
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex rounded-lg border border-gray-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setMainView('journal')}
              className={`px-3 py-2 text-sm font-medium transition ${mainView === 'journal' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:bg-gray-800/50'}`}
            >
              Journal
            </button>
            {/* Explorateur désactivé */}
          </div>
          {mainView === 'journal' && (
            <button
              type="button"
              onClick={handleNewNoteTab}
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
          {/* Recherche déplacée dans la colonne Notes */}
        </div>
        {/* Tri déplacé dans la colonne Notes (localité) */}
      </div>

      {activeProjectId ? (
        <div className="flex-1 min-h-0">
          <ProjectView
            project={projects.find((p) => p.id === activeProjectId)}
            userId={userId}
            onBack={() => setActiveProjectId(null)}
            onOpenNote={(entryOrId) => {
              const entry = entryOrId?.id && !entryOrId.entry_text
                ? archives.find((e) => e.id === entryOrId.id)
                : entryOrId;
              if (entry) {
                setSelectedEntry(entry);
                setActiveProjectId(null);
              }
            }}
            onRenameProject={(updated) => setProjects((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
            onDeleteProject={(id) => { setProjects((prev) => prev.filter((x) => x.id !== id)); setActiveProjectId(null); }}
            archivesForProject={archives}
            fetchArchives={fetchArchives}
          />
        </div>
      ) : (
      <div className="flex-1 min-h-0">
        {/* Mobile-first : une seule vue à la fois */}
        {isMobile ? (
          <div className="m-4 mt-0 h-full">
            {/* Drawer Sidebar */}
            {mobileSidebarOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setMobileSidebarOpen(false)} aria-hidden />
                <div className="fixed inset-y-0 left-0 z-50 w-[85vw] max-w-sm bg-[#1A1A1A] border-r border-gray-800 shadow-2xl shadow-black/70 p-4 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-200">Filtres</p>
                    <button type="button" onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Sidebar content (réutilise le même JSX que desktop) */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Projets</p>
                      <button
                        type="button"
                        onClick={() => { setProjectFilter(null); setActiveProjectId(null); setMobileSidebarOpen(false); }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-sm mb-1 transition ${!projectFilter ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                      >
                        Tous
                      </button>
                      {projects.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setProjectFilter(p.id); setActiveProjectId(p.id); setMobileSidebarOpen(false); }}
                          className={`w-full text-left truncate px-2 py-1.5 rounded-lg text-sm transition border-l-2 pl-2 ${projectFilter === p.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
                          style={{ borderColor: p.color || '#6B7280' }}
                        >
                          {p.name}
                        </button>
                      ))}
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
                              onClick={() => { setFilterTag(filterTag === t ? null : t); setMobileSidebarOpen(false); }}
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
                </div>
              </>
            )}

            {/* List view */}
            {mobileView === 'list' && (
              <div className="h-full border border-gray-800 rounded-2xl bg-[#1A1A1A] shadow-2xl shadow-black/70 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                  <button type="button" onClick={() => setMobileSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400" title="Menu">
                    <Menu className="w-5 h-5" />
                  </button>
                  <p className="text-sm text-gray-300">Notes</p>
                  <div className="w-[72px]" />
                </div>
                <NotesViewControls zoomLevel={zoomLevel} onZoomChange={setZoomLevel} />
                <div className="overflow-y-auto h-full">
                  {sortedArchives.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-6">
                      <div className="text-center">
                        <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500">{searchQuery || filterTag ? 'Aucun résultat' : 'Aucune note pour le moment'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-800">
                      {sortedArchives.map((entry) => {
                        const title = getEntryTitle(entry);
                        const preview = stripHtml(entry.entry_text || '').slice(0, 120);
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => handleSelectEntry(entry)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-800/40 transition"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm text-gray-200 truncate">{title}</p>
                              <p className="text-xs text-gray-500 flex-shrink-0">{new Date(entry.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{preview}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* FAB mobile (inspiration Google Docs) */}
                <button
                  type="button"
                  onClick={handleNewNoteTab}
                  className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-white text-black shadow-xl shadow-black/40 hover:bg-gray-100 active:scale-[0.98] transition flex items-center justify-center"
                  title="Nouvelle note"
                  aria-label="Nouvelle note"
                >
                  <Plus className="w-7 h-7" />
                </button>
              </div>
            )}

            {/* Editor view */}
            {mobileView === 'editor' && (
              <div className="h-full rounded-2xl border border-gray-800 bg-[#111111] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                  <button type="button" onClick={() => setMobileView('list')} className="flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-gray-800 text-gray-300" title="Retour">
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-sm">Retour</span>
                  </button>
                  <p className="text-sm text-gray-300 truncate">Éditeur</p>
                  <button type="button" onClick={() => setMobileSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400" title="Menu">
                    <Menu className="w-5 h-5" />
                  </button>
                </div>
                {/* Réutilise le même contenu éditeur (onglets + editor) déjà rendu dans la colonne droite desktop */}
                <div className="h-full overflow-y-auto p-4">
                  {/* On garde l’expérience onglets existante */}
                  <div className="rounded-2xl border border-gray-800 bg-[#1A1A1A] h-full flex flex-col min-h-0 relative">
                    <div className="flex items-center border-b border-gray-800 bg-[#141414] flex-shrink-0 overflow-x-auto">
                      {openTabs.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            if (t.id === 'new') return handleNewNoteTab();
                            const entry = sortedArchives.find((e) => e.id === t.id) || archives.find((e) => e.id === t.id);
                            if (entry) handleSelectEntry(entry);
                            else setActiveTabId(t.id);
                          }}
                          className={`group flex items-center gap-2 px-4 py-2 text-sm border-r border-gray-800 min-w-0 transition ${
                            activeTabId === t.id ? 'bg-[var(--sj-bg-elevated)] text-[#e5e5e5]' : 'text-gray-400 hover:bg-gray-800/40 hover:text-gray-200'
                          }`}
                        >
                          <span className="truncate">{t.id === 'new' ? 'Nouvelle note' : 'Note'}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0 p-4">
                      {activeTabId !== 'new' && selectedEntry && !isEditing && (
                        <EntryViewer
                          entry={selectedEntry}
                          onClose={() => { setSelectedEntry(null); setMobileView('list'); }}
                          onEdit={handleEditEntry}
                          onDelete={() => handleDeleteEntry(selectedEntry.id)}
                          onSaveAnnotations={handleSaveAnnotations}
                          userId={userId}
                          onOpenMediaSide={openSplitMedia}
                        />
                      )}

                      {activeTabId !== 'new' && isEditing && selectedEntry && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col min-h-[70vh] gap-4">
                          <div className="flex items-center justify-between">
                            <h2 className="text-base font-medium text-[#e5e5e5]">Modifier la note</h2>
                            <button type="button" onClick={() => setIsEditing(false)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <RichTextEditor
                            value={editText}
                            onChange={setEditText}
                            placeholder="Contenu de la note..."
                            minHeight="0"
                            stickyToolbar
                            rightSlot={assistantButton}
                            className="flex-1 min-h-0"
                            pageAppearance={pageAppearance}
                            onPageAppearanceChange={setPageAppearance}
                            annotations={editAnnotations}
                            onAnnotationsChange={setEditAnnotations}
                            isMobile={isMobile}
                            onMentorClick={handleMentorClick}
                            density={density}
                            onDensityChange={setDensity}
                          />

                          <div className="sticky bottom-0 rounded-xl border border-gray-800 bg-white/5 p-4 space-y-3 backdrop-blur">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Tags</p>
                              <TagPills tags={editTags} onRemove={(i) => setEditTags((prev) => prev.filter((_, j) => j !== i))} />
                              <TagInput
                                value={editTagInput}
                                onChange={setEditTagInput}
                                onAdd={(t) => { setEditTags((prev) => (prev.includes(t) ? prev : [...prev, t])); setEditTagInput(''); }}
                              />
                            </div>
                            <div className="flex items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="px-5 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                {isSaving ? 'Enregistrement…' : '💾 Sauvegarder'}
                              </button>
                              {lastSavedAt && (
                                <span className="text-[10px] text-gray-500">Enregistré à {lastSavedAt.toLocaleTimeString()}</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTabId === 'new' && !aiResult && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col min-h-[70vh] gap-4">
                          <div className="rounded-2xl border border-gray-800 bg-[#1a1a1a] overflow-hidden">
                            <RichTextEditor
                              value={text}
                              onChange={setText}
                              placeholder="Écrivez votre note ici…"
                              minHeight="0"
                              disabled={isAnalyzing}
                              stickyToolbar
                              rightSlot={assistantButton}
                              className="flex-1 min-h-0"
                              pageAppearance={pageAppearance}
                              onPageAppearanceChange={setPageAppearance}
                              annotations={newAnnotations}
                              onAnnotationsChange={setNewAnnotations}
                              isMobile={isMobile}
                              onMentorClick={handleMentorClick}
                              density={density}
                              onDensityChange={setDensity}
                            />
                          </div>

                          <div className="sticky bottom-0 rounded-xl border border-gray-800 bg-white/5 p-4 space-y-3 backdrop-blur">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Tags</p>
                              <TagPills tags={currentTags} onRemove={handleRemoveTag} />
                              <TagInput value={tagInputValue} onChange={setTagInputValue} onAdd={handleAddTag} />
                            </div>
                            <MediaPreview media={pendingMedia} onRemove={removePendingMedia} onOpenSide={openSplitMedia} />
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <input ref={scannerInputRef} type="file" accept="image/*" onChange={handleScanManuscript} className="hidden" />
                                <button type="button" onClick={() => scannerInputRef.current?.click()} disabled={ocrLoading} className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 disabled:opacity-50" title="OCR (photo manuscrite)">
                                  {ocrLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanLine className="w-5 h-5" />}
                                </button>
                                <input ref={attachmentInputRef} type="file" accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" multiple onChange={handleAttachmentUpload} className="hidden" />
                                <button type="button" onClick={() => attachmentInputRef.current?.click()} className="p-2 rounded-lg hover:bg-gray-800 text-gray-500" title="Pièce jointe">
                                  <Paperclip className="w-5 h-5" />
                                </button>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={handleManualSaveNew}
                                  disabled={isSaving || !stripHtml(text).trim()}
                                  className="px-5 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                  {isSaving ? 'Enregistrement…' : '💾 Sauvegarder'}
                                </button>
                                {lastSavedAt && (
                                  <span className="text-[10px] text-gray-500">Enregistré à {lastSavedAt.toLocaleTimeString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : focusMode ? (
          <div className="m-6 mt-0 h-full rounded-2xl border border-gray-800 bg-[#1A1A1A] overflow-hidden">
            {/* Panneau éditeur plein écran */}
            <div className="h-full flex flex-col min-h-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#141414]">
                <p className="text-sm text-gray-300">Mode Focus</p>
                <button
                  type="button"
                  onClick={() => setFocusMode(false)}
                  className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition"
                  title="Quitter le mode Focus"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {/* Réutilise le panneau d’onglets existant */}
                <div className="rounded-2xl border border-gray-800 bg-[#1A1A1A] h-full flex flex-col min-h-0">
                  {/* Tabs */}
                  <div className="flex items-center border-b border-gray-800 bg-[#141414] flex-shrink-0 overflow-x-auto">
                    {openTabs.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => (t.id === 'new' ? handleNewNoteTab() : setActiveTabId(t.id))}
                        className={`group flex items-center gap-2 px-4 py-2 text-sm border-r border-gray-800 min-w-0 transition ${
                          activeTabId === t.id ? 'bg-[var(--sj-bg-elevated)] text-[#e5e5e5]' : 'text-gray-400 hover:bg-gray-800/40 hover:text-gray-200'
                        }`}
                      >
                        <span className="truncate">{t.id === 'new' ? 'Nouvelle note' : getEntryTitle(archives.find((e) => e.id === t.id) || selectedEntry)}</span>
                        {t.id !== 'new' && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); handleCloseTab(t.id); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleCloseTab(t.id); } }}
                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-200 transition"
                            aria-label="Fermer"
                          >
                            ×
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-y-auto min-h-0 p-6">
                    {/* contenu existant (réutilisation) */}
                    {activeTabId !== 'new' && selectedEntry && !isEditing && (
                      <EntryViewer
                        entry={selectedEntry}
                        onClose={() => setSelectedEntry(null)}
                        onEdit={handleEditEntry}
                        onDelete={() => handleDeleteEntry(selectedEntry.id)}
                        onSaveAnnotations={handleSaveAnnotations}
                        userId={userId}
                        onOpenMediaSide={openSplitMedia}
                      />
                    )}
                    {activeTabId !== 'new' && isEditing && selectedEntry && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-medium text-[#e5e5e5]">Modifier la note</h2>
                          <button type="button" onClick={() => setIsEditing(false)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <RichTextEditor
                          value={editText}
                          onChange={setEditText}
                          placeholder="Contenu de la note..."
                          minHeight="520px"
                          stickyToolbar
                          rightSlot={assistantButton}
                          pageAppearance={pageAppearance}
                          onPageAppearanceChange={setPageAppearance}
                          annotations={editAnnotations}
                          onAnnotationsChange={setEditAnnotations}
                          isMobile={isMobile}
                          density={density}
                          onDensityChange={setDensity}
                        />
                        {/* Métadonnées en bas */}
                        <div className="rounded-2xl border border-gray-800 bg-white/5 p-6 space-y-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Tags</p>
                            <TagPills tags={editTags} onRemove={(i) => setEditTags((prev) => prev.filter((_, j) => j !== i))} />
                            <TagInput
                              value={editTagInput}
                              onChange={setEditTagInput}
                              onAdd={(t) => { setEditTags((prev) => (prev.includes(t) ? prev : [...prev, t])); setEditTagInput(''); }}
                            />
                          </div>
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              disabled={isSaving}
                              className="px-5 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                              {isSaving ? 'Enregistrement…' : '💾 Sauvegarder'}
                            </button>
                            {lastSavedAt && (
                              <span className="text-[10px] text-gray-500">Enregistré à {lastSavedAt.toLocaleTimeString()}</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                    {activeTabId === 'new' && !aiResult && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                        <div className="rounded-2xl bg-[#1a1a1a] overflow-hidden">
                          <RichTextEditor
                            value={text}
                            onChange={setText}
                            placeholder="Écrivez votre note ici…"
                            minHeight="560px"
                            disabled={isAnalyzing}
                            stickyToolbar
                            rightSlot={assistantButton}
                            pageAppearance={pageAppearance}
                            onPageAppearanceChange={setPageAppearance}
                            annotations={newAnnotations}
                            onAnnotationsChange={setNewAnnotations}
                            isMobile={isMobile}
                            density={density}
                            onDensityChange={setDensity}
                          />
                        </div>
                        <div className="rounded-2xl border border-gray-800 bg-white/5 p-6 space-y-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Tags</p>
                            <TagPills tags={currentTags} onRemove={handleRemoveTag} />
                            <TagInput value={tagInputValue} onChange={setTagInputValue} onAdd={handleAddTag} />
                          </div>
                          <MediaPreview media={pendingMedia} onRemove={removePendingMedia} onOpenSide={openSplitMedia} />
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <input ref={scannerInputRef} type="file" accept="image/*" onChange={handleScanManuscript} className="hidden" />
                              <button type="button" onClick={() => scannerInputRef.current?.click()} disabled={ocrLoading} className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 disabled:opacity-50" title="OCR (photo manuscrite)">
                                {ocrLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanLine className="w-5 h-5" />}
                              </button>
                              <input ref={attachmentInputRef} type="file" accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" multiple onChange={handleAttachmentUpload} className="hidden" />
                              <button type="button" onClick={() => attachmentInputRef.current?.click()} className="p-2 rounded-lg hover:bg-gray-800 text-gray-500" title="Pièce jointe">
                                <Paperclip className="w-5 h-5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={handleManualSaveNew}
                                disabled={isSaving || !stripHtml(text).trim()}
                                className="px-5 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                {isSaving ? 'Enregistrement…' : '💾 Sauvegarder'}
                              </button>
                              {lastSavedAt && (
                                <span className="text-[10px] text-gray-500">Enregistré à {lastSavedAt.toLocaleTimeString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
        <PanelGroup direction="horizontal" className="h-full">
          {/* Sidebar (flottante) */}
          <Panel defaultSize={20} minSize={16}>
            {sidebarOpen && (
              <div className="m-6 mt-0 h-[calc(100%-0px)] border border-gray-800 rounded-2xl bg-[#1A1A1A] shadow-2xl shadow-black/70 p-4 overflow-y-auto space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Projets</p>
              <button
                type="button"
                onClick={() => { setProjectFilter(null); setActiveProjectId(null); }}
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
                        onClick={() => {
                          setProjectFilter(p.id);
                          setActiveProjectId(p.id);
                        }}
                        className={`flex-1 text-left truncate px-2 py-1.5 rounded-lg text-sm transition border-l-2 pl-2 ${activeProjectId === p.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
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
          </Panel>
          <ResizeHandle />

          {/* Liste centrale (flottante) */}
          <Panel defaultSize={35} minSize={20}>
            <div className="m-6 mt-0 h-full border border-gray-800 rounded-2xl bg-[#1A1A1A] shadow-2xl shadow-black/70 overflow-hidden">
              <div className="sticky top-0 z-10 backdrop-blur-md bg-[#1A1A1A]/80">
                <div className="px-4 py-3 border-b border-gray-800 text-sm text-gray-300 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="truncate">Notes</span>
                    <button
                      type="button"
                      onClick={handleNewNoteTab}
                      className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-black font-semibold shadow-lg shadow-black/30 hover:bg-gray-100 active:scale-[0.99] transition"
                      title="Créer une nouvelle note"
                    >
                      <Plus className="w-4 h-4" />
                      Créer
                    </button>
                  </div>
                  {/* "Échelle" supprimé */}
                </div>
                <div className="px-4 pb-3 border-b border-gray-800">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher dans les notes…"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#111111] border border-gray-800 text-sm text-[#e5e5e5] placeholder-gray-500 focus:outline-none focus:border-gray-600"
                    />
                  </div>
                </div>
                <div className="px-4 py-2 border-b border-gray-800 flex items-center justify-between gap-3">
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
                  <span className="text-xs text-gray-600 hidden md:inline">Alt+Clic : ouvrir à côté</span>
                </div>
                <NotesViewControls zoomLevel={zoomLevel} onZoomChange={setZoomLevel} className="border-b-0" />
              </div>
              <div className="overflow-y-auto h-full">
                {sortedArchives.length === 0 ? (
                  <div className="h-full flex items-center justify-center p-6">
                    <div className="text-center">
                      <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500">{searchQuery || filterTag ? 'Aucun résultat' : 'Aucune note pour le moment'}</p>
                    </div>
                  </div>
                ) : (
                  zoomLevel >= 70 ? (
                    <div className="divide-y divide-gray-800">
                      {sortedArchives.map((entry) => {
                        const title = getEntryTitle(entry);
                        const preview = stripHtml(entry.entry_text || '').slice(0, 120);
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={(e) => {
                              if (e.altKey) openSplitNote(entry.id);
                              else handleSelectEntry(entry);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-800/40 transition ${
                              selectedEntry?.id === entry.id ? 'bg-gray-800/30' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm text-gray-200 truncate">{title}</p>
                              <p className="text-xs text-gray-500 flex-shrink-0">{new Date(entry.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{preview}</p>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={`p-4 grid gap-3 ${getGridCols()}`}>
                      {sortedArchives.map((entry) => {
                        const title = getEntryTitle(entry);
                        const preview = stripHtml(entry.entry_text || '').slice(0, 140);
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={(e) => {
                              if (e.altKey) openSplitNote(entry.id);
                              else handleSelectEntry(entry);
                            }}
                            className={`text-left rounded-xl border border-gray-800 bg-[#111111] hover:bg-[#141414] transition p-4 ${
                              selectedEntry?.id === entry.id ? 'ring-1 ring-gray-600' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm text-gray-200 font-medium line-clamp-2">{title}</p>
                              <p className="text-[10px] text-gray-500 flex-shrink-0 mt-0.5">{new Date(entry.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 line-clamp-3">{preview}</p>
                          </button>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            </div>
          </Panel>
          <ResizeHandle />

          {/* Éditeur (concret, ancré) */}
          <Panel defaultSize={45} minSize={30}>
            <div className="m-6 mt-0 h-full rounded-2xl border border-gray-800 bg-[#111111] overflow-hidden relative">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#111111]">
                <p className="text-sm text-gray-400 truncate">{focusMode ? 'Mode Focus' : 'Éditeur'}</p>
                <button
                  type="button"
                  onClick={() => setFocusMode(true)}
                  className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition"
                  title="Mode Focus"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
              <div className="h-full">
              {!isMobile && splitView ? (
                <PanelGroup direction="horizontal" className="h-full">
                  <Panel defaultSize={62} minSize={35}>
                    <div className="h-full overflow-y-auto p-0">
                <AnimatePresence mode="wait">
                  {mainView === 'journal' && openTabs.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="h-full"
                    >
                      <div className="rounded-2xl border border-gray-800 bg-[#1A1A1A] h-full flex flex-col min-h-0">
                {/* Tabs (style VS Code) */}
                <div className="flex items-center border-b border-gray-800 bg-[#141414] flex-shrink-0 overflow-x-auto">
                  {openTabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => (t.id === 'new' ? handleNewNoteTab() : setActiveTabId(t.id))}
                      className={`group flex items-center gap-2 px-4 py-2 text-sm border-r border-gray-800 min-w-0 transition ${
                        activeTabId === t.id ? 'bg-[var(--sj-bg-elevated)] text-[#e5e5e5]' : 'text-gray-400 hover:bg-gray-800/40 hover:text-gray-200'
                      }`}
                    >
                      <span className="truncate">{t.id === 'new' ? 'Nouvelle note' : 'Note'}</span>
                      {t.id !== 'new' && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); handleCloseTab(t.id); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleCloseTab(t.id); } }}
                          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-200 transition"
                          aria-label="Fermer"
                        >
                          ×
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 p-6">
                {activeTabId !== 'new' && selectedEntry && !isEditing && (
                  <EntryViewer
                    entry={selectedEntry}
                    onClose={() => setSelectedEntry(null)}
                    onEdit={handleEditEntry}
                                    onDelete={() => handleDeleteEntry(selectedEntry.id)}
                    onSaveAnnotations={handleSaveAnnotations}
                    userId={userId}
                    onOpenMediaSide={openSplitMedia}
                  />
                )}

                {activeTabId !== 'new' && isEditing && selectedEntry && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col min-h-[calc(100vh-360px)] gap-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-[#e5e5e5]">Modifier la note</h2>
                      <button type="button" onClick={() => setIsEditing(false)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <RichTextEditor
                      value={editText}
                      onChange={setEditText}
                      placeholder="Contenu de la note..."
                      minHeight="0"
                      stickyToolbar
                      rightSlot={assistantButton}
                      className="flex-1 min-h-0"
                      pageAppearance={pageAppearance}
                      onPageAppearanceChange={setPageAppearance}
                      annotations={editAnnotations}
                      onAnnotationsChange={setEditAnnotations}
                      isMobile={isMobile}
                      onMentorClick={handleMentorClick}
                      density={density}
                      onDensityChange={setDensity}
                    />

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

                    {/* Métadonnées + actions en bas (toujours visibles) */}
                    <div className="sticky bottom-0 rounded-xl border border-gray-800 bg-white/5 p-4 space-y-3 backdrop-blur">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Tags</p>
                        <TagPills tags={editTags} onRemove={(i) => setEditTags((prev) => prev.filter((_, j) => j !== i))} />
                        <TagInput
                          value={editTagInput}
                          onChange={setEditTagInput}
                          onAdd={(t) => { setEditTags((prev) => (prev.includes(t) ? prev : [...prev, t])); setEditTagInput(''); }}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                            className="px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {isSaving ? 'Enregistrement…' : '💾 Sauvegarder'}
                          </button>
                          <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 transition">
                            Annuler
                          </button>
                          {lastSavedAt && (
                            <span className="text-[10px] text-gray-500">Enregistré à {lastSavedAt.toLocaleTimeString()}</span>
                          )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTabId === 'new' && !aiResult && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col min-h-[calc(100vh-360px)] gap-4 px-6 py-6">
                    <div className="rounded-2xl bg-[#1a1a1a] overflow-hidden flex flex-col min-h-0">
                      <RichTextEditor
                        value={text}
                        onChange={setText}
                        placeholder="Écrivez votre note ici…"
                        minHeight="0"
                        disabled={isAnalyzing}
                        stickyToolbar
                        rightSlot={assistantButton}
                        className="flex-1 min-h-0"
                        pageAppearance={pageAppearance}
                        onPageAppearanceChange={setPageAppearance}
                        annotations={newAnnotations}
                        onAnnotationsChange={setNewAnnotations}
                        isMobile={isMobile}
                        onMentorClick={handleMentorClick}
                        density={density}
                        onDensityChange={setDensity}
                      />
                    </div>

                    {/* Métadonnées en bas (visuellement distinct) */}
                    <div className="sticky bottom-0 rounded-xl border border-gray-800 bg-white/5 p-4 space-y-3 backdrop-blur">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Tags</p>
                        <TagPills tags={currentTags} onRemove={handleRemoveTag} />
                        <TagInput value={tagInputValue} onChange={setTagInputValue} onAdd={handleAddTag} />
                      </div>

                      <MediaPreview media={pendingMedia} onRemove={removePendingMedia} onOpenSide={openSplitMedia} />

                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <input ref={scannerInputRef} type="file" accept="image/*" onChange={handleScanManuscript} className="hidden" />
                          <button type="button" onClick={() => scannerInputRef.current?.click()} disabled={ocrLoading} className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 disabled:opacity-50" title="OCR (photo manuscrite)">
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

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleManualSaveNew}
                            disabled={isSaving || !stripHtml(text).trim()}
                            className="px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {isSaving ? 'Enregistrement…' : '💾 Sauvegarder'}
                          </button>
                          {lastSavedAt && (
                            <span className="text-[10px] text-gray-500">Enregistré à {lastSavedAt.toLocaleTimeString()}</span>
                          )}
                        </div>
                      </div>
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                    </div>
                  </Panel>
                  <PanelResizeHandle className="w-1 flex items-center justify-center">
                    <div className="w-px h-8 bg-gray-800/80" />
                  </PanelResizeHandle>
                  <Panel defaultSize={38} minSize={25}>
                    <div className="h-full bg-[#0f0f0f] border-l border-gray-800 relative">
                      <button
                        type="button"
                        onClick={() => setSplitView(null)}
                        className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-black/40 border border-white/10 text-gray-200 hover:bg-black/60 transition"
                        title="Fermer le Split View"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {splitView?.type === 'media' ? (
                        <MediaViewer media={splitView.media} />
                      ) : splitView?.type === 'note' ? (
                        <SplitNoteEditor
                          userId={userId}
                          entryId={splitView.entryId}
                          onClose={() => setSplitView(null)}
                          density={density}
                          isMobile={isMobile}
                        />
                      ) : null}
                    </div>
                  </Panel>
                </PanelGroup>
              ) : (
              <div className="h-full overflow-y-auto p-0">
                <AnimatePresence mode="wait">
                  {mainView === 'journal' && openTabs.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="h-full"
                    >
                      <div className="rounded-2xl border border-gray-800 bg-[#1A1A1A] h-full flex flex-col min-h-0">
                        {/* Tabs (style VS Code) */}
                        <div className="flex items-center border-b border-gray-800 bg-[#141414] flex-shrink-0 overflow-x-auto">
                          {openTabs.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => (t.id === 'new' ? handleNewNoteTab() : setActiveTabId(t.id))}
                              className={`group flex items-center gap-2 px-4 py-2 text-sm border-r border-gray-800 min-w-0 transition ${
                                activeTabId === t.id ? 'bg-[var(--sj-bg-elevated)] text-[#e5e5e5]' : 'text-gray-400 hover:bg-gray-800/40 hover:text-gray-200'
                              }`}
                            >
                              <span className="truncate">{t.id === 'new' ? 'Nouvelle note' : 'Note'}</span>
                            </button>
                          ))}
                        </div>
                        <div className="flex-1 overflow-y-auto min-h-0 p-6">
                          {activeTabId !== 'new' && selectedEntry && !isEditing && (
                            <EntryViewer
                              entry={selectedEntry}
                              onClose={() => setSelectedEntry(null)}
                              onEdit={handleEditEntry}
                              onDelete={() => handleDeleteEntry(selectedEntry.id)}
                              onSaveAnnotations={handleSaveAnnotations}
                              userId={userId}
                              onOpenMediaSide={openSplitMedia}
                            />
                          )}
                          {activeTabId !== 'new' && isEditing && selectedEntry && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col min-h-[calc(100vh-360px)] gap-4">
                              <div className="flex items-center justify-between">
                                <h2 className="text-lg font-medium text-[#e5e5e5]">Modifier la note</h2>
                                <button type="button" onClick={() => setIsEditing(false)} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <RichTextEditor
                                value={editText}
                                onChange={setEditText}
                                placeholder="Contenu de la note..."
                                minHeight="0"
                                stickyToolbar
                                rightSlot={assistantButton}
                                className="flex-1 min-h-0"
                                pageAppearance={pageAppearance}
                                onPageAppearanceChange={setPageAppearance}
                                annotations={editAnnotations}
                                onAnnotationsChange={setEditAnnotations}
                                isMobile={isMobile}
                                onMentorClick={handleMentorClick}
                                density={density}
                                onDensityChange={setDensity}
                              />
                            </motion.div>
                          )}
                          {activeTabId === 'new' && !aiResult && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col min-h-[calc(100vh-360px)] gap-4">
                              <div className="rounded-2xl bg-[#1a1a1a] overflow-hidden flex flex-col min-h-0">
                                <RichTextEditor
                                  value={text}
                                  onChange={setText}
                                  placeholder="Écrivez votre note ici…"
                                  minHeight="0"
                                  disabled={isAnalyzing}
                                  stickyToolbar
                                  rightSlot={assistantButton}
                                  className="flex-1 min-h-0"
                                  pageAppearance={pageAppearance}
                                  onPageAppearanceChange={setPageAppearance}
                                  annotations={newAnnotations}
                                  onAnnotationsChange={setNewAnnotations}
                                  isMobile={isMobile}
                                  onMentorClick={handleMentorClick}
                                  density={density}
                                  onDensityChange={setDensity}
                                />
                              </div>
                              <div className="sticky bottom-0 rounded-xl border border-gray-800 bg-white/5 p-4 space-y-3 backdrop-blur">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">Tags</p>
                                  <TagPills tags={currentTags} onRemove={handleRemoveTag} />
                                  <TagInput value={tagInputValue} onChange={setTagInputValue} onAdd={handleAddTag} />
                                </div>
                                <MediaPreview media={pendingMedia} onRemove={removePendingMedia} onOpenSide={openSplitMedia} />
                                <div className="flex items-center justify-end gap-3">
                                  <button
                                    type="button"
                                    onClick={handleManualSaveNew}
                                    disabled={isSaving || !stripHtml(text).trim()}
                                    className="px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                  >
                                    {isSaving ? 'Enregistrement…' : '💾 Sauvegarder'}
                                  </button>
                                  {lastSavedAt && (
                                    <span className="text-[10px] text-gray-500">Enregistré à {lastSavedAt.toLocaleTimeString()}</span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              )}
              </div>

              <MentorPanel
                open={mentorOpen}
                onClose={() => setMentorOpen(false)}
                isMobile={isMobile}
                contextText={mentorContext}
                onContextChange={setMentorContext}
                onRequestAdvice={requestMentorAdvice}
                loading={mentorLoading}
                advice={mentorAdvice}
              />
            </div>
          </Panel>
        </PanelGroup>
        )}
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

      <MentorUpsellModal open={mentorUpsellOpen} onClose={() => setMentorUpsellOpen(false)} />
    </div>
  );
}
