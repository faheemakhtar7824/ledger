import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Ledger — Expense Tracker',
        short_name: 'Ledger',
        description: 'Track personal and business expenses across separate Spaces.',
        theme_color: '#0B6E4F',
        background_color: '#F5F5F7',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache the app shell for offline access, per product brief's
        // "works offline via caching" requirement. API calls are NOT
        // cached here — expense data must always be fresh/live, not
        // served stale from cache.
        globPatterns: ['**/*.{js,css,html,svg}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  server: {
    port: 5173,
  },
});