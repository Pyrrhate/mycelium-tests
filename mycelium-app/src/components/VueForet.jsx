import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ExternalLink } from 'lucide-react';
import { supabase } from '../supabaseClient';

/**
 * V6 — La Forêt (Réseau Public) : liste des initiés dont le profil est public. Lien vers /profile/[slug].
 */
export default function VueForet({ onBack }) {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    if (!supabase) return;
    const fetchProfiles = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, initiate_name, totem, maison, slug')
          .or('is_public.eq.true,public_constellation.eq.true')
          .not('slug', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(24);
        setProfiles(data || []);
      } catch {
        setProfiles([]);
      }
    };
    fetchProfiles();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <h1 className="font-serif text-2xl font-bold text-[#D4AF37] flex items-center gap-2">
        <Users className="w-7 h-7" />
        La Forêt — Réseau Public
      </h1>
      <p className="text-[#F1F1E6]/70 text-sm">
        Initiés dont la visibilité dans la Forêt est activée. Cliquez pour voir leur Carte d'Initié.
      </p>

      <section
        className="rounded-2xl border border-[#D4AF37]/30 bg-white/5 backdrop-blur-[20px] p-6"
        style={{ boxShadow: '0 0 30px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.05)' }}
      >
        {profiles.length === 0 ? (
          <p className="text-[#F1F1E6]/50 text-sm italic">Aucun initié visible dans la Forêt pour l'instant.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((p) => (
              <a
                key={p.id}
                href={`#/profile/${encodeURIComponent(p.slug || '')}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0d1211]/80 border border-[#D4AF37]/20 text-[#F1F1E6] hover:border-[#D4AF37]/50 transition"
              >
                <span className="font-medium truncate">{p.initiate_name || p.slug || 'Initié'}</span>
                {p.maison && <span className="text-[#F1F1E6]/50 text-xs truncate">· {p.maison}</span>}
                <ExternalLink className="w-4 h-4 flex-shrink-0 text-[#D4AF37]/70 ml-auto" />
              </a>
            ))}
          </div>
        )}
      </section>

      {onBack && (
        <button type="button" onClick={onBack} className="text-[#D4AF37]/80 text-sm hover:text-[#D4AF37]">
          ← Retour au tableau de bord
        </button>
      )}
    </motion.div>
  );
}
