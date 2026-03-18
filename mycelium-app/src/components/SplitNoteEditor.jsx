import { useEffect, useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { getJournalEntryById, updateJournalEntry } from '../services/myceliumSave';

export default function SplitNoteEditor({ userId, entryId, onClose, density = 'comfortable', isMobile = false }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entry, setEntry] = useState(null);
  const [html, setHtml] = useState('');
  const [tags, setTags] = useState([]);
  const [annotations, setAnnotations] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!userId || !entryId) return;
      setLoading(true);
      const data = await getJournalEntryById(userId, entryId);
      if (!cancelled) {
        setEntry(data);
        setHtml(data?.entry_text || '');
        setTags(data?.tags || []);
        setAnnotations(data?.annotations || []);
        setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [userId, entryId]);

  const handleSave = async () => {
    if (!userId || !entryId || saving) return;
    setSaving(true);
    try {
      const updated = await updateJournalEntry(userId, entryId, { entry_text: html, tags, annotations });
      if (updated) setEntry((prev) => ({ ...(prev || {}), ...updated }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#141414]">
        <div className="min-w-0">
          <p className="text-sm text-gray-200 truncate">Note parallèle</p>
          <p className="text-xs text-gray-500 truncate">{entry?.created_at ? new Date(entry.created_at).toLocaleString('fr-FR') : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm hover:bg-gray-600 disabled:opacity-50 transition"
            title="Sauvegarder"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauver
          </button>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400" title="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <RichTextEditor
          value={html}
          onChange={setHtml}
          placeholder="Contenu de la note..."
          minHeight="0"
          stickyToolbar
          className="flex-1 min-h-0"
          density={density}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}

