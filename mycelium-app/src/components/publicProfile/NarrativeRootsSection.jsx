import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PenLine } from 'lucide-react';

export default function NarrativeRootsSection({ narrativeRoots, isOwnProfile, onSaveBio, saving }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(narrativeRoots ?? '');
  useEffect(() => {
    if (!isEditing) setDraft(narrativeRoots ?? '');
  }, [narrativeRoots, isEditing]);

  const handleSave = () => {
    onSaveBio?.(draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(narrativeRoots ?? '');
    setIsEditing(false);
  };

  const hasChange = draft !== (narrativeRoots ?? '');
  const isEmpty = !(narrativeRoots?.trim?.());

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
      style={{ boxShadow: '0 0 24px rgba(212,175,55,0.06), inset 0 1px 0 rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-xs uppercase tracking-widest text-[#D4AF37]/80 font-mono">Racines Narratives</h2>
        {isOwnProfile && !isEditing && (
          <button
            type="button"
            onClick={() => { setDraft(narrativeRoots ?? ''); setIsEditing(true); }}
            className="p-1.5 rounded-lg text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-white/10 transition"
            title="Modifier la bio"
            aria-label="Modifier la bio"
          >
            <PenLine className="w-4 h-4" />
          </button>
        )}
      </div>

      {isEditing && isOwnProfile ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Décrivez-vous en quelques lignes..."
            className="w-full min-h-[120px] px-4 py-3 rounded-xl bg-white/5 border border-[#D4AF37]/30 text-[#F1F1E6] placeholder-[#F1F1E6]/40 focus:border-[#D4AF37]/50 outline-none resize-y transition"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChange}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/30 disabled:opacity-50 transition"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" onClick={handleCancel} className="px-4 py-2 rounded-xl text-sm text-[#F1F1E6]/70 hover:bg-white/10 transition">
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="text-[#F1F1E6]/90 text-sm leading-relaxed whitespace-pre-wrap">
          {isEmpty && !isOwnProfile ? (
            <span className="italic text-[#F1F1E6]/50">Aucune racine narrative partagée.</span>
          ) : (
            narrativeRoots?.trim() || <span className="italic text-[#F1F1E6]/50">Aucune bio renseignée.</span>
          )}
        </div>
      )}
    </motion.section>
  );
}
