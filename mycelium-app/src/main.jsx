import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Missing #root')

// En file:// les modules sont souvent bloqués ; si on charge quand même, afficher le message
if (window.location.protocol === 'file:') {
  rootEl.innerHTML = '<div style="padding:2rem;font-family:system-ui;text-align:center;max-width:480px;margin:2rem auto;color:#F1F1E6;background:#0d1211;border:1px solid rgba(212,175,55,0.3);border-radius:1rem;"><p style="color:#D4AF37;font-size:1.25rem;">Mycélium Hub</p><p style="margin:1rem 0;">Ouvrez l\'application via un serveur web (Laragon, etc.).</p><p style="margin:1rem 0;"><a href="http://localhost/mycelium-tests/" style="color:#D4AF37;">http://localhost/mycelium-tests/</a></p></div>'
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </StrictMode>,
  )
}
