import { X, Sparkles } from 'lucide-react';

export default function MentorUpsellModal({ open, onClose }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center p-4">
        <div className="w-full md:max-w-lg rounded-2xl border border-gray-800 bg-[#111111] shadow-2xl shadow-black/70 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gray-300" />
              <p className="text-sm font-semibold text-gray-200">Mentor Éditorial</p>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-sm text-gray-300">
              Passez à la version <span className="text-white font-semibold">Alchimiste (Premium)</span>.
            </p>
            <p className="text-sm text-gray-500">
              Débloquez le <span className="text-white font-semibold">Mentor Éditorial</span>, un coach d’écriture privé propulsé par l’IA pour structurer vos pensées — sans jamais écrire à votre place.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white text-black font-semibold hover:bg-gray-100 transition"
                title="Simulation (Stripe à venir)"
              >
                S’abonner (Simulation)
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

