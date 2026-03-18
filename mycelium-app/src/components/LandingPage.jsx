import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Camera, Sparkles, Shield, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

const atouts = [
  {
    icon: FileText,
    title: 'Éditeur Rich Text & Projets',
    description: 'Organisez vos pensées sans friction.',
  },
  {
    icon: Camera,
    title: 'Scanner OCR Vision',
    description: 'Prenez en photo vos notes papier, l\'IA les retranscrit instantanément.',
  },
  {
    icon: Sparkles,
    title: 'Assistant à la demande',
    description: 'Résumez ou extrayez des tâches uniquement quand vous en avez besoin.',
  },
];

export default function LandingPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Email et mot de passe requis.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        if (data?.session && onAuth) onAuth(data.session);
        else setError(''); // confirmation email sent
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        if (data?.session && onAuth) onAuth(data.session);
      }
    } catch (err) {
      setError(err?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--bg-main)] text-[var(--text-main)]">
      {/* Gauche / Haut : Vitrine */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:py-16 lg:px-12 xl:px-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-xl"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-50 tracking-tight">
            Votre Second Cerveau. Augmenté par l'IA.
          </h1>
          <p className="mt-4 text-lg text-gray-300 leading-relaxed">
            L'espace de travail minimaliste pour capturer vos notes, organiser vos projets et transcrire vos carnets manuscrits avec une intelligence à la demande.
          </p>

          <div className="mt-10 space-y-4">
            {atouts.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (i + 1), duration: 0.4 }}
                className="flex items-start gap-4 p-4 rounded-xl border border-gray-800 bg-[var(--bg-elevated)] hover:border-gray-700 transition"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-50">{item.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 p-4 rounded-xl border border-gray-800 bg-[var(--bg-elevated)]"
          >
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300">
                Vos données sont privées entre vous et l'IA, mais stockées sur nos serveurs de manière standard. Infrastructure sécurisée par Supabase RLS.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Droite / Bas : Auth */}
      <div className="flex-shrink-0 w-full lg:w-[420px] flex items-center justify-center p-6 lg:p-12 border-t lg:border-t-0 lg:border-l border-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <h2 className="text-xl font-semibold text-gray-50 mb-6">
            {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="landing-email" className="block text-sm font-medium text-gray-400 mb-1">
                Email
              </label>
              <input
                id="landing-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-elevated)] border border-gray-800 text-gray-50 placeholder-gray-500 focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="landing-password" className="block text-sm font-medium text-gray-400 mb-1">
                Mot de passe
              </label>
              <input
                id="landing-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-elevated)] border border-gray-800 text-gray-50 placeholder-gray-500 focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'login' ? (
                'Se connecter'
              ) : (
                'Créer mon espace'
              )}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
            {mode === 'login' ? (
              <>
                Pas encore de compte ?{' '}
                <button type="button" onClick={() => { setMode('signup'); setError(''); }} className="text-gray-50 hover:underline font-medium">
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-gray-50 hover:underline font-medium">
                  Se connecter
                </button>
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
