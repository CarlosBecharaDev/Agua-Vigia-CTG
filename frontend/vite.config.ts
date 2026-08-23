import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'favicon-180.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'AguaVigía CTG — Monitoreo del Agua en Cartagena',
        short_name: 'AguaVigía',
        description: 'Monitoreo ciudadano del servicio de agua en Cartagena de Indias. Consulta el estado en tu barrio, reporta cortes y revisa estadísticas.',
        theme_color: '#0066cc',
        background_color: '#f5f5f7',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['utilities', 'social'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'favicon-32.png',
            sizes: '32x32',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // En localhost, una versión nueva debe reemplazar también la pestaña que seguía
        // controlada por el Service Worker anterior. El script no recarga clientes reales
        // de producción; allí se conserva el ciclo normal de actualización del PWA.
        importScripts: ['sw-local-refresh.js'],
        // Cachear assets estáticos incluyendo el GeoJSON de barrios
        // El GeoJSON se guarda al solicitarlo mediante runtimeCaching. Precachearlo también lo
        // descargaba y almacenaba dos veces, compitiendo con el primer render sobre 3G.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Caché en runtime para tiles de mapa y APIs externas
        runtimeCaching: [
          {
            // Tiles de OpenStreetMap — CacheFirst para funcionar offline
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // GeoJSON local (por si se carga dinámicamente)
            urlPattern: /barrios-cartagena\.geojson$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'geojson-barrios',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
              }
            }
          },
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err) => {
            console.warn(`[Vite Proxy] No se pudo conectar con el backend en ${options.target}: ${err.message}. Si el backend corre en Docker usa VITE_BACKEND_PROXY_TARGET=http://localhost:8081`);
          });
        },
      },
      '/acuacar-api': {
        target: 'https://www.acuacar.com/wp-json/wp/v2',
        changeOrigin: true,
        secure: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        rewrite: (path) => path.replace(/^\/acuacar-api/, ''),
      },
    },
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
  },
  // @ts-ignore - Vitest types
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    exclude: ['node_modules', 'tests/e2e/**'],
  }
})
