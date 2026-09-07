import { chromium } from '@playwright/test';
import path from 'path';

const outDir = 'C:/Users/josed/.gemini/antigravity-cli/brain/0fcbe40a-0714-4243-a2b2-d74d45e32692';

async function run() {
  const browser = await chromium.launch();

  // 1. Desktop Claro
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('aguavigia-tema', 'claro');
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, 'captura-rediseño-claro.png') });

    // Capturar elemento Bitácora completo
    const bitacora = page.locator('#bitacora');
    if (await bitacora.isVisible()) {
      await bitacora.screenshot({ path: path.join(outDir, 'captura-stitch-bitacora.png') });
    }

    // Capturar elemento Estadísticas completo
    const estadisticas = page.locator('#estadisticas');
    if (await estadisticas.isVisible()) {
      await estadisticas.screenshot({ path: path.join(outDir, 'captura-stitch-estadisticas.png') });
    }

    // Capturar elemento Veedor completo
    const veedor = page.locator('#veedor');
    if (await veedor.isVisible()) {
      await veedor.screenshot({ path: path.join(outDir, 'captura-stitch-veedor.png') });
    }

    await page.close();
  }

  // 2. Desktop Oscuro
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.click('#btn-selector-tema');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'captura-rediseño-oscuro.png') });

    const bitacora = page.locator('#bitacora');
    if (await bitacora.isVisible()) {
      await bitacora.screenshot({ path: path.join(outDir, 'captura-stitch-bitacora-oscuro.png') });
    }

    await page.close();
  }

  // 3. Mobile Claro
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'captura-rediseño-movil.png') });
    await page.close();
  }

  // 4. Mobile Oscuro
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.click('#btn-selector-tema');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'captura-rediseño-movil-oscuro.png') });
    await page.close();
  }

  await browser.close();
  console.log('Capturas listas!');
}

run().catch(console.error);
