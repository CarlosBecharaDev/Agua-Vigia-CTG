/**
 * PaginaMapa — M1 (Mapa en vivo) + lista accesible (RF004).
 *
 * Conectado a datos reales vía useDatosEnVivo:
 *  - Acuacar WordPress API → boletines oficiales → estado de barrios
 *  - Open-Meteo → clima en tiempo real
 *  - Si las APIs no responden, muestra "sin datos" en vez de inventar sectores.
 *
 * DESIGN.md §1: responde "¿tengo agua?" en menos de 5 segundos.
 */
import { useCallback, useMemo, useState } from 'react'
import type { FC } from 'react'
import { CloudSun, Database, LocateFixed, Map, Megaphone, RefreshCw, ServerCrash, Users } from 'lucide-react'
import { MapaCartagena } from '../components/MapaCartagena'
import { ListaSectores } from '../components/ListaSectores'
import { FeedComentarios } from '../components/FeedComentarios'
import { ModalReporte } from '../components/ModalReporte'
import type { Sector } from '../types/tipos-dominio'
import { useDatosEnVivo } from '../hooks/useDatosEnVivo'
import { PageWrapper } from '../components/PageWrapper'

const PaginaMapa: FC = () => {
  const { sectores, clima, cargando, error, ultimaActualizacion, usandoDatosReales, recargar } = useDatosEnVivo()
  const [sectorActivo, setSectorActivo] = useState<Sector | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [sectorReporte, setSectorReporte] = useState('')
  const [vistaMovil, setVistaMovil] = useState<'mapa' | 'lista'>('mapa')

  const resumen = useMemo(() => ({
    afectados: sectores.filter((sector) => sector.estado && sector.estado !== 'CON_SERVICIO').length,
    sinServicio: sectores.filter((sector) => sector.estado === 'SIN_SERVICIO').length,
    estables: sectores.filter((sector) => sector.estado === 'CON_SERVICIO').length,
  }), [sectores])

  const seleccionarSector = useCallback((sector: Sector | null) => {
    setSectorActivo(sector)
    if (sector && window.matchMedia('(max-width: 899px)').matches) setVistaMovil('mapa')
  }, [])

  const abrirReporte = (sectorId = '') => {
    setSectorReporte(sectorId)
    setModalAbierto(true)
  }

  return (
    <PageWrapper>
      <main id="contenido-principal" className="pagina-inicio" aria-label="Estado del servicio de agua en Cartagena">
        <section className="portada-estado" aria-labelledby="titulo-portada">
          <div className="portada-copy">
            <span className="eyebrow"><span className="live-dot" /> Observatorio ciudadano en vivo</span>
            <h1 id="titulo-portada">El agua de Cartagena, <em>barrio por barrio.</em></h1>
            <p>Consulta el estado del servicio, contrasta avisos oficiales y ayuda a tu comunidad con un reporte verificado.</p>
          </div>

          <div className="resumen-ciudad" aria-label="Resumen actual de Cartagena">
            <div className="resumen-principal">
              <span>Barrios con novedades</span>
              <strong className="tabular">{cargando ? '—' : resumen.afectados}</strong>
              <small>de {sectores.length || '—'} monitoreados</small>
            </div>
            <div className="resumen-mini">
              <span><i className="punto-estado estado-sin-bg" /> Sin servicio <b>{resumen.sinServicio}</b></span>
              <span><i className="punto-estado estado-con-bg" /> Servicio estable <b>{resumen.estables}</b></span>
            </div>
          </div>
        </section>

        <section className="barra-contexto" aria-label="Fuente y actualización de datos">
          <div className="contexto-item contexto-fuente">
            {error ? <ServerCrash size={17} /> : usandoDatosReales ? <span className="live-dot" /> : <Database size={17} />}
            <span>
              <small>Fuente</small>
              <strong>{error ? 'Modo sin conexión' : usandoDatosReales ? 'Acuacar + comunidad' : 'Datos de demostración'}</strong>
            </span>
          </div>
          {clima && (
            <div className="contexto-item">
              <CloudSun size={18} />
              <span><small>Cartagena ahora</small><strong>{clima.temperatura}° · Humedad {clima.humedad}%</strong></span>
            </div>
          )}
          <button type="button" onClick={recargar} className="boton-actualizar" disabled={cargando}>
            <RefreshCw size={16} className={cargando ? 'girando' : ''} />
            {cargando ? 'Actualizando' : 'Actualizar datos'}
          </button>
        </section>

        <div className="selector-vista" role="group" aria-label="Cambiar vista">
          <button className={vistaMovil === 'mapa' ? 'activo' : ''} onClick={() => setVistaMovil('mapa')}>
            <Map size={17} /> Mapa
          </button>
          <button className={vistaMovil === 'lista' ? 'activo' : ''} onClick={() => setVistaMovil('lista')}>
            <Users size={17} /> Barrios
          </button>
        </div>

        <section className="centro-monitoreo" aria-label="Centro de monitoreo">
          <article className={`tarjeta-mapa vista-${vistaMovil}`}>
            <header className="cabecera-panel">
              <div>
                <span className="eyebrow"><LocateFixed size={14} /> Estado georreferenciado</span>
                <h2>Mapa de servicio</h2>
              </div>
              <div className="leyenda-mapa" aria-label="Leyenda del mapa">
                <span><i className="estado-con-bg" /> Con agua</span>
                <span><i className="estado-baja-bg" /> Baja presión</span>
                <span><i className="estado-sin-bg" /> Sin agua</span>
              </div>
            </header>
            <div className="marco-mapa">
              <MapaCartagena
                sectores={sectores}
                cargando={cargando}
                error={error}
                ultimaActualizacion={ultimaActualizacion}
                sectorActivo={sectorActivo}
                onSectorSeleccionado={seleccionarSector}
                onAbrirReporte={abrirReporte}
              />
            </div>
          </article>

          <aside className={`panel-barrios vista-${vistaMovil}`} aria-label="Barrios monitoreados">
            <div className="cabecera-barrios">
              <span className="eyebrow">Participación ciudadana</span>
              <h2>¿Cómo está tu barrio?</h2>
              <p>Busca tu sector, revisa el último estado y confirma lo que sucede.</p>
              <button type="button" className="boton boton-primario boton-ancho" onClick={() => abrirReporte()}>
                <Megaphone size={18} /> Reportar lo que pasa
              </button>
            </div>
            <div className="lista-barrios-scroll">
              <ListaSectores sectores={sectores} cargando={cargando} error={error} onSectorSeleccionado={seleccionarSector} />
            </div>
          </aside>
        </section>

        <section className="bloque-comunidad">
          <FeedComentarios />
        </section>

        <ModalReporte
          abierto={modalAbierto}
          alCerrar={() => setModalAbierto(false)}
          sectores={sectores}
          sectorPreseleccionado={sectorReporte}
        />
      </main>
    </PageWrapper>
  )
}

export default PaginaMapa
