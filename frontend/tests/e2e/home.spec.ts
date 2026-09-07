import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // El navegador prueba la interfaz; los servicios se aíslan para no depender del Docker local.
  await page.route('**/api/sectores/stream', (route) => route.abort())
  await page.route('**/api/sectores', (route) => route.fulfill({ json: [] }))
  await page.route('**/api/bitacora?**', (route) => route.fulfill({ json: [], headers: { 'x-total-count': '0' } }))
  await page.route('**/api/estadisticas', (route) => route.abort())
  await page.route('**/api/cumplimiento', (route) => route.abort())
  await page.route('**/posts?**', (route) => route.fulfill({ json: [] }))
})

test('el acceso del veedor permite mostrar la clave', async ({ page }) => {
  await page.goto('/veedor')

  await expect(page).toHaveTitle(/AguaVigía/)
  await expect(page.getByRole('heading', { name: 'Ingreso del Veedor' })).toBeVisible()

  const clave = page.getByLabel('Clave', { exact: true })
  await expect(clave).toHaveAttribute('type', 'password')
  await clave.fill('clave-de-prueba')
  await page.getByRole('button', { name: 'Mostrar clave' }).click()
  await expect(clave).toHaveAttribute('type', 'text')
})

test('una ruta desconocida ofrece volver al mapa', async ({ page }) => {
  await page.goto('/ruta-que-no-existe')

  await expect(page.getByRole('heading', { name: 'Esta página no existe' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver el mapa' })).toHaveAttribute('href', '/')
})

test('la navegación principal conserva destino y estado activo', async ({ page }) => {
  await page.goto('/')

  const navegacion = page.getByRole('navigation', { name: 'Secciones de la página principal' })
  const mapa = navegacion.getByRole('button', { name: 'Mapa en vivo' })
  const bitacora = navegacion.getByRole('button', { name: 'Bitácora' })

  await expect(mapa).toHaveAttribute('aria-current', 'page')
  await bitacora.click()
  await expect(page).toHaveURL(/#bitacora$/)
  await expect(page.locator('#bitacora')).toBeInViewport()
})

test('el escritorio muestra el mapa en el primer viewport sin desbordamiento horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.goto('/')

  const mapa = page.locator('#contenedor-mapa')
  await expect(mapa).toBeVisible()
  const caja = await mapa.boundingBox()
  expect(caja).not.toBeNull()
  expect(caja!.y).toBeLessThan(720)

  const medidas = await page.evaluate(() => ({ ancho: document.documentElement.clientWidth, contenido: document.documentElement.scrollWidth }))
  expect(medidas.contenido).toBeLessThanOrEqual(medidas.ancho + 1)
})

test.describe('en teléfono', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('la navegación se mueve al pie y conserva objetivos táctiles', async ({ page }) => {
    await page.goto('/')

    const pie = page.getByRole('navigation', { name: 'Secciones de la página' })
    await expect(pie).toBeVisible()
    await expect(page.locator('.navbar-enlaces')).toHaveCount(0)
    await expect(pie.getByRole('button', { name: 'Mapa en vivo' })).toHaveAttribute('aria-current', 'page')

    for (const etiqueta of ['Mapa en vivo', 'Bitácora', 'Estadísticas', 'Panel veedor']) {
      const boton = pie.getByRole('button', { name: etiqueta })
      await expect(boton).toBeVisible()
      const caja = await boton.boundingBox()
      expect(caja!.height).toBeGreaterThanOrEqual(44)
      expect(caja!.width).toBeGreaterThanOrEqual(44)
    }
  })

  test('el mapa o su estado aparecen antes de hacer scroll', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('.portada-movil')).toHaveCount(0)
    const mapa = page.locator('#contenedor-mapa')
    await expect(mapa).toBeVisible()
    const caja = await mapa.boundingBox()
    expect(caja).not.toBeNull()
    expect(caja!.y).toBeLessThan(844)
  })

  test('los cinco filtros de la bitácora caben sin desbordar', async ({ page }) => {
    await page.goto('/#bitacora')

    const filtros = page.locator('.bitacora-filtros-pro')
    await expect(filtros).toBeVisible()
    const medidas = await filtros.evaluate((el) => ({ contenido: el.scrollWidth, caja: el.clientWidth }))
    expect(medidas.contenido).toBeLessThanOrEqual(medidas.caja + 1)
    await expect(filtros.getByRole('tab')).toHaveCount(5)
  })

  test('las flechas de la bitácora recorren el carrusel', async ({ page }) => {
    await page.route('**/api/bitacora?**', (route) =>
      route.fulfill({
        json: [1, 2, 3].map((n) => ({
          id: `evt-${n}`,
          tipo: 'CORTE_ANUNCIADO',
          timestamp: `2026-08-0${n}T12:00:00Z`,
          descripcion: `Boletín de prueba ${n}`,
        })),
      })
    )
    await page.goto('/#bitacora')

    const carrusel = page.locator('.bitacora-carrusel-pro')
    const anterior = page.getByRole('button', { name: 'Ver boletines anteriores' })
    const siguiente = page.getByRole('button', { name: 'Ver más boletines' })

    await expect(anterior).toBeDisabled()
    await siguiente.click()
    await expect.poll(async () => carrusel.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)
    await expect(anterior).toBeEnabled()
  })

  test('la marca sigue visible a 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/')

    await expect(page.locator('.navbar-superior .navbar-marca-copy')).toBeVisible()
    await expect(page.locator('.navbar-superior .navbar-marca-copy')).toHaveText('AguaVigía')
  })
})
