import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Key, Mail, Trash2, Package, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { generateDataArchive } from '../utils/exportArchive';

/**
 * Paramètres du compte : mot de passe, email, visibilité Forêt, export archive, supprimer le compte.
 */
export default function VueParametres({ onBack, userId, profile, canActivatePublic, isPublic, onToggleForest, refetch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState({ type: '', text: '' });
  const [premiumSim, setPremiumSim] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(false);

  useEffect(() => {
    setPremiumSim(profile?.is_premium === true);
  }, [profile?.is_premium]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit faire au moins 6 caractères.' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    setMessage({ type: 'success', text: 'Mot de passe mis à jour.' });
    setPassword('');
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Adresse email invalide.' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    const { error } = await supabase.auth.updateUser({ email: email.trim() });
    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }
    setMessage({ type: 'success', text: 'Un lien de confirmation a été envoyé à votre nouvelle adresse.' });
    setEmail('');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'SUPPRIMER') return;
    setDeleteLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const { error: deleteError } = await supabase.rpc('delete_user', { user_id: userId });
      if (deleteError) throw deleteError;
      await supabase.auth.signOut();
      setMessage({ type: 'success', text: 'Compte supprimé. Vous allez être déconnecté.' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.message || 'La suppression du compte nécessite une configuration serveur (RPC delete_user). Contactez le support.' });
    }
    setDeleteLoading(false);
  };

  const handleGenerateArchive = async () => {
    if (!userId) return;
    setIsExporting(true);
    setExportMessage({ type: '', text: '' });
    try {
      await generateDataArchive(userId);
      setExportMessage({ type: 'success', text: 'Archive téléchargée avec succès.' });
    } catch (err) {
      setExportMessage({ type: 'error', text: err?.message || 'Erreur lors de la génération de l\'archive.' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-8">
      <h1 className="font-serif text-2xl font-bold accent-color flex items-center gap-2">
        <Settings className="w-7 h-7" />
        Paramètres du compte
      </h1>

      {message.text && (
        <div
          className={`rounded-xl p-4 text-sm ${message.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}
        >
          {message.text}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="font-serif text-lg font-bold accent-color mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" />
          Mot de passe
        </h2>
        <form onSubmit={handleUpdatePassword} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nouveau mot de passe (6 caractères min.)"
            className="w-full px-4 py-2 rounded-xl bg-[#0d1211] border border-[var(--accent)]/30 text-[#F1F1E6] placeholder-[#F1F1E6]/40 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl bg-[var(--accent)]/20 border border-[var(--accent)]/50 accent-color font-medium hover:bg-[var(--accent)]/30 disabled:opacity-50">
            {loading ? 'Envoi...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="font-serif text-lg font-bold accent-color mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email
        </h2>
        <form onSubmit={handleUpdateEmail} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nouvelle adresse email"
            className="w-full px-4 py-2 rounded-xl bg-[#0d1211] border border-[var(--accent)]/30 text-[#F1F1E6] placeholder-[#F1F1E6]/40 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl bg-[var(--accent)]/20 border border-[var(--accent)]/50 accent-color font-medium hover:bg-[var(--accent)]/30 disabled:opacity-50">
            {loading ? 'Envoi...' : 'Modifier l\'email'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="font-serif text-lg font-bold text-gray-50 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Propriété de vos données
        </h2>
        <p className="text-gray-300 text-sm mb-4">
          Vos pensées vous appartiennent. Téléchargez une archive complète de vos notes et projets à tout moment pour la conserver sur votre propre disque dur ou Cloud.
        </p>
        <button
          type="button"
          onClick={handleGenerateArchive}
          disabled={isExporting}
          className="px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-gray-50 font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Compilation de votre cerveau numérique en cours...
            </>
          ) : (
            <>
              <Package className="w-5 h-5" />
              Générer mon archive (.zip)
            </>
          )}
        </button>
        {exportMessage.text && (
          <p className={`mt-3 text-sm ${exportMessage.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
            {exportMessage.text}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-red-900/30 bg-red-950/10 p-6 backdrop-blur-xl">
        <h2 className="font-serif text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Supprimer le compte
        </h2>
        <p className="text-[#F1F1E6]/70 text-sm mb-4">
          Cette action est irréversible. Toutes vos données (profil, journal, résonances) seront supprimées.
        </p>
        <input
          type="text"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder='Tapez SUPPRIMER pour confirmer'
          className="w-full max-w-xs px-4 py-2 rounded-xl bg-[#0d1211] border border-red-500/30 text-[#F1F1E6] placeholder-[#F1F1E6]/40 mb-3"
        />
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleteConfirm !== 'SUPPRIMER' || deleteLoading}
          className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 font-medium hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleteLoading ? 'Suppression...' : 'Supprimer définitivement mon compte'}
        </button>
      </section>

      {/* Simulation Premium (Stripe à venir) */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="font-serif text-lg font-bold text-gray-50 mb-3">🛠️ Zone Développeur (Simulation)</h2>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-gray-200">Activer le mode Premium</p>
            <p className="text-xs text-gray-500">
              Active/désactive l’accès Premium pour tester le paywall (Stripe sera branché plus tard).
            </p>
          </div>
          <button
            type="button"
            disabled={!userId || premiumLoading}
            onClick={async () => {
              if (!userId || !supabase) return;
              const next = !premiumSim;
              setPremiumLoading(true);
              try {
                const { error } = await supabase.from('profiles').update({ is_premium: next }).eq('id', userId);
                if (error) throw error;
                setPremiumSim(next);
                refetch?.();
              } catch (err) {
                const msg = err?.message || 'Erreur lors de la mise à jour du mode Premium.';
                if (String(msg).includes("Could not find the 'is_premium' column")) {
                  setMessage({ type: 'error', text: "La colonne profiles.is_premium n'existe pas encore côté Supabase. Exécute la migration `supabase-migrations-premium-simulator.sql` puis réessaie." });
                } else {
                  setMessage({ type: 'error', text: msg });
                }
              } finally {
                setPremiumLoading(false);
              }
            }}
            className={`relative inline-flex h-9 w-16 flex-shrink-0 items-center rounded-full border transition ${
              premiumSim ? 'bg-emerald-500/25 border-emerald-400/40' : 'bg-[#0d1211] border-white/10'
            } ${premiumLoading ? 'opacity-60' : ''}`}
            aria-pressed={premiumSim}
            aria-label="Activer le mode Premium"
            title="Simulation Premium"
          >
            <span
              className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition ${
                premiumSim ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>

      {onBack && (
        <button type="button" onClick={onBack} className="text-[var(--accent)]/80 text-sm hover:accent-color">
          ← Retour au tableau de bord
        </button>
      )}
    </motion.div>
  );
}
