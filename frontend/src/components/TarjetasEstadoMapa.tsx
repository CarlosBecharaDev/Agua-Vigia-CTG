/**
 * TarjetasEstadoMapa — reemplaza la lista .mapa-conteos y la barra flotante del mapa
 * (.mapa-overlay-top): 4 tarjetas, una por estado, con acento neón del color de su estado
 * (COLOR_POR_ESTADO). "Ver en el mapa" no navega a ningún lado — le pasa el estado a
 * MapaCartagena vía estadoDestacado, que se encarga de atenuar el resto, encuadrar el zoom
 * y dibujar la línea + los "pings" con el nombre de cada barrio (ver dibujarDestacado en
 * MapaCartagena.tsx). Volver a tocar la misma tarjeta apaga el foco (comportamiento toggle).
 */
import type { CSSProperties, FC } from 'react'
import { ArrowRight, Droplets } from 'lucide-react'
import type { EstadoServicio, Sector } from '../types/tipos-dominio'
import { COLOR_POR_ESTADO } from '../types/tipos-dominio'

interface Props {
  resumen: { estado: EstadoServicio; n: number }[]
  estadoDestacado: EstadoServicio | null
  onAlternar: (estado: EstadoServicio) => void
  sectorActivo?: Sector | null
  sectores?: Sector[]
  onAbrirFichaTecnica?: () => void
  onAbrirReporte?: (sectorId: string) => void
  onAlternarBitacora?: () => void
}

const SUBTITULO_POR_ESTADO: Record<EstadoServicio, string> = {
  SIN_SERVICIO: 'barrios afectados',
  PRESION_BAJA: 'barrios en monitoreo',
  CORTE_PROGRAMADO: 'para hoy',
  CON_SERVICIO: 'barrios activos',
}

export const TarjetasEstadoMapa: FC<Props> = ({
  resumen,
  estadoDestacado,
  onAlternar,
  sectorActivo,
  sectores,
  onAbrirFichaTecnica,
  onAbrirReporte,
  onAlternarBitacora,
}) => {
  const sectorDestacado =
    sectorActivo ||
    sectores?.find((s) => s.estado === 'SIN_SERVICIO') ||
    sectores?.find((s) => s.estado === 'PRESION_BAJA') ||
    sectores?.find((s) => s.estado === 'CORTE_PROGRAMADO') ||
    sectores?.[0] ||
    null

  const tieneNovedad = Boolean(
    sectorDestacado &&
    (sectorDestacado.estado === 'SIN_SERVICIO' ||
     sectorDestacado.estado === 'PRESION_BAJA' ||
     sectorDestacado.estado === 'CORTE_PROGRAMADO')
  )

  const nombreSector = sectorDestacado ? sectorDestacado.nombre : 'Cartagena'
  const codigoSector = sectorDestacado
    ? `#CTG-${sectorDestacado.id.replace(/[^0-9]/g, '').padEnd(4, '0').slice(-4) || '0001'}`
    : '#CTG-DIST'
  const esCorte = sectorDestacado
    ? sectorDestacado.estado === 'SIN_SERVICIO' || sectorDestacado.estado === 'CORTE_PROGRAMADO'
    : false
  const esBajaPresion = sectorDestacado ? sectorDestacado.estado === 'PRESION_BAJA' : false
  const badgeTexto = esCorte ? 'Corte Activo' : esBajaPresion ? 'Presión Baja' : 'Con Servicio'
  const tiempoTexto = tieneNovedad
    ? (sectorDestacado?.actualizadoEn
        ? new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit' }).format(new Date(sectorDestacado.actualizadoEn)) + ' COT'
        : 'En monitoreo')
    : 'Operación normal'
  const descripcionSector = esCorte
    ? `Interrupción registrada en el circuito hidráulico de ${nombreSector}. Cuadrillas y veeduría ciudadana en seguimiento de restablecimiento.`
    : esBajaPresion
      ? `Baja presión detectada en la red local de ${nombreSector}. Se recomienda uso racional del recurso durante el periodo de presurización.`
      : 'Todos los sectores evaluados operan con presurización y suministro continuo en la red matriz de Cartagena.'
  const porcentajeAvance = esCorte ? '65%' : esBajaPresion ? '82%' : '100%'
  const habitantesAfectados = esCorte
    ? 'Sector en suspensión'
    : esBajaPresion
      ? 'Sector en monitoreo'
      : 'Sin afectación reportada'
  const suministroAlterno = esCorte ? 'Carro-tanques prioritarios' : 'Red Matriz Activa'

  return (
    <div
      className="tarjetas-estado-mapa-contenedor"
      role="group"
      aria-label="Resumen de sectores por estado, con acceso rápido al mapa"
    >
      <div className="tarjetas-estado-mapa">
        {resumen.map(({ estado, n }) => {
          const { claro: color, etiqueta } = COLOR_POR_ESTADO[estado]
          const activa = estadoDestacado === estado
          const claseModificador = `tarjeta-estado-mapa--${estado.toLowerCase().replace('_', '-')}`
          const esProgramados = estado === 'CORTE_PROGRAMADO'
          return (
            <div
              key={estado}
              className={`metric-card tarjeta-estado-mapa ${claseModificador}${activa ? ' is-activa' : ''}`}
              style={{ '--color-neon': color } as CSSProperties}
              onClick={() => {
                if (esProgramados && onAlternarBitacora) {
                  onAlternarBitacora()
                } else if (n > 0) {
                  onAlternar(estado)
                }
              }}
            >
              <div className="tarjeta-estado-mapa-cab">
                <span className="tarjeta-estado-mapa-punto" aria-hidden="true" />
                <span className="tarjeta-estado-mapa-etiqueta">{etiqueta}</span>
              </div>
              <div className="tarjeta-estado-mapa-cuerpo">
                <strong className="tarjeta-estado-mapa-num tabular">{n}</strong>
                <span className="tarjeta-estado-mapa-sub">{SUBTITULO_POR_ESTADO[estado]}</span>
              </div>
              <button
                type="button"
                className="tarjeta-estado-mapa-btn"
                disabled={n === 0 && !esProgramados}
                aria-pressed={activa}
                onClick={(e) => {
                  e.stopPropagation()
                  if (esProgramados && onAlternarBitacora) {
                    onAlternarBitacora()
                  } else {
                    onAlternar(estado)
                  }
                }}
              >
                <span>
                  {esProgramados
                    ? 'Ver cronograma'
                    : activa
                      ? 'Ocultar del mapa'
                      : estado === 'CON_SERVICIO'
                        ? 'Ver todos'
                        : 'Ver en el mapa'}
                </span>
                <ArrowRight size={12} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>

      {/* SECCIÓN DE INSPECCIÓN CONTEXTUAL DEL SECTOR DESTACADO */}
      <div className="inspector-contextual-card" id="inspector-sector">
        <div className="inspector-contextual-cab">
          <div>
            <div className="inspector-badge-fila">
              <span className={`inspector-badge-pill ${esCorte ? 'is-corte' : esBajaPresion ? 'is-baja' : 'is-con'}`}>
                <span className={esCorte ? 'pulse-dot-coral' : esBajaPresion ? 'pulse-dot-amber' : 'pulse-dot-emerald'} aria-hidden="true" />
                {badgeTexto}
              </span>
              <span className="inspector-codigo font-mono">{codigoSector}</span>
            </div>
            <h3 className="inspector-sector-titulo">Sector {nombreSector}</h3>
          </div>
          <span className={`inspector-tiempo-pill font-mono ${esCorte ? 'is-alerta' : esBajaPresion ? 'is-aviso' : 'is-normal'}`}>
            {tiempoTexto}
          </span>
        </div>

        <p className="inspector-contextual-desc">
          {descripcionSector}
        </p>

        {/* Barra de Avance con Shimmer Loading */}
        <div className="inspector-avance-bloque">
          <div className="inspector-avance-cab">
            <span className="inspector-avance-rotulo">
              {esCorte ? 'Avance de reparación' : esBajaPresion ? 'Nivel de presurización' : 'Estabilidad de flujo'}
            </span>
            <span className="inspector-avance-pct font-mono">{porcentajeAvance}</span>
          </div>
          <div className="inspector-avance-riel">
            <div
              className={`shimmer-bar inspector-avance-barra ${esCorte ? 'is-corte' : esBajaPresion ? 'is-baja' : 'is-normal'}`}
              style={{ width: porcentajeAvance }}
            />
          </div>
        </div>

        {/* Metadatos Clave en Fila Compacta */}
        <div className="inspector-metadatos-grid">
          <div>
            <span className="inspector-metadatos-rotulo">Afectación:</span>
            <strong className="inspector-metadatos-valor">{habitantesAfectados}</strong>
          </div>
          <div>
            <span className="inspector-metadatos-rotulo">Suministro alterno:</span>
            <span className="inspector-metadatos-valor text-secondary font-semibold">{suministroAlterno}</span>
          </div>
        </div>

        <button
          type="button"
          className="inspector-contextual-cta"
          onClick={() => {
            if (onAbrirFichaTecnica) {
              onAbrirFichaTecnica()
            } else if (onAbrirReporte && sectorActivo) {
              onAbrirReporte(sectorActivo.id)
            }
          }}
        >
          <span>Ver ficha técnica y seguimiento</span>
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Resumen de Infraestructura / Tanques de almacenamiento de la red matriz */}
      <div className="tarjetas-widget-tanque" title="Nivel hidrostático promedio en tanques de distribución">
        <div className="tarjetas-widget-tanque-cab">
          <div className="tarjetas-widget-tanque-icono" aria-hidden="true">
            <Droplets size={17} />
          </div>
          <div>
            <span className="tarjetas-widget-tanque-titulo">Tanque Colinas / Nariño</span>
            <span className="tarjetas-widget-tanque-sub">Volumen acumulado: 88.4%</span>
          </div>
        </div>
        <span className="tarjetas-widget-tanque-badge">Óptimo</span>
      </div>
    </div>
  )
}
