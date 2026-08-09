import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { InsigniaEstado } from './InsigniaEstado'

describe('InsigniaEstado', () => {
  it('renderiza correctamente el estado SIN_SERVICIO', () => {
    render(<InsigniaEstado estado="SIN_SERVICIO" />)
    
    // Verifica que exista el texto adecuado según RF016
    expect(screen.getByText(/sin servicio/i)).toBeInTheDocument()
  })

  it('renderiza correctamente el estado CON_SERVICIO', () => {
    render(<InsigniaEstado estado="CON_SERVICIO" />)
    expect(screen.getByText(/con servicio/i)).toBeInTheDocument()
  })
})
