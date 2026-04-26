import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // dexie-react-hooks must NOT be pre-bundled by Vite — doing so creates a
  // separate React instance, causing the "useCallback is null" hook crash.
  // Instead, we exclude it so it resolves React at component render time
  // through the app's own single React copy.
  optimizeDeps: {
    exclude: ['dexie-react-hooks'],
    include: ['dexie'],
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true, // Expose on LAN (0.0.0.0) for multi-device testing
    headers: {
      // Required for Service Worker scope and SharedArrayBuffer (future use)
      'Service-Worker-Allowed': '/',
    },
  },
  preview: {
    port: 4173,
    host: true,
    headers: {
      'Service-Worker-Allowed': '/',
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Vite 8 / Rolldown requires manualChunks as a function
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react';
          }
          if (id.includes('node_modules/react-router-dom') || id.includes('node_modules/@remix-run')) {
            return 'router';
          }
          if (id.includes('node_modules/qrcode.react') || id.includes('node_modules/html5-qrcode')) {
            return 'qr';
          }
          if (id.includes('node_modules/zustand')) {
            return 'zustand';
          }
        },
      },
    },
  },
})
