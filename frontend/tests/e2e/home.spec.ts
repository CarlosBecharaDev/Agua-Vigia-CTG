import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Las pantallas bajo prueba montan el shell global, que consulta el backend y abre SSE.
  // Aislamos esos servicios para que el E2E sea determinista y pueda cerrar sin conexiones vivas.
  await page.route('**/api/sectores/stream', (route) => route.abort())
  await page.route('**/api/sectores', (route) => route.fulfill({ json: [] }))
  await page.route('**/posts?**', (route) => route.fulfill({ json: [] }))
})

test('el acceso del veedor inicia cerrado y permite mostrar la clave', async ({ page }) => {
  await page.goto('/veedor')

  await expect(page).toHaveTitle(/AguaVigía/)
  await expect(page.getByRole('heading', { name: 'Ingreso del Veedor' })).toBeVisible()

  const clave = page.getByLabel('Clave del veedor')
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

test('la navegación mantiene contraste mientras aparece la píldora activa', async ({ page }) => {
  await page.goto('/')

  const estadoInicial = await page
    .getByRole('banner')
    .getByRole('link', { name: 'Bitácora' })
    .evaluate((enlace) => new Promise<{ texto: string; filtroActivo: boolean; color: string }>((resolve) => {
      enlace.addEventListener('click', () => queueMicrotask(() => {
        const contenedor = enlace.closest('.gooey-nav-container')
        const texto = contenedor?.querySelector<HTMLElement>('.effect.text')
        const filtro = contenedor?.querySelector<HTMLElement>('.effect.filter')
        resolve({
          texto: texto?.innerText ?? '',
          filtroActivo: filtro?.classList.contains('active') ?? false,
          color: texto ? getComputedStyle(texto).color : '',
        })
      }), { once: true })
      enlace.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    }))

  expect(estadoInicial.texto).toBe('Bitácora')
  expect(estadoInicial.filtroActivo).toBe(true)
  expect(estadoInicial.color).toBe('rgb(255, 255, 255)')
})

test('el logo principal conserva su tamaño original y no tiene recuadro', async ({ page }) => {
  await page.goto('/')

  const logo = page.locator('.panel-proyecto-logo')
  await expect(logo).toBeVisible()
  await expect(page.locator('.panel-proyecto-logo-box')).toHaveCount(0)
  // 195px desde e465a23, que agrandó el logo al centrar el panel de bienvenida. El test se quedó
  // en los 150px anteriores y dejó el CI en rojo sin que nadie lo mirara. Lo que la prueba vigila
  // no es la cifra en sí, sino que el logo conserve su tamaño de diseño y no vuelva el recuadro.
  await expect(logo).toHaveCSS('width', '195px')
})

// ── Teléfono ──────────────────────────────────────────────────────────────────
// El corte (768px) es el mismo que usan las reglas móviles de `.navbar-superior` en
// index.css y el que consulta NavegacionFlotante para decidir qué navegación monta.
test.describe('en teléfono', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('la navegación se mueve a la barra del pie y el riel de arriba no se monta', async ({ page }) => {
    await page.goto('/')

    const pie = page.getByRole('navigation', { name: 'Secciones de la página' })
    await expect(pie).toBeVisible()
    await expect(page.locator('.navbar-enlaces')).toHaveCount(0)

    await expect(pie.getByRole('button', { name: 'Mapa en vivo' })).toHaveAttribute('aria-current', 'page')
    for (const etiqueta of ['Mapa en vivo', 'Bitácora', 'Estadísticas', 'Panel veedor']) {
      await expect(pie.getByRole('button', { name: etiqueta })).toBeVisible()
    }
  })

  test('el panel del proyecto es la portada y «Ver el mapa» baja hasta el mapa', async ({ page }) => {
    await page.goto('/')

    const portada = page.locator('.portada-movil')
    await expect(portada).toBeVisible()
    await expect(portada.getByRole('heading', { level: 1 })).toContainText('AGUA')
    // El nombre accesible del botón es su aria-label («Suscríbete para recibir avisos de tu
    // barrio»), no su texto visible: por eso el patrón es solo la primera palabra.
    await expect(portada.getByRole('button', { name: /Suscríbete/i })).toBeVisible()

    await portada.getByRole('button', { name: 'Ver el mapa' }).click()
    await expect
      .poll(async () => Math.round(await page.locator('#mapa').evaluate((el) => el.getBoundingClientRect().top)))
      .toBeLessThanOrEqual(2)
  })

  test('los cinco filtros de la bitácora caben completos, sin desbordar', async ({ page }) => {
    await page.goto('/#bitacora')

    const filtros = page.locator('.bitacora-filtros-pro')
    await expect(filtros).toBeVisible()
    const medidas = await filtros.evaluate((el) => ({ contenido: el.scrollWidth, caja: el.clientWidth }))
    expect(medidas.contenido).toBeLessThanOrEqual(medidas.caja + 1)
    await expect(filtros.getByRole('tab')).toHaveCount(5)
  })

  test('las flechas de la bitácora recorren el carrusel', async ({ page }) => {
    // Tres boletines para que el carrusel tenga a dónde avanzar: a ancho de teléfono cabe uno.
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

    // En el primer boletín no hay nada antes: la flecha se apaga, no desaparece.
    await expect(anterior).toBeDisabled()
    await siguiente.click()
    await expect.poll(async () => carrusel.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)
    await expect(anterior).toBeEnabled()
  })

  // BUG-067: una regla de la media query de 480px pensada para el otro encabezado ocultaba el
  // texto de la marca, y como aquí la marca es SOLO texto, la barra se quedaba sin ninguna.
  test('la marca sigue visible en la barra de arriba en pantallas pequeñas', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto('/')

    await expect(page.locator('.navbar-superior .navbar-marca-copy')).toBeVisible()
    await expect(page.locator('.navbar-superior .navbar-marca-copy')).toHaveText('AguaVigía')
  })
})
