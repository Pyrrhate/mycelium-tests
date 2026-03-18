import { useEffect, useMemo, useState } from 'react';
import { X, Trash2 } from 'lucide-react';

export default function ParagraphAnnotationSheet({
  open,
  paragraphId,
  annotations = [],
  onClose,
  onChange,
}) {
  const list = useMemo(() => (Array.isArray(annotations) ? annotations : []).filter((a) => a?.paragraphId === paragraphId), [annotations, paragraphId]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!open) setDraft('');
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border border-gray-800 bg-[#111111] shadow-2xl shadow-black/70">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <p className="text-sm font-semibold text-gray-200">Annotations</p>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-4 py-3 space-y-3">
          {list.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune annotation sur ce paragraphe.</p>
          ) : (
            list.map((ann, idx) => (
              <div key={ann.id || idx} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">{ann.content}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const next = annotations.filter((a) => a !== ann);
                      onChange?.(next);
                    }}
                    className="p-1 text-gray-400 hover:text-red-400"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}

          <div className="pt-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ajouter une annotation…"
              className="w-full min-h-[80px] px-3 py-2 rounded-xl bg-[#1a1a1a] border border-gray-800 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-600"
            />
            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  const content = draft.trim();
                  if (!content) return;
                  const newAnn = { id: crypto.randomUUID?.() || Date.now().toString(), paragraphId, content, createdAt: new Date().toISOString() };
                  onChange?.([...(annotations || []), newAnn]);
                  setDraft('');
                }}
                className="px-4 py-2 rounded-xl bg-gray-700 border border-gray-600 text-white text-sm hover:bg-gray-600 transition"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

