/**
 * PaginaSector — destino del enlace "ver mi sector" en el correo de cambio de estado
 * (MailNotificacionAdapter.java, urlReportar → `{urlBasePublica}/sectores/{id}`). Antes ese
 * enlace no tenía a dónde llegar en el frontend — un vecino que hacía clic caía en 404.
 *
 * Presentación: es la ficha de sonda de un barrio, así que se lee en el mismo pliego que
 * el resto de pantallas secundarias. El caso que manda es el de ADR-014: si el barrio no
 * tiene estado verificado NO se dibuja como "con servicio" ni se deja el hueco en blanco,
 * se trama y se dice que nadie lo ha sondeado. Ese es el argumento del producto, no un
 * estado vacío que resolver.
 */
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
      <main id="contenido-principal" tabIndex={-1} className="pagina-pliego reticula-carta">
        <article className="pliego">
          {cargando ? (
            <div className="pliego-cuerpo">
              <p className="pliego-cargando" role="status">
                <span className="spinner" aria-hidden="true" />
                Cargando el barrio…
              </p>
            </div>
          ) : !sector ? (
            <>
              <header className="pliego-cabecera">
                <p className="rotulo-carta pliego-rotulo">Fuera de la carta</p>
                <h1 className="pliego-titulo">No encontramos este barrio</h1>
                <p className="pliego-entradilla">{error ?? 'Puede que el enlace esté desactualizado.'}</p>
              </header>
              <div className="pliego-cuerpo">
                <div className="pliego-acciones">
                  <Link className="boton boton-primario" to="/">Ver el mapa</Link>
                  <Link className="boton boton-secundario" to="/reportar">Reportar mi barrio</Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <header className="pliego-cabecera">
                <p className="rotulo-carta pliego-rotulo">Ficha de barrio</p>
                <h1 className="pliego-titulo">{sector.nombre}</h1>
              </header>

              <div className="pliego-cuerpo">
                <div className="lectura-barrio">
                  {/* Itálica hidrográfica: es la única línea de la ficha que habla del agua
                      misma, no del barrio ni de la interfaz. */}
                  <p className="rotulo-hidrografico lectura-barrio-titulo">Última lectura del servicio</p>
                  <InsigniaEstado estado={sector.estado} />
                  <EtiquetaFrescura timestampIso={sector.actualizadoEn} />
                </div>

                {/* ADR-014: sin dato verificado no se afirma nada. El rayado es la misma
                    primitiva que llevan los polígonos sin sondar en el mapa. */}
                {sector.estado === null && (
                  <div className="sin-sondar-aviso zona-sin-sondar">
                    <span className="rotulo-carta">Zona sin sondar</span>
                    <p>
                      Nadie ha verificado este barrio todavía. No decimos que tenga agua ni que
                      no la tenga: preferimos admitir que no lo sabemos. Tu reporte es lo que
                      lo pone en la carta.
                    </p>
                  </div>
                )}

                <div className="pliego-acciones">
                  <Link className="boton boton-primario" to={`/reportar?sector=${encodeURIComponent(sector.id)}`}>
                    Reportar el estado de este barrio
                  </Link>
                  <Link className="boton boton-secundario" to="/">Ver el mapa</Link>
                </div>
              </div>
            </>
          )}
        </article>
      </main>
    </PageWrapper>
  )
}
