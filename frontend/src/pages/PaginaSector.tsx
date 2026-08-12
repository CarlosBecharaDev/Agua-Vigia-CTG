/**
 * PaginaSector — destino del enlace "ver mi sector" en el correo de cambio de estado
 * (MailNotificacionAdapter.java, urlReportar → `{urlBasePublica}/sectores/{id}`). Antes ese
 * enlace no tenía a dónde llegar en el frontend — un vecino que hacía clic caía en 404.
 */
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Droplets } from 'lucide-react'
import { PageWrapper } from '../components/PageWrapper'
import { InsigniaEstado } from '../components/InsigniaEstado'
import { EtiquetaFrescura } from '../components/EtiquetaFrescura'
import { normalizarErrorApi } from '../api/client'
import { obtenerSector } from '../api/services'
import type { SectorSeguro } from '../api/services'

export default function PaginaSector() {
  const { id } = useParams<{ id: string }>()
  const [sector, setSector] = useState<SectorSeguro | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) { setCargando(false); return }
    let montado = true
    setCargando(true)
    setError(null)
    obtenerSector(id)
      .then((res) => { if (montado) setSector(res) })
      .catch((causa) => { if (montado) setError(normalizarErrorApi(causa).detalle) })
      .finally(() => { if (montado) setCargando(false) })
    return () => { montado = false }
  }, [id])

  return (
    <PageWrapper>
      <main id="contenido-principal" tabIndex={-1} className="pagina-estado">
        <section className="estado-pagina">
          <span className="estado-pagina-icono icono-coral" aria-hidden="true"><Droplets /></span>
          {cargando ? (
            <p role="status">Cargando el sector…</p>
          ) : !sector ? (
            <>
              <p className="eyebrow">Sector no encontrado</p>
              <h1>No encontramos este sector</h1>
              <p>{error ?? 'Puede que el enlace esté desactualizado.'}</p>
              <Link className="boton boton-primario" to="/">Ver el mapa</Link>
            </>
          ) : (
            <>
              <p className="eyebrow">Estado del servicio</p>
              <h1>{sector.nombre}</h1>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center', margin: '0.75rem 0 1.75rem', flexWrap: 'wrap' }}>
                <InsigniaEstado estado={sector.estado} />
                <EtiquetaFrescura timestampIso={sector.actualizadoEn} />
              </div>
              <Link className="boton boton-primario" to={`/reportar?sector=${encodeURIComponent(sector.id)}`}>
                Reportar algo en este sector
              </Link>
            </>
          )}
        </section>
      </main>
    </PageWrapper>
  )
}
