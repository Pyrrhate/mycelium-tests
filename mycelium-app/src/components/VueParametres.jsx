import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Key, Mail, TreeDeciduous, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

/**
 * Paramètres du compte : mot de passe, email, visibilité Forêt, supprimer le compte.
 */
export default function VueParametres({ onBack, userId, canActivatePublic, isPublic, onToggleForest, refetch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

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
        <h2 className="font-serif text-lg font-bold accent-color mb-4 flex items-center gap-2">
          <TreeDeciduous className="w-5 h-5" />
          Visibilité dans la Forêt
        </h2>
        {canActivatePublic ? (
          <button
            type="button"
            onClick={onToggleForest}
            className="px-4 py-2 rounded-xl bg-[var(--accent)]/20 border border-[var(--accent)]/50 accent-color font-medium hover:bg-[var(--accent)]/30"
          >
            {isPublic ? 'Masquer mon profil de la Forêt' : 'Activer mon affichage dans la Forêt'}
          </button>
        ) : (
          <p className="text-[#F1F1E6]/60 text-sm">
            Complétez les 49 Racines, le Totem et atteignez 1500 XP (Racine Ancrée) pour pouvoir apparaître dans la Forêt.
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

      {onBack && (
        <button type="button" onClick={onBack} className="text-[var(--accent)]/80 text-sm hover:accent-color">
          ← Retour au tableau de bord
        </button>
      )}
    </motion.div>
  );
}
