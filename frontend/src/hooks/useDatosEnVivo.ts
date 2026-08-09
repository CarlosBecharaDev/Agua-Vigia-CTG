import { useQuery } from '@tanstack/react-query'
import { normalizarErrorApi } from '../api/client'
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
  const consulta = useQuery({
    queryKey: ['sectores'],
    queryFn: obtenerSectores,
    refetchInterval: 5 * 60_000,
  })

  const sectores = consulta.data?.sectores ?? []
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
    ultimaActualizacion: consulta.data?.generadoEn ?? null,
    recargar: () => { void consulta.refetch() },
  }
}
