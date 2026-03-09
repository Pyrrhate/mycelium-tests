import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, ExternalLink, Activity, Filter, Link2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { TOTEMS } from '../data/totemData';
import { ELEMENT_TEST } from '../data/elementQuestions';

const MAISONS = [{ id: '', label: 'Toutes les Maisons' }, { id: 'Racine', label: 'Racine' }, { id: 'Efflorescence', label: 'Efflorescence' }, { id: 'Vide', label: 'Vide' }];
const ELEMENTS = [
  { id: '', label: 'Tous les Éléments' },
  ...Object.entries(ELEMENT_TEST.labels).map(([k, v]) => ({ id: k, label: v.element })),
];

/**
 * La Forêt — Grille d'avatars (Totems) flottants, filtres Maison/Élément, Proposer un Maillage (demande duel/symbiose).
 */
export default function VueForet({ pulse, onBack, onMaillageRequest, addToast }) {
  const [globalScores, setGlobalScores] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [filterMaison, setFilterMaison] = useState('');
  const [filterElement, setFilterElement] = useState('');
  const [maillagePending, setMaillagePending] = useState(new Set());

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
          .select('id, initiate_name, totem, maison, slug, element_primordial')
          .or('is_public.eq.true,public_constellation.eq.true')
          .not('slug', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(48);
        setProfiles(data || []);
      } catch {
        setProfiles([]);
      }
    };
    fetchProfiles();
  }, []);

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (filterMaison && p.maison !== filterMaison) return false;
      if (filterElement && p.element_primordial !== filterElement) return false;
      return true;
    });
  }, [profiles, filterMaison, filterElement]);

  const handleMaillage = (profileId, initiateName) => {
    setMaillagePending((prev) => new Set(prev).add(profileId));
    onMaillageRequest?.(profileId);
    addToast?.(`Demande de Maillage envoyée à ${initiateName || 'l\'initié'}. Vous gagnerez des PS si la symbiose est acceptée.`);
    setTimeout(() => setMaillagePending((prev) => {
      const next = new Set(prev);
      next.delete(profileId);
      return next;
    }), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      <h1 className="font-serif text-2xl font-bold accent-color flex items-center gap-2">
        <Users className="w-7 h-7" />
        La Forêt
      </h1>
      <p className="text-[#F1F1E6]/70 text-sm">
        Explorez les initiés dont la sève est visible. Proposez un Maillage (duel amical ou symbiose) pour gagner des Points de Symbiose.
      </p>

      {/* Pouls */}
      <section
        className="rounded-2xl border border-[var(--accent)]/30 bg-white/5 backdrop-blur-xl p-6"
        style={{ boxShadow: '0 0 30px rgba(212,175,55,0.08)' }}
      >
        <h2 className="font-serif text-lg font-bold accent-color mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Pouls de la Forêt
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="rounded-xl bg-[#0d1211]/80 border border-[var(--accent)]/20 p-4">
            <p className="text-[#F1F1E6]/60 text-xs uppercase tracking-wider">Moyenne QM</p>
            <p className="text-2xl font-bold accent-color mt-1">{pulse?.moyenneQM ?? '—'}</p>
          </div>
          <div className="rounded-xl bg-[#0d1211]/80 border border-[var(--accent)]/20 p-4">
            <p className="text-[#F1F1E6]/60 text-xs uppercase tracking-wider">Passages</p>
            <p className="text-2xl font-bold text-[#F1F1E6] mt-1">{pulse?.count ?? '—'}</p>
          </div>
        </div>
        {globalScores && globalScores.length > 0 && (
          <div>
            <p className="text-[var(--accent)]/80 text-xs uppercase tracking-wider mb-2">Moyennes par clé (monde)</p>
            <div className="flex flex-wrap gap-2">
              {globalScores.map(({ key, value }) => (
                <span key={key} className="px-3 py-1.5 rounded-lg bg-[#0d1211] border border-[var(--accent)]/25 text-[#F1F1E6] text-sm">
                  {key} : <strong className="accent-color">{value}</strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Filtres */}
      <section className="flex flex-wrap items-center gap-3">
        <Filter className="w-5 h-5 text-[#F1F1E6]/60" />
        <select
          value={filterMaison}
          onChange={(e) => setFilterMaison(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-[var(--accent)]/30 text-[#F1F1E6] text-sm focus:border-[var(--accent)]/50 outline-none"
        >
          {MAISONS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <select
          value={filterElement}
          onChange={(e) => setFilterElement(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/5 border border-[var(--accent)]/30 text-[#F1F1E6] text-sm focus:border-[var(--accent)]/50 outline-none"
        >
          {ELEMENTS.map((e) => (
            <option key={e.id} value={e.id}>{e.label}</option>
          ))}
        </select>
      </section>

      {/* Grille d'avatars — Totems flottants */}
      <section
        className="rounded-2xl border border-[var(--accent)]/30 bg-white/5 backdrop-blur-[20px] p-6"
        style={{ boxShadow: '0 0 30px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.05)' }}
      >
        <h2 className="font-serif text-lg font-bold accent-color mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Hyphes actives
        </h2>
        {filtered.length === 0 ? (
          <p className="text-[#F1F1E6]/50 text-sm italic">Aucun initié ne correspond aux filtres ou la Forêt est vide.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p, i) => {
              const totemData = TOTEMS.find((t) => t.name === p.totem);
              const emoji = totemData?.emoji ?? '✨';
              const color = totemData?.color ?? '#D4AF37';
              const elementLabel = p.element_primordial && ELEMENT_TEST.labels[p.element_primordial] ? ELEMENT_TEST.labels[p.element_primordial].element : null;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="relative rounded-2xl border border-[var(--accent)]/20 bg-[#0d1211]/80 backdrop-blur-xl p-4 flex flex-col items-center text-center overflow-hidden"
                  style={{
                    boxShadow: `0 0 24px ${color}20`,
                    animation: 'float 4s ease-in-out infinite',
                    animationDelay: `${i * 0.15}s`,
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-xl border-2 flex items-center justify-center text-3xl mb-2"
                    style={{ borderColor: `${color}60`, background: `${color}15` }}
                  >
                    {emoji}
                  </div>
                  <p className="font-medium text-[#F1F1E6] truncate w-full">{p.initiate_name || p.slug || 'Initié'}</p>
                  {p.maison && <p className="text-[#F1F1E6]/60 text-xs">{p.maison}</p>}
                  {elementLabel && <p className="text-xs mt-0.5" style={{ color: `${color}` }}>{elementLabel}</p>}
                  <div className="flex items-center gap-2 mt-3 w-full">
                    <a
                      href={`#/profile/${encodeURIComponent(p.slug || '')}`}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 border border-[var(--accent)]/30 text-[#F1F1E6]/90 text-xs hover:bg-white/10 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Carte
                    </a>
                    <button
                      type="button"
                      onClick={() => handleMaillage(p.id, p.initiate_name)}
                      disabled={maillagePending.has(p.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs hover:bg-emerald-500/30 disabled:opacity-50 transition"
                    >
                      <Link2 className="w-3.5 h-3.5" /> {maillagePending.has(p.id) ? 'Envoyé' : 'Maillage'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {onBack && (
        <button type="button" onClick={onBack} className="text-[var(--accent)]/80 text-sm hover:accent-color">
          ← Retour au tableau de bord
        </button>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </motion.div>
  );
}
