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
// En localhost durante desarrollo, limpiar cualquier Service Worker previo para que el navegador
// no sirva la caché vieja de sesiones anteriores.
if ('serviceWorker' in navigator && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister()
    }
  }).catch(() => undefined)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
