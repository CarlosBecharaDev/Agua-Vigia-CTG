/**
 * useDatosEnVivo.ts — sectores en vivo desde el backend de AguaVigía (M1), con los
 * boletines oficiales de Acuacar como contexto complementario para la ficha de un sector
 * (ver PanelDetalleSector). Los boletines nunca deciden el estado publicado de un barrio:
 * eso lo hace el propio pipeline de ingesta + moderación del veedor del backend
 * (`AcuacarApiCollector` → `PipelineOrquestador` → cola de revisión en `/api/veedor/ingesta/propuestas`).
 */
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
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
  /** Boletines oficiales de Acuacar más recientes — solo contexto, ver nota arriba. */
  boletines: BoletinAcuacar[]
  recargar: () => void
}

export function useDatosEnVivo(): DatosEnVivo {
  const [sectores, setSectores] = useState<Sector[]>([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null)
  const [boletines, setBoletines] = useState<BoletinAcuacar[]>([])

  const consulta = useQuery({
    queryKey: ['sectores'],
    queryFn: obtenerSectores,
    refetchInterval: 5 * 60_000,
  })

  useEffect(() => {
    if (consulta.data) {
      setSectores(consulta.data.sectores)
      setUltimaActualizacion(consulta.data.generadoEn)
    }
  }, [consulta.data])

  useEffect(() => {
    const eventSource = new EventSource('/api/sectores/stream')

    const manejarEvento = (event: MessageEvent) => {
      const data = JSON.parse(event.data)
      setSectores(data.sectores)
      setUltimaActualizacion(data.generadoEn)
    }

    eventSource.addEventListener('sectores', manejarEvento)

    return () => {
      eventSource.removeEventListener('sectores', manejarEvento)
      eventSource.close()
    }
  }, [])

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
    boletines,
    recargar: () => { void consulta.refetch() },
  }
}
