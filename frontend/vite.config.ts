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
      includeAssets: ['favicon-32.png', 'favicon-180.png', 'barrios-cartagena.geojson', 'pwa-192x192.png', 'pwa-512x512.png'],
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
        // Cachear assets estáticos incluyendo el GeoJSON de barrios.
        // `gif` NO va aquí a propósito: el logo animado pesa 4,6MB y precachearlo obligaría
        // a descargarlo entero en la instalación (además de pasarse del tope de 2MiB que
        // Workbox aplica por defecto). Se cachea en runtime, más abajo.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,geojson,woff2}'],
        // Caché en runtime para tiles de mapa y APIs externas
        runtimeCaching: [
          {
            // Logo animado de la marca. Estaba fuera de globPatterns y de runtimeCaching, así
            // que el service worker no lo tenía y la petición caía a red; contra el dev server
            // esa ruta con hash no existe y devolvía el index.html, que el <img> decodificaba
            // como 0x0 — el logo simplemente no aparecía.
            urlPattern: /\.gif$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'imagenes-marca',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
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
          {
            // API de clima Open-Meteo — NetworkFirst con fallback
            urlPattern: /^https:\/\/api\.open-meteo\.com/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-api',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 30, // 30 minutos
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      // El backend vive en otro puerto, así que sin esto `apiClient` (baseURL '/api') le
      // pegaba al propio dev server: GET devolvía el index.html del SPA con 200 y axios lo
      // daba por bueno, POST devolvía 404. Con el proxy el origen es el mismo que en
      // producción (nginx hace lo propio, ver frontend/nginx.conf) y no hace falta CORS.
      '/api': {
        target: process.env.VITE_BACKEND_ORIGIN || 'http://localhost:8080',
        changeOrigin: true,
        // RF de mapa en vivo: /api/sectores/stream es text/event-stream y se queda abierto.
        // Sin esto el proxy lo bufferiza y los eventos no llegan hasta que cierra.
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
              proxyRes.headers['cache-control'] = 'no-cache, no-transform'
            }
          })
        },
      },
      '/acuacar-api': {
        target: 'https://www.acuacar.com/wp-json/wp/v2',
        changeOrigin: true,
        secure: false,
        headers: {
          // El colector se identifica siempre (CLAUDE.md §Ética de datos, regla 3). Antes iba
          // un User-Agent de Chrome falsificado, que contradice la regla 1 del mismo archivo.
          // Verificado contra la API real: con esta identidad acuacar.com responde 200 igual.
          'User-Agent': 'AguaVigiaCTG-Bot/1.0 (+rafasarmiento777@gmail.com)',
          'Accept': 'application/json'
        },
        rewrite: (path) => path.replace(/^\/acuacar-api/, ''),
      },
      '/google-news-rss': {
        target: 'https://news.google.com/rss',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/google-news-rss/, ''),
      },
    },
  },
  // @ts-ignore - Vitest types
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
