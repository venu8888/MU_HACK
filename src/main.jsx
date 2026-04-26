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

import { App as CapApp } from '@capacitor/app';
import { parseDeepLink, syncWithPeerViaHttp } from './lib/sync';
import { decompressPackets } from './lib/qr';
import { bulkUpsert } from './lib/db';

// ── Deep Link Handler ─────────────────────────────────────────────────────────
// When any camera scans a QR and opens the app (native or web),
// this listener fires and routes to the correct action.
export async function handleDeepLink(url) {
  if (!url) return;
  const isPulseMeshScheme = url.startsWith('pulsemesh://');
  const isPulseMeshApp = url.includes('pulsemesh.app');
  const isWebLink = url.includes('venu8888.github.io/MU_HACK') || url.includes('localhost') || url.includes('127.0.0.1');
  
  if (!isPulseMeshScheme && !isPulseMeshApp && !isWebLink) return;
  
  const link = parseDeepLink(url);
  if (!link) return;
  
  console.log('[DeepLink] Received:', url);

  if (link.action === 'psync') {
    // Personal QR scanned — import and prepare to send back (Ping-Pong)
    console.log(`[DeepLink] Personal Sync payload received`);
    try {
      const { useAppStore } = await import('./store/useAppStore');
      const { addLog, triggerReturnSync } = useAppStore.getState();
      addLog('🔄 Personal QR scanned — processing alerts...', 'info');
      
      if (link.data) {
        const packets = decompressPackets(link.data);
        const result = await bulkUpsert(packets, 1);
        addLog(`✅ Sync Step 1: Imported ${result.imported} alerts.`, 'success');
        useAppStore.getState().loadMessages?.();
      }
      
      // Trigger the UI to show the return QR code
      triggerReturnSync();
      // Redirect to the QR page to show the return QR code
      window.location.href = '/qr';
    } catch (err) {
      console.error('[DeepLink] Personal Sync failed:', err);
    }
  }

  if (link.action === 'drop') {
    // Public Drop QR scanned — import alerts from encoded data
    console.log('[DeepLink] Importing public drop data');
    try {
      const { useAppStore } = await import('./store/useAppStore');
      const { addLog } = useAppStore.getState();
      addLog('📦 Public QR scanned — importing alerts...', 'info');
      
      const packets = decompressPackets(link.data);
      const result = await bulkUpsert(packets, link.hops + 1);
      addLog(`✅ Imported ${result.imported} new alerts (hop ${link.hops + 1})`, 'success');
      useAppStore.getState().loadMessages?.();
    } catch (err) {
      console.error('[DeepLink] Drop import failed:', err);
    }
  }
}

// Listen for deep links when app is already running
CapApp.addListener('appUrlOpen', ({ url }) => handleDeepLink(url));

// Handle deep link if app was cold-started via QR scan (Native)
CapApp.getLaunchUrl().then(({ url } = {}) => { if (url) handleDeepLink(url); }).catch(() => {});

// Handle Web Universal Links (If app opened in browser)
if (window.location.search) {
  // Add a slight delay to ensure store is ready
  setTimeout(() => handleDeepLink(window.location.href), 500);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
