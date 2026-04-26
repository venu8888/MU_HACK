// =================================================================
// PulseMesh X Secure — Service Worker (Self-Contained, No CDN)
// Zero external dependencies — works fully offline from first load.
//
// Strategies:
//   Navigation (HTML)  → Network First  (3s timeout → cache fallback)
//   Static assets      → Cache First    (JS/CSS/fonts/images)
//   Google Fonts CSS   → Stale-While-Revalidate
//   Everything else    → Network Only   (don't cache)
// =================================================================

const SW_VERSION   = 'v5';
const CACHE_SHELL  = `pulsemesh-shell-${SW_VERSION}`;
const CACHE_ASSETS = `pulsemesh-assets-${SW_VERSION}`;
const CACHE_FONTS  = `pulsemesh-fonts-${SW_VERSION}`;
const CACHE_PAGES  = `pulsemesh-pages-${SW_VERSION}`;

// ALL cache names for this version — anything else gets deleted on activate
const ALL_CACHES = [CACHE_SHELL, CACHE_ASSETS, CACHE_FONTS, CACHE_PAGES];

// App shell URLs to precache at install time
const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

// ─── INSTALL ────────────────────────────────────────────────────
// Precache the app shell so the app loads offline immediately.
self.addEventListener('install', (event) => {
  console.log(`[PulseMesh SW ${SW_VERSION}] Installing…`);

  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => {
      // addAll fetches every URL and caches the response.
      // If any fetch fails, the whole install fails — acceptable,
      // since the preview server is always up on first install.
      return cache.addAll(SHELL_URLS);
    }).then(() => {
      console.log(`[PulseMesh SW ${SW_VERSION}] Shell precached.`);
      // Skip the waiting phase immediately — take control right away.
      return self.skipWaiting();
    })
  );
});

// ─── ACTIVATE ───────────────────────────────────────────────────
// Delete all caches that don't belong to this SW version.
self.addEventListener('activate', (event) => {
  console.log(`[PulseMesh SW ${SW_VERSION}] Activating…`);

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !ALL_CACHES.includes(key))
          .map((key) => {
            console.log(`[PulseMesh SW] Deleting old cache: ${key}`);
            return caches.delete(key);
          })
      );
    }).then(() => {
      console.log(`[PulseMesh SW ${SW_VERSION}] Controlling all clients.`);
      return self.clients.claim();
    })
  );
});

// ─── FETCH ──────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── Only handle GET requests ──
  if (request.method !== 'GET') return;

  // ── Skip Vite HMR / websocket / internal requests ──
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules') ||
    url.protocol === 'chrome-extension:'
  ) return;

  // ── Google Fonts stylesheets → Stale-While-Revalidate ──
  if (url.origin === 'https://fonts.googleapis.com') {
    event.respondWith(staleWhileRevalidate(request, CACHE_FONTS));
    return;
  }

  // ── Google Fonts files (binary) → Cache First ──
  if (url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, CACHE_FONTS));
    return;
  }

  // ── Static assets (Vite hashed JS/CSS/images) → Cache First ──
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, CACHE_ASSETS));
    return;
  }

  // ── SPA navigation → Network First with offline fallback ──
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNav(request));
    return;
  }

  // ── Everything else → pass through (no caching) ──
});

// ─── STRATEGY: Cache First ───────────────────────────────────────
// Serve from cache immediately; if not cached, fetch and store.
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed and not in cache — return a basic offline response
    return new Response('Offline — asset not cached.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// ─── STRATEGY: Stale While Revalidate ────────────────────────────
// Serve from cache instantly, then update cache in background.
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fire-and-forget network update
  const networkFetch = fetch(request).then((response) => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cached || networkFetch;
}

// ─── STRATEGY: Network First (Navigation) ─────────────────────────
// Try network with a 3-second timeout; fall back to cached HTML;
// last resort: serve the cached index.html (SPA offline shell).
async function networkFirstNav(request) {
  const cache = await caches.open(CACHE_PAGES);

  try {
    // Race the network against a 3-second timeout
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 3000)
      ),
    ]);

    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;

  } catch {
    // Network slow or offline → try cached version of this URL
    const cached = await cache.match(request);
    if (cached) return cached;

    // Fallback: serve index.html so React Router handles the route
    const shell =
      await caches.match('/index.html', { cacheName: CACHE_SHELL }) ||
      await caches.match('/',           { cacheName: CACHE_SHELL });

    if (shell) return shell;

    // Absolute last resort
    return new Response(
      `<!DOCTYPE html><html><head><title>Offline</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:60px;background:#0f172a;color:#94a3b8">
        <h2 style="color:#e2e8f0">PulseMesh — Offline</h2>
        <p>The app shell hasn't been cached yet. Please visit once while online.</p>
      </body></html>`,
      { status: 503, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// ─── HELPER: Is this a static Vite asset? ────────────────────────
function isStaticAsset(url) {
  // Vite builds assets into /assets/ with content hashes
  if (url.pathname.startsWith('/assets/')) return true;

  // Common static file extensions
  return /\.(js|mjs|css|woff2|woff|ttf|otf|png|jpg|jpeg|webp|svg|gif|ico)$/.test(
    url.pathname
  );
}

// ─── MESSAGE HANDLER ─────────────────────────────────────────────
// Allow the main thread to trigger skipWaiting programmatically.
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    console.log(`[PulseMesh SW] SKIP_WAITING received — taking control.`);
    self.skipWaiting();
  }

  if (event.data.type === 'GET_VERSION' && event.ports[0]) {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
});
