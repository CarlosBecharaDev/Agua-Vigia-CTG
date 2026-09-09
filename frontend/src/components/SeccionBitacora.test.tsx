import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SeccionBitacora } from './SeccionBitacora'
import type { BoletinAcuacar } from '../api/acuacar'

function boletinOficial(parcial: Partial<BoletinAcuacar> = {}): BoletinAcuacar {
  return {
    id: 7958,
    numero: '#2864',
    fecha: '2026-09-07T09:12:16',
    titulo: 'Boletín oficial vigente de Acuacar',
    contenidoHTML: '<p>Información oficial del servicio.</p>',
    contenidoTexto: 'Información oficial del servicio.',
    menciones: [],
    barriosAfectados: [],
    url: 'https://www.acuacar.com/2864-informacion-oficial-del-servicio/',
    imagenUrl: 'https://www.acuacar.com/wp-content/uploads/2026/09/boletin.jpg',
    imagenSrcSet: [
      'https://www.acuacar.com/wp-content/uploads/2026/09/boletin-300.jpg 300w',
      'https://www.acuacar.com/wp-content/uploads/2026/09/boletin-1024.jpg 1024w',
    ].join(', '),
    imagenAlt: 'Boletín oficial de Acuacar',
    ...parcial,
  }
}

describe('SeccionBitacora', () => {
  it('deja la vista vacia si Acuacar no devuelve publicaciones', () => {
    render(<SeccionBitacora boletines={[]} estadoAcuacar="empty" />)

    expect(screen.getByText(/Acuacar no devolvió publicaciones/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /ver boletín/i })).not.toBeInTheDocument()
  })

  it('muestra exclusivamente el boletin oficial con su enlace y numero', () => {
    const boletin = boletinOficial()
    render(<SeccionBitacora boletines={[boletin]} estadoAcuacar="success" />)

    expect(screen.getByText(boletin.titulo)).toBeInTheDocument()
    expect(screen.getByText(/Acuacar conectado · 1 boletín/i)).toBeInTheDocument()
    expect(screen.getByText('Boletín N° 2864')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver boletín/i })).toHaveAttribute('href', boletin.url)
  })

  it('sirve la portada y sus variantes de alta resolucion por el proxy propio', () => {
    render(<SeccionBitacora boletines={[boletinOficial()]} estadoAcuacar="success" />)

    const portada = screen.getByRole('presentation', { hidden: true })
    expect(portada).toHaveAttribute('src', '/acuacar-media/2026/09/boletin.jpg')
    expect(portada).toHaveAttribute(
      'srcset',
      '/acuacar-media/2026/09/boletin-300.jpg 300w, /acuacar-media/2026/09/boletin-1024.jpg 1024w',
    )
  })

  it('no rellena con otra fuente cuando Acuacar esta caido', () => {
    render(<SeccionBitacora boletines={[]} estadoAcuacar="unavailable" />)

    expect(screen.getByText(/Acuacar no está disponible/i)).toBeInTheDocument()
    expect(screen.getByText(/No mostramos datos alternativos/i)).toBeInTheDocument()
  })

  it('vuelve al inicio cuando llega un boletin oficial mas reciente', () => {
    const anterior = boletinOficial({
      id: 7955,
      numero: '#2863',
      fecha: '2026-09-02T08:12:31',
      titulo: 'Boletín oficial anterior de Acuacar',
    })
    const reciente = boletinOficial()
    const { container, rerender } = render(
      <SeccionBitacora boletines={[anterior]} estadoAcuacar="success" />,
    )
    const carrusel = container.querySelector<HTMLElement>('.bitacora-carrusel-pro')!
    carrusel.scrollLeft = 320

    rerender(<SeccionBitacora boletines={[reciente, anterior]} estadoAcuacar="success" />)

    expect(carrusel.scrollLeft).toBe(0)
    expect(screen.getByText(reciente.titulo)).toBeInTheDocument()
  })
})
