export type EstadoCapaBase = 'cargando' | 'disponible' | 'no-disponible'

interface EmisorEventosTesela {
  on: (tipo: string, manejador: () => void) => unknown
  off: (tipo: string, manejador: () => void) => unknown
}

/** Mantiene el fallo de una tanda de teselas hasta que comienza una carga nueva completa. */
export function observarEstadoCapaBase(
  capa: EmisorEventosTesela,
  alCambiar: (estado: EstadoCapaBase) => void,
): () => void {
  let huboError = false
  const alIniciar = () => {
    huboError = false
    alCambiar('cargando')
  }
  const alFallar = () => {
    huboError = true
    alCambiar('no-disponible')
  }
  const alCompletar = () => alCambiar(huboError ? 'no-disponible' : 'disponible')

  capa.on('loading', alIniciar)
  capa.on('tileerror', alFallar)
  capa.on('load', alCompletar)

  return () => {
    capa.off('loading', alIniciar)
    capa.off('tileerror', alFallar)
    capa.off('load', alCompletar)
  }
}
