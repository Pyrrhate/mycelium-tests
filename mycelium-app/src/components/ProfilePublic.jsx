import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Chart from 'chart.js/auto';
import { supabase } from '../supabaseClient';
import { MYCELIUM_49 } from '../data/mycelium49';
import { User } from 'lucide-react';
import { generateSeal } from '../utils/sealGenerator';

/**
 * V6 — Carte d'Initié publique : #/profile/:username (lecture seule, pas d'auth requise).
 * Utilisé via hash (pas React Router).
 */
export default function ProfilePublic({ username, onBack }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const radarRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!username || !supabase) {
      setLoading(false);
      setError(username === undefined ? null : 'Slug manquant.');
      return;
    }
    const slug = typeof username === 'string' ? username : '';
    if (!slug) {
      setLoading(false);
      setError('Slug manquant.');
      return;
    }
    supabase
      .from('profiles')
      .select('id, initiate_name, totem, maison, slug, constellation_data, current_seal_id, current_nebula_css, capacite_maillage, cognitive_title')
      .or('is_public.eq.true,public_constellation.eq.true')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data, error: e }) => {
        setError(e?.message || (data ? null : 'Profil non trouvé.'));
        setProfile(data || null);
      })
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (!profile?.constellation_data?.poleAverages || !radarRef.current) return;
    const values = profile.constellation_data.poleAverages.map((v) => v + 2);
    const labels = MYCELIUM_49.keys.map((k) => k.name);
    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new Chart(radarRef.current, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: 'Sève',
          data: values,
          borderColor: '#D4AF37',
          backgroundColor: 'rgba(212, 175, 55, 0.15)',
          borderWidth: 2,
          pointBackgroundColor: '#D4AF37',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0,
            max: 4,
            pointLabels: { color: '#F1F1E6', font: { size: 11 } },
            grid: { color: 'rgba(241,241,230,0.15)' },
            angleLines: { color: 'rgba(241,241,230,0.1)' },
          },
        },
        plugins: { legend: { display: false } },
      },
    });
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B0A] text-[#F1F1E6] flex items-center justify-center">
        <p className="text-[#D4AF37]/80">Chargement de la constellation…</p>
      </div>
    );
  }
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#070B0A] text-[#F1F1E6] flex flex-col items-center justify-center p-6">
        <p className="text-red-400/90 mb-4">{error || 'Cette constellation n\'existe pas ou n\'est pas visible.'}</p>
        {onBack && <button type="button" onClick={onBack} className="text-[#D4AF37]/80 hover:text-[#D4AF37] text-sm">← Retour</button>}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen text-[#F1F1E6] p-6"
      style={{ background: profile.current_nebula_css || '#070B0A' }}
    >
      <div className="max-w-lg mx-auto text-center space-y-6">
        {onBack && <button type="button" onClick={onBack} className="inline-block text-[#D4AF37]/80 hover:text-[#D4AF37] text-sm">← Retour</button>}
        <h1 className="font-serif text-2xl font-bold text-[#D4AF37] flex items-center justify-center gap-2">
          <User className="w-6 h-6" />
          Carte d'Initié
        </h1>
        {profile.current_seal_id && (() => {
          const parts = profile.current_seal_id.split('_');
          const { svg } = generateSeal(parts[0], parts[1], 100);
          return <div className="inline-block" dangerouslySetInnerHTML={{ __html: svg }} />;
        })()}
        <p className="text-xl font-semibold text-[#F1F1E6]">{profile.initiate_name || profile.slug || 'Initié'}</p>
        {profile.maison && <p className="text-[#F1F1E6]/80 text-sm">Maison : {profile.maison}</p>}
        {profile.totem && <p className="text-[#F1F1E6]/80 text-sm">Totem : {profile.totem}</p>}
        {profile.cognitive_title && (
          <p className="text-[#D4AF37] font-serif text-sm italic">Titre cognitif : {profile.cognitive_title}</p>
        )}
        {profile.capacite_maillage != null && (
          <p className="text-[#F1F1E6]/80 text-sm">Capacité de Maillage : {profile.capacite_maillage}/100</p>
        )}
        {profile.constellation_data?.poleAverages && profile.constellation_data.poleAverages.length === 7 ? (
          <div className="w-full max-w-xs mx-auto h-64">
            <canvas ref={radarRef} />
          </div>
        ) : (
          <p className="text-[#F1F1E6]/50 text-sm italic">Constellation non partagée.</p>
        )}
        <p className="text-[#D4AF37]/60 text-xs">Réseau Mycélium — Profil public</p>
      </div>
    </motion.div>
  );
}
