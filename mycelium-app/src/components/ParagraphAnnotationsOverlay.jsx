import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';

function findScrollParent(el) {
  let cur = el;
  while (cur && cur !== document.body) {
    const style = window.getComputedStyle(cur);
    const overflowY = style.overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') return cur;
    cur = cur.parentElement;
  }
  return window;
}

export default function ParagraphAnnotationsOverlay({
  editor,
  surfaceRef,
  annotations = [],
  isMobile = false,
  onOpenAnnotation,
}) {
  const [positions, setPositions] = useState([]);
  const scrollParentRef = useRef(null);

  const byParagraph = useMemo(() => {
    const map = new Map();
    for (const ann of Array.isArray(annotations) ? annotations : []) {
      if (!ann?.paragraphId) continue;
      const prev = map.get(ann.paragraphId) || [];
      map.set(ann.paragraphId, [...prev, ann]);
    }
    return map;
  }, [annotations]);

  useLayoutEffect(() => {
    if (!editor || !surfaceRef?.current) return;
    const surfaceEl = surfaceRef.current;
    scrollParentRef.current = findScrollParent(surfaceEl);
  }, [editor, surfaceRef]);

  useEffect(() => {
    if (!editor || !surfaceRef?.current) return undefined;
    const surfaceEl = surfaceRef.current;
    const scrollParent = scrollParentRef.current || findScrollParent(surfaceEl);

    const compute = () => {
      const viewEl = editor.view?.dom;
      if (!viewEl) return;
      const viewRect = viewEl.getBoundingClientRect();
      const surfaceRect = surfaceEl.getBoundingClientRect();
      const nodes = viewEl.querySelectorAll('p[data-paragraph-id]');
      const next = [];

      nodes.forEach((p) => {
        const id = p.getAttribute('data-paragraph-id');
        if (!id) return;
        const anns = byParagraph.get(id);
        if (!anns || anns.length === 0) return;
        const r = p.getBoundingClientRect();
        const top = r.top - surfaceRect.top + (surfaceEl.scrollTop || 0);
        const right = viewRect.right - surfaceRect.left;
        next.push({
          paragraphId: id,
          top: Math.max(8, top),
          right,
          count: anns.length,
          annotation: anns[0],
        });
      });

      setPositions(next);
    };

    const rafCompute = () => requestAnimationFrame(compute);
    rafCompute();

    const onScroll = () => rafCompute();
    const onResize = () => rafCompute();

    if (scrollParent && scrollParent !== window) scrollParent.addEventListener('scroll', onScroll, { passive: true });
    else window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    const off = editor.on?.('update', rafCompute);

    return () => {
      if (scrollParent && scrollParent !== window) scrollParent.removeEventListener('scroll', onScroll);
      else window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (typeof off === 'function') off();
    };
  }, [editor, surfaceRef, byParagraph]);

  if (!editor || positions.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0">
      {positions.map((p) => (
        <button
          key={p.paragraphId}
          type="button"
          className={`pointer-events-auto absolute flex items-center gap-2 ${
            isMobile
              ? 'right-3'
              : 'right-2 md:right-3'
          }`}
          style={{ top: p.top }}
          onClick={() => onOpenAnnotation?.(p.paragraphId)}
          title="Voir l'annotation"
        >
          {isMobile ? (
            <span className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#111111] border border-gray-800 shadow-lg shadow-black/30">
              <MessageCircle className="w-4 h-4 text-gray-300" />
              {p.count > 1 && (
                <span className="absolute -top-1 -right-1 text-[10px] leading-none px-1.5 py-0.5 rounded-full bg-white text-black">
                  {p.count}
                </span>
              )}
            </span>
          ) : (
            <div className="hidden md:flex items-start gap-2">
              <span className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#111111] border border-gray-800 shadow-lg shadow-black/30 flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-gray-300" />
                {p.count > 1 && (
                  <span className="absolute -top-1 -right-1 text-[10px] leading-none px-1.5 py-0.5 rounded-full bg-white text-black">
                    {p.count}
                  </span>
                )}
              </span>
              <div className="w-56 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 shadow-lg shadow-black/30">
                <p className="text-xs text-gray-200 line-clamp-4 whitespace-pre-wrap">
                  {p.annotation?.content || 'Annotation'}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">Cliquer pour ouvrir</p>
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

