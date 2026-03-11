import { useState, useEffect } from 'react';
import AuthGate from './components/AuthGate';
import MyceliumHub from './components/MyceliumHub';
import ProfilePublic from './components/ProfilePublic';
import LandingPage from './components/LandingPage';
import { supabase } from './supabaseClient';

function App() {
  const [session, setSession] = useState(null);
  const [authIntent, setAuthIntent] = useState(null);
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
        <MyceliumHub session={session} onLogout={() => setSession(null)} />
      </AuthGate>
    );
  }

  if (authIntent) {
    return (
      <AuthGate
        initialMode={authIntent}
        onBack={() => setAuthIntent(null)}
        onAuth={setSession}
      >
        {null}
      </AuthGate>
    );
  }

  return (
    <LandingPage
      onSignup={() => setAuthIntent('signup')}
      onLogin={() => setAuthIntent('login')}
    />
  );
}

export default App;
