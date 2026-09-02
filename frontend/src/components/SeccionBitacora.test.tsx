import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SeccionBitacora } from './SeccionBitacora'
import type { EventoBitacora } from '../api/services'

const listarBitacora = vi.fn()
vi.mock('../api/services', () => ({ listarBitacora: (...args: unknown[]) => listarBitacora(...args) }))

function evento(parcial: Partial<EventoBitacora> = {}): EventoBitacora {
  return {
    id: 'e-1',
    tipo: 'CORTE_ANUNCIADO',
    timestamp: '2026-07-08T14:00:00Z',
    descripcion: 'Suspension del servicio en el barrio Manga',
    sectorId: 'manga',
    corteId: null,
    ...parcial,
  } as EventoBitacora
}

afterEach(() => listarBitacora.mockReset())

describe('SeccionBitacora', () => {
  /**
   * El backend publica en la bitácora eventos que no hablan del servicio (un premio, la calidad
   * del agua, un programa ambiental). Antes caían por defecto en CORTE_PROGRAMADO y la bitácora
   * los anunciaba como si fueran un corte: exactamente lo que esta plataforma no puede hacer.
   */
  it('no debe anunciar como corte un evento que no habla del servicio', async () => {
    listarBitacora.mockResolvedValue([
      evento({ tipo: 'PREMIO_AMBIENTAL', estado: null, descripcion: 'Acuacar recibe un reconocimiento ambiental' }),
    ])

    render(<SeccionBitacora />)

    expect(await screen.findByText(/reconocimiento ambiental/i)).toBeInTheDocument()
    expect(screen.getByText('Informativo')).toBeInTheDocument()
    expect(screen.queryByText('Corte programado')).not.toBeInTheDocument()
  })

  /** La ingesta publica cortes y restablecimientos con el mismo tipo: el tipo no basta. */
  it('debe respetar el estado que afirma el evento por encima del deducido de su tipo', async () => {
    listarBitacora.mockResolvedValue([
      evento({ tipo: 'CORTE_DETECTADO_POR_INGESTA', estado: 'CON_SERVICIO', descripcion: 'Servicio restablecido en Manga' }),
    ])

    render(<SeccionBitacora />)

    expect(await screen.findByText('Con servicio')).toBeInTheDocument()
    expect(screen.queryByText('Sin servicio')).not.toBeInTheDocument()
  })

  /**
   * BUG-049 — acuacar.com bloquea el hotlinking por `Referer`, así que un `<img>` apuntando
   * directo a su dominio nunca cargaba. Las portadas van por el proxy propio `/acuacar-media/`.
   */
  it('debe pedir la portada de Acuacar por el proxy propio y no a su dominio', async () => {
    listarBitacora.mockResolvedValue([
      evento({ imagenUrl: 'https://www.acuacar.com/wp-content/uploads/2026/07/boletin-300x200.jpg' }),
    ])

    render(<SeccionBitacora />)

    const portada = await screen.findByRole('presentation', { hidden: true })
    expect(portada).toHaveAttribute('src', '/acuacar-media/2026/07/boletin-300x200.jpg')
  })

  /** Una fuente futura puede permitir el enlace directo; forzarla por el proxy la rompería. */
  it('debe dejar intacta la portada que no viene de Acuacar', async () => {
    listarBitacora.mockResolvedValue([
      evento({ imagenUrl: 'https://zonacero.com/imagen.jpg' }),
    ])

    render(<SeccionBitacora />)

    const portada = await screen.findByRole('presentation', { hidden: true })
    expect(portada).toHaveAttribute('src', 'https://zonacero.com/imagen.jpg')
  })

  /**
   * La bitácora cubre cinco años de boletines: «hace 2 h» no informa sobre uno de julio. Por
   * debajo de un día se conserva el relativo, que es lo natural para lo que acaba de pasar.
   */
  it('debe fechar un boletin viejo con su fecha real y no en relativo', async () => {
    listarBitacora.mockResolvedValue([evento({ timestamp: '2026-07-08T14:00:00Z' })])

    render(<SeccionBitacora />)

    const fecha = await screen.findByText(/8 de julio de 2026/i)
    expect(fecha).toBeInTheDocument()
    expect(screen.queryByText(/hace \d+ min/i)).not.toBeInTheDocument()
  })

  /** Una bitácora vacía no es un error: se explica por qué está vacía. */
  it('debe explicar por que esta vacia en vez de mostrar un hueco', async () => {
    listarBitacora.mockResolvedValue([])

    render(<SeccionBitacora />)

    expect(await screen.findByText(/la bitácora está vacía/i)).toBeInTheDocument()
  })
})
