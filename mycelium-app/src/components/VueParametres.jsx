import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Key, Mail, Trash2, Package, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { generateDataArchive } from '../utils/exportArchive';
import { useCryptoVault } from '../contexts/CryptoContext';

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
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const { hasVault, unlocked, busy: vaultBusy, error: vaultError, activateVault, lock } = useCryptoVault();

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-8 text-[var(--text-main)]">
      <h1 className="text-3xl font-semibold flex items-center gap-2">
        <Settings className="w-7 h-7" />
        Paramètres
      </h1>

      {message.text && (
        <div
          className={`rounded-xl p-4 text-sm ${message.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}
        >
          {message.text}
        </div>
      )}

      <section className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          Mon Profil
        </h2>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Key className="w-5 h-5" />
          Mot de passe
        </h3>
        <form onSubmit={handleUpdatePassword} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nouveau mot de passe (6 caractères min.)"
            className="eink-label w-full px-4 py-2 bg-[var(--bg-main)] border border-[var(--border-subtle)] focus:outline-none"
          />
          <button type="submit" disabled={loading} className="eink-label px-4 py-2 border border-[var(--text-main)] hover:bg-black/5 disabled:opacity-50">
            {loading ? 'Envoi...' : 'Modifier le mot de passe'}
          </button>
        </form>
        <h3 className="text-lg font-semibold mt-6 mb-3 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email
        </h3>
        <form onSubmit={handleUpdateEmail} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nouvelle adresse email"
            className="eink-label w-full px-4 py-2 bg-[var(--bg-main)] border border-[var(--border-subtle)] focus:outline-none"
          />
          <button type="submit" disabled={loading} className="eink-label px-4 py-2 border border-[var(--text-main)] hover:bg-black/5 disabled:opacity-50">
            {loading ? 'Envoi...' : 'Modifier l\'email'}
          </button>
        </form>
      </section>

      <section className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6">
        <h2 className="text-2xl font-semibold mb-4">🔐 Sécurité & Chiffrement</h2>
        <div className="space-y-3">
          <label className="eink-label block text-xs text-[var(--text-muted)]">Définir votre Clé Maîtresse</label>
          <input
            type="password"
            value={masterKeyInput}
            onChange={(e) => setMasterKeyInput(e.target.value)}
            placeholder="Entrez votre clé maîtresse"
            className="eink-label w-full max-w-md px-4 py-2 bg-[var(--bg-main)] border border-[var(--border-subtle)] focus:outline-none"
          />
          <p className="italic text-lg">
            Attention : Cette clé ne transite jamais par nos serveurs. Si vous la perdez, vos notes chiffrées seront définitivement illisibles. Nous ne pouvons pas la réinitialiser.
          </p>
          {vaultError ? <p className="text-sm text-red-500">{vaultError}</p> : null}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const ok = await activateVault(masterKeyInput);
                if (ok) setMasterKeyInput('');
              }}
              disabled={vaultBusy || !masterKeyInput.trim()}
              className="eink-label px-4 py-2 border border-[var(--text-main)] hover:bg-black/5 disabled:opacity-50"
            >
              {hasVault ? 'Déverrouiller le coffre-fort' : 'Activer le coffre-fort'}
            </button>
            {unlocked && (
              <button type="button" onClick={lock} className="eink-label px-4 py-2 border border-dashed border-[var(--text-main)]">
                Verrouiller
              </button>
            )}
          </div>
          <p className="eink-label text-xs text-[var(--text-muted)]">
            État: {hasVault ? (unlocked ? 'Déverrouillé en session' : 'Verrouillé') : 'Non configuré'}
          </p>
        </div>
      </section>

      <section className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6">
        <h2 className="text-2xl font-semibold mb-4">Apparence</h2>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Propriété de vos données
        </h3>
        <p className="text-[var(--text-muted)] text-base mb-4">
          Vos pensées vous appartiennent. Téléchargez une archive complète de vos notes et projets à tout moment pour la conserver sur votre propre disque dur ou Cloud.
        </p>
        <button
          type="button"
          onClick={handleGenerateArchive}
          disabled={isExporting}
          className="eink-label px-4 py-3 border border-[var(--text-main)] text-[var(--text-main)] bg-[var(--bg-main)] hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

      <section className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6">
        <h2 className="text-2xl font-semibold mb-4">Sécurité</h2>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Supprimer le compte
        </h3>
        <p className="text-[var(--text-muted)] text-sm mb-4">
          Cette action est irréversible. Toutes vos données (profil, journal, résonances) seront supprimées.
        </p>
        <input
          type="text"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder='Tapez SUPPRIMER pour confirmer'
          className="eink-label w-full max-w-xs px-4 py-2 bg-[var(--bg-main)] border border-[var(--border-subtle)] mb-3"
        />
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleteConfirm !== 'SUPPRIMER' || deleteLoading}
          className="eink-label px-4 py-2 border border-dashed border-[var(--text-main)] hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleteLoading ? 'Suppression...' : 'Supprimer définitivement mon compte'}
        </button>
      </section>

      {/* Simulation Premium (Stripe à venir) */}
      <section className="border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6">
        <h2 className="text-lg font-semibold mb-3">Simulateur Premium (is_premium)</h2>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-gray-200">Activer le mode Premium</p>
            <p className="text-xs text-gray-500">
              Active/désactive l’accès Premium pour tester le paywall (Stripe sera branché plus tard).
            </p>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={premiumSim}
              disabled={!userId || premiumLoading}
              onChange={async () => {
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
              className="h-5 w-5 border border-dashed border-[var(--text-main)] accent-black"
            />
            <span className="eink-label text-sm">{premiumLoading ? 'Mise à jour...' : 'Activer le mode Premium'}</span>
          </label>
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
