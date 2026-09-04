import '@testing-library/jest-dom'

// jsdom no implementa IntersectionObserver — lo necesita framer-motion (useInView), que
// usan BuscadorBarrios y otros componentes con animaciones de scroll.
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
// @ts-expect-error -- stub mínimo solo para el entorno de test, no implementa la interfaz completa
globalThis.IntersectionObserver = IntersectionObserverMock

// Tampoco implementa ResizeObserver — lo necesita el carrusel de SeccionBitacora, que mide el
// desbordamiento para decidir si las flechas deben existir.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock

// jsdom tampoco implementa matchMedia, y lo consultan useConsultaMedios (qué navegación y qué
// portada se montan) y todo lo que respeta prefers-reduced-motion. Por defecto nada coincide:
// las pruebas corren en la variante de escritorio y con animación. Quien necesite otra cosa lo
// sobrescribe en su propio archivo (ver Encabezado.test.tsx).
const consultaMediosPruebas = (consulta: string): MediaQueryList => ({
  matches: false,
  media: consulta,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})
globalThis.matchMedia = consultaMediosPruebas

const memoria = new Map<string, string>()
const almacenamientoPruebas: Storage = {
  get length() { return memoria.size },
  clear: () => memoria.clear(),
  getItem: (clave) => memoria.get(clave) ?? null,
  key: (indice) => [...memoria.keys()][indice] ?? null,
  removeItem: (clave) => { memoria.delete(clave) },
  setItem: (clave, valor) => { memoria.set(clave, String(valor)) },
}

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: almacenamientoPruebas,
})
