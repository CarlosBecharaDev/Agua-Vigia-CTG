import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { Droplet } from 'lucide-react'

export const SplashScreen: FC = () => {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // Después de 2 segundos, inicia el fade out
    const fadeTimer = setTimeout(() => {
      setFading(true)
    }, 2000)

    // Después de 2.5 segundos, desmonta completamente para no bloquear clics
    const removeTimer = setTimeout(() => {
      setVisible(false)
    }, 2500)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'var(--color-fondo)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: fading ? 'fadeOutSplash 0.5s forwards' : 'none',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        animation: 'dropSplash 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
      }}>
        <div style={{
          backgroundColor: 'var(--color-superficie)',
          padding: '2rem',
          borderRadius: '50%',
          boxShadow: '0 10px 40px rgba(2, 132, 199, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Droplet size={64} strokeWidth={2} color="var(--color-acento-vivo)" />
        </div>
      </div>
      
      <div style={{
        marginTop: '1.5rem',
        animation: 'textReveal 0.8s ease-out 0.5s both'
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.5rem',
          fontWeight: '800',
          background: 'linear-gradient(90deg, var(--color-acento) 0%, var(--color-acento-vivo) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-1px'
        }}>
          AguaVigía
        </span>
      </div>
    </div>
  )
}
