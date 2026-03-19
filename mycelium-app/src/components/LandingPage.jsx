import { useState } from 'react';
import { BookOpenText, Brain, Camera, FileText, Loader2, Shield, Sparkles } from 'lucide-react';
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
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:py-16 lg:px-14 xl:px-24">
        <div className="max-w-2xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight">
            Votre Second Cerveau. Augmenté par l'IA.
          </h1>
          <p className="mt-6 text-2xl leading-relaxed">
            L'espace de travail minimaliste pour capturer vos notes, organiser vos projets et transcrire vos carnets manuscrits avec une intelligence à la demande.
          </p>

          <div className="mt-10 space-y-4">
            {atouts.map((item, i) => (
              <div
                key={item.title}
                className="flex items-start gap-4 p-4 border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-dashed"
              >
                <div className="w-10 h-10 border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-medium">{item.title}</h3>
                  <p className="text-base text-[var(--text-muted)] mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <section className="mt-12 border-t border-[var(--border-subtle)] pt-8 space-y-5">
            <h2 className="text-4xl font-semibold">Pourquoi j'ai développé cette application</h2>
            <article className="flex gap-3">
              <FileText className="w-5 h-5 mt-1" />
              <p className="text-xl leading-relaxed"><strong>Le Confort sans Distraction</strong> - Les outils répandus sont des cockpits surchargés. Aura Notes est conçu pour la concentration totale, avec une interface pure qui laisse respirer votre pensée.</p>
            </article>
            <article className="flex gap-3">
              <Brain className="w-5 h-5 mt-1" />
              <p className="text-xl leading-relaxed"><strong>IA comme Partenaire, pas Remplaçant</strong> - La concurrence utilise l'IA pour écrire à votre place, volant votre voix. Notre Mentor agit comme un Coach pour structurer vos mots, sans dénaturer votre voix.</p>
            </article>
            <article className="flex gap-3">
              <Camera className="w-5 h-5 mt-1" />
              <p className="text-xl leading-relaxed"><strong>Fluidité Physique-Numérique</strong> - Aucun outil n'intègre si élégamment vos carnets manuscrits. Notre OCR Vision intelligent numérise et archive vos notes papier en 5 secondes, créant un pont élégant.</p>
            </article>
          </section>

          <div className="mt-10 p-4 border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-base">
                Vos données sont privées entre vous et l'IA, stockées sur nos serveurs de manière standard. Infrastructure sécurisée par Supabase RLS.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 w-full lg:w-[460px] flex items-center justify-center p-6 lg:p-12 border-t lg:border-t-0 lg:border-l border-[var(--border-subtle)]">
        <div className="w-full max-w-sm border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6">
          <h2 className="text-2xl font-semibold mb-6">
            {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="landing-email" className="eink-label block text-xs font-medium text-[var(--text-muted)] mb-1">
                Email
              </label>
              <input
                id="landing-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                className="eink-label w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-subtle)] placeholder-gray-500 focus:outline-none"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="landing-password" className="eink-label block text-xs font-medium text-[var(--text-muted)] mb-1">
                Mot de passe
              </label>
              <input
                id="landing-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="eink-label w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-subtle)] placeholder-gray-500 focus:outline-none"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="eink-label w-full py-3 border border-[var(--text-main)] bg-[var(--text-main)] text-[var(--bg-main)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          <p className="mt-4 text-center text-sm text-[var(--text-muted)] eink-label">
            {mode === 'login' ? (
              <>
                Pas encore de compte ?{' '}
                <button type="button" onClick={() => { setMode('signup'); setError(''); }} className="font-medium underline">
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <button type="button" onClick={() => { setMode('login'); setError(''); }} className="font-medium underline">
                  Se connecter
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
