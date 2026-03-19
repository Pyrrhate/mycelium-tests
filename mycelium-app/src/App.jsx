import { useState, useEffect } from 'react';
import AuthGate from './components/AuthGate';
import ProfilePublic from './components/ProfilePublic';
import LandingPage from './components/LandingPage';
import AnchoredJournal from './components/AnchoredJournal';
import VueParametres from './components/VueParametres';
import { useInitiationStatus } from './hooks/useInitiationStatus';
import { supabase } from './supabaseClient';
import { updateProfile } from './services/myceliumSave';
import { LogOut, Settings } from 'lucide-react';
import ThemeToggle from './components/ThemeToggle';
import { CryptoProvider } from './contexts/CryptoContext';

function AppJournalView({ session, onLogout }) {
  const [showSettings, setShowSettings] = useState(false);
  const { profile, canActivatePublic, isPublic, refetch: refetchInitiation } = useInitiationStatus(session?.user?.id);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[var(--bg-main)] text-[var(--text-main)]">
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-main)]">
        <span className="text-sm font-semibold">
          {showSettings ? 'Paramètres' : 'Smart Journal'}
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          {showSettings ? (
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="eink-label flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-black/5"
            >
              <span className="text-xs">← Retour au journal</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="eink-label flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-black/5"
              title="Paramètres"
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs">Paramètres</span>
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="eink-label flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-black/5"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs">Déconnexion</span>
          </button>
        </div>
      </header>
      <CryptoProvider userId={session?.user?.id}>
        <main className="flex-1 min-h-0 overflow-hidden">
          {showSettings ? (
            <div className="h-full overflow-y-auto p-4 max-w-2xl mx-auto">
              <VueParametres
                onBack={() => setShowSettings(false)}
                userId={session?.user?.id}
                profile={profile}
                canActivatePublic={canActivatePublic}
                isPublic={isPublic}
                onToggleForest={async () => {
                  if (!session?.user?.id || !supabase) return;
                  const slug = (session?.user?.user_metadata?.display_name || session?.user?.email || 'initie').replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
                  await updateProfile(session.user.id, { is_public: !isPublic, public_constellation: !isPublic, slug: isPublic ? null : (slug || `initie-${session.user.id.slice(0, 8)}`) });
                  refetchInitiation?.();
                }}
                refetch={refetchInitiation}
              />
            </div>
          ) : (
            <AnchoredJournal
              userId={session?.user?.id}
              profile={profile}
            />
          )}
        </main>
      </CryptoProvider>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [publicSlug, setPublicSlug] = useState(() => {
    const m = window.location.hash.match(/^#\/profile\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  });

  // Restaurer la session au chargement (refresh, onglet rouvert)
  useEffect(() => {
    if (!supabase) {
      setSessionLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setSessionLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    const parseHash = () => {
      const match = window.location.hash.match(/^#\/profile\/(.+)$/);
      setPublicSlug(match ? decodeURIComponent(match[1]) : null);
    };
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const handleProfileBack = () => {
    window.location.hash = '';
  };

  if (publicSlug) {
    return <ProfilePublic username={publicSlug} onBack={handleProfileBack} session={session} />;
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center eink-flash">
        <p className="text-2xl font-serif">Aura Notes relie vos pensées...</p>
      </div>
    );
  }

  if (session) {
    return (
      <AuthGate sessionFromParent={session} onAuth={setSession}>
        <AppJournalView session={session} onLogout={() => setSession(null)} />
      </AuthGate>
    );
  }

  return (
    <LandingPage onAuth={setSession} />
  );
}

export default App;
