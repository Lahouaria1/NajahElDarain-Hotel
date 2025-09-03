// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// 👉 Pre-warm the Render backend on app boot
import { BASE } from './lib/api';

(async () => {
  try {
    // add a preconnect hint
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = BASE;
    document.head.appendChild(link);

    // ping health (don’t block UI)
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 60000); // 60s for cold start
    await fetch(`${BASE}/health`, { signal: ctrl.signal });
    // console.log('Backend warmed');
  } catch {
    // ignore – just warming up
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
