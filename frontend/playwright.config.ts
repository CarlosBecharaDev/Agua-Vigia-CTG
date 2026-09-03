import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  // El servidor de desarrollo transforma los módulos a demanda y la página principal arrastra
  // varios chunks perezosos (mapa, bitácora, estadísticas) más la pantalla de bienvenida. Con
  // las pruebas en paralelo, el primer render de una ruta se pasa de los 5s por defecto y las
  // aserciones fallaban por arranque en frío, no por el código.
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Invocar Vite directamente evita dejar el proceso nieto de `npm` vivo al cerrar en Windows.
    command: 'node ./node_modules/vite/bin/vite.js --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
});
