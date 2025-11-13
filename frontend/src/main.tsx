// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { BASE } from './lib/api';

(async () => {
  try {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = BASE;
    document.head.appendChild(link);

    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 60000);
    await fetch(`${BASE}/health`, { signal: ctrl.signal });
  } catch {}
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
