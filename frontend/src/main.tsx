import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { queryClient } from './api/queryClient.ts'

import React from 'react'
import ReactDOM from 'react-dom'

if (import.meta.env.DEV) {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000)
  })
}

// Docker sirve un build de producción también durante el trabajo local. Si una pestaña
// queda controlada por el Service Worker anterior, recárgala apenas el nuevo tome control.
// Se limita a localhost para no interrumpir formularios abiertos en producción.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const esEntornoLocal = window.location.hostname === '127.0.0.1'
    || window.location.hostname === 'localhost'

  if (esEntornoLocal) {
    let recargandoPorActualizacion = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (recargandoPorActualizacion) return
      recargandoPorActualizacion = true
      window.location.reload()
    })

    window.addEventListener('load', () => {
      navigator.serviceWorker.ready
        .then((registro) => registro.update())
        .catch(() => undefined)
    })
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
