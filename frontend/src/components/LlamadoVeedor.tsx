import { useState } from 'react'
import type { FC, FormEvent } from 'react'
import {
  ShieldCheck,
  BellRing,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Users,
  Camera,
  Send,
  Download,
  Check,
  Layers,
} from 'lucide-react'
import './LlamadoVeedor.css'

interface Props {
  onSuscribirse: () => void
  onAbrirPanel: () => void
}

interface AlertaCola {
  id: string
  radicado: string
  sector: string
  tiempo: string
  coincidencias: number
  descripcion: string
  estadoAccion?: string
}

const ALERTAS_INICIALES: AlertaCola[] = [
  {
    id: 'a-1',
    radicado: '#RAD-4821',
    sector: 'Manga (Callejón Román)',
    tiempo: 'Hace 14 min',
    coincidencias: 8,
    descripcion: 'Presión cero desde las 11:00 AM. 8 reportes coincidentes de vecinos en la misma cuadra.',
  },
  {
    id: 'a-2',
    radicado: '#RAD-4819',
    sector: 'Getsemaní (Calle de la Sierpe)',
    tiempo: 'Hace 38 min',
    coincidencias: 5,
    descripcion: 'Agua chocolatosa saliendo del grifo. Alta turbiedad reportada en 4 restaurantes del sector.',
  },
  {
    id: 'a-3',
    radicado: '#RAD-4815',
    sector: 'Olaya Herrera (Sector Ricaurte)',
    tiempo: 'Hace 1h',
    coincidencias: 12,
    descripcion: 'Fuga masiva en tubo madre sin presencia de operarios de Acuacar desde hace 3 horas.',
  },
]

export const LlamadoVeedor: FC<Props> = ({ onSuscribirse, onAbrirPanel }) => {
  const [alertas, setAlertas] = useState<AlertaCola[]>(ALERTAS_INICIALES)
  const [firmas, setFirmas] = useState<number>(1248)
  const [yaFirmo, setYaFirmo] = useState<boolean>(false)
  const [correoSub, setCorreoSub] = useState<string>('')
  const [barrioSub, setBarrioSub] = useState<string>('manga')
  const [subscritoExito, setSubscritoExito] = useState<boolean>(false)

  const manejarAccionAlerta = (id: string, accion: string) => {
    setAlertas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, estadoAccion: accion } : a))
    )
  }

  const sumarFirma = () => {
    if (yaFirmo) return
    setFirmas((prev) => prev + 1)
    setYaFirmo(true)
  }

  const manejarSubscripcionRapida = (e: FormEvent) => {
    e.preventDefault()
    if (!correoSub.trim()) return
    setSubscritoExito(true)
    setTimeout(() => {
      setCorreoSub('')
      setSubscritoExito(false)
    }, 4000)
  }

  return (
    <section id="veedor" className="llamado-veedor" aria-labelledby="llamado-veedor-titulo">
      <div className="llamado-veedor-envoltorio">
        {/* Banner Hero Principal */}
        <div className="llamado-veedor-tarjeta">
          <span className="llamado-veedor-eyebrow">
            <ShieldCheck size={14} aria-hidden="true" />
            Veeduría ciudadana distrital • Ley 850 de 2003
          </span>

          <h2 id="llamado-veedor-titulo" className="llamado-veedor-titulo">
            Cartagena se vigila entre vecinos
          </h2>

          <p className="llamado-veedor-texto">
            Los <strong>veedores</strong> revisan los reportes de la comunidad y confirman qué barrios
            se quedaron sin agua. Su trabajo es lo que separa un dato verificado de un rumor, y por eso
            el panel solo lo abren las personas acreditadas para esa tarea.
          </p>
          <p className="llamado-veedor-texto">
            No hace falta ser veedor para participar: cualquier vecino puede recibir en su correo los
            avisos de su propio barrio, y reportar una falta de agua sin registrarse.
          </p>

          <div className="llamado-veedor-acciones">
            <button
              type="button"
              className="llamado-veedor-btn-primario"
              onClick={onAbrirPanel}
              aria-label="Acceso a consola acreditada"
            >
              <ShieldCheck size={17} aria-hidden="true" />
              Acceso a consola acreditada
              <ArrowRight size={15} aria-hidden="true" />
            </button>

            <button
              type="button"
              className="llamado-veedor-btn-secundario"
              onClick={onSuscribirse}
              aria-label="Suscribirme a las alertas de mi barrio"
            >
              <BellRing size={17} aria-hidden="true" />
              Suscribirme a las alertas de mi barrio
            </button>
          </div>

          <p className="llamado-veedor-nota">
            El panel pide la clave del veedor. La suscripción solo pide tu barrio y tu correo, y te
            manda un enlace para confirmar que eres tú.
          </p>
        </div>

        {/* 4 Métricas Clave de la Veeduría en Guardia */}
        <div className="veedor-stats-strip">
          <div className="veedor-stat-item">
            <span className="veedor-stat-cifra tabular">18</span>
            <span className="veedor-stat-label">Veedores en Guardia</span>
            <span className="veedor-stat-sub">Activos en 3 localidades distritales</span>
          </div>
          <div className="veedor-stat-item">
            <span className="veedor-stat-cifra tabular text-coral">07</span>
            <span className="veedor-stat-label">Cola de Verificación</span>
            <span className="veedor-stat-sub">Alertas vecinales en espera</span>
          </div>
          <div className="veedor-stat-item">
            <span className="veedor-stat-cifra tabular">18 min</span>
            <span className="veedor-stat-label">Tiempo de Respuesta</span>
            <span className="veedor-stat-sub">Validación comunitaria en campo</span>
          </div>
          <div className="veedor-stat-item">
            <span className="veedor-stat-cifra tabular text-teal">86%</span>
            <span className="veedor-stat-label">Cobertura Distrital</span>
            <span className="veedor-stat-sub">Barrios con monitoreo vecinal</span>
          </div>
        </div>

        {/* Bento Grid Principal: 8 Cols (Cola de Alertas + Mesa Jurídica) + 4 Cols (Lateral) */}
        <div className="veedor-bento-grid">
          {/* Columna Principal (8 cols) */}
          <div className="veedor-col-principal">
            {/* 1. Alertas Comunitarias en Cola de Verificación */}
            <div className="veedor-card-bloque">
              <div className="veedor-bloque-cab">
                <div>
                  <span className="veedor-bloque-eyebrow">MODERACIÓN Y CONTROL OPERATIVO</span>
                  <h3 className="veedor-bloque-titulo">Alertas Comunitarias en Cola de Verificación</h3>
                </div>
                <span className="veedor-cola-badge tabular">
                  {alertas.filter((a) => !a.estadoAccion).length} en cola activa
                </span>
              </div>

              <div className="veedor-cola-lista">
                {alertas.map((alerta) => (
                  <div key={alerta.id} className="veedor-alerta-tarjeta">
                    <div className="alerta-tarjeta-cab">
                      <div className="alerta-meta-izq">
                        <span className="alerta-radicado tabular">{alerta.radicado}</span>
                        <span className="alerta-sector">{alerta.sector}</span>
                      </div>
                      <div className="alerta-meta-der">
                        <span className="alerta-coincidencias tabular">
                          <Users size={12} aria-hidden="true" /> {alerta.coincidencias} reportes
                        </span>
                        <span className="alerta-tiempo tabular">{alerta.tiempo}</span>
                      </div>
                    </div>

                    <p className="alerta-descripcion">{alerta.descripcion}</p>

                    <div className="alerta-acciones-fila">
                      {alerta.estadoAccion ? (
                        <span className="alerta-accion-confirmada">
                          <CheckCircle2 size={14} aria-hidden="true" /> {alerta.estadoAccion}
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="alerta-btn alerta-btn--foto"
                            onClick={() => manejarAccionAlerta(alerta.id, 'Solicitud fotométrica despachada')}
                          >
                            <Camera size={13} aria-hidden="true" /> Pedir Fotométrica
                          </button>
                          <button
                            type="button"
                            className="alerta-btn alerta-btn--descartar"
                            onClick={() => manejarAccionAlerta(alerta.id, 'Descartado como falso positivo')}
                          >
                            <AlertCircle size={13} aria-hidden="true" /> Falsa Alarma
                          </button>
                          <button
                            type="button"
                            className="alerta-btn alerta-btn--confirmar"
                            onClick={() => {
                              manejarAccionAlerta(alerta.id, 'Corte confirmado en bitácora distrital')
                            }}
                          >
                            <CheckCircle2 size={13} aria-hidden="true" /> Confirmar Corte
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Mesa de Radicación y Presión Jurídica */}
            <div className="veedor-card-bloque veedor-mesa-juridica">
              <div className="veedor-bloque-cab">
                <div>
                  <span className="veedor-bloque-eyebrow">DERECHO DE PETICIÓN COLECTIVO</span>
                  <h3 className="veedor-bloque-titulo">Mesa de Radicación y Presión Jurídica</h3>
                </div>
                <span className="veedor-radicado-chip tabular">Radicado #SSPD-2026-CTG-0982</span>
              </div>

              <p className="mesa-juridica-desc">
                Expediente distrital acumulado ante la Superintendencia de Servicios Públicos Domiciliarios. Aporta registros de discrepancia temporal y pruebas fotográficas de turbiedad.
              </p>

              {/* Barra de Recolección de Firmas Vecinales */}
              <div className="veedor-firmas-caja">
                <div className="firmas-cab">
                  <span className="firmas-etiqueta">Firmas Comunitarias Recolectadas</span>
                  <span className="firmas-conteo tabular">
                    <strong>{firmas.toLocaleString()}</strong> de 1,500 meta (83%)
                  </span>
                </div>
                <div className="firmas-barra-fondo">
                  <div
                    className="firmas-barra-progreso"
                    style={{ width: `${Math.min(100, (firmas / 1500) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="mesa-juridica-acciones">
                <button
                  type="button"
                  className={`btn-firmar-vecinal${yaFirmo ? ' is-firmado' : ''}`}
                  onClick={sumarFirma}
                  disabled={yaFirmo}
                >
                  {yaFirmo ? (
                    <>
                      <Check size={15} aria-hidden="true" /> Tu firma ya fue radicada
                    </>
                  ) : (
                    <>
                      <Send size={15} aria-hidden="true" /> Sumar mi firma vecinal al radicado
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-descargar-acta"
                  onClick={() => alert('Descargando copia legal certificada del radicado #SSPD-2026-CTG-0982 (PDF)')}
                >
                  <Download size={15} aria-hidden="true" /> Descargar Acta Legal (PDF)
                </button>
              </div>
            </div>
          </div>

          {/* Columna Lateral (4 cols) */}
          <aside className="veedor-col-lateral" aria-label="Acciones de veeduría y células">
            {/* 1. Suscripción Vecinal Activa Inmediata */}
            <div className="veedor-card-bloque veedor-suscripcion-card">
              <div className="veedor-bloque-cab">
                <h4 className="veedor-bloque-subtitulo">Suscripción Vecinal Activa</h4>
              </div>
              <p className="suscripcion-card-nota">
                Recibe alertas inmediatas en tu correo cuando se reporte un corte o restablecimiento en tu barrio.
              </p>

              {subscritoExito ? (
                <div className="suscripcion-exito-aviso" role="status">
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>¡Activado! Te enviamos un correo para verificar tu suscripción.</span>
                </div>
              ) : (
                <form className="suscripcion-mini-form" onSubmit={manejarSubscripcionRapida}>
                  <div className="mini-form-campo">
                    <label htmlFor="barrio-suscripcion" className="mini-form-label">Tu Barrio</label>
                    <div className="mini-select-wrap">
                      <Layers size={13} className="mini-select-icono" aria-hidden="true" />
                      <select
                        id="barrio-suscripcion"
                        className="mini-select"
                        value={barrioSub}
                        onChange={(e) => setBarrioSub(e.target.value)}
                      >
                        <option value="manga">Manga</option>
                        <option value="bocagrande">Bocagrande</option>
                        <option value="castillogrande">Castillogrande</option>
                        <option value="centro">Centro Histórico</option>
                        <option value="ceballos">Ceballos</option>
                        <option value="el-pozon">El Pozón</option>
                        <option value="olaya-herrera">Olaya Herrera</option>
                        <option value="la-victoria">La Victoria</option>
                      </select>
                    </div>
                  </div>

                  <div className="mini-form-campo">
                    <label htmlFor="correo-suscripcion" className="mini-form-label">Correo Electrónico</label>
                    <input
                      id="correo-suscripcion"
                      type="email"
                      required
                      placeholder="vecino@correo.com"
                      className="mini-input"
                      value={correoSub}
                      onChange={(e) => setCorreoSub(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="mini-btn-submit">
                    <BellRing size={14} aria-hidden="true" /> Activar Alertas Comunitarias
                  </button>
                </form>
              )}
            </div>

            {/* 2. Células de Veedores en Turno */}
            <div className="veedor-card-bloque">
              <div className="veedor-bloque-cab">
                <h4 className="veedor-bloque-subtitulo">Células de Veedores en Turno</h4>
              </div>

              <div className="celulas-lista">
                <div className="celula-item">
                  <div className="celula-cab">
                    <span className="celula-nombre">Célula Norte (UAP 1)</span>
                    <span className="celula-badge-activa">6 veedores</span>
                  </div>
                  <span className="celula-sectores">Manga, Bocagrande, Castillogrande, Centro</span>
                </div>

                <div className="celula-item">
                  <div className="celula-cab">
                    <span className="celula-nombre">Célula Virgen (UAP 2)</span>
                    <span className="celula-badge-activa">8 veedores</span>
                  </div>
                  <span className="celula-sectores">El Pozón, Olaya Herrera, La Victoria</span>
                </div>

                <div className="celula-item">
                  <div className="celula-cab">
                    <span className="celula-nombre">Célula Industrial (UAP 3)</span>
                    <span className="celula-badge-activa">4 veedores</span>
                  </div>
                  <span className="celula-sectores">Ceballos, Campestre, Mamonal</span>
                </div>
              </div>
            </div>

            {/* 3. Monitoreo Fotográfico de Terreno */}
            <div className="veedor-card-bloque veedor-sensor-card">
              <div className="veedor-bloque-cab">
                <h4 className="veedor-bloque-subtitulo">Monitoreo de Presión en Terreno</h4>
              </div>

              <div className="sensor-foto-wrap">
                <img
                  src="https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80"
                  alt="Sensor de presión en red de agua"
                  className="sensor-foto"
                  loading="lazy"
                />
                <div className="sensor-chip">
                  <span className="bitacora-pulse-dot" /> Sensor SCADA #41
                </div>
              </div>

              <div className="sensor-telemetria-info">
                <div className="sensor-cab-info">
                  <span className="sensor-ubicacion">Castillogrande - Edificio Torre Marina</span>
                  <span className="sensor-hora tabular">14:10 COT</span>
                </div>
                <div className="sensor-lectura-fila">
                  <span className="sensor-lectura-tag">Presión reportada:</span>
                  <strong className="sensor-lectura-val text-coral tabular">0.2 bar (Crítico)</strong>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
