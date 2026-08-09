import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const BotonInstalarPWA: FC = () => {
  const [eventoInstalacion, setEventoInstalacion] = useState<BeforeInstallPromptEvent | null>(null)
  const [appInstalada, setAppInstalada] = useState(false)

  useEffect(() => {
    // Escuchar el evento que indica que la PWA se puede instalar
    const interceptarInstalacion = (e: Event) => {
      e.preventDefault()
      setEventoInstalacion(e as BeforeInstallPromptEvent)
    }

    // Detectar si ya está instalada (Standalone mode)
    const detectarStandalone = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setAppInstalada(true)
      }
    }

    window.addEventListener('beforeinstallprompt', interceptarInstalacion)
    const marcarComoInstalada = () => {
      setAppInstalada(true)
      setEventoInstalacion(null)
    }
    window.addEventListener('appinstalled', marcarComoInstalada)
    
    detectarStandalone()

    return () => {
      window.removeEventListener('beforeinstallprompt', interceptarInstalacion)
      window.removeEventListener('appinstalled', marcarComoInstalada)
    }
  }, [])

  if (appInstalada || !eventoInstalacion) {
    return null
  }

  const solicitarInstalacion = async () => {
    const evento = eventoInstalacion
    if (!evento) return

    setEventoInstalacion(null)

    try {
      await evento.prompt()
      const resultado = await evento.userChoice
      if (resultado.outcome === 'accepted') {
        console.log('El usuario aceptó instalar la PWA de AguaVigía')
      }
    } catch (error) {
      console.warn('No se pudo mostrar el diálogo de instalación:', error)
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
