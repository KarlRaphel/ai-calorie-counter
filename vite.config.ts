import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon-16x16.png', 'favicon-32x32.png'],
          manifest: {
            name: 'AI 卡路里计算器',
            short_name: '卡路里计算器',
            description: 'AI-powered calorie counter app',
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',
            icons: [
              {
                src: 'icon-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'icon-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,gif,woff2}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/aistudiocdn\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'cdn-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 30
                  }
                }
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
