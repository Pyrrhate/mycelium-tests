import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FolderOpen, Tag, FileText, CheckSquare, Square, FileDown, ChevronLeft,
  Loader2,
} from 'lucide-react';
import { getJournalEntriesForExplorer } from '../services/myceliumSave';
import { stripHtml } from '../utils/exportNote';
import { exportNotesToCombinedPdf } from '../utils/exportNote';

export default function ExplorerView({ userId, projects = [], onBack, onSelectNote }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectId, setProjectId] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const data = await getJournalEntriesForExplorer(userId, { projectId: projectId || undefined, limit: 300 });
    setEntries(data || []);
    setLoading(false);
  }, [userId, projectId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const uniqueTags = [...new Set(entries.flatMap((e) => e.tags || []).filter(Boolean))].sort();

  const filtered = entries.filter((e) => {
    const matchSearch = !searchQuery || stripHtml(e.entry_text || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchTag = !selectedTag || (e.tags || []).includes(selectedTag);
    return matchSearch && matchTag;
  });

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size >= filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((e) => e.id)));
  };

  const handleGeneratePdf = async () => {
    const toExport = entries.filter((e) => selectedIds.has(e.id));
    if (!toExport.length) return;
    setGeneratingPdf(true);
    try {
      await exportNotesToCombinedPdf(toExport, 'Notes exportées', `notes-${Date.now()}`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="flex flex-col h-full bg-[var(--sj-bg)] text-[#e5e5e5]">
      <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-800">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onBack && (
            <button type="button" onClick={onBack} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-lg font-semibold truncate">Explorateur</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 border-b border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans les notes..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#1a1a1a] border border-gray-800 text-sm text-[#e5e5e5] placeholder-gray-500 focus:outline-none focus:border-gray-600"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500">Projet :</span>
          <select
            value={projectId || ''}
            onChange={(e) => setProjectId(e.target.value || null)}
            className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-gray-800 text-sm text-[#e5e5e5] focus:outline-none focus:border-gray-600"
          >
            <option value="">Tous</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500 ml-2">Tags :</span>
          {uniqueTags.slice(0, 15).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTag(selectedTag === t ? null : t)}
              className={`px-2 py-1 rounded-lg text-xs transition ${selectedTag === t ? 'bg-gray-600 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'}`}
            >
              #{t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setSelectionMode(!selectionMode); setSelectedIds(new Set()); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${selectionMode ? 'bg-gray-700 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'}`}
          >
            {selectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {selectionMode ? 'Annuler la sélection' : 'Sélection'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune note trouvée</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((entry) => (
              <motion.li
                key={entry.id}
                layout
                className={`rounded-xl border p-4 transition cursor-pointer ${selectionMode && selectedIds.has(entry.id) ? 'border-gray-500 bg-gray-800/50' : 'border-gray-800 bg-[#1a1a1a] hover:bg-[#222]'}`}
                onClick={() => {
                  if (selectionMode) toggleSelect(entry.id);
                  else onSelectNote?.(entry);
                }}
              >
                <div className="flex items-start gap-3">
                  {selectionMode && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleSelect(entry.id); }}
                      className="mt-0.5 p-1 rounded text-gray-400 hover:text-white"
                    >
                      {selectedIds.has(entry.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(entry.created_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
                    </p>
                    <p className="text-sm text-[#e5e5e5] line-clamp-2">{stripHtml(entry.entry_text || '')}</p>
                    {entry.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.map((t, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-xs">#{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {selectionMode && selectedCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 px-6 py-4 rounded-2xl border border-gray-700 bg-[#1a1a1a] shadow-xl"
          >
            <span className="text-sm text-gray-400">{selectedCount} note(s) sélectionnée(s)</span>
            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={generatingPdf}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-700 text-white font-medium hover:bg-gray-600 disabled:opacity-50 transition"
            >
              {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              Générer un PDF combiné
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
