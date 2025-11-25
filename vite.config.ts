import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// IMPORTANT: Set this to your repo name for GitHub Pages, e.g. "/pwa-game-hello/"
const REPO_BASE = process.env.REPO_BASE || '/pwa-game-hello/';

export default defineConfig({
  base: REPO_BASE,
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,ogg,wav,mp3,json}'],
        navigateFallback: 'index.html',
        clientsClaim: true,
        skipWaiting: false, // we'll prompt the user to reload
        cleanupOutdatedCaches: true
      },
      manifest: {
        name: 'PWA Game Hello',
        short_name: 'PWA Game',
        description: 'Phaser 3 PWA game starter (offline forever).',
        display: 'standalone',
        background_color: '#0b1020',
        theme_color: '#0b1020',
        categories: ['games', 'entertainment'],
        icons: [
          { src: 'assets/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'assets/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
  build: {
    sourcemap: false
  }
});
