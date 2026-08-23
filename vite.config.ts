/// <reference types="vitest/config" />
import { execSync } from 'child_process';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/** `unsafe-inline` für Stile, weil Radix Positionen als Inline-Style setzt. */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ');

/** Nur im Build: im Dev-Server würde `script-src 'self'` React Refresh abwürgen. */
const cspPlugin = {
  name: 'csp-meta',
  apply: 'build' as const,
  transformIndexHtml: (html: string) =>
    html.replace(
      '<meta charset="UTF-8" />',
      `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`
    ),
};

/** Kurzer Commit-Hash, damit man im Support fragen kann, welche Version jemand sieht. */
const appVersion = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unbekannt';
  }
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cspPlugin,
    VitePWA({
      // 'prompt' statt 'autoUpdate': der neue Worker wartet, statt den laufenden
      // Tab zu übernehmen und dessen Dateien wegzuräumen. Erst der Reload wechselt.
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'DSA Roll Assistant',
        short_name: 'DSA Würfel',
        description: 'Digitaler Würfelassistent und Charakterbogen für DSA 5',
        lang: 'de',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        theme_color: '#2a1f13',
        background_color: '#f6f1e8',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion()),
  },
  base: '/dsa-roll-assistant/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
  },
});
