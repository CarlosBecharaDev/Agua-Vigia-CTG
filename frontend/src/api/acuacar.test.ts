import { describe, expect, it } from 'vitest'
import { determinarEstadoBoletin, extraerBarriosDeTexto, extraerMencionesDeTexto } from './acuacar'

describe('normalización de boletines de Acuacar', () => {
  it('no confunde CHILE dentro de NUEVO CHILE', () => {
    expect(extraerBarriosDeTexto('Mantenimiento en Nuevo Chile')).toEqual(['NUEVO CHILE'])
    expect(extraerBarriosDeTexto('Corte en Chile')).toEqual(['CHILE'])
  })

  it('exige palabra completa: "sanitario" no contiene el barrio ANITA', () => {
    // Caso real: el boletín #2852 (14-ago-2026) dice "alcantarillado sanitario" y no nombra
    // ningún barrio; con la búsqueda por subcadena, ANITA quedaba marcada con corte.
    expect(extraerBarriosDeTexto('la protección del sistema de alcantarillado sanitario', ['ANITA']))
      .toEqual([])
    expect(extraerBarriosDeTexto('afectación en la urbanización Anita', ['ANITA']))
      .toEqual(['ANITA'])
  })

  it('reconoce a Olaya Herrera, que el GeoJSON parte en sectores', () => {
    const sectores = ['OLAYA ST. RICAURTE', 'OLAYA ST. STELLA']
    expect(extraerBarriosDeTexto('Suspensión en Olaya Herrera', sectores)).toEqual(sectores)
    // Nombrar un sector suelto también cruza, sin que el boletín repita el prefijo del GeoJSON.
    expect(extraerBarriosDeTexto('Trabajos en el sector Stella', sectores)).toEqual(['OLAYA ST. STELLA'])
  })

  it('no marca Olaya/Ricaurte cuando el boletín usa el canal como linde de otro barrio (BUG-046)', () => {
    // Frase real del corpus: el canal Ricaurte delimita a San Fernando, no anuncia nada sobre
    // el sector Ricaurte de Olaya Herrera.
    const texto = 'San Fernando, las viviendas entre la avenida El Consulado y el canal Ricaurte'
    expect(extraerBarriosDeTexto(texto, ['OLAYA ST. RICAURTE', 'SAN FERNANDO'])).toEqual(['SAN FERNANDO'])
  })

  it('traduce el numeral que Acuacar escribe en dígito', () => {
    expect(extraerBarriosDeTexto('Corte en el barrio 9 de Abril', ['NUEVE DE ABRIL']))
      .toEqual(['NUEVE DE ABRIL'])
  })

  it('reconoce barrios que Acuacar nombra y el GeoJSON no tiene, sin polígono', () => {
    const menciones = extraerMencionesDeTexto('Suspensión del servicio en Nabonasar', [])
    expect(menciones).toHaveLength(1)
    expect(menciones[0].barrio).toBe('Nabonasar')
    expect(menciones[0].sinPoligono).toBe(true)
  })

  it('acompaña cada barrio con la frase del boletín que lo respalda', () => {
    const texto = 'Aguas de Cartagena informa. Habrá suspensión del servicio en Manga desde las 8:00 a. m. Gracias.'
    const [mencion] = extraerMencionesDeTexto(texto, ['MANGA'])
    expect(mencion.cita).toContain('suspensión del servicio en Manga')
  })

  it('aplica la misma clasificación a cualquier pantalla', () => {
    expect(determinarEstadoBoletin('Interrupción del servicio')).toBe('SIN_SERVICIO')
    expect(determinarEstadoBoletin('Servicio restablecido')).toBe('CON_SERVICIO')
    expect(determinarEstadoBoletin('Jornada de mantenimiento programada')).toBe('CORTE_PROGRAMADO')
  })

  it('no inventa un corte cuando el boletín no habla del servicio', () => {
    // Boletines reales del corpus que antes caían en el default CORTE_PROGRAMADO y pintaban
    // de azul a todo barrio nombrado de paso.
    expect(determinarEstadoBoletin('AGUAS DE CARTAGENA IMPULSA UNA GENERACIÓN DE LÍDERES AMBIENTALES')).toBeNull()
    expect(determinarEstadoBoletin('AGUAS DE CARTAGENA OBTIENE UN ÍNDICE ÚNICO SECTORIAL DE 94,39')).toBeNull()
  })
})
