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
