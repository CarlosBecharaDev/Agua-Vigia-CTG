import { afterEach, describe, expect, it, vi } from 'vitest'
import { determinarEstadoBoletin, extraerBarriosDeTexto, extraerMencionesDeTexto, obtenerBoletinesRecientes } from './acuacar'

afterEach(() => vi.unstubAllGlobals())

describe('normalización de boletines de Acuacar', () => {
  it('consulta publicaciones vigentes en orden descendente desde el proxy oficial', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        id: 7958,
        date: '2026-09-07T09:12:16',
        title: { rendered: '#2864 Servicio restablecido en Manga' },
        content: { rendered: '<p>Servicio restablecido en Manga.</p>' },
        link: 'https://www.acuacar.com/2864-servicio-restablecido/',
        _embedded: { 'wp:featuredmedia': [{
          source_url: 'https://www.acuacar.com/portada-original.jpg',
          alt_text: 'Cuadrilla',
          media_details: { sizes: {
            medium: { source_url: 'https://www.acuacar.com/portada-300.jpg', width: 300 },
            large: { source_url: 'https://www.acuacar.com/portada-1024.jpg', width: 1024 },
          } },
        }] },
      }],
    })
    vi.stubGlobal('fetch', fetchMock)

    const boletines = await obtenerBoletinesRecientes(20, ['MANGA'])
    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit]
    const peticion = new URL(url, 'http://aguavigia.local')

    expect(peticion.pathname).toBe('/acuacar-api/posts')
    expect(peticion.searchParams.get('status')).toBe('publish')
    expect(peticion.searchParams.get('orderby')).toBe('date')
    expect(peticion.searchParams.get('order')).toBe('desc')
    expect(peticion.searchParams.get('per_page')).toBe('20')
    expect(opciones).toMatchObject({ cache: 'no-store', headers: { Accept: 'application/json' } })
    expect(boletines[0]).toMatchObject({
      id: 7958,
      numero: '#2864',
      barriosAfectados: ['MANGA'],
      imagenUrl: 'https://www.acuacar.com/portada-original.jpg',
      imagenSrcSet: 'https://www.acuacar.com/portada-300.jpg 300w, https://www.acuacar.com/portada-1024.jpg 1024w',
    })
  })

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
