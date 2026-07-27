import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        includeAssets: ['logo.png'],
        manifest: {
          name: 'Infinity',
          short_name: 'Infinity',
          description: 'Business operations dashboard',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#f97316',
          icons: [
            {
              src: '/logo.png',
              type: 'image/png',
              sizes: '192x192',
              purpose: 'any maskable',
            },
            {
              src: '/logo.png',
              type: 'image/png',
              sizes: '512x512',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/yvrkalzekgbfmysqoyzz\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api',
                expiration: {maxEntries: 50, maxAgeSeconds: 86400},
                networkTimeoutSeconds: 10,
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
