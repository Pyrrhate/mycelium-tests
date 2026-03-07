import { useState, useEffect } from 'react';
import AuthGate from './components/AuthGate';
import MyceliumHub from './components/MyceliumHub';
import ProfilePublic from './components/ProfilePublic';

function App() {
  const [session, setSession] = useState(null);
  const [publicSlug, setPublicSlug] = useState(() => {
    const m = window.location.hash.match(/^#\/profile\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  });

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
    return <ProfilePublic username={publicSlug} onBack={handleProfileBack} />;
  }

  return (
    <AuthGate onAuth={setSession}>
      <MyceliumHub session={session} onLogout={() => setSession(null)} />
    </AuthGate>
  );
}

export default App;
