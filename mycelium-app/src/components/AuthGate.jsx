import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, Sparkles, Send } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { ToastContainer } from './Toast';

const EMAIL_NOT_CONFIRMED = 'Email not confirmed';

/**
 * AuthGate — Le Seuil de Verre
 * Design Glassmorphism bioluminescent, bordures or/émeraude, lueur selon l'action (doré / bleu éthéré).
 * Gestion "Email not confirmed" + bouton Renvoyer l'e-mail de confirmation.
 */
export default function AuthGate({ onAuth, children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resending, setResending] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, variant = 'success', duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant, duration }]);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // AuthListener : persistance session (localStorage) + mise à jour immédiate de l'UI
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
      if (s && onAuth) onAuth(s);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s && onAuth) onAuth(s);
    });
    return () => subscription?.unsubscribe();
  }, [onAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEmailNotConfirmed(false);
    if (!supabase) {
      setError('Supabase n\'est pas configuré.');
      addToast('Supabase non configuré.', 'error');
      return;
    }
    if (!email.trim() || !password) {
      setError('Courriel et Clé de Conscience sont requis.');
      addToast('Courriel et Clé de Conscience requis.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: displayName.trim() } },
        });
        if (err) throw err;
        if (data?.session) {
          setSession(data.session);
          if (onAuth) onAuth(data.session);
          addToast('Serment enregistré. Bienvenue dans le Réseau.');
        } else {
          addToast('Serment enregistré. Vérifiez votre courriel pour confirmer.');
        }
        setSuccess('Compte créé. Vous pouvez entrer dans le Réseau.');
        setSubmitting(false);
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) {
          if (err.message?.toLowerCase().includes('email not confirmed')) {
            setEmailNotConfirmed(true);
            setError('Courriel non confirmé. Consultez votre boîte mail et cliquez sur le lien, ou renvoyez l\'e-mail ci-dessous.');
            addToast('Courriel non confirmé. Utilisez le bouton ci-dessous pour renvoyer.', 'error');
          } else {
            setError(err.message || 'Erreur de connexion');
            addToast(err.message || 'Clé de résonance incorrecte.', 'error');
          }
          setSubmitting(false);
          return;
        }
        if (data?.session && onAuth) onAuth(data.session);
        addToast('Vous êtes entré dans le Réseau.');
        setSuccess('Connexion réussie.');
        setSubmitting(false);
      }
    } catch (err) {
      const msg = err?.message || 'Erreur de connexion';
      setError(msg);
      addToast(msg.includes('Email') ? 'Vérifiez votre courriel.' : 'Clé de résonance incorrecte.', 'error');
      setSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!supabase || !email.trim()) return;
    setResending(true);
    setError('');
    try {
      const { error: err } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      if (err) throw err;
      addToast('E-mail de confirmation renvoyé. Consultez votre boîte mail.');
      setSuccess('E-mail renvoyé. Vérifiez votre boîte (et les indésirables).');
    } catch (err) {
      setError(err?.message || 'Impossible de renvoyer l\'e-mail.');
      addToast(err?.message || 'Échec du renvoi.', 'error');
    }
    setResending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B0A] flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1], scale: [0.98, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-[#D4AF37] font-serif text-lg"
        >
          Le seuil s'ouvre…
        </motion.div>
      </div>
    );
  }

  if (session && children) {
    return children;
  }

  const isSignup = mode === 'signup';
  const glowBg = isSignup
    ? 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(56,189,248,0.18), transparent 55%)'
    : 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(212,175,55,0.22), transparent 55%)';

  return (
    <div className="min-h-screen bg-[#070B0A] relative overflow-hidden flex items-center justify-center p-4">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="absolute inset-0 bg-gradient-to-br from-[#0d1211] via-[#070B0A] to-[#0a0f0e]" aria-hidden />
      <div
        className="absolute inset-0 pointer-events-none opacity-90"
        style={{ background: glowBg, animation: 'pulse-glow 4s ease-in-out infinite' }}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div
          className={`
            rounded-2xl backdrop-blur-2xl p-8
            ${isSignup ? 'seuil-verre-breathe-signup' : 'seuil-verre-breathe'}
          `}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid transparent',
            backgroundImage: 'linear-gradient(rgba(7,11,10,0.4), rgba(13,18,17,0.5)), linear-gradient(135deg, rgba(212,175,55,0.45), rgba(16,185,129,0.35))',
            backgroundOrigin: 'padding-box, border-box',
            backgroundClip: 'padding-box, border-box',
          }}
        >
          <div className="flex justify-center mb-4">
            <Sparkles className={`w-8 h-8 ${isSignup ? 'text-sky-400/90' : 'text-[#D4AF37]/90'}`} aria-hidden />
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#F1F1E6] text-center mb-1 font-serif-titles">
            Le Seuil de l'Initiation
          </h1>
          <p className="text-[#F1F1E6]/70 text-sm text-center mb-6">
            Passez le seuil. La sève vous attend.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="temple-email" className="flex items-center gap-2 text-[#D4AF37] text-sm mb-1">
                <Mail className="w-4 h-4" />
                Courriel du Réseau
              </label>
              <input
                id="temple-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailNotConfirmed(false); }}
                placeholder="vous@exemple.com"
                required
                className="font-mono-inputs w-full px-4 py-3 rounded-xl bg-white/5 border border-[#D4AF37]/30 text-[#F1F1E6] placeholder-[#F1F1E6]/40 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition text-sm"
              />
            </div>
            <div>
              <label htmlFor="temple-password" className="flex items-center gap-2 text-[#D4AF37] text-sm mb-1">
                <Lock className="w-4 h-4" />
                Clé de Conscience
              </label>
              <input
                id="temple-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="font-mono-inputs w-full px-4 py-3 rounded-xl bg-white/5 border border-[#D4AF37]/30 text-[#F1F1E6] placeholder-[#F1F1E6]/40 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition text-sm"
              />
            </div>

            <AnimatePresence mode="wait">
              {isSignup && (
                <motion.div
                  key="display-name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label htmlFor="temple-display-name" className="flex items-center gap-2 text-[#D4AF37] text-sm mb-1">
                    <UserPlus className="w-4 h-4" />
                    Comment devons-nous vous nommer ?
                  </label>
                  <input
                    id="temple-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Prénom ou nom d'initié"
                    className="font-mono-inputs w-full px-4 py-3 rounded-xl bg-white/5 border border-[#D4AF37]/30 text-[#F1F1E6] placeholder-[#F1F1E6]/40 focus:border-[#D4AF37]/60 focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition text-sm"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {emailNotConfirmed && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-400/30 p-3">
                <p className="text-amber-200/90 text-sm mb-2">
                  Confirmez votre adresse en cliquant sur le lien reçu par e-mail, ou renvoyez-le.
                </p>
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resending}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 text-sm font-medium hover:bg-amber-500/30 transition disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {resending ? 'Envoi…' : "Renvoyer l'e-mail de confirmation"}
                </button>
              </div>
            )}

            {error && !emailNotConfirmed && (
              <p className="text-red-400 text-sm text-center" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="text-[#D4AF37] text-sm text-center" role="status">
                {success}
              </p>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className={`
                  w-full py-3 rounded-xl font-medium transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2
                  ${isSignup
                    ? 'bg-sky-500/80 hover:bg-sky-500 text-white'
                    : 'bg-[#D4AF37]/90 hover:bg-[#D4AF37] text-[#070B0A]'
                  }
                `}
              >
                {mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    Entrer dans le Réseau
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Prêter Serment
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError('');
                  setSuccess('');
                  setEmailNotConfirmed(false);
                }}
                className="text-[#D4AF37]/80 text-sm hover:text-[#D4AF37] transition py-1"
              >
                {mode === 'login' ? 'Prêter Serment (S\'inscrire)' : 'Déjà initié ? Entrer dans le Réseau'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
