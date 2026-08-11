/**
 * acuacar.ts — Servicio para consumir la API REST pública de Acuacar (WordPress).
 *
 * Fuente verificada (ver MEMORY.md): acuacar.com expone /wp-json/wp/v2/posts
 * con 300+ boletines oficiales de cortes, mantenimientos y noticias.
 *
 * En desarrollo: las peticiones van a /acuacar-api (proxy de Vite → acuacar.com).
 * En producción: se usará VITE_ACUACAR_API_URL o un backend propio.
 */

// ── Interfaces ──────────────────────────────────────────────

export interface BoletinAcuacar {
  id: number;
  numero: string;          // e.g. '#2840'
  fecha: string;           // ISO string
  titulo: string;
  contenidoHTML: string;
  contenidoTexto: string;
  barriosAfectados: string[];
  url?: string;
  imagenUrl: string | null;
  imagenAlt: string;
}

export interface EstadoBarrioAcuacar {
  nombre: string;
  estado: 'SIN_SERVICIO' | 'CORTE_PROGRAMADO' | 'CON_SERVICIO';
  fuente: string;          // número de boletín
  fechaBoletin: string;    // ISO string
  esVigente: boolean;
}

// ── Barrios conocidos de Cartagena ──────────────────────────
// Fuente: GeoJSON de D5 + boletines reales de Acuacar

const BARRIOS_CONOCIDOS = [
  'BOCAGRANDE', 'CASTILLOGRANDE', 'EL LAGUITO', 'MANGA',
  'PIE DE LA POPA', 'OLAYA HERRERA', 'GETSEMANI', 'EL CENTRO',
  'LA BOQUILLA', 'EL SOCORRO', 'TORICES', 'CRESPO',
  'DANIEL LEMAITRE', 'SAN DIEGO', 'CANAPOTE', 'SANTA RITA',
  'CHAMBACU', 'BOSTON', 'ZARAGOCILLA', 'NUEVO BOSQUE',
  'LA CAMPIÑA', 'TERNERA', 'EL CAMPESTRE', 'NELSON MANDELA',
  'PASACABALLOS', 'ALBORNOZ', 'BAYUNCA', 'PONTEZUELA',
  'EL POZON', 'BARRIO CHINO', 'BLAS DE LEZO', 'ESCALLON VILLA',
  'LOS CALAMARES', 'CHIQUINQUIRA', 'LAS GAVIOTAS', 'ARMENIA',
  'PIEDRA BOLIVAR', 'SAN ISIDRO', 'ALTO BOSQUE', 'JUAN XXIII',
  'VISTA HERMOSA', 'EL BOSQUE', 'SAN FERNANDO', 'LA CANDELARIA',
  'PABLO VI', 'LOMA FRESCA', 'PETARE', 'LA HEROICA',
  'SAN JOSE DE LOS CAMPANOS', 'NUEVO CHILE', 'CHILE',
  'MARIA AUXILIADORA', 'LAS PALMERAS', 'LOS ALPES',
  'BARLOVENTO', 'NUEVO CAMPESTRE', 'BELLAVISTA',
];

/** Normaliza un texto para comparación (minúsculas, sin acentos) */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Bolet\u00edn real #2849 (9-ago-2026) escribe "7 de Agosto"; el GeoJSON de D5 tiene el barrio
// como "SIETE DE AGOSTO" \u2014 en d\u00edgito nunca calzaba contra el nombre en letras y ese barrio
// quedaba fuera de cualquier bolet\u00edn que lo mencionara as\u00ed. Cubre los \u00fanicos 4 nombres de
// barrio del GeoJSON que empiezan con un n\u00famero (siete/nueve/trece/veinte de algo); si D5
// agrega uno nuevo con numeral, hay que sumarlo aqu\u00ed.
const NUMEROS_EN_NOMBRES_DE_BARRIO: [RegExp, string][] = [
  [/\b7\b/g, 'siete'],
  [/\b9\b/g, 'nueve'],
  [/\b13\b/g, 'trece'],
  [/\b20\b/g, 'veinte'],
];

/** Como `normalizar`, pero adem\u00e1s pasa a letras los n\u00fameros que Acuacar suele escribir en
 *  d\u00edgito cuando el nombre del barrio los tiene en letras. Solo se usa para la extracci\u00f3n de
 *  barrios en texto libre \u2014 nunca para el texto que se muestra, para no alterar la cita textual. */
function normalizarParaExtraccion(texto: string): string {
  let normalizado = normalizar(texto);
  for (const [patron, palabra] of NUMEROS_EN_NOMBRES_DE_BARRIO) {
    normalizado = normalizado.replace(patron, palabra);
  }
  return normalizado;
}

// ── Funciones públicas ──────────────────────────────────────

/**
 * Obtiene los boletines más recientes de Acuacar. Usa el proxy de Vite en desarrollo.
 *
 * @param barriosConocidos Lista de barrios a reconocer en el texto. Por defecto la lista
 *   corta de respaldo (`BARRIOS_CONOCIDOS`); en producción useDatosEnVivo pasa el universo
 *   completo cargado desde el GeoJSON de D5 (ver `data/barriosCartagena.ts`), para que un
 *   boletín pueda mencionar cualquiera de los ~211 barrios reales, no solo estos 55.
 */
export async function obtenerBoletinesRecientes(
  cantidad: number = 15,
  barriosConocidos: string[] = BARRIOS_CONOCIDOS,
): Promise<BoletinAcuacar[]> {
  try {
    const baseUrl = import.meta.env.VITE_ACUACAR_API_URL || '/acuacar-api';
    // `_embed=wp:featuredmedia` trae la imagen destacada de cada boletín sin peticiones
    // adicionales — verificado contra la API real: los últimos 20 boletines la traen todos.
    const url = `${baseUrl}/posts?per_page=${cantidad}&_fields=id,date,title,content,link,_links,_embedded&_embed=wp:featuredmedia`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Acuacar API respondió ${res.status}`);

    const posts = await res.json();

    return posts.map((post: any) => {
      const titulo = limpiarHTML(post.title?.rendered || '');
      const contenidoHTML = post.content?.rendered || '';
      const contenidoTexto = limpiarHTML(contenidoHTML);
      const numeroMatch = titulo.match(/#(\d+)/);
      const media = post._embedded?.['wp:featuredmedia']?.[0];

      return {
        id: post.id,
        numero: numeroMatch ? `#${numeroMatch[1]}` : `#${post.id}`,
        fecha: post.date || new Date().toISOString(),
        titulo,
        contenidoHTML,
        contenidoTexto,
        barriosAfectados: extraerBarriosDeTexto(contenidoTexto, barriosConocidos),
        url: post.link || `https://www.acuacar.com/?p=${post.id}`,
        imagenUrl: media?.media_details?.sizes?.medium?.source_url ?? media?.source_url ?? null,
        imagenAlt: media?.alt_text || titulo,
      };
    });
  } catch (error) {
    console.warn('No se pudieron cargar boletines de Acuacar:', error);
    return [];
  }
}

/**
 * Extrae nombres de barrios conocidos de un texto libre.
 * Busca coincidencias con la lista de barrios conocidos: los nombres más largos ganan sobre
 * los cortos que quedan contenidos dentro de ellos (p.ej. "CHILE" no debe colarse cuando el
 * texto dice "NUEVO CHILE"), para no inflar la lista con falsos positivos.
 */
export function extraerBarriosDeTexto(texto: string, barrios: string[] = BARRIOS_CONOCIDOS): string[] {
  const textoNorm = normalizarParaExtraccion(texto);
  const candidatos = [...barrios].sort((a, b) => b.length - a.length);
  const cubierto = new Array(textoNorm.length).fill(false);
  const encontrados = new Set<string>();

  for (const barrio of candidatos) {
    const barrioNorm = normalizar(barrio);
    if (!barrioNorm) continue;

    let desde = 0;
    let idx: number;
    while ((idx = textoNorm.indexOf(barrioNorm, desde)) !== -1) {
      const fin = idx + barrioNorm.length;
      if (!cubierto.slice(idx, fin).some(Boolean)) {
        encontrados.add(barrio);
        for (let i = idx; i < fin; i++) cubierto[i] = true;
      }
      desde = idx + 1;
    }
  }

  // Orden estable según `barrios`, no según dónde aparece cada uno en el texto.
  return barrios.filter((barrio) => encontrados.has(barrio));
}

/**
 * Clasifica el tipo de afectación a partir del título del boletín. Función pura y expuesta
 * aparte para que la misma regla se aplique tanto a lotes (determinarEstadoBarrios) como a
 * un boletín suelto en pantallas que lo necesiten (p.ej. la bitácora).
 */
export function determinarEstadoBoletin(titulo: string): 'SIN_SERVICIO' | 'CORTE_PROGRAMADO' | 'CON_SERVICIO' {
  const tituloNorm = normalizar(titulo);

  if (
    tituloNorm.includes('interrupcion') ||
    tituloNorm.includes('falla') ||
    tituloNorm.includes('avance del') ||
    tituloNorm.includes('suspension')
  ) {
    return 'SIN_SERVICIO';
  }

  if (
    tituloNorm.includes('restablec') ||
    tituloNorm.includes('normaliz') ||
    tituloNorm.includes('recuperacion')
  ) {
    return 'CON_SERVICIO';
  }

  // Incluye mantenimiento/programado y cualquier boletín sin palabra clave reconocida.
  return 'CORTE_PROGRAMADO';
}

/**
 * Analiza los boletines y determina el estado de cada barrio afectado.
 * Los boletines más recientes tienen prioridad.
 */
export function determinarEstadoBarrios(boletines: BoletinAcuacar[]): EstadoBarrioAcuacar[] {
  const ahora = Date.now();
  const HORAS_VIGENCIA = 48;

  // Ordenar: más recientes primero
  const ordenados = [...boletines].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  // Mapa para evitar duplicados (el más reciente gana)
  const mapaEstados = new Map<string, EstadoBarrioAcuacar>();

  for (const boletin of ordenados) {
    if (boletin.barriosAfectados.length === 0) continue;

    const fechaBoletin = new Date(boletin.fecha).getTime();
    const horasTranscurridas = (ahora - fechaBoletin) / (1000 * 60 * 60);
    const esVigente = horasTranscurridas <= HORAS_VIGENCIA;
    const estado = determinarEstadoBoletin(boletin.titulo);

    for (const barrio of boletin.barriosAfectados) {
      // Solo agregar si no existe ya uno más reciente
      if (!mapaEstados.has(barrio)) {
        mapaEstados.set(barrio, {
          nombre: barrio,
          estado,
          fuente: boletin.numero,
          fechaBoletin: boletin.fecha,
          esVigente,
        });
      }
    }
  }

  return Array.from(mapaEstados.values());
}

/**
 * Elimina tags HTML y decodifica entidades comunes.
 */
export function limpiarHTML(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8220;/g, '\u201c')
    .replace(/&#8221;/g, '\u201d')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
