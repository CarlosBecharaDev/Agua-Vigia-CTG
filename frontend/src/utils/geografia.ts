/** Utilidades compartidas para cruzar nombres y geometrías de barrios. */

export function normalizarNombreBarrio(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Permite que un boletín de un barrio padre cubra sus polígonos por comuna. */
export function nombresBarrioCoinciden(primero: string, segundo: string): boolean {
  const a = normalizarNombreBarrio(primero)
  const b = normalizarNombreBarrio(segundo)
  return a === b || a.startsWith(`${b} -`) || b.startsWith(`${a} -`)
}

type Punto = [number, number]
type Anillo = Punto[]

function puntoSobreSegmento(punto: Punto, inicio: Punto, fin: Punto): boolean {
  const [x, y] = punto
  const [x1, y1] = inicio
  const [x2, y2] = fin
  const productoCruzado = (y - y1) * (x2 - x1) - (x - x1) * (y2 - y1)

  if (Math.abs(productoCruzado) > Number.EPSILON) return false

  return x >= Math.min(x1, x2) - Number.EPSILON
    && x <= Math.max(x1, x2) + Number.EPSILON
    && y >= Math.min(y1, y2) - Number.EPSILON
    && y <= Math.max(y1, y2) + Number.EPSILON
}

/** Ray casting: el punto se considera dentro también cuando cae en un borde. */
export function puntoDentroDeAnillo(punto: Punto, anillo: Anillo): boolean {
  if (anillo.length < 3) return false

  let dentro = false
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const actual = anillo[i]
    const anterior = anillo[j]
    if (puntoSobreSegmento(punto, anterior, actual)) return true

    const cruza = (actual[1] > punto[1]) !== (anterior[1] > punto[1])
      && punto[0] < (anterior[0] - actual[0]) * (punto[1] - actual[1])
        / (anterior[1] - actual[1]) + actual[0]
    if (cruza) dentro = !dentro
  }

  return dentro
}

function puntoDentroDePoligono(punto: Punto, anillos: Anillo[]): boolean {
  const [exterior, ...huecos] = anillos
  return Boolean(exterior)
    && puntoDentroDeAnillo(punto, exterior)
    && !huecos.some(hueco => puntoDentroDeAnillo(punto, hueco))
}

/** Acepta geometrías GeoJSON Polygon y MultiPolygon. */
export function geometriaContienePunto(
  geometry: { type?: string; coordinates?: unknown } | null | undefined,
  latitud: number,
  longitud: number,
): boolean {
  if (!geometry || !Array.isArray(geometry.coordinates)) return false
  const punto: Punto = [longitud, latitud]

  if (geometry.type === 'Polygon') {
    return puntoDentroDePoligono(punto, geometry.coordinates as Anillo[])
  }

  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates as Anillo[][]).some(poligono => puntoDentroDePoligono(punto, poligono))
  }

  return false
}
