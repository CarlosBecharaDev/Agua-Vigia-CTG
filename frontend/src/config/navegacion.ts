/**
 * navegacion.ts — enlaces de navegación principal del producto.
 *
 * Fuente única: usado por Encabezado (sidebar de las páginas secundarias) y por
 * NavegacionFlotante (riel de iconos de la página principal) para no duplicar la lista.
 */
import type { LucideIcon } from 'lucide-react'
import { BarChart3, Clock3, Map, ShieldCheck } from 'lucide-react'

export interface EnlaceNav {
  a: string
  etiqueta: string
  resumen: string
  Icono: LucideIcon
}

export const ENLACES: EnlaceNav[] = [
  { a: '/', etiqueta: 'Mapa en vivo', resumen: 'Estado por barrio', Icono: Map },
  { a: '/#bitacora', etiqueta: 'Bitácora', resumen: 'Historial público', Icono: Clock3 },
  { a: '/#estadisticas', etiqueta: 'Estadísticas', resumen: 'Tendencias y métricas', Icono: BarChart3 },
  { a: '/veedor', etiqueta: 'Panel veedor', resumen: 'Validación ciudadana', Icono: ShieldCheck },
]
