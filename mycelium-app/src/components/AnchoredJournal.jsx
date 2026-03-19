import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpenText,
  CheckSquare,
  Copy,
  FilePlus2,
  Files,
  FileText,
  FileType2,
  Filter,
  GitMerge,
  Loader2,
  Menu,
  MoreVertical,
  Plus,
  ScanLine,
  Save,
  Tag,
  X,
  CloudCheck,
  RefreshCw,
  CloudOff,
  Lock,
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import {
  attachUnclassifiedNotesToProject,
  ensureDefaultProject,
  getJournalEntries,
  getProjects,
  saveJournalEntry,
  updateJournalEntry,
} from '../services/myceliumSave';
import {
  exportNoteToDocx,
  exportNoteToPdf,
  exportNotesToCombinedDocx,
  exportNotesToCombinedPdf,
  stripHtml,
} from '../utils/exportNote';
import { supabase } from '../supabaseClient';
import MentorPanel from './MentorPanel';
import MentorUpsellModal from './MentorUpsellModal';
import { decryptNoteText, encryptNoteText, isEncryptedPayload } from '../utils/noteCrypto';

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getNoteTitle(entry) {
  if (entry?.title?.trim()) return entry.title.trim();
  const text = stripHtml(entry?.entry_text || '');
  if (!text) return 'Note sans titre';
  return text.slice(0, 64);
}

const ASSISTANT_ACTIONS = [
  { id: 'generate-tags', label: '🏷️ Générer des tags', icon: Tag },
  { id: 'summarize', label: '📝 Résumer', icon: FileText },
  { id: 'extract-tasks', label: '✅ Extraire To-Do', icon: CheckSquare },
];

export default function AnchoredJournal({ userId, profile }) {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [contextType, setContextType] = useState('all'); // all | project | tag
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [sortOrder, setSortOrder] = useState('recent');
  const [activeNoteId, setActiveNoteId] = useState('new');
  const [draft, setDraft] = useState('');
  const [titleDraft, setTitleDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantResult, setAssistantResult] = useState('');
  const [actionsOpen, setActionsOpen] = useState(false);
  const [fusionOpen, setFusionOpen] = useState(false);
  const [mentorOpen, setMentorOpen] = useState(false);
  const [mentorUpsellOpen, setMentorUpsellOpen] = useState(false);
  const [mentorContext, setMentorContext] = useState('');
  const [mentorLoading, setMentorLoading] = useState(false);
  const [mentorAdvice, setMentorAdvice] = useState('');
  const [openTabs, setOpenTabs] = useState(['new']);
  const [mergeMode, setMergeMode] = useState(false);
  const [mergeSelectedIds, setMergeSelectedIds] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(70);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [syncState, setSyncState] = useState('saved'); // saved | syncing | offline | error
  const [encryptionEnabled, setEncryptionEnabled] = useState(() => {
    try { return localStorage.getItem('anima.encryption.enabled') !== 'false'; } catch { return true; }
  });
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // list | editor
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [flashTick, setFlashTick] = useState(0);
  const isPremium = profile?.is_premium === true;
  const ocrInputRef = useRef(null);
  const autosaveTimerRef = useRef(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(!!mq.matches);
    sync();
    if (mq.addEventListener) mq.addEventListener('change', sync);
    else mq.addListener(sync);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', sync);
      else mq.removeListener(sync);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileView('list');
      setMobileSidebarOpen(false);
      return;
    }
    if (activeNoteId && activeNoteId !== 'new') setMobileView('editor');
  }, [isMobile, activeNoteId]);

  useEffect(() => {
    try { localStorage.setItem('anima.encryption.enabled', String(encryptionEnabled)); } catch {}
  }, [encryptionEnabled]);

  useEffect(() => {
    setFlashTick((v) => v + 1);
  }, [activeNoteId, mobileView]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const defaultProject = await ensureDefaultProject(userId);
      if (defaultProject?.id) {
        await attachUnclassifiedNotesToProject(userId, defaultProject.id);
      }
      const [loadedNotes, loadedProjects] = await Promise.all([
        getJournalEntries(userId, 300),
        getProjects(userId),
      ]);
      setNotes(loadedNotes || []);
      setProjects(loadedProjects || []);
      if (!selectedProjectId && defaultProject?.id) setSelectedProjectId(defaultProject.id);
      if (!loadedNotes?.length) {
        setActiveNoteId('new');
        setDraft('');
        setTitleDraft('');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, selectedProjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tags = useMemo(() => {
    const set = new Set();
    for (const note of notes) {
      for (const tag of note?.tags || []) {
        const clean = String(tag || '').trim();
        if (clean) set.add(clean);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let data = [...notes];
    if (contextType === 'project' && selectedProjectId) {
      data = data.filter((n) => n.project_id === selectedProjectId);
    }
    if (contextType === 'tag' && selectedTag) {
      data = data.filter((n) => (n.tags || []).includes(selectedTag));
    }
    if (sortOrder === 'oldest') return data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [notes, contextType, selectedProjectId, selectedTag, sortOrder]);

  const activeNote = useMemo(() => (
    notes.find((n) => n.id === activeNoteId) || null
  ), [notes, activeNoteId]);

  useEffect(() => {
    let cancelled = false;
    if (activeNoteId === 'new') {
      hydratedRef.current = true;
      return;
    }
    if (!activeNote) {
      setActiveNoteId('new');
      setDraft('');
      setTitleDraft('');
      return;
    }
    (async () => {
      let text = activeNote.entry_text || '';
      if (isEncryptedPayload(text)) {
        try {
          text = await decryptNoteText(text, userId);
        } catch {
          text = '<p>[Contenu chiffré indisponible localement]</p>';
        }
      }
      if (!cancelled) setDraft(text);
      hydratedRef.current = true;
    })();
    setTitleDraft(activeNote.title || getNoteTitle(activeNote));
    return () => { cancelled = true; };
  }, [activeNote, activeNoteId, userId]);

  const selectNote = (note) => {
    setActiveNoteId(note.id);
    setDraft(note.entry_text || '');
    setOpenTabs((prev) => (prev.includes(note.id) ? prev : [...prev, note.id]));
    if (isMobile) setMobileView('editor');
  };

  const handleNewNote = () => {
    setOpenTabs((prev) => (prev.includes('new') ? prev : [...prev, 'new']));
    setActiveNoteId('new');
    setDraft('');
    setTitleDraft('');
    setStatus('');
    if (isMobile) setMobileView('editor');
  };

  const handleCloseTab = (tabId) => {
    if (tabId === 'new') return;
    const nextTabs = openTabs.filter((t) => t !== tabId);
    setOpenTabs(nextTabs);
    if (activeNoteId === tabId) {
      const fallback = nextTabs[nextTabs.length - 1] || 'new';
      setActiveNoteId(fallback);
      if (fallback === 'new') {
        setDraft('');
        setTitleDraft('');
      }
    }
  };

  const getTabLabel = (tabId) => {
    if (tabId === 'new') return 'Nouvelle note';
    const n = notes.find((x) => x.id === tabId);
    return n ? getNoteTitle(n) : 'Note';
  };

  const handleCopyText = async (htmlOrText) => {
    const text = stripHtml(htmlOrText || '').trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Texte copié dans le presse-papiers.');
    } catch {
      setStatus('Copie impossible sur ce navigateur.');
    }
  };

  const handleSave = async () => {
    if (!userId || saving) return;
    const plain = stripHtml(draft || '').trim();
    if (!plain) return;
    setSaving(true);
    setStatus('');
    try {
      const payloadText = encryptionEnabled ? await encryptNoteText(draft, userId) : draft;
      if (activeNote && activeNote.id) {
        const updated = await updateJournalEntry(userId, activeNote.id, {
          entry_text: payloadText,
          title: titleDraft,
          project_id: selectedProjectId || activeNote.project_id || null,
        });
        if (updated) {
          setNotes((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
          setStatus('Note sauvegardee.');
          setSyncState('saved');
        }
      } else {
        const fallbackDefault = projects.find((p) => p.name === 'Non classé');
        const project_id = selectedProjectId || fallbackDefault?.id || null;
        const created = await saveJournalEntry(userId, {
          entry_text: payloadText,
          project_id,
          tags: [],
        });
        if (created) {
          const hydrated = { ...created, title: (titleDraft || '').trim() || null };
          if (hydrated.title) {
            const updatedCreated = await updateJournalEntry(userId, hydrated.id, { title: hydrated.title });
            if (updatedCreated) hydrated.title = updatedCreated.title;
          }
          setNotes((prev) => [hydrated, ...prev]);
          setActiveNoteId(hydrated.id);
          setStatus('Nouvelle note creee.');
          setSyncState('saved');
        }
      }
    } catch {
      setSyncState(navigator.onLine ? 'error' : 'offline');
    } finally {
      setSaving(false);
    }
  };

  const enqueueOfflineSync = (item) => {
    try {
      const key = `anima.offline.queue.${userId}`;
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      current.push(item);
      localStorage.setItem(key, JSON.stringify(current.slice(-50)));
      setSyncState('offline');
    } catch {}
  };

  const flushOfflineQueue = useCallback(async () => {
    if (!userId || !navigator.onLine) return;
    const key = `anima.offline.queue.${userId}`;
    let queue = [];
    try { queue = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    if (!queue.length) return;
    for (const q of queue) {
      if (q.type === 'update' && q.entryId) {
        // best-effort sync
        // eslint-disable-next-line no-await-in-loop
        await updateJournalEntry(userId, q.entryId, q.payload);
      }
    }
    localStorage.removeItem(key);
    setSyncState('saved');
  }, [userId]);

  useEffect(() => {
    if (!userId || !hydratedRef.current) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      if (!draft || !stripHtml(draft).trim()) return;
      setSyncState('syncing');
      try {
        const entry_text = encryptionEnabled ? await encryptNoteText(draft, userId) : draft;
        if (activeNote?.id) {
          const payload = { entry_text, title: titleDraft, project_id: selectedProjectId || activeNote.project_id || null };
          const updated = await updateJournalEntry(userId, activeNote.id, payload);
          if (!updated) throw new Error('sync failed');
          setNotes((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
        }
        setSyncState('saved');
      } catch {
        if (!navigator.onLine && activeNote?.id) {
          const entry_text = encryptionEnabled ? await encryptNoteText(draft, userId) : draft;
          enqueueOfflineSync({ type: 'update', entryId: activeNote.id, payload: { entry_text, title: titleDraft, project_id: selectedProjectId || activeNote.project_id || null } });
        } else {
          setSyncState('error');
        }
      }
      try {
        localStorage.setItem(`anima.offline.draft.${userId}.${activeNoteId}`, JSON.stringify({ draft, titleDraft, ts: Date.now() }));
      } catch {}
    }, 2000);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [draft, titleDraft, activeNoteId, activeNote, selectedProjectId, userId, encryptionEnabled]);

  useEffect(() => {
    if (!userId) return;
    const onOnline = () => { flushOfflineQueue(); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [userId, flushOfflineQueue]);

  const handleExportCurrent = async (format) => {
    const text = draft || '';
    if (!stripHtml(text).trim()) return;
    const filename = (titleDraft || getNoteTitle(activeNote) || 'note').replace(/[\\/:*?"<>|]/g, '-');
    setExporting(true);
    try {
      if (format === 'pdf') await exportNoteToPdf(text, filename);
      if (format === 'docx') await exportNoteToDocx(text, filename);
      setStatus(`Export ${format.toUpperCase()} terminé.`);
    } finally {
      setExporting(false);
    }
  };

  const toggleMergeSelection = (noteId) => {
    setMergeSelectedIds((prev) => (prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]));
  };

  const handleMergeExport = async (format) => {
    const selected = notes.filter((n) => mergeSelectedIds.includes(n.id));
    if (!selected.length) {
      setStatus('Sélectionne au moins une note à fusionner.');
      return;
    }
    setExporting(true);
    try {
      if (format === 'pdf') await exportNotesToCombinedPdf(selected, 'Notes fusionnées', 'notes-fusionnees');
      if (format === 'docx') await exportNotesToCombinedDocx(selected, 'notes-fusionnees');
      setStatus(`Fusion export ${format.toUpperCase()} terminée.`);
    } finally {
      setExporting(false);
    }
  };

  const handleScanManuscript = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    e.target.value = '';
    if (!supabase) {
      setStatus('OCR indisponible: Supabase non configuré.');
      return;
    }
    setOcrLoading(true);
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
      const transcribed = String(data?.text || '').trim();
      if (!transcribed) {
        setStatus('OCR terminé, aucun texte détecté.');
        return;
      }
      const html = `<p>${transcribed.replace(/\n/g, '</p><p>')}</p>`;
      setDraft((prev) => `${prev || ''}${html}`);
      setStatus('Texte OCR ajouté dans la note.');
    } catch (err) {
      const raw = String(err?.message || 'échec');
      const lower = raw.toLowerCase();
      if (
        lower.includes('failed to send a request to the edge function') ||
        lower.includes('failed to fetch') ||
        lower.includes('networkerror')
      ) {
        setStatus(
          "OCR indisponible: la fonction Edge 'ocr-vision' est injoignable. Vérifiez son déploiement, la config Supabase (URL/anon key) et le réseau."
        );
      } else {
        setStatus(`Erreur OCR: ${raw}`);
      }
    } finally {
      setOcrLoading(false);
    }
  };

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
    const contentPlain = stripHtml(draft || '').trim();
    if (!contentPlain || contentPlain.length < 20) {
      setMentorAdvice('• Ajoutez quelques lignes pour recevoir des conseils utiles.');
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
      setMentorAdvice(`• ${String(err?.message || 'Erreur Mentor')}`);
    } finally {
      setMentorLoading(false);
    }
  };

  const assistantHint = async (actionType) => {
    if (!supabase || !userId) {
      setStatus("Assistant indisponible: configuration Supabase manquante.");
      return;
    }
    const noteText = stripHtml(draft || '').trim();
    if (!noteText || noteText.length < 10) {
      setStatus("Écris au moins quelques lignes pour utiliser l'assistant.");
      return;
    }
    setActionsOpen(false);
    setAssistantLoading(true);
    setAssistantResult('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke('journal-assistant', {
        body: { note_text: noteText, action_type: actionType },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      const raw = data?.result;
      const normalized = Array.isArray(raw) ? raw.map((x) => `• ${x}`).join('\n') : String(raw || '').trim();
      setAssistantResult(normalized || 'Aucun résultat.');
    } catch (err) {
      const msg = String(err?.message || "Erreur de l'assistant.");
      setAssistantResult(`Erreur assistant: ${msg}`);
    } finally {
      setAssistantLoading(false);
    }
  };

  const insertAssistantResultIntoNote = () => {
    if (!assistantResult || assistantResult.startsWith('Erreur assistant:')) return;
    const escaped = assistantResult
      .split('\n')
      .map((line) => `<p>${line.replace(/[<>&]/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[m]))}</p>`)
      .join('');
    setDraft((prev) => `${prev || ''}${escaped}`);
    setStatus("Résultat de l'assistant inséré dans la note.");
  };

  const activeProjectForEditor = projects.find((p) => p.id === (selectedProjectId || activeNote?.project_id)) || null;
  const noteCardCompact = zoomLevel < 50;

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-main)]">
      <aside className="hidden md:flex md:w-64 md:flex-shrink-0 md:flex-col border-r border-gray-800 overflow-y-auto px-3 py-4">
        <p className="px-3 text-[11px] uppercase tracking-wide text-gray-500">Journal</p>
        <button
          type="button"
          onClick={() => {
            setContextType('all');
            setSelectedProjectId(null);
            setSelectedTag(null);
          }}
          className={`mt-2 w-full text-left px-3 py-2 rounded-lg text-sm transition ${contextType === 'all' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-900'}`}
        >
          Toutes les notes
        </button>

        <div className="mt-4">
          <p className="px-3 text-[11px] uppercase tracking-wide text-gray-500">📁 Projets</p>
          <div className="mt-2 space-y-1">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => {
                  setContextType('project');
                  setSelectedProjectId(project.id);
                  setSelectedTag(null);
                }}
                className={`w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-md text-sm transition ${contextType === 'project' && selectedProjectId === project.id ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-900'}`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color || '#6B7280' }} />
                <span className="truncate">{project.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="px-3 text-[11px] uppercase tracking-wide text-gray-500">🏷️ Tags</p>
          <div className="mt-2 flex flex-wrap gap-1 px-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setContextType('tag');
                  setSelectedTag(tag);
                  setSelectedProjectId(null);
                }}
                className={`px-2 py-1 rounded-md text-xs border transition ${contextType === 'tag' && selectedTag === tag ? 'border-gray-500 bg-gray-800 text-white' : 'border-gray-700 text-gray-400 hover:text-gray-200'}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {isMobile && mobileSidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setMobileSidebarOpen(false)} aria-hidden />
          <aside className="fixed inset-y-0 left-0 z-50 w-[86vw] max-w-[320px] border-r border-gray-800 bg-[#0A0A0A] overflow-y-auto px-3 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-200">Menu</p>
              <button type="button" onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-md border border-gray-700 text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="px-3 text-[11px] uppercase tracking-wide text-gray-500">Journal</p>
            <button
              type="button"
              onClick={() => {
                setContextType('all');
                setSelectedProjectId(null);
                setSelectedTag(null);
                setMobileSidebarOpen(false);
                setMobileView('list');
              }}
              className={`mt-2 w-full text-left px-3 py-2 rounded-lg text-sm transition ${contextType === 'all' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-900'}`}
            >
              Toutes les notes
            </button>
            <div className="mt-4">
              <p className="px-3 text-[11px] uppercase tracking-wide text-gray-500">📁 Projets</p>
              <div className="mt-2 space-y-1">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      setContextType('project');
                      setSelectedProjectId(project.id);
                      setSelectedTag(null);
                      setMobileSidebarOpen(false);
                      setMobileView('list');
                    }}
                    className={`w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-md text-sm transition ${contextType === 'project' && selectedProjectId === project.id ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-900'}`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color || '#6B7280' }} />
                    <span className="truncate">{project.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <p className="px-3 text-[11px] uppercase tracking-wide text-gray-500">🏷️ Tags</p>
              <div className="mt-2 flex flex-wrap gap-1 px-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setContextType('tag');
                      setSelectedTag(tag);
                      setSelectedProjectId(null);
                      setMobileSidebarOpen(false);
                      setMobileView('list');
                    }}
                    className={`px-2 py-1 rounded-md text-xs border transition ${contextType === 'tag' && selectedTag === tag ? 'border-gray-500 bg-gray-800 text-white' : 'border-gray-700 text-gray-400 hover:text-gray-200'}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </>
      )}

      {(!isMobile || mobileView === 'list') && (
      <section className="flex-col flex-1 md:flex-initial md:w-80 md:flex-shrink-0 md:border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-visible min-h-0 flex">
        <div className="relative z-20 px-4 py-3 border-b border-gray-800 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isMobile && (
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="p-1.5 rounded-md border border-gray-700 text-gray-300"
                  title="Menu"
                >
                  <Menu className="w-3.5 h-3.5" />
                </button>
              )}
              <p className="text-sm font-semibold text-gray-100">Notes</p>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                ref={ocrInputRef}
                type="file"
                accept="image/*"
                onChange={handleScanManuscript}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => ocrInputRef.current?.click()}
                disabled={ocrLoading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-700 text-gray-200 text-xs hover:bg-gray-800 disabled:opacity-60"
                title="Scanner image (OCR)"
              >
                {ocrLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
                OCR
              </button>
              <button
                type="button"
                onClick={handleNewNote}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-100 text-black text-xs font-semibold hover:bg-white"
              >
                <Plus className="w-3.5 h-3.5" />
                Créer
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button
                type="button"
                onClick={() => setFusionOpen((v) => !v)}
                className="p-1.5 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800"
                title="Menu fusion"
              >
                <GitMerge className="w-3.5 h-3.5" />
              </button>
              {fusionOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-gray-700 bg-[#1A1A1A] p-1 z-50 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => setMergeMode((v) => !v)}
                    className="w-full text-left px-2.5 py-2 rounded text-xs text-gray-200 hover:bg-gray-800"
                  >
                    {mergeMode ? 'Désactiver sélection multiple' : 'Activer sélection multiple'}
                  </button>
                  <div className="my-1 h-px bg-gray-700" />
                  <button
                    type="button"
                    onClick={() => handleMergeExport('pdf')}
                    disabled={mergeSelectedIds.length === 0 || exporting}
                    className="w-full text-left px-2.5 py-2 rounded text-xs text-gray-200 hover:bg-gray-800 disabled:opacity-50"
                  >
                    <span className="inline-flex items-center gap-2"><FilePlus2 className="w-3.5 h-3.5" />📄 Fusionner la sélection en PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMergeExport('docx')}
                    disabled={mergeSelectedIds.length === 0 || exporting}
                    className="w-full text-left px-2.5 py-2 rounded text-xs text-gray-200 hover:bg-gray-800 disabled:opacity-50"
                  >
                    <span className="inline-flex items-center gap-2"><Files className="w-3.5 h-3.5" />📄 Fusionner la sélection en DOCX</span>
                  </button>
                </div>
              )}
            </div>
            <div className="relative group">
              <button type="button" className="p-1.5 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800">
                <Filter className="w-3.5 h-3.5" />
              </button>
              <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-36 rounded-lg border border-gray-800 bg-[#111111] p-1 z-20">
                <button type="button" onClick={() => setSortOrder('recent')} className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-gray-800">Plus récentes</button>
                <button type="button" onClick={() => setSortOrder('oldest')} className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-gray-800">Plus anciennes</button>
              </div>
            </div>
            <input
              type="range"
              min={20}
              max={100}
              step={5}
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-20 accent-gray-300"
              title="Échelle notes"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {loading && <p className="px-2 py-3 text-xs text-gray-500">Chargement des notes…</p>}
          {!loading && filteredNotes.length === 0 && (
            <p className="px-2 py-3 text-xs text-gray-500">Aucune note dans ce contexte.</p>
          )}
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`w-full text-left rounded-lg border px-2.5 py-2 transition ${activeNoteId === note.id ? 'border-[#B8B8B8] bg-[#F1F1F1]' : 'border-[var(--border-subtle)] bg-[var(--bg-main)] hover:border-dashed'}`}
            >
              {mergeMode && (
                <div className="pb-1">
                  <label className="inline-flex items-center gap-2 text-xs text-gray-400">
                    <input
                      type="checkbox"
                      checked={mergeSelectedIds.includes(note.id)}
                      onChange={() => toggleMergeSelection(note.id)}
                    />
                    Sélectionner
                  </label>
                </div>
              )}
              <button type="button" onClick={() => selectNote(note)} className="w-full text-left">
                <p className={`${noteCardCompact ? 'text-xs' : 'text-sm'} font-semibold text-[var(--text-main)] truncate`}>{getNoteTitle(note)}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{formatDate(note.created_at)}</p>
                {!noteCardCompact && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(note.tags || []).slice(0, 4).map((tag) => (
                      <span key={`${note.id}-${tag}`} className="text-[10px] text-[var(--text-muted)]">#{tag}</span>
                    ))}
                  </div>
                )}
              </button>
              <div className="pt-1.5 flex justify-end">
                <button type="button" onClick={() => handleCopyText(note.entry_text || '')} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5" title="Copier la note">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {(!isMobile || mobileView === 'editor') && (
      <section key={flashTick} className="eink-flash flex-col flex-1 bg-[var(--bg-main)] min-w-0 flex">
        <header className="h-16 flex-shrink-0 border-b border-gray-800 px-5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            {isMobile && (
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className="md:hidden inline-flex items-center gap-1 px-2 py-1 rounded-md border border-gray-700 text-xs text-gray-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Retour
              </button>
            )}
            <input
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              placeholder={activeNoteId === 'new' ? 'Titre de la nouvelle note' : 'Titre de la note'}
              className="w-full max-w-xl bg-transparent border border-transparent focus:border-gray-700 rounded-md px-2 py-1 text-sm font-semibold text-gray-100 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setActionsOpen((v) => !v)}
                className="p-2 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-900"
                title="Menu actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {actionsOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-gray-700 bg-[#1A1A1A] p-1 z-30">
                  <p className="px-2.5 py-1 text-[11px] uppercase tracking-wide text-gray-500">Exporter</p>
                  <button
                    type="button"
                    onClick={() => handleExportCurrent('pdf')}
                    disabled={exporting}
                    className="w-full text-left px-2.5 py-2 rounded text-xs text-gray-200 hover:bg-gray-800 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <FileType2 className="w-3.5 h-3.5 text-blue-300" />
                    📄 Exporter cette note en PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportCurrent('docx')}
                    disabled={exporting}
                    className="w-full text-left px-2.5 py-2 rounded text-xs text-gray-200 hover:bg-gray-800 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <BookOpenText className="w-3.5 h-3.5 text-emerald-300" />
                    📄 Exporter cette note en DOCX
                  </button>
                  <div className="my-1 h-px bg-gray-700" />
                  <p className="px-2.5 py-1 text-[11px] uppercase tracking-wide text-gray-500">Assistant IA</p>
                  {ASSISTANT_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => assistantHint(action.id)}
                      disabled={assistantLoading}
                      className="w-full text-left px-2.5 py-2 rounded text-xs text-gray-200 hover:bg-gray-800 disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      <action.icon className="w-3.5 h-3.5 text-amber-300" />
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleMentorClick}
              className="px-3 py-1.5 rounded-md border border-gray-700 text-xs text-gray-200 hover:bg-gray-900"
            >
              🧠 Mentor
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="px-3 py-1.5 rounded-md bg-gray-100 text-black text-xs font-semibold disabled:opacity-60 inline-flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        </header>
        <div className="h-10 flex-shrink-0 border-b border-gray-800 bg-[#111111] px-3 flex items-center gap-2 overflow-x-auto">
          {openTabs.map((tabId) => (
            <div
              key={tabId}
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs ${
                activeNoteId === tabId ? 'border-gray-500 bg-gray-800 text-white' : 'border-gray-700 text-gray-300'
              }`}
            >
              <button type="button" onClick={() => setActiveNoteId(tabId)} className="truncate max-w-[180px] text-left">
                {getTabLabel(tabId)}
              </button>
              {tabId !== 'new' && (
                <button type="button" onClick={() => handleCloseTab(tabId)} className="text-gray-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto bg-[#FDFDFD]">
            <div className="max-w-3xl mx-auto px-12 py-16 min-h-full">
              {assistantResult && (
                <div className="mb-4 rounded-lg border border-gray-300 bg-white p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Résultat Assistant</p>
                  <pre className="whitespace-pre-wrap text-xs text-gray-700 m-0">{assistantResult}</pre>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={insertAssistantResultIntoNote}
                      disabled={assistantResult.startsWith('Erreur assistant:')}
                      className="px-2.5 py-1.5 rounded-md border border-gray-300 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Insérer dans la note
                    </button>
                  </div>
                </div>
              )}
              <RichTextEditor
                value={draft}
                onChange={setDraft}
                placeholder="Ecrivez votre note…"
                minHeight="560px"
                className="h-full border-0 bg-[#FDFDFD] text-[#1A1A1A]"
                stickyToolbar
                density="comfortable"
                visualStyle="eink"
                disableAiActions
              />
            </div>
          </div>
          <div className="flex-shrink-0 border-t border-gray-800 bg-[#111111] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-400">Projet</p>
              <label className="text-xs text-gray-400 inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={encryptionEnabled}
                  onChange={(e) => setEncryptionEnabled(e.target.checked)}
                />
                <Lock className="w-3.5 h-3.5" />
                🔒 Chiffré de bout en bout
              </label>
            </div>
            <select
              value={activeProjectForEditor?.id || ''}
              onChange={(e) => setSelectedProjectId(e.target.value || null)}
              className="px-2 py-1.5 rounded-md border border-gray-700 bg-[#1a1a1a] text-xs text-gray-200"
            >
              <option value="">Aucun</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="absolute bottom-2 right-4 text-xs text-gray-500 inline-flex items-center gap-1.5">
            {syncState === 'syncing' && <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Synchronisation...</>}
            {syncState === 'saved' && <><CloudCheck className="w-3.5 h-3.5" />Enregistré</>}
            {syncState === 'offline' && <><CloudOff className="w-3.5 h-3.5" />Hors ligne</>}
            {syncState === 'error' && <><CloudOff className="w-3.5 h-3.5" />Erreur sync</>}
          </div>
          {status && <p className="absolute bottom-14 left-4 text-xs text-gray-500">{status}</p>}
          <MentorPanel
            open={mentorOpen}
            onClose={() => setMentorOpen(false)}
            contextText={mentorContext}
            onContextChange={setMentorContext}
            onRequestAdvice={requestMentorAdvice}
            loading={mentorLoading}
            advice={mentorAdvice}
          />
          <MentorUpsellModal open={mentorUpsellOpen} onClose={() => setMentorUpsellOpen(false)} />
        </div>
      </section>
      )}
    </div>
  );
}
