import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// ── Service Worker Registration (Workbox) ──────────────────────────────────
// The SW is served from /sw.js in the public directory.
// It uses Workbox 7 via CDN to provide:
//   • Cache First for JS/CSS/image assets (offline-first)
//   • Stale While Revalidate for Google Fonts stylesheets
//   • Network First for SPA navigation (with offline fallback)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        // updateViaCache: 'none' ensures the browser always checks for a
        // new SW from the network rather than from the HTTP cache.
        updateViaCache: 'none',
      });

      console.log('[PulseMesh] Service Worker registered:', registration.scope);

      // Listen for updates — when a new SW is waiting, prompt the user
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // New SW installed and waiting to activate
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PulseMesh] New version available. Activating...');
            // Tell the waiting SW to skip waiting and take control immediately
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      // When controller changes (new SW activated), reload for fresh assets
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('[PulseMesh] New SW controlling page — reloading for fresh assets.');
          window.location.reload();
        }
      });

    } catch (error) {
      // SW registration failed (e.g., private browsing, blocked) — app still works
      console.warn('[PulseMesh] Service Worker registration failed:', error);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
