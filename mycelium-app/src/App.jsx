import { useState } from 'react';
import AuthGate from './components/AuthGate';
import MyceliumHub from './components/MyceliumHub';

function App() {
  const [session, setSession] = useState(null);

  return (
    <AuthGate onAuth={setSession}>
      <MyceliumHub session={session} onLogout={() => setSession(null)} />
    </AuthGate>
  );
}

export default App;
