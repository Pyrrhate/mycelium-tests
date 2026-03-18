import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const OPTIONS = [
  { id: 'default', label: 'Défaut' },
  { id: 'grain', label: 'Texture grain' },
  { id: 'lines', label: 'Lignes' },
  { id: 'dots', label: 'Pointillés' },
];

export default function PageAppearanceMenu({ value = 'default', onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const current = OPTIONS.find((o) => o.id === value) || OPTIONS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-800 bg-[#1a1a1a] text-xs text-gray-300 hover:bg-gray-800/40 transition"
        title="Apparence de la page"
      >
        <span className="hidden sm:inline">Apparence</span>
        <span className="sm:hidden">Page</span>
        <span className="text-gray-500">·</span>
        <span className="text-gray-400">{current.label}</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-800 bg-[#111111] shadow-2xl shadow-black/60 overflow-hidden z-50">
          {OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onChange?.(opt.id);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition ${
                opt.id === value ? 'bg-gray-800/60 text-white' : 'text-gray-300 hover:bg-gray-800/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

