import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { getRankFromXp, getXpProgressForNextRank } from '../data/ranks';
import { getQM } from '../data/profiles49';
import { ELEMENT_TEST } from '../data/elementQuestions';
import { updateProfile } from '../services/myceliumSave';
import ProfileHeader from './publicProfile/ProfileHeader';
import ProfileMetrics from './publicProfile/ProfileMetrics';
import NarrativeRootsSection from './publicProfile/NarrativeRootsSection';
import SealsGallery from './publicProfile/SealsGallery';
import ConstellationRadar from './publicProfile/ConstellationRadar';
import MaillageButton from './publicProfile/MaillageButton';

const FIELDS =
  'id, initiate_name, totem, maison, slug, constellation_data, current_seal_id, current_nebula_css, capacite_maillage, cognitive_title, xp_seve, symbiose_points, narrative_roots, unlocked_seals, element_primordial';

/**
 * Profil Public — Vitrine riche (Glassmorphism Bioluminescent).
 * #/profile/:slug : en-tête identitaire, métriques, bio, sceaux, radar, bouton Maillage.
 */
export default function ProfilePublic({ username, onBack, session }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bioSaving, setBioSaving] = useState(false);
  const [maillageLoading, setMaillageLoading] = useState(false);

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
    setLoading(true);
    supabase
      .from('profiles')
      .select(FIELDS)
      .or('is_public.eq.true,public_constellation.eq.true')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data, error: e }) => {
        setError(e?.message || (data ? null : 'Profil non trouvé.'));
        setProfile(data || null);
      })
      .finally(() => setLoading(false));
  }, [username]);

  const isOwnProfile = !!(
    session?.user?.id &&
    profile?.id &&
    session.user.id === profile.id
  );

  const rank = profile ? getRankFromXp(profile.xp_seve) : null;
  const xpProgress = profile ? getXpProgressForNextRank(profile.xp_seve) : null;
  const qm =
    profile?.constellation_data?.poleAverages?.length === 7
      ? getQM(profile.constellation_data.poleAverages)
      : null;
  const elementColor =
    profile?.element_primordial && ELEMENT_TEST.labels[profile.element_primordial]
      ? ELEMENT_TEST.labels[profile.element_primordial].color
      : '#D4AF37';

  const handleSaveBio = async (text) => {
    if (!profile?.id || !session?.user?.id || session.user.id !== profile.id) return;
    setBioSaving(true);
    try {
      await updateProfile(profile.id, { narrative_roots: text });
      setProfile((p) => (p ? { ...p, narrative_roots: text } : null));
    } finally {
      setBioSaving(false);
    }
  };

  const handleMaillage = () => {
    setMaillageLoading(true);
    setTimeout(() => setMaillageLoading(false), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B0A] text-[#F1F1E6] flex flex-col items-center justify-center p-6">
        <motion.p
          animate={{ opacity: [0.6, 1] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="font-serif text-[#D4AF37]/90 text-center"
        >
          La sève circule dans le réseau…
        </motion.p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#070B0A] text-[#F1F1E6] flex flex-col items-center justify-center p-6">
        <p className="text-red-400/90 mb-4">
          {error || "Cette constellation n'existe pas ou n'est pas visible."}
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-[#D4AF37]/80 hover:text-[#D4AF37] text-sm"
          >
            ← Retour
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen text-[#F1F1E6] p-4 md:p-6"
      style={{ background: profile.current_nebula_css || '#070B0A' }}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-[#D4AF37]/80 hover:text-[#D4AF37] text-sm"
          >
            ← Retour
          </button>
        )}

        <ProfileHeader profile={profile} elementColor={elementColor} />

        <ProfileMetrics
          rank={rank}
          xpProgress={xpProgress}
          xpSeve={profile.xp_seve}
          qm={qm}
          symbiosePoints={profile.symbiose_points}
        />

        <NarrativeRootsSection
          narrativeRoots={profile.narrative_roots}
          isOwnProfile={isOwnProfile}
          onSaveBio={handleSaveBio}
          saving={bioSaving}
        />

        <SealsGallery unlockedSeals={profile.unlocked_seals} />

        <ConstellationRadar
          poleAverages={profile.constellation_data?.poleAverages}
          accentColor={elementColor}
        />

        {!isOwnProfile && (
          <MaillageButton onClick={handleMaillage} loading={maillageLoading} />
        )}

        <p className="text-[#D4AF37]/50 text-xs text-center pb-4">
          Réseau Mycélium — Profil public
        </p>
      </div>
    </motion.div>
  );
}
