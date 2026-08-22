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
