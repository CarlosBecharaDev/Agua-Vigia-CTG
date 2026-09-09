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

test('la navegación mantiene contraste mientras aparece la píldora activa', async ({ page }) => {
  await page.goto('/')

  const estadoInicial = await page
    .getByRole('banner')
    .getByRole('link', { name: 'Bitácora & Boletines' })
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

  expect(estadoInicial.texto).toBe('Bitácora & Boletines')
  expect(estadoInicial.filtroActivo).toBe(true)
  expect(estadoInicial.color).toBe('rgb(255, 255, 255)')
})

test('el logo oficial aparece en la barra institucional sin recuadro', async ({ page }) => {
  await page.goto('/')

  const logo = page.locator('.navbar-marca-logo')
  await expect(logo).toBeVisible()
  await expect(page.locator('.panel-proyecto-logo-box')).toHaveCount(0)
  await expect(logo).toHaveCSS('width', '46px')
})

// ── Teléfono ──────────────────────────────────────────────────────────────────
// El corte (768px) es el mismo que usan las reglas móviles de `.navbar-superior` en
// index.css y el que consulta NavegacionFlotante para decidir qué navegación monta.
test('la barra superior muestra iconos y permite buscar boletines con el atajo', async ({ page }) => {
  await page.goto('/')

  const barra = page.getByRole('banner')
  await expect(barra.locator('.gooey-nav-icono')).toHaveCount(4)

  const buscador = barra.getByRole('searchbox', { name: 'Buscar en la bitácora' })
  await expect(buscador).toBeVisible()
  await page.keyboard.press('/')
  await expect(buscador).toBeFocused()
  await buscador.fill('Manga')
  await expect(buscador).toHaveValue('Manga')
  await expect(barra.getByRole('button', { name: 'Limpiar búsqueda' })).toBeVisible()
})

test('el panel barrial usa el tema claro y no presenta ceros cuando la API no entregó sectores', async ({ page }) => {
  await page.goto('/')

  const panel = page.getByRole('complementary', { name: 'Resumen y lista de sectores' })
  await expect(panel).toHaveCSS('background-color', 'rgba(249, 253, 253, 0.95)')
  await expect(panel.locator('.tarjeta-estado-mapa-num')).toHaveText(['—', '—', '—', '—'])
  await expect(panel.getByText('Esperando datos validados')).toHaveCount(4)
})

test('el mapa rotula barrios y conserva una sola selección ante clics rápidos', async ({ page }) => {
  const errores: Error[] = []
  page.on('pageerror', (error) => errores.push(error))
  await page.goto('/')

  await expect.poll(() => page.locator('.mapa-etiqueta-barrio--principal:visible').count()).toBeGreaterThan(0)
  const barrios = page.locator('.leaflet-overlay-pane path.leaflet-interactive')
  await expect.poll(() => barrios.count()).toBeGreaterThan(3)

  // Disparo síncrono para reproducir la ráfaga que antes acumulaba varios flyToBounds.
  await barrios.evaluateAll((elementos) => {
    elementos.slice(0, 3).forEach((elemento) => {
      elemento.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
  })

  await expect.poll(() => page.locator('.mapa-etiqueta-barrio--seleccionada').count()).toBe(1)
  expect(errores).toEqual([])
})

test.describe('en teléfono', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('la navegación se mueve a la barra del pie y el riel de arriba no se monta', async ({ page }) => {
    await page.goto('/')

    const pie = page.getByRole('navigation', { name: 'Secciones de la página' })
    await expect(pie).toBeVisible()
    await expect(page.locator('.navbar-enlaces')).toHaveCount(0)

    await expect(pie.getByRole('button', { name: 'Mapa en vivo' })).toHaveAttribute('aria-current', 'page')
    for (const etiqueta of ['Mapa en vivo', 'Bitácora & Boletines', 'Evidencias', 'Veeduría']) {
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
    // Tres publicaciones oficiales para que el carrusel tenga a dónde avanzar: a ancho de
    // teléfono cabe una. Esta vista no mezcla eventos internos con el feed público de Acuacar.
    await page.unroute('**/posts?**')
    await page.route('**/posts?**', (route) =>
      route.fulfill({
        json: [1, 2, 3].map((n) => ({
          id: n,
          date: `2026-08-0${n}T12:00:00`,
          link: `https://www.acuacar.com/boletin-oficial-${n}/`,
          title: { rendered: `Boletín oficial ${n}` },
          content: { rendered: `<p>Comunicado oficial de Acuacar ${n}</p>` },
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
