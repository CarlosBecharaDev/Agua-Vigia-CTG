/**
 * noticias.ts — Servicio de noticias en tiempo real sobre el agua en Cartagena.
 * 
 * Fuente: Google News RSS (gratis, sin API key).
 * En desarrollo: las peticiones pasan por el proxy de Vite (/google-news-rss).
 */

export interface NoticiaAgua {
  titulo: string;
  enlace: string;
  fuente: string;
  fechaPublicacion: string;   // ISO string
  descripcion: string;
}

/**
 * Busca noticias recientes sobre el servicio de agua en Cartagena
 * via Google News RSS.
 */
export async function obtenerNoticiasAgua(): Promise<NoticiaAgua[]> {
  try {
    const query = encodeURIComponent('"acueducto Cartagena" OR "agua Cartagena" OR "Acuacar"');
    const url = `/google-news-rss/search?q=${query}&hl=es-CO&gl=CO&ceid=CO:es`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`RSS respondió ${res.status}`);

    const textoXML = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(textoXML, 'text/xml');

    const items = doc.querySelectorAll('item');
    const noticias: NoticiaAgua[] = [];

    items.forEach((item, i) => {
      if (i >= 10) return; // Máximo 10 noticias

      const titulo = item.querySelector('title')?.textContent || '';
      const enlace = item.querySelector('link')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const descripcion = item.querySelector('description')?.textContent || '';
      const fuente = item.querySelector('source')?.textContent || 'Fuente desconocida';

      noticias.push({
        titulo: limpiarTextoRSS(titulo),
        enlace,
        fuente,
        fechaPublicacion: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        descripcion: limpiarTextoRSS(descripcion),
      });
    });

    return noticias;
  } catch (error) {
    console.warn('No se pudieron cargar las noticias de Google News:', error);
    return [];
  }
}

/** Limpia entidades HTML comunes del texto RSS */
function limpiarTextoRSS(texto: string): string {
  return texto
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .trim();
}
