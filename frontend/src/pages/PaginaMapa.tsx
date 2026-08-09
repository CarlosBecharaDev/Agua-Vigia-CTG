import { useCallback, useMemo, useState } from 'react'
import { Database, LocateFixed, Map, Megaphone, RefreshCw, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MapaCartagena } from '../components/MapaCartagena'
import { ListaSectores } from '../components/ListaSectores'
import { FormularioSuscripcion } from '../components/FormularioSuscripcion'
import { ErrorRecurso } from '../components/EstadoPagina'
import type { Sector } from '../types/tipos-dominio'
import { useDatosEnVivo } from '../hooks/useDatosEnVivo'
import { PageWrapper } from '../components/PageWrapper'

export default function PaginaMapa() {
  const { estado, sectores, cargando, error, ultimaActualizacion, recargar } = useDatosEnVivo()
  const [sectorActivo, setSectorActivo] = useState<Sector | null>(null)
  const [vistaMovil, setVistaMovil] = useState<'mapa' | 'lista'>('mapa')
  const navigate = useNavigate()

  const resumen = useMemo(() => ({
    afectados: sectores.filter((sector) => sector.estado === 'SIN_SERVICIO' || sector.estado === 'PRESION_BAJA' || sector.estado === 'CORTE_PROGRAMADO').length,
    sinServicio: sectores.filter((sector) => sector.estado === 'SIN_SERVICIO').length,
    estables: sectores.filter((sector) => sector.estado === 'CON_SERVICIO').length,
    sinDatos: sectores.filter((sector) => sector.estado === null).length,
  }), [sectores])

  const seleccionarSector = useCallback((sector: Sector | null) => {
    setSectorActivo(sector)
    if (sector && window.matchMedia('(max-width: 899px)').matches) setVistaMovil('mapa')
  }, [])

  return (
    <PageWrapper>
      <main id="contenido-principal" className="pagina-inicio" aria-label="Estado del servicio de agua en Cartagena">
        <section className="estado-compacto" aria-labelledby="titulo-mapa">
          <div>
            <p className="eyebrow"><span className="live-dot" /> Estado verificado por barrio</p>
            <h1 id="titulo-mapa">¿Cómo está el agua en tu barrio?</h1>
            <p>Busca tu sector. “Sin datos” significa que el sistema todavía no puede confirmarlo.</p>
          </div>
          <dl className="resumen-compacto">
            <div><dt>Novedades</dt><dd>{cargando ? '—' : resumen.afectados}</dd></div>
            <div><dt>Sin agua</dt><dd>{cargando ? '—' : resumen.sinServicio}</dd></div>
            <div><dt>Sin datos</dt><dd>{cargando ? '—' : resumen.sinDatos}</dd></div>
          </dl>
        </section>

        <section className="barra-contexto" aria-label="Fuente y actualización de datos">
          <div className="contexto-item"><Database size={17} /><span><small>Fuente</small><strong>Backend AguaVigía</strong></span></div>
          <span className={`estado-conexion estado-${estado}`}>{estado === 'stale' ? 'Datos desactualizados' : estado === 'error' ? 'Sin conexión' : estado === 'empty' ? 'Sin sectores cargados' : 'Datos del contrato oficial'}</span>
          <button type="button" onClick={recargar} className="boton-actualizar" disabled={cargando}><RefreshCw size={16} className={cargando ? 'girando' : ''} />{cargando ? 'Actualizando' : 'Actualizar'}</button>
        </section>

        {error && estado === 'error' && <ErrorRecurso mensaje={error} onReintentar={recargar} />}

        <div className="selector-vista" role="group" aria-label="Cambiar vista">
          <button className={vistaMovil === 'mapa' ? 'activo' : ''} onClick={() => setVistaMovil('mapa')}><Map size={17} /> Mapa</button>
          <button className={vistaMovil === 'lista' ? 'activo' : ''} onClick={() => setVistaMovil('lista')}><Users size={17} /> Lista accesible</button>
        </div>

        <section className="centro-monitoreo" aria-label="Centro de monitoreo">
          <article className={`tarjeta-mapa vista-${vistaMovil}`}>
            <header className="cabecera-panel">
              <div><span className="eyebrow"><LocateFixed size={14} /> Estado georreferenciado</span><h2>Mapa de servicio</h2></div>
              <div className="leyenda-mapa" aria-label="Leyenda del mapa">
                <span><i className="estado-con-bg" /> Con agua</span><span><i className="estado-baja-bg" /> Baja presión</span><span><i className="estado-sin-bg" /> Sin agua</span><span><i className="estado-desconocido-bg" /> Sin datos</span>
              </div>
            </header>
            <div className="marco-mapa">
              <MapaCartagena sectores={sectores} cargando={cargando} error={error} ultimaActualizacion={ultimaActualizacion} sectorActivo={sectorActivo} onSectorSeleccionado={seleccionarSector} onAbrirReporte={() => navigate('/reportar')} />
            </div>
          </article>

          <aside className={`panel-barrios vista-${vistaMovil}`} aria-label="Barrios monitoreados">
            <div className="cabecera-barrios"><span className="eyebrow">Alternativa textual</span><h2>Barrios monitoreados</h2><p>{resumen.estables} con servicio confirmado; {resumen.sinDatos} todavía sin datos.</p><button type="button" className="boton boton-secundario boton-ancho" onClick={() => navigate('/reportar')}><Megaphone size={18} /> Consultar reportes</button></div>
            <div className="lista-barrios-scroll"><ListaSectores sectores={sectores} cargando={cargando} error={error} onSectorSeleccionado={seleccionarSector} /></div>
          </aside>
        </section>

        <section className="bloque-suscripcion" aria-label="Avisos por correo"><FormularioSuscripcion sectores={sectores} /></section>
      </main>
    </PageWrapper>
  )
}
