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
