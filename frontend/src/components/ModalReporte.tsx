import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { FormularioReporte } from './FormularioReporte'
import { EnlaceConfirmarReporte } from './EnlaceConfirmarReporte'
import { X, CheckCircle } from 'lucide-react'
import type { Sector } from '../types/tipos-dominio'
import type { ReporteRespuesta } from '../api/services'

interface Props {
  abierto: boolean
  alCerrar: () => void
  sectores: Sector[]
  sectorPreseleccionado?: string
}

export const ModalReporte: FC<Props> = ({ abierto, alCerrar, sectores, sectorPreseleccionado }) => {
  const [reporteExitoso, setReporteExitoso] = useState<ReporteRespuesta | null>(null)

  useEffect(() => {
    if (abierto) setReporteExitoso(null)
  }, [abierto])

  if (!abierto) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-reporte"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        padding: '1rem'
      }}
      onClick={alCerrar}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="panel-glass"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 'var(--radio-lg)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: '1px solid var(--color-linea)',
          backgroundColor: 'var(--color-fondo)',
          padding: '2rem 1.5rem'
        }}
      >
        <button
          onClick={alCerrar}
          aria-label="Cerrar ventana de reporte"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-tinta-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            transition: 'background var(--transicion)'
          }}
          className="hover-glowing"
        >
          <X size={20} />
        </button>

        {reporteExitoso ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: 'var(--color-estado-con)', padding: '1.5rem', borderRadius: '50%', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
                <CheckCircle size={48} color="#fff" />
              </div>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: 'var(--color-tinta)', marginBottom: '1rem', fontWeight: '800' }}>
              ¡Reporte Recibido!
            </h2>
            <p style={{ color: 'var(--color-tinta-2)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Gracias por ser un AguaVigía. Tu reporte ha sido registrado y ya forma parte del consenso de la ciudad para ayudar a tus vecinos.
            </p>

            {reporteExitoso?.id && <EnlaceConfirmarReporte reporteId={reporteExitoso.id} />}

            <button
              onClick={alCerrar}
              className="hover-glowing"
              style={{
                backgroundColor: 'var(--color-acento)',
                color: '#fff',
                border: 'none',
                padding: '0.8rem 2rem',
                borderRadius: 'var(--radio-pill)',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              Cerrar y Volver al Mapa
            </button>
          </div>
        ) : (
          <>
            <h1 id="titulo-modal-reporte" style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--color-tinta)' }}>
              Reportar estado
            </h1>
            <p style={{ color: 'var(--color-tinta-2)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Por favor, indícanos cómo está el servicio en tu barrio ahora mismo. Tu reporte ayuda a validar el consenso comunitario.
            </p>

            <FormularioReporte
              sectores={sectores}
              sectorPreseleccionado={sectorPreseleccionado}
              onReporteEnviado={(reporte) => setReporteExitoso(reporte)}
            />

            <p style={{ color: 'var(--color-tinta-3)', fontSize: '0.75rem', marginTop: '2.5rem', textAlign: 'center' }}>
              Tus datos son anónimos. Si tienes una emergencia o daño grave, contacta a Acuacar directamente al 604 660 3030.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
