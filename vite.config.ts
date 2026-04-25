import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Vite config — Corre Patinho PWA.
 *
 * Ref: 03-TECH-STACK.md § 2, § 5
 * Ref: Decisão P3 (Vite), P10 (PWA offline-first)
 */
export default defineConfig({
  plugins: [
    VitePWA({
      /**
       * registerType: 'prompt' — o usuário é notificado quando há update disponível.
       * O update é aplicado no próximo reload, sem interromper partida.
       * Ref: 03-TECH-STACK.md § 5.2
       */
      registerType: 'prompt',

      /**
       * Manifest PWA — configuração conforme spec § 5.3.
       */
      manifest: {
        name: 'Corre Patinho',
        short_name: 'Corre Patinho',
        description: 'Jogo casual inspirado no brinquedo Patinho Escorregador. Desvie das curvas do tobogã!',
        display: 'fullscreen',
        orientation: 'landscape',
        theme_color: '#1E90FF',
        background_color: '#1a1a2e',
        lang: 'pt-BR',
        categories: ['games', 'entertainment'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      /**
       * Workbox — cache-first para todos os assets estáticos.
       * Ref: 03-TECH-STACK.md § 5.1
       *
       * O jogo funciona 100% offline após o primeiro acesso.
       * Todos os assets (JS, CSS, imagens, áudio) são cached.
       */
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2,mp3,ogg,webm}'],
        cleanupOutdatedCaches: true,
        /**
         * Configuração de cache runtime para assets não cobertos pelo precache.
         * Todos usam CacheFirst — o jogo é self-contained, não tem API externa.
         */
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
              },
            },
          },
          {
            urlPattern: /\.(?:mp3|ogg|webm|wav)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
});
