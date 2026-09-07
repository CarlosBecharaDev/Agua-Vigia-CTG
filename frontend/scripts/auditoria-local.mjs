import { chromium } from '@playwright/test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const browser = await chromium.launch({ headless: true })
const salida = path.join(os.tmpdir(), 'aguavigia-auditoria')
const origen = process.env.AGUAVIGIA_AUDIT_URL ?? 'http://127.0.0.1:5173'
fs.mkdirSync(salida, { recursive: true })

const casos = [
  ['inicio-claro', '/', 1280, 720, 'claro'],
  ['inicio-oscuro', '/', 1280, 720, 'oscuro'],
  ['inicio-movil-claro', '/', 360, 800, 'claro'],
  ['inicio-movil-oscuro', '/', 390, 844, 'oscuro'],
  ['inicio-tablet-claro', '/', 768, 1024, 'claro'],
  ['reportar-claro', '/reportar', 1280, 720, 'claro'],
  ['veedor-claro', '/veedor', 1280, 720, 'claro'],
  ['registro-oscuro', '/cuentas/registro', 1280, 720, 'oscuro'],
]

const axe = require.resolve('axe-core/axe.min.js')
const resultados = []
const fechaReciente = new Date().toISOString()

for (const [nombre, url, width, height, tema] of casos) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: tema === 'oscuro' ? 'dark' : 'light',
  })
  const page = await context.newPage()
  await page.addInitScript((valor) => localStorage.setItem('aguavigia-tema', valor), tema)
  await page.route('**/ArcGIS/**', (route) => route.abort())
  await page.route('**/posts?**', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/bitacora?**', (route) => route.fulfill({ json: [], headers: { 'x-total-count': '0' } }))
  await page.route('**/api/estadisticas', (route) => route.abort())
  await page.route('**/api/cumplimiento', (route) => route.abort())
  await page.route('**/api/sectores/stream', (route) => route.abort())
  await page.route('**/api/sectores', (route) => route.fulfill({
    json: {
      generadoEn: fechaReciente,
      sectores: [
        { id: 'sec-1', nombre: 'BOCAGRANDE', estado: 'CON_SERVICIO', actualizadoEn: fechaReciente },
        { id: 'sec-2', nombre: 'CRESPO', estado: 'SIN_SERVICIO', actualizadoEn: fechaReciente },
        { id: 'sec-3', nombre: 'MANGA', estado: 'PRESION_BAJA', actualizadoEn: fechaReciente },
        { id: 'sec-4', nombre: 'EL CABRERO', estado: 'CORTE_PROGRAMADO', actualizadoEn: fechaReciente },
      ],
    },
  }))

  await page.goto(`${origen}${url}`, { waitUntil: 'domcontentloaded' })
  await page.locator('h1').waitFor({ state: 'visible' })
  await page.waitForTimeout(250)
  await page.screenshot({
    path: path.join(salida, `${nombre}.png`),
    fullPage: url !== '/',
    animations: 'disabled',
    timeout: 60_000,
  })
  await page.addScriptTag({ path: axe })
  const audit = await page.evaluate(async () => {
    const resultado = await window.axe.run(document)
    return resultado.violations.map((violacion) => ({
      id: violacion.id,
      impact: violacion.impact,
      nodos: violacion.nodes.length,
      ayuda: violacion.help,
      detalles: violacion.nodes.slice(0, 12).map((nodo) => ({
        target: nodo.target,
        html: nodo.html,
        resumen: nodo.failureSummary,
      })),
    }))
  })
  resultados.push({ nombre, audit })
  await context.close()
}

await browser.close()
console.log(JSON.stringify({ salida, resultados }, null, 2))
