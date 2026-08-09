import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { Download } from 'lucide-react'

export const BotonInstalarPWA: FC = () => {
  const [eventoInstalacion, setEventoInstalacion] = useState<any>(null)
  const [appInstalada, setAppInstalada] = useState(false)

  useEffect(() => {
    // Escuchar el evento que indica que la PWA se puede instalar
    const interceptarInstalacion = (e: Event) => {
      e.preventDefault()
      setEventoInstalacion(e)
    }

    // Detectar si ya está instalada (Standalone mode)
    const detectarStandalone = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setAppInstalada(true)
      }
    }

    window.addEventListener('beforeinstallprompt', interceptarInstalacion)
    window.addEventListener('appinstalled', () => {
      setAppInstalada(true)
      setEventoInstalacion(null)
    })
    
    detectarStandalone()

    return () => {
      window.removeEventListener('beforeinstallprompt', interceptarInstalacion)
    }
  }, [])

  if (appInstalada || !eventoInstalacion) {
    return null
  }

  const solicitarInstalacion = async () => {
    if (!eventoInstalacion) return
    eventoInstalacion.prompt()
    const resultado = await eventoInstalacion.userChoice
    if (resultado.outcome === 'accepted') {
      console.log('El usuario aceptó instalar la PWA de AguaVigía')
      setEventoInstalacion(null)
    }
  }

  return (
    <button
      onClick={solicitarInstalacion}
      className="hover-glowing"
      title="Instalar AguaVigía en tu dispositivo"
      aria-label="Instalar aplicación"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 0.75rem',
        backgroundColor: 'var(--color-acento)',
        color: '#fff',
        borderRadius: 'var(--radio-pill)',
        border: 'none',
        fontSize: '0.75rem',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(0, 102, 204, 0.3)',
      }}
    >
      <Download size={14} />
      <span>Instalar App</span>
    </button>
  )
}
