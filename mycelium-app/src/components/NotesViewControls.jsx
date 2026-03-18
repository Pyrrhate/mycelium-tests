import { Grid3X3, RectangleHorizontal } from 'lucide-react';

export default function NotesViewControls({ zoomLevel, onZoomChange, className = '' }) {
  return (
    <div
      className={`sticky top-0 z-10 backdrop-blur-md bg-[#1A1A1A]/80 border-b border-gray-800 ${className}`}
    >
      <div className="px-4 py-2 flex items-center gap-3">
        <Grid3X3 className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden />
        <input
          type="range"
          min={10}
          max={90}
          value={zoomLevel}
          onChange={(e) => onZoomChange?.(Number(e.target.value))}
          className="flex-1 min-w-0 accent-gray-500"
          aria-label="Échelle d'affichage des notes"
        />
        <RectangleHorizontal className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden />
        <span className="text-xs text-gray-500 w-10 text-right tabular-nums">{zoomLevel}%</span>
      </div>
    </div>
  );
}

