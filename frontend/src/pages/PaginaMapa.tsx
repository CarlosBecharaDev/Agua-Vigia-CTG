import { useCallback, useEffect, useMemo, useState } from 'react'
import { LocateFixed, Map, RefreshCw, Users } from 'lucide-react'
import { MapaCartagena } from '../components/MapaCartagena'
import { ListaSectores } from '../components/ListaSectores'
import { ErrorRecurso } from '../components/EstadoPagina'
import type { Sector } from '../types/tipos-dominio'
import { useDatosEnVivo } from '../hooks/useDatosEnVivo'
import { PageWrapper } from '../components/PageWrapper'
import { PanelSectorSeleccionado } from '../components/PanelSectorSeleccionado'

const ContadorAnimado = ({ valor, cargando }: { valor: number; cargando: boolean }) => (
  <span key={valor} className="contador-animado">{cargando ? '—' : valor}</span>
)

export default function PaginaMapa() {
  const { estado, sectores, cargando, error, ultimaActualizacion, recargar } = useDatosEnVivo()
  const [sectorActivo, setSectorActivo] = useState<Sector | null>(null)
  const [vistaMovil, setVistaMovil] = useState<'mapa' | 'lista'>('mapa')
  const [esMovil, setEsMovil] = useState(() => window.matchMedia('(max-width: 899px)').matches)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 899px)')
    const actualizar = () => setEsMovil(media.matches)
    media.addEventListener('change', actualizar)
    return () => media.removeEventListener('change', actualizar)
  }, [])

  const resumen = useMemo(() => ({
    afectados: sectores.filter((sector) => sector.estado === 'SIN_SERVICIO' || sector.estado === 'PRESION_BAJA' || sector.estado === 'CORTE_PROGRAMADO').length,
    sinServicio: sectores.filter((sector) => sector.estado === 'SIN_SERVICIO').length,
    estables: sectores.filter((sector) => sector.estado === 'CON_SERVICIO').length,
    sinDatos: sectores.filter((sector) => sector.estado === null).length,
  }), [sectores])

  const seleccionarSector = useCallback((sector: Sector | null) => {
    setSectorActivo(sector)
    if (sector && window.matchMedia('(max-width: 899px)').matches) {
      setVistaMovil('mapa')
      requestAnimationFrame(() => requestAnimationFrame(() => {
        document.getElementById('panel-mapa')?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start',
        })
      }))
    }
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
            <div><dt>Novedades</dt><dd><ContadorAnimado valor={resumen.afectados} cargando={cargando} /></dd></div>
            <div><dt>Sin agua</dt><dd><ContadorAnimado valor={resumen.sinServicio} cargando={cargando} /></dd></div>
            <div><dt>Sin datos</dt><dd><ContadorAnimado valor={resumen.sinDatos} cargando={cargando} /></dd></div>
          </dl>
        </section>

        {error && estado === 'error' && <ErrorRecurso mensaje={error} onReintentar={recargar} />}

        <div className="selector-vista" role="group" aria-label="Cambiar vista">
          <button className={vistaMovil === 'mapa' ? 'activo' : ''} onClick={() => setVistaMovil('mapa')}><Map size={17} /> Mapa</button>
          <button className={vistaMovil === 'lista' ? 'activo' : ''} onClick={() => setVistaMovil('lista')}><Users size={17} /> Lista accesible</button>
        </div>

        <section className="centro-monitoreo" aria-label="Centro de monitoreo">
          <article id="panel-mapa" className={`tarjeta-mapa vista-${vistaMovil}`}>
            <header className="cabecera-panel">
              <div><span className="eyebrow"><LocateFixed size={14} /> Estado georreferenciado</span><h2>Mapa de servicio</h2></div>
              <div className="mapa-acciones">
                <div className="leyenda-mapa" aria-label="Leyenda del mapa">
                  <span><i className="estado-con-bg" /> Con agua</span><span><i className="estado-baja-bg" /> Baja presión</span><span><i className="estado-sin-bg" /> Sin agua</span><span><i className="estado-desconocido-bg" /> Sin datos</span>
                </div>
                <button type="button" onClick={recargar} className="boton-actualizar" disabled={cargando} aria-label={cargando ? 'Actualizando mapa' : 'Actualizar mapa'}><RefreshCw size={16} className={cargando ? 'girando' : ''} /><span>{cargando ? 'Actualizando' : 'Actualizar'}</span></button>
              </div>
            </header>
            <div className="marco-mapa">
              <MapaCartagena sectores={sectores} cargando={cargando} error={error} ultimaActualizacion={ultimaActualizacion} sectorActivo={sectorActivo} onSectorSeleccionado={seleccionarSector} />
            </div>
            {sectorActivo && esMovil && <PanelSectorSeleccionado integrado sector={sectorActivo} onCerrar={() => seleccionarSector(null)} />}
          </article>

          <aside className={`panel-barrios vista-${vistaMovil}`} aria-label="Barrios monitoreados">
            {sectorActivo && !esMovil && <PanelSectorSeleccionado integrado sector={sectorActivo} onCerrar={() => seleccionarSector(null)} />}
            <div className="cabecera-barrios"><span className="eyebrow">Explorador de servicio</span><h2>Barrios monitoreados</h2><p>{sectores.length - resumen.sinDatos} con estado reportado; {resumen.afectados} con novedades.</p></div>
            <div className="lista-barrios-scroll"><ListaSectores sectores={sectores} cargando={cargando} error={error} sectorActivo={sectorActivo} onSectorSeleccionado={seleccionarSector} /></div>
          </aside>
        </section>

      </main>
    </PageWrapper>
  )
}
