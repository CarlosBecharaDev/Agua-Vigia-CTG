/**
 * BuscadorBarrios — alternativa textual accesible al mapa (RF004), en reemplazo de
 * ListaSectores: un único buscador + lista plana. La lista vive en un desplegable que solo
 * aparece al enfocar el campo (clic o tab) — con el campo vacío no se listan los ~50 barrios
 * de una vez. El desplegable muestra hasta 5 filas (`.buscador-barrios-dropdown`, ver
 * index.css) y el resto queda accesible con scroll interno. Al escribir, los barrios que
 * EMPIEZAN por lo tecleado se ordenan antes que los que solo lo contienen, para que la mejor
 * coincidencia quede siempre de primera. Tocar un barrio selecciona el sector: MapaCartagena
 * reacciona centrando el mapa en su polígono (ver el efecto de sectorActivo en ese componente).
 *
 * `busqueda`/`onCambiarBusqueda` son los mismos que usa el buscador flotante sobre el mapa
 * (PaginaMapa) — comparten estado a propósito, para que los dos campos queden sincronizados
 * en vez de tener dos búsquedas independientes.
 *
 * Los resultados usan la animación de reactbits.dev (Components → Animated List): cada fila
 * aparece con un fundido + escala al entrar en el viewport del desplegable (useInView, se
 * repite al volver a hacerla visible con scroll — igual que el original) y dos degradados
 * arriba/abajo que se atenúan según la posición del scroll, insinuando que hay más filas.
 * Dos diferencias deliberadas con el original: sin arrastre de foco por `Tab` (el suyo hace
 * `preventDefault` en Tab para navegar la lista, lo que rompe el orden de tabulación del
 * resto de la página — aquí solo flechas ↑↓ y Enter) y el listener de teclado solo escucha
 * mientras el desplegable está abierto, no siempre en `window`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FC, KeyboardEvent as ReactKeyboardEvent, UIEvent as ReactUIEvent } from 'react'
import { motion, useInView } from 'framer-motion'
import { Search } from 'lucide-react'
import type { Sector } from '../types/tipos-dominio'
import { COLOR_POR_ESTADO, COLOR_SIN_DATOS } from '../types/tipos-dominio'

interface Props {
  sectores: Sector[]
  busqueda: string
  onCambiarBusqueda: (valor: string) => void
  cargando: boolean
  error: string | null
  onSectorSeleccionado?: (sector: Sector) => void
}

interface FilaBarrioProps {
  sector: Sector
  indice: number
  seleccionado: boolean
  onEnfocar: () => void
  onElegir: () => void
}

const FilaBarrioAnimada: FC<FilaBarrioProps> = ({ sector, indice, seleccionado, onEnfocar, onElegir }) => {
  const ref = useRef<HTMLLIElement>(null)
  const enVista = useInView(ref, { amount: 0.5, once: false })

  return (
    <motion.li
      ref={ref}
      data-indice={indice}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={enVista ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
    >
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={onEnfocar}
        onClick={onElegir}
        aria-label={`Ver ${sector.nombre} en el mapa — estado: ${(sector.estado ? COLOR_POR_ESTADO[sector.estado] : COLOR_SIN_DATOS).etiqueta}`}
        className={`lista-barrios-btn${seleccionado ? ' is-seleccionado' : ''}`}
      >
        <span
          className="lista-barrios-punto"
          style={{ backgroundColor: (sector.estado ? COLOR_POR_ESTADO[sector.estado] : COLOR_SIN_DATOS).claro }}
          aria-hidden="true"
        />
        {sector.nombre}
      </button>
    </motion.li>
  )
}

export const BuscadorBarrios: FC<Props> = ({
  sectores,
  busqueda,
  onCambiarBusqueda,
  cargando,
  error,
  onSectorSeleccionado,
}) => {
  const [abierto, setAbierto] = useState(false)
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(-1)
  const listaRef = useRef<HTMLUListElement>(null)
  const [opacidadArriba, setOpacidadArriba] = useState(0)
  const [opacidadAbajo, setOpacidadAbajo] = useState(1)

  const sectoresOrdenados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return sectores
    return sectores
      .filter((s) => s.nombre.toLowerCase().includes(termino))
      .sort((a, b) => {
        const empiezaA = a.nombre.toLowerCase().startsWith(termino)
        const empiezaB = b.nombre.toLowerCase().startsWith(termino)
        if (empiezaA !== empiezaB) return empiezaA ? -1 : 1
        return a.nombre.localeCompare(b.nombre)
      })
  }, [sectores, busqueda])

  // El índice resaltado por teclado no sobrevive a un resultado que ya no existe (p.ej. si
  // se sigue escribiendo y la lista se acorta).
  useEffect(() => {
    setIndiceSeleccionado(-1)
  }, [sectoresOrdenados])

  const elegirSector = useCallback(
    (sector: Sector) => {
      onSectorSeleccionado?.(sector)
      setAbierto(false)
    },
    [onSectorSeleccionado]
  )

  const alDesplazar = useCallback((e: ReactUIEvent<HTMLUListElement>) => {
    const el = e.currentTarget
    setOpacidadArriba(Math.min(el.scrollTop / 50, 1))
    const distanciaAbajo = el.scrollHeight - (el.scrollTop + el.clientHeight)
    setOpacidadAbajo(el.scrollHeight <= el.clientHeight ? 0 : Math.min(distanciaAbajo / 50, 1))
  }, [])

  const alPresionarTecla = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (sectoresOrdenados.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setIndiceSeleccionado((i) => Math.min(i + 1, sectoresOrdenados.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setIndiceSeleccionado((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && indiceSeleccionado >= 0) {
        e.preventDefault()
        elegirSector(sectoresOrdenados[indiceSeleccionado])
      }
    },
    [sectoresOrdenados, indiceSeleccionado, elegirSector]
  )

  // Mantiene la fila resaltada por teclado dentro del área visible del desplegable.
  useEffect(() => {
    if (indiceSeleccionado < 0 || !listaRef.current) return
    const fila = listaRef.current.querySelector(`[data-indice="${indiceSeleccionado}"]`) as HTMLElement | null
    fila?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [indiceSeleccionado])

  return (
    <section aria-label="Buscador de barrios">
      <div className="buscador-barrios">
        <Search size={16} aria-hidden="true" />
        <input
          type="text"
          placeholder="Buscar barrio..."
          aria-label="Buscar barrio"
          value={busqueda}
          onChange={(e) => onCambiarBusqueda(e.target.value)}
          onFocus={() => setAbierto(true)}
          onBlur={() => setAbierto(false)}
          onKeyDown={alPresionarTecla}
        />

        {abierto && (
          <div className="buscador-barrios-dropdown panel-glass">
            {error ? (
              <p role="alert" className="buscador-barrios-mensaje" style={{ color: 'var(--color-estado-sin)' }}>
                No pudimos cargar los sectores. Revisa tu conexión e intenta de nuevo.
              </p>
            ) : cargando ? (
              <ul className="lista-barrios" aria-label="Cargando barrios">
                {Array.from({ length: 2 }).map((_, i) => (
                  <li key={i} aria-hidden="true" className="lista-sectores-skel">
                    <div className="skeleton" style={{ width: '65%', height: '16px' }} />
                  </li>
                ))}
              </ul>
            ) : sectoresOrdenados.length === 0 ? (
              <p className="buscador-barrios-mensaje">Ningún barrio coincide con &quot;{busqueda}&quot;.</p>
            ) : (
              <>
                <ul
                  ref={listaRef}
                  className="lista-barrios"
                  aria-label={`${sectoresOrdenados.length} barrios`}
                  onScroll={alDesplazar}
                >
                  {sectoresOrdenados.map((sector, indice) => (
                    <FilaBarrioAnimada
                      key={sector.id}
                      sector={sector}
                      indice={indice}
                      seleccionado={indiceSeleccionado === indice}
                      onEnfocar={() => setIndiceSeleccionado(indice)}
                      onElegir={() => elegirSector(sector)}
                    />
                  ))}
                </ul>
                <div className="buscador-barrios-degradado-arriba" style={{ opacity: opacidadArriba }} />
                <div className="buscador-barrios-degradado-abajo" style={{ opacity: opacidadAbajo }} />
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
