import { useQuery } from '@tanstack/react-query'
import { normalizarErrorApi } from '../api/client'
import { useState, useEffect } from 'react'
import { obtenerSectores } from '../api/services'
import type { Sector } from '../types/tipos-dominio'

export type EstadoRecurso = 'loading' | 'success' | 'empty' | 'error' | 'stale' | 'unavailable'

export interface DatosEnVivo {
  estado: EstadoRecurso
  cargando: boolean
  error: string | null
  sectores: Sector[]
  ultimaActualizacion: string | null
  recargar: () => void
}

export function useDatosEnVivo(): DatosEnVivo {
  const [sectores, setSectores] = useState<Sector[]>([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null)

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
    recargar: () => { void consulta.refetch() },
  }
}
