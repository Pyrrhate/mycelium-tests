import { useEffect, useMemo, useState } from 'react';
import { X, Lightbulb, Loader2 } from 'lucide-react';

function AdviceCard({ text }) {
  const lines = String(text || '').split('\n').filter(Boolean);
  return (
    <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-3">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-amber-300" />
        </div>
        <div className="text-sm text-gray-200 whitespace-pre-wrap">
          {lines.length <= 1 ? text : lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MentorPanel({
  open,
  onClose,
  isMobile = false,
  contextText,
  onContextChange,
  onRequestAdvice,
  loading,
  advice,
}) {
  const [localContext, setLocalContext] = useState(contextText || '');

  useEffect(() => setLocalContext(contextText || ''), [contextText]);

  const cards = useMemo(() => {
    if (!advice) return [];
    // Si l'IA renvoie des bullets, on garde le texte brut (pas de rendu Markdown lourd)
    return [String(advice)];
  }, [advice]);

  if (!open) return null;

  const content = (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <p className="text-sm font-semibold text-gray-200">🧠 Mentor Éditorial</p>
        <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-3 overflow-y-auto">
        <div>
          <p className="text-xs text-gray-500 mb-1">Quel est le contexte de cette note ?</p>
          <textarea
            value={localContext}
            onChange={(e) => setLocalContext(e.target.value)}
            placeholder="Ex: Article pour mon exposition, Newsletter, Coup de gueule…"
            className="w-full min-h-[90px] px-3 py-2 rounded-xl bg-[#1a1a1a] border border-gray-800 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-600"
          />
          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                onContextChange?.(localContext);
                onRequestAdvice?.(localContext);
              }}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 disabled:opacity-50 transition inline-flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Demander conseil sur la structure
            </button>
          </div>
        </div>

        {loading && !advice ? (
          <div className="rounded-xl border border-gray-800 bg-[#0f0f0f] p-3 text-sm text-gray-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyse en cours…
          </div>
        ) : null}

        {cards.length > 0 ? (
          <div className="space-y-2">
            {cards.map((c, i) => <AdviceCard key={i} text={c} />)}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Le Mentor vous donne des conseils d’architecture et de ton — sans jamais écrire le texte à votre place.
          </p>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} aria-hidden />
        <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] rounded-t-2xl border border-gray-800 bg-[#111111] shadow-2xl shadow-black/70 overflow-hidden">
          {content}
        </div>
      </>
    );
  }

  return (
    <div className="absolute inset-y-0 right-0 z-30 w-[360px] border-l border-gray-800 bg-[#111111] shadow-2xl shadow-black/60">
      {content}
    </div>
  );
}

