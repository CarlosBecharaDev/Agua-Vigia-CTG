import { fetchWithTimeout } from './fetchWithTimeout'

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

// ── Funciones públicas ──────────────────────────────────────

/**
 * Obtiene los boletines más recientes de Acuacar.
 * Usa el proxy de Vite en desarrollo.
 */
export async function obtenerBoletinesRecientes(cantidad: number = 15): Promise<BoletinAcuacar[]> {
  try {
    const baseUrl = import.meta.env.VITE_ACUACAR_API_URL || '/acuacar-api';
    const url = `${baseUrl}/posts?per_page=${cantidad}&_fields=id,date,title,content,link`;

    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`Acuacar API respondió ${res.status}`);

    const posts = await res.json();

    return posts.map((post: any) => {
      const titulo = limpiarHTML(post.title?.rendered || '');
      const contenidoHTML = post.content?.rendered || '';
      const contenidoTexto = limpiarHTML(contenidoHTML);
      const numeroMatch = titulo.match(/#(\d+)/);

      return {
        id: post.id,
        numero: numeroMatch ? `#${numeroMatch[1]}` : `#${post.id}`,
        fecha: post.date || new Date().toISOString(),
        titulo,
        contenidoHTML,
        contenidoTexto,
        barriosAfectados: extraerBarriosDeTexto(contenidoTexto),
        url: post.link || `https://www.acuacar.com/?p=${post.id}`,
      };
    });
  } catch (error) {
    console.warn('No se pudieron cargar boletines de Acuacar:', error);
    return [];
  }
}

/**
 * Extrae nombres de barrios conocidos de un texto libre.
 * Busca coincidencias con la lista de barrios conocidos.
 */
export function extraerBarriosDeTexto(texto: string): string[] {
  const textoNorm = normalizar(texto);
  const encontrados: string[] = [];

  for (const barrio of BARRIOS_CONOCIDOS) {
    const barrioNorm = normalizar(barrio);
    if (textoNorm.includes(barrioNorm)) {
      encontrados.push(barrio);
    }
  }

  return encontrados;
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

    // Determinar tipo de afectación por el título
    const tituloNorm = normalizar(boletin.titulo);
    let estado: 'SIN_SERVICIO' | 'CORTE_PROGRAMADO' | 'CON_SERVICIO' = 'CORTE_PROGRAMADO';

    if (
      tituloNorm.includes('interrupcion') ||
      tituloNorm.includes('falla') ||
      tituloNorm.includes('avance del') ||
      tituloNorm.includes('suspension')
    ) {
      estado = 'SIN_SERVICIO';
    } else if (
      tituloNorm.includes('restablec') ||
      tituloNorm.includes('normaliz') ||
      tituloNorm.includes('recuperacion')
    ) {
      estado = 'CON_SERVICIO';
    } else if (
      tituloNorm.includes('mantenimiento') ||
      tituloNorm.includes('programad') ||
      tituloNorm.includes('realizara') ||
      tituloNorm.includes('intervendr')
    ) {
      estado = 'CORTE_PROGRAMADO';
    }

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
