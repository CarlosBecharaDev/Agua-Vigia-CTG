import { fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { NavegacionInferior } from './NavegacionInferior'
import { ENLACES } from '../../config/navegacion'

describe('NavegacionInferior', () => {
  it('muestra una pestaña por cada enlace de la navegación principal', () => {
    render(<NavegacionInferior items={ENLACES} activeIndex={0} onSelect={() => {}} />)

    ENLACES.forEach(({ etiqueta }) => {
      expect(screen.getByRole('button', { name: new RegExp(etiqueta, 'i') })).toBeInTheDocument()
    })
  })

  it('marca como página actual solo la sección activa', () => {
    render(<NavegacionInferior items={ENLACES} activeIndex={2} onSelect={() => {}} />)

    const actuales = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page')
    expect(actuales).toHaveLength(1)
    expect(actuales[0]).toHaveTextContent(ENLACES[2].etiqueta)
  })

  it('avisa con el índice y el destino de la pestaña tocada', () => {
    const alSeleccionar = vi.fn()
    render(<NavegacionInferior items={ENLACES} activeIndex={0} onSelect={alSeleccionar} />)

    fireEvent.click(screen.getByRole('button', { name: new RegExp(ENLACES[3].etiqueta, 'i') }))

    expect(alSeleccionar).toHaveBeenCalledWith(3, ENLACES[3].a)
  })
})
