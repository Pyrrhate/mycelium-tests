import { useState, useEffect } from 'react';
import AuthGate from './components/AuthGate';
import ProfilePublic from './components/ProfilePublic';
import LandingPage from './components/LandingPage';
import SmartJournal from './components/SmartJournal';
import VueParametres from './components/VueParametres';
import { useInitiationStatus } from './hooks/useInitiationStatus';
import { supabase } from './supabaseClient';
import { updateProfile } from './services/myceliumSave';
import { LogOut, Settings } from 'lucide-react';

function AppJournalView({ session, onLogout }) {
  const [showSettings, setShowSettings] = useState(false);
  const { profile, aiCredits, canActivatePublic, isPublic, refetch: refetchInitiation } = useInitiationStatus(session?.user?.id);

  return (
    <div className="min-h-screen bg-[#070B0A] flex flex-col">
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#070B0A]/95">
        <span className="text-sm font-semibold text-[#F1F1E6]/90">
          {showSettings ? 'Paramètres' : 'Smart Journal'}
        </span>
        <div className="flex items-center gap-2">
          {showSettings ? (
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[#F1F1E6]/60 hover:text-[#F1F1E6] hover:bg-white/5 transition"
            >
              <span className="text-xs">← Retour au journal</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[#F1F1E6]/60 hover:text-[#F1F1E6] hover:bg-white/5 transition"
              title="Paramètres"
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs">Paramètres</span>
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[#F1F1E6]/60 hover:text-[#F1F1E6] hover:bg-white/5 transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs">Déconnexion</span>
          </button>
        </div>
      </header>
      <main className="flex-1 min-h-0 overflow-auto">
        {showSettings ? (
          <div className="p-4 max-w-2xl mx-auto">
            <VueParametres
              onBack={() => setShowSettings(false)}
              userId={session?.user?.id}
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
          <SmartJournal
            userId={session?.user?.id}
            profile={profile}
            aiCredits={aiCredits ?? 15}
            onCreditsRefetch={refetchInitiation}
          />
        )}
      </main>
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
      <div className="min-h-screen bg-[#070B0A] flex items-center justify-center">
        <p className="text-[#D4AF37] font-serif">Le seuil s&apos;ouvre…</p>
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
