/**
 * BrechaCumplimiento — lo prometido contra lo real, sobre la carta.
 *
 * Es el diferencial del proyecto (M6, RF020–RF025): el Índice de Cumplimiento cruza la
 * duración que Acuacar prometió para cada corte con la que realmente duró. Hasta ahora
 * solo existía dentro de la sección de estadísticas, a dos pantallas de scroll de la
 * portada; aquí sube a la primera pantalla, que es donde justifica el producto.
 *
 * Se presenta siempre como comparación y nunca como un puntaje suelto (DESIGN.md):
 * "Prometieron 2 h · Fueron 8 h" dice algo; "87 %" no dice nada. La magenta —el color con
 * el que una carta náutica marca lo que exige atención— aparece solo cuando hay desvío en
 * contra, y es el único sitio de la portada donde se usa con fuerza.
 */
import { useQuery } from '@tanstack/react-query'
import type { FC } from 'react'
import { obtenerIndiceCumplimientoGlobal } from '../api/services'

/**
 * Segundos a una duración que alguien pueda leer de un vistazo.
 *
 * La escala se adapta porque este índice agrega TODOS los cortes cerrados: formateando
 * siempre en horas y minutos, la portada acababa anunciando "2943 h · 2922 h 59 m", dos
 * cifras que nadie compara de un vistazo ni traduce a nada que haya vivido. Por encima de
 * dos días se muestran días, que es la unidad de un acumulado; por debajo, horas y
 * minutos, que es como se vive un corte.
 */
function formatearDuracion(segundos: number): string {
  const totalMinutos = Math.round(Math.abs(segundos) / 60)
  const horas = Math.floor(totalMinutos / 60)
  const minutos = totalMinutos % 60

  if (horas >= 48) {
    const dias = horas / 24
    // Un decimal solo mientras aporte: "5,5 días" informa, "122,4 días" es ruido.
    const conDecimal = dias < 10 && !Number.isInteger(dias)
    return `${dias.toLocaleString('es-CO', {
      minimumFractionDigits: conDecimal ? 1 : 0,
      maximumFractionDigits: conDecimal ? 1 : 0,
    })} días`
  }
  if (horas === 0) return `${minutos} m`
  if (minutos === 0) return `${horas} h`
  return `${horas} h ${minutos} m`
}

export const BrechaCumplimiento: FC = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['cumplimiento', 'global'],
    queryFn: obtenerIndiceCumplimientoGlobal,
    // Sin reintentos: el backend responde 400 —no 404 ni 204— cuando todavía no hay
    // ningún corte cerrado que comparar, y ese 400 es un estado vacío perfectamente
    // legítimo, no un fallo del que valga la pena reponerse insistiendo.
    retry: false,
    staleTime: 5 * 60_000,
  })

  // Mientras carga no se reserva un hueco con un esqueleto: esta banda es contexto, no la
  // respuesta a "¿tengo agua?", y un bloque parpadeando sobre el mapa le robaría atención
  // a lo único que la portada tiene que contestar en menos de 5 segundos.
  if (isPending) return null

  // Sin cortes cerrados todavía no hay nada que comparar, y decirlo es más honesto que
  // esconder la banda: que el índice exista y aún no tenga material es información
  // (ADR-014 — el producto declara lo que no sabe en vez de callarlo).
  if (isError || !data) {
    return (
      <aside className="brecha" aria-label="Índice de cumplimiento">
        <p className="rotulo-carta brecha-rotulo">Cumplimiento</p>
        <p className="brecha-vacia">
          Sin cortes cerrados que comparar todavía.
        </p>
      </aside>
    )
  }

  const { duracionPrometidaSegundos, duracionRealSegundos, desviacionSegundos } = data
  // Positivo = duró más de lo prometido. Es el único caso que merece la magenta: que un
  // corte termine antes de lo anunciado no es un incumplimiento que reprocharle a nadie.
  const enContra = desviacionSegundos > 0

  return (
    <aside className="brecha" aria-label="Índice de cumplimiento">
      <p className="rotulo-carta brecha-rotulo">Cumplimiento</p>

      <dl className="brecha-comparacion">
        <div>
          <dt>Prometieron</dt>
          <dd className="sonda">{formatearDuracion(duracionPrometidaSegundos)}</dd>
        </div>
        <div>
          <dt>Fueron</dt>
          <dd className="sonda">{formatearDuracion(duracionRealSegundos)}</dd>
        </div>
      </dl>

      <p className={`brecha-desvio${enContra ? ' brecha-magenta' : ''}`}>
        <span className="sonda">
          {enContra ? '+' : '−'}{formatearDuracion(desviacionSegundos)}
        </span>{' '}
        {enContra ? 'de más' : 'de menos'}
      </p>

      {/* Sin esta línea las dos cifras se leen como un corte concreto —"prometieron 2 h,
          fueron 8 h"— cuando son el acumulado de todos los cortes ya cerrados. Decir
          sobre qué se está sumando es lo que separa un dato de una insinuación. */}
      <p className="brecha-alcance">Sobre todos los cortes ya cerrados</p>
    </aside>
  )
}
