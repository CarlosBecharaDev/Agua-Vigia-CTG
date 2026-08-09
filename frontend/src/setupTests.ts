import '@testing-library/jest-dom'

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
