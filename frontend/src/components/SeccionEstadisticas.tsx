/**
 * SeccionEstadisticas — M7 (Estadísticas), integrada en la página principal.
 *
 * Vivía en su propia ruta (/estadisticas); ahora es una sección de "/" a la que se llega
 * haciendo scroll (o navegando a "/#estadisticas" desde cualquier otra página — ver
 * PaginaMapa, que escucha el hash y hace scroll hasta acá), igual que la Bitácora.
 *
 * Conectada al backend real: GET /api/estadisticas (M7, público, calculado a partir de
 * cortes oficiales cerrados). El backend expone tres cifras — sectores más afectados,
 * cortes por día de la semana y duración promedio — no una serie diaria ni un histórico
 * comparable mes a mes, así que las gráficas se ajustan a esa forma (nada de tendencias o
 * "insights" inventados sobre datos que el backend no calcula).
 *
 * Sobre el color de las gráficas: las dos son de MAGNITUD (cuántos cortes), no de
 * identidad, así que van en un solo tono. La versión anterior pintaba las barras con ocho
 * colores categóricos —rojo, coral, ámbar, amarillo, verde, azul, púrpura, magenta— que
 * insinuaban ocho categorías donde solo hay una cantidad ordenada de mayor a menor, y de
 * paso metían una paleta ajena al producto. El tono elegido (#0A7EA4) pasa el validador de
 * la guía de visualización sobre las dos superficies, la de papel y la de noche, así que
 * es el mismo dato en los dos temas.
 *
 * El "peor sector" no se distingue por color sino por su posición y su etiqueta: dos
 * colores para separar uno de otro no sobreviven a una protanopia (el par magenta/cian que
 * se probó primero daba ΔE 3.4, muy por debajo del mínimo de 8).
 */
import { useEffect, useState } from 'react'
import type { FC } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { AlertTriangle, CalendarDays, Clock, Download, Scale } from 'lucide-react'
import { obtenerEstadisticas, obtenerIndiceCumplimientoGlobal, urlExportarCumplimientoCsv, urlExportarEstadisticasCsv } from '../api/services'
import type { EstadisticasGlobales, IndiceCumplimiento } from '../api/services'
import { normalizarErrorApi } from '../api/client'

/** Un solo tono para toda barra: estas gráficas miden magnitud, no identidad. */
const COLOR_DATO = '#0A7EA4'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DIAS_SEMANA_CORTOS: Record<string, string> = {
  Lunes: 'Lun', Martes: 'Mar', Miércoles: 'Mié', Jueves: 'Jue', Viernes: 'Vie', Sábado: 'Sáb', Domingo: 'Dom',
}

/**
 * Segundos a horas con un decimal — la unidad en la que se habla de un corte.
 *
 * Devuelve siempre la magnitud sin signo: el signo lo pone quien llama, que es el único
 * que sabe si un desvío va a favor o en contra. Sin el valor absoluto, una desviación
 * negativa traía su propio "−" de toLocaleString y la pantalla mostraba "−−20,0 h".
 */
function aHoras(segundos: number): string {
  return (Math.abs(segundos) / 3600).toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export const SeccionEstadisticas: FC = () => {
  const [datos, setDatos] = useState<EstadisticasGlobales | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Índice de Cumplimiento (M6, RF020-022) — "el diferencial del proyecto": compara la
  // duración prometida de un corte contra la real. Puede no haber datos todavía (400 si no
  // hay ningún corte cerrado) — se trata como "sin datos", no como un error de la sección.
  const [cumplimiento, setCumplimiento] = useState<IndiceCumplimiento | null>(null)

  useEffect(() => {
    let montado = true
    setCargando(true)
    obtenerEstadisticas()
      .then((res) => { if (montado) { setDatos(res); setError(null) } })
      .catch((causa) => { if (montado) setError(normalizarErrorApi(causa).detalle) })
      .finally(() => { if (montado) setCargando(false) })
    obtenerIndiceCumplimientoGlobal()
      .then((res) => { if (montado) setCumplimiento(res) })
      .catch(() => { if (montado) setCumplimiento(null) })
    return () => { montado = false }
  }, [])

  // El total sale de cortesPorDiaDeSemana, que reparte TODOS los cortes cerrados, y no de
  // sectoresMasAfectados, que es un top 5: sumar ese top daba 32 bajo el rótulo "cortes
  // registrados" cuando en la base había 120. La cifra era correcta para lo que sumaba y
  // mentía sobre lo que decía ser.
  const totalCortes = Object.values(datos?.cortesPorDiaDeSemana ?? {}).reduce((acc, n) => acc + n, 0)
  const sectorTop = datos?.sectoresMasAfectados[0]?.nombre ?? '—'

  const datosBarrios = datos?.sectoresMasAfectados.map((s) => ({ nombre: s.nombre, cortes: s.cantidadCortes })) ?? []
  const datosPorDia = DIAS_SEMANA.map((dia) => ({
    dia: DIAS_SEMANA_CORTOS[dia],
    cortes: datos?.cortesPorDiaDeSemana[dia] ?? 0,
  }))

  // Ejes y rejilla en tinta, no en el color de la serie: el color identifica el dato y el
  // texto se queda en los tokens de texto. Se leen del tema en vez de fijarse a un valor
  // para que la gráfica funcione en la carta impresa y en la de noche.
  const ejeProps = {
    stroke: 'var(--color-tinta-3)',
    tick: { fill: 'var(--color-tinta-2)', fontSize: 12 },
    tickLine: false,
  } as const

  const estiloTooltip = {
    background: 'var(--color-elevado)',
    border: '1px solid var(--color-linea)',
    borderRadius: '3px',
    color: 'var(--color-tinta)',
    fontSize: '0.8rem',
  } as const

  return (
    <section id="estadisticas" className="seccion-inferior" aria-label="Estadísticas del servicio de agua en Cartagena">
      <div className="seccion-inferior-caja">
        <p className="rotulo-carta seccion-rotulo">Estadísticas</p>
        <h2 className="seccion-titulo">Lo que dicen los cortes ya cerrados</h2>
        <p className="seccion-entrada">
          Todo lo de abajo sale de cortes oficiales que ya terminaron. Mientras un corte
          sigue abierto no entra en ninguna cifra: no se puede medir lo que todavía no pasó.
        </p>

        <div className="seccion-acciones">
          <span className={`estado-fuente${error ? ' is-degradado' : ''}`}>
            <span className="estado-fuente-punto" aria-hidden="true" />
            {cargando ? 'Cargando estadísticas…' : error ? `Sin conexión — ${error}` : 'Datos en vivo desde el backend'}
          </span>
          <a href={urlExportarEstadisticasCsv()} download className="enlace-descarga">
            <Download size={13} aria-hidden="true" /> Descargar CSV
          </a>
        </div>

        {/* Tres lecturas, sin animación de conteo. Ver una cifra correr desde cero durante
            1,4 s antes de poder leerla no es información: es un retraso. */}
        <dl className="lecturas">
          <div className="lectura">
            <dt><Clock size={15} aria-hidden="true" /> Duración promedio</dt>
            <dd className="sonda">{datos?.duracionPromedioHoras ?? 0} h</dd>
            <small>Por corte cerrado</small>
          </div>
          <div className="lectura">
            <dt><CalendarDays size={15} aria-hidden="true" /> Cortes cerrados</dt>
            <dd className="sonda">{totalCortes.toLocaleString('es-CO')}</dd>
            <small>Registrados hasta hoy</small>
          </div>
          <div className="lectura">
            <dt><AlertTriangle size={15} aria-hidden="true" /> Sector más afectado</dt>
            <dd className="lectura-texto">{sectorTop}</dd>
            <small>Por número de cortes</small>
          </div>
        </dl>

        {/* El diferencial del proyecto, siempre como comparación y nunca como un puntaje
            suelto: "87 %" no dice nada; "prometieron 2 h y fueron 8 h" sí (DESIGN.md). */}
        <section className="bloque-cumplimiento" aria-label="Índice de cumplimiento">
          <div className="bloque-cumplimiento-cab">
            <h3><Scale size={17} aria-hidden="true" /> Lo prometido contra lo real</h3>
            <a href={urlExportarCumplimientoCsv()} download className="enlace-descarga">
              <Download size={13} aria-hidden="true" /> Descargar serie
            </a>
          </div>

          {cumplimiento ? (
            <>
              <dl className="comparacion">
                <div>
                  <dt>Prometieron</dt>
                  <dd className="sonda">{aHoras(cumplimiento.duracionPrometidaSegundos)} h</dd>
                </div>
                <div>
                  <dt>Fueron</dt>
                  <dd className="sonda">{aHoras(cumplimiento.duracionRealSegundos)} h</dd>
                </div>
                <div>
                  <dt>Diferencia</dt>
                  {/* La magenta solo cuando el desvío va en contra: que un corte acabe
                      antes de lo anunciado no es un incumplimiento que reprochar. */}
                  <dd className={`sonda${cumplimiento.desviacionSegundos > 0 ? ' brecha-magenta' : ''}`}>
                    {cumplimiento.desviacionSegundos > 0 ? '+' : '−'}
                    {aHoras(cumplimiento.desviacionSegundos)} h
                  </dd>
                </div>
              </dl>
              <p className="comparacion-alcance">
                Suma de todos los cortes cerrados hasta hoy.
              </p>
            </>
          ) : (
            <p className="seccion-vacia">
              Todavía no hay cortes cerrados que comparar. En cuanto termine el primero,
              aquí aparece cuánto duró frente a lo que se prometió.
            </p>
          )}
        </section>

        <div className="graficas">
          <figure className="grafica">
            <figcaption>
              <h3>Barrios con más cortes</h3>
              <p>De mayor a menor. Solo cortes ya cerrados.</p>
            </figcaption>
            {datosBarrios.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={datosBarrios} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
                  <CartesianGrid horizontal={false} stroke="var(--color-linea)" />
                  <XAxis type="number" allowDecimals={false} {...ejeProps} />
                  <YAxis type="category" dataKey="nombre" width={116} {...ejeProps} />
                  <Tooltip contentStyle={estiloTooltip} cursor={{ fill: 'var(--color-superficie-2)' }} />
                  {/* Extremo redondeado solo del lado del dato y sin animación larga. */}
                  <Bar dataKey="cortes" name="Cortes" fill={COLOR_DATO} radius={[0, 4, 4, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="seccion-vacia">Sin cortes cerrados registrados todavía.</p>
            )}
          </figure>

          <figure className="grafica">
            <figcaption>
              <h3>Cortes por día de la semana</h3>
              <p>En qué días se concentran los cortes.</p>
            </figcaption>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={datosPorDia} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--color-linea)" />
                <XAxis dataKey="dia" {...ejeProps} />
                <YAxis allowDecimals={false} {...ejeProps} />
                <Tooltip contentStyle={estiloTooltip} cursor={{ fill: 'var(--color-superficie-2)' }} />
                <Bar dataKey="cortes" name="Cortes" fill={COLOR_DATO} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </figure>
        </div>
      </div>
    </section>
  )
}
