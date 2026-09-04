/** Lleva el scroll al inicio de la sección del mapa.
 *
 *  No es `window.scrollTo(0)`: en teléfono y tableta el panel de bienvenida vive encima del
 *  hero (ver PaginaMapa), así que subir del todo deja al usuario en la portada y no en el
 *  mapa. En escritorio la sección del mapa ES lo primero del documento, así que esto da el
 *  mismo cero de siempre. */
export function desplazarAlMapa(): void {
  const mapa = document.getElementById('mapa')
  const destino = mapa ? Math.max(0, Math.round(mapa.getBoundingClientRect().top + window.scrollY)) : 0
  window.scrollTo({ top: destino, behavior: 'smooth' })
}
