import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network, Activity, Users } from 'lucide-react';
import { supabase } from '../supabaseClient';

/**
 * Vue "Le Réseau" — Pouls de la Forêt, moyennes mondiales, Hyphes actives.
 */
export default function VueReseau({ pulse, onBack }) {
  const [globalScores, setGlobalScores] = useState(null);
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    if (!supabase) return;
    const fetchGlobal = async () => {
      try {
        const { data } = await supabase
          .from('forest_stats')
          .select('score_spore, score_ancrage, score_expansion, score_lyse, score_fructification, score_absorption, score_dormance')
          .limit(500);
        if (data && data.length > 0) {
          const keys = ['score_spore', 'score_ancrage', 'score_expansion', 'score_lyse', 'score_fructification', 'score_absorption', 'score_dormance'];
          const labels = ['Spore', 'Ancrage', 'Expansion', 'Lyse', 'Fructification', 'Absorption', 'Dormance'];
          const avgs = keys.map((k) => {
            const sum = data.reduce((s, r) => s + (Number(r[k]) || 0), 0);
            return { key: labels[keys.indexOf(k)], value: Math.round((sum / data.length) * 100) / 100 };
          });
          setGlobalScores(avgs);
        }
      } catch {
        setGlobalScores([]);
      }
    };
    fetchGlobal();
  }, []);

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
          .limit(12);
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
        <Network className="w-7 h-7" />
        Le Réseau
      </h1>
      <p className="text-[#F1F1E6]/70 text-sm">
        Statistiques mondiales et initiés dont la Constellation est publique.
      </p>

      {/* Pouls de la Forêt */}
      <section
        className="rounded-2xl border border-[#D4AF37]/30 bg-white/5 backdrop-blur-xl p-6"
        style={{ boxShadow: '0 0 30px rgba(212,175,55,0.08)' }}
      >
        <h2 className="font-serif text-lg font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Pouls de la Forêt
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl bg-[#0d1211]/80 border border-[#D4AF37]/20 p-4">
            <p className="text-[#F1F1E6]/60 text-xs uppercase tracking-wider">Moyenne QM</p>
            <p className="text-2xl font-bold text-[#D4AF37] mt-1">{pulse?.moyenneQM ?? '—'}</p>
          </div>
          <div className="rounded-xl bg-[#0d1211]/80 border border-[#D4AF37]/20 p-4">
            <p className="text-[#F1F1E6]/60 text-xs uppercase tracking-wider">Passages</p>
            <p className="text-2xl font-bold text-[#F1F1E6] mt-1">{pulse?.count ?? '—'}</p>
          </div>
        </div>
        {globalScores && globalScores.length > 0 && (
          <div>
            <p className="text-[#D4AF37]/80 text-xs uppercase tracking-wider mb-2">Moyennes par clé (monde)</p>
            <div className="flex flex-wrap gap-2">
              {globalScores.map(({ key, value }) => (
                <span
                  key={key}
                  className="px-3 py-1.5 rounded-lg bg-[#0d1211] border border-[#D4AF37]/25 text-[#F1F1E6] text-sm"
                >
                  {key} : <strong className="text-[#D4AF37]">{value}</strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Hyphes actives */}
      <section
        className="rounded-2xl border border-[#D4AF37]/30 bg-white/5 backdrop-blur-xl p-6"
        style={{ boxShadow: '0 0 30px rgba(212,175,55,0.08)' }}
      >
        <h2 className="font-serif text-lg font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Hyphes actives
        </h2>
        <p className="text-[#F1F1E6]/70 text-sm mb-4">
          Initiés dont la Constellation est visible par le Réseau.
        </p>
        {profiles.length === 0 ? (
          <p className="text-[#F1F1E6]/50 text-sm italic">Aucune hyphe active pour l'instant.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="px-4 py-3 rounded-xl bg-[#0d1211]/80 border border-[#D4AF37]/20 text-[#F1F1E6] text-sm hover:border-[#D4AF37]/40 transition"
              >
                <span className="font-medium">{p.initiate_name || p.slug || 'Initié'}</span>
                {p.maison && <span className="text-[#F1F1E6]/60 ml-2">· {p.maison}</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-[#D4AF37]/80 text-sm hover:text-[#D4AF37]"
        >
          ← Retour au tableau de bord
        </button>
      )}
    </motion.div>
  );
}
