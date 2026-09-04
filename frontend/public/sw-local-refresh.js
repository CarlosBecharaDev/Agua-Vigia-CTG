self.addEventListener('activate', (event) => {
  const esEntornoLocal = self.location.hostname === '127.0.0.1'
    || self.location.hostname === 'localhost'

  if (!esEntornoLocal) return

  event.waitUntil((async () => {
    // Asegura que el worker nuevo controle la pestaña antes de navegarla. Sin esta espera,
    // Chromium puede completar la navegación todavía con el precache del worker anterior.
    await self.clients.claim()
    await new Promise((resolve) => setTimeout(resolve, 120))
    const clientes = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    await Promise.all(
      clientes.map((cliente) => cliente.navigate(cliente.url).catch(() => undefined)),
    )
  })())
})
