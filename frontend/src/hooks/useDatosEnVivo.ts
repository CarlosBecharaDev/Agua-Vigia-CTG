/**
 * useDatosEnVivo.ts — sectores en vivo desde el backend de AguaVigía (M1), con los
 * boletines oficiales de Acuacar como contexto complementario para la ficha de un sector
 * (ver PanelDetalleSector). Los boletines nunca deciden el estado publicado de un barrio:
 * eso lo hace el propio pipeline de ingesta + moderación del veedor del backend
 * (`AcuacarApiCollector` → `PipelineOrquestador` → cola de revisión en `/api/veedor/ingesta/propuestas`).
 */
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { normalizarErrorApi } from '../api/client'
import { obtenerSectores } from '../api/services'
import type { Sector } from '../types/tipos-dominio'
import { obtenerBoletinesRecientes } from '../api/acuacar'
import type { BoletinAcuacar } from '../api/acuacar'

export type EstadoRecurso = 'loading' | 'success' | 'empty' | 'error' | 'stale' | 'unavailable'

export interface DatosEnVivo {
  estado: EstadoRecurso
  cargando: boolean
  error: string | null
  sectores: Sector[]
  ultimaActualizacion: string | null
  /** F4 — false cuando el stream SSE está caído (reconectando). El dato en pantalla sigue
   *  siendo el último conocido; esto solo indica que el canal en vivo no está entregando. */
  conexionViva: boolean
  /** Boletines oficiales de Acuacar más recientes — solo contexto, ver nota arriba. */
  boletines: BoletinAcuacar[]
  recargar: () => void
}

export function useDatosEnVivo(): DatosEnVivo {
  const [sectores, setSectores] = useState<Sector[]>([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null)
  const [conexionViva, setConexionViva] = useState(true)
  const [boletines, setBoletines] = useState<BoletinAcuacar[]>([])

  // F5 — el poll de React Query (cada 5 min) y el SSE pueden entregar en cualquier orden; sin
  // comparar `generadoEn`, una respuesta de poll más vieja que ya venía en vuelo podía pisar un
  // dato más fresco que el SSE acababa de entregar. Se guarda en un ref (no en estado) porque la
  // comparación tiene que ver el valor más reciente en el momento de cada evento, no el de la
  // última vez que este hook renderizó.
  const ultimaActualizacionRef = useRef<string | null>(null)

  const aplicarSiEsMasReciente = useCallback((nuevosSectores: Sector[], generadoEn: string) => {
    const actual = ultimaActualizacionRef.current
    if (actual && Date.parse(generadoEn) < Date.parse(actual)) return
    ultimaActualizacionRef.current = generadoEn
    setSectores(nuevosSectores)
    setUltimaActualizacion(generadoEn)
  }, [])

  const consulta = useQuery({
    queryKey: ['sectores'],
    queryFn: obtenerSectores,
    refetchInterval: 5 * 60_000,
  })

  useEffect(() => {
    if (consulta.data) {
      aplicarSiEsMasReciente(consulta.data.sectores, consulta.data.generadoEn)
    }
  }, [consulta.data, aplicarSiEsMasReciente])

  useEffect(() => {
    const eventSource = new EventSource('/api/sectores/stream')

    const manejarEvento = (event: MessageEvent) => {
      const data = JSON.parse(event.data)
      aplicarSiEsMasReciente(data.sectores, data.generadoEn)
    }

    eventSource.addEventListener('sectores', manejarEvento)
    // F4 — sin esto no había ninguna señal de que el stream en vivo murió: el mapa seguía
    // mostrando el último dato conocido sin avisar hasta que pasara el umbral de frescura
    // (hasta varios minutos). El navegador reintenta la conexión solo; esto solo expone su
    // estado para que la UI pueda avisar antes.
    eventSource.onopen = () => setConexionViva(true)
    eventSource.onerror = () => setConexionViva(false)

    return () => {
      eventSource.removeEventListener('sectores', manejarEvento)
      eventSource.close()
    }
  }, [aplicarSiEsMasReciente])

  // Best-effort: si Acuacar no responde, la ficha del sector simplemente no muestra citas.
  useEffect(() => {
    let montado = true
    obtenerBoletinesRecientes(20)
      .then((bols) => { if (montado) setBoletines(bols) })
      .catch(() => {})
    return () => { montado = false }
  }, [])

  const error = consulta.error ? normalizarErrorApi(consulta.error).detalle : null
  const estaDesactualizado = Boolean(consulta.isError && consulta.data)
  const estado: EstadoRecurso = consulta.isPending
    ? 'loading'
    : estaDesactualizado
      ? 'stale'
      : consulta.isError
        ? 'error'
        : sectores.length === 0
          ? 'empty'
          : 'success'

  return {
    estado,
    cargando: consulta.isPending,
    error,
    sectores,
    ultimaActualizacion,
    conexionViva,
    boletines,
    recargar: () => { void consulta.refetch() },
  }
}
