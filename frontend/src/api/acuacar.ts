/**
 * acuacar.ts — Servicio para consumir la API REST pública de Acuacar (WordPress).
 *
 * Fuente verificada (ver MEMORY.md): acuacar.com expone /wp-json/wp/v2/posts
 * con 300+ boletines oficiales de cortes, mantenimientos y noticias.
 *
 * En desarrollo: las peticiones van a /acuacar-api (proxy de Vite → acuacar.com).
 * En producción: se usará VITE_ACUACAR_API_URL o un backend propio.
 */

import { ALIAS_DE_BARRIO, BARRIOS_SIN_POLIGONO } from '../data/barriosAcuacar';

// ── Interfaces ──────────────────────────────────────────────

export interface BoletinAcuacar {
  id: number;
  numero: string;          // e.g. '#2840'
  fecha: string;           // ISO string
  titulo: string;
  contenidoHTML: string;
  contenidoTexto: string;
  /** Barrios nombrados por el boletín, cada uno con la frase que lo respalda. */
  menciones: MencionBarrio[];
  barriosAfectados: string[];
  url?: string;
  imagenUrl: string | null;
  imagenAlt: string;
}

/** Estado que un boletín reporta. `null` = el boletín no habla del servicio (nota
 *  institucional, premio, calidad del agua…) y por tanto no dice nada de ningún barrio. */
export type EstadoServicioBoletin = 'SIN_SERVICIO' | 'CORTE_PROGRAMADO' | 'CON_SERVICIO';

export interface EstadoBarrioAcuacar {
  nombre: string;
  estado: EstadoServicioBoletin;
  fuente: string;          // número de boletín
  fechaBoletin: string;    // ISO string
  esVigente: boolean;
  /** Frase textual del boletín que respalda esta afectación. `CLAUDE.md` §Ética de datos,
   *  regla 4: si no se puede citar la frase, no se publica. La UI la muestra como evidencia. */
  cita: string;
  /** El GeoJSON no tiene polígono para este nombre: se lista, pero no se dibuja. */
  sinPoligono: boolean;
}

/** Un barrio nombrado por un boletín, con la frase que lo respalda. */
export interface MencionBarrio {
  barrio: string;
  cita: string;
  sinPoligono: boolean;
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

/** Un nombre buscable en el texto y los barrios can\u00f3nicos a los que resuelve. */
interface PatronDeBarrio {
  texto: string;        // ya normalizado
  canonicos: string[];
  sinPoligono: boolean;
}

/**
 * \u00cdndice de b\u00fasqueda: nombre del GeoJSON + alias de Acuacar + barrios sin pol\u00edgono.
 * Se memoiza por lista de barrios porque `extraerBarriosDeTexto` se llama una vez por
 * bolet\u00edn y reconstruirlo cada vez recorrer\u00eda los ~211 nombres y los ~100 alias de m\u00e1s.
 */
const cachePatrones = new WeakMap<string[], PatronDeBarrio[]>();

function construirPatrones(barrios: string[]): PatronDeBarrio[] {
  const memoizado = cachePatrones.get(barrios);
  if (memoizado) return memoizado;

  const porTexto = new Map<string, PatronDeBarrio>();
  const agregar = (nombre: string, canonicos: string[], sinPoligono: boolean) => {
    const texto = normalizar(nombre);
    if (!texto) return;
    const existente = porTexto.get(texto);
    if (existente) {
      for (const canonico of canonicos) {
        if (!existente.canonicos.includes(canonico)) existente.canonicos.push(canonico);
      }
      return;
    }
    porTexto.set(texto, { texto, canonicos: [...canonicos], sinPoligono });
  };

  const universo = new Set(barrios);
  for (const barrio of barrios) agregar(barrio, [barrio], false);

  // El nombre propio de un barrio manda sobre cualquier alias o extra que se normalice igual:
  // sin esto, "Nuevo Chile" de BARRIOS_SIN_POLIGONO se sumaba al "NUEVO CHILE" del GeoJSON y
  // el mismo sitio sal\u00eda dos veces con distinta graf\u00eda.
  const yaEsBarrio = (nombre: string) => porTexto.has(normalizar(nombre));

  // Los alias solo valen para pol\u00edgonos que existan en la lista recibida: si se llama con la
  // lista corta de respaldo, un alias a `OLAYA ST. STELLA` no debe inventar ese barrio.
  for (const [alias, canonicos] of Object.entries(ALIAS_DE_BARRIO)) {
    if (yaEsBarrio(alias)) continue;
    const presentes = canonicos.filter((canonico) => universo.has(canonico));
    if (presentes.length > 0) agregar(alias, presentes, false);
  }

  for (const nombre of BARRIOS_SIN_POLIGONO) {
    if (yaEsBarrio(nombre)) continue;
    agregar(nombre, [nombre], true);
  }

  // Los nombres m\u00e1s largos ganan: as\u00ed "NUEVO CHILE" se lleva el tramo antes de que "CHILE"
  // pueda reclamarlo, y "SAN PEDRO MARTIR" antes que "SAN PEDRO".
  const patrones = [...porTexto.values()].sort((a, b) => b.texto.length - a.texto.length);
  cachePatrones.set(barrios, patrones);
  return patrones;
}

/** Un match solo cuenta si no est\u00e1 pegado a otra letra o d\u00edgito. Sin esto "ANITA" sal\u00eda de
 *  "alcantarillado s-ANITA-rio" y pintaba ese barrio con un corte que nadie anunci\u00f3 \u2014 el caso
 *  que m\u00e1s falsos positivos met\u00eda al mapa (boletines #2852, #2844, #2837, #2835). */
function esPalabraCompleta(texto: string, desde: number, hasta: number): boolean {
  const anterior = desde > 0 ? texto[desde - 1] : '';
  const siguiente = hasta < texto.length ? texto[hasta] : '';
  return !/[a-z0-9]/.test(anterior) && !/[a-z0-9]/.test(siguiente);
}

/**
 * Como `normalizar`, pero devolviendo adem\u00e1s a qu\u00e9 car\u00e1cter del texto original corresponde
 * cada car\u00e1cter del normalizado. Hace falta para citar la frase exacta: quitar los
 * diacr\u00edticos cambia la longitud ("Pey\u00e9" \u2192 "peye"), as\u00ed que un \u00edndice del normalizado no
 * sirve tal cual sobre el original y la cita saldr\u00eda corrida.
 */
function normalizarConMapa(texto: string): { normalizado: string; indices: number[] } {
  let normalizado = '';
  const indices: number[] = [];
  for (let i = 0; i < texto.length; i++) {
    const limpio = texto[i].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const caracter of limpio) {
      normalizado += caracter;
      indices.push(i);
    }
  }
  return { normalizado, indices };
}

/** Frase del texto original que contiene la posici\u00f3n dada, recortada para mostrarse. */
function citaEnPosicion(textoOriginal: string, posicion: number): string {
  const inicio = textoOriginal.lastIndexOf('.', posicion) + 1;
  let fin = textoOriginal.indexOf('.', posicion);
  if (fin === -1) fin = textoOriginal.length - 1;
  const frase = textoOriginal.slice(inicio, fin + 1).replace(/\s+/g, ' ').trim();
  return frase.length > 320 ? `${frase.slice(0, 317)}\u2026` : frase;
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
      const menciones = extraerMencionesDeTexto(contenidoTexto, barriosConocidos);

      return {
        id: post.id,
        numero: numeroMatch ? `#${numeroMatch[1]}` : `#${post.id}`,
        fecha: post.date || new Date().toISOString(),
        titulo,
        contenidoHTML,
        contenidoTexto,
        menciones,
        barriosAfectados: menciones.map((mencion) => mencion.barrio),
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
export function extraerMencionesDeTexto(
  texto: string,
  barrios: string[] = BARRIOS_CONOCIDOS,
): MencionBarrio[] {
  const { normalizado, indices } = normalizarConMapa(texto);
  const patrones = construirPatrones(barrios);
  const cubierto = new Array(normalizado.length).fill(false);
  const encontrados = new Map<string, MencionBarrio>();

  for (const patron of patrones) {
    let desde = 0;
    let idx: number;
    while ((idx = normalizado.indexOf(patron.texto, desde)) !== -1) {
      const fin = idx + patron.texto.length;
      const libre = !cubierto.slice(idx, fin).some(Boolean);

      if (libre && esPalabraCompleta(normalizado, idx, fin)) {
        const cita = citaEnPosicion(texto, indices[idx] ?? 0);
        for (const canonico of patron.canonicos) {
          if (!encontrados.has(canonico)) {
            encontrados.set(canonico, { barrio: canonico, cita, sinPoligono: patron.sinPoligono });
          }
        }
        for (let i = idx; i < fin; i++) cubierto[i] = true;
      }
      desde = idx + 1;
    }
  }

  // Orden estable: primero los del GeoJSON en su propio orden, después los que no tienen
  // polígono. Así la lista no baila según dónde caiga cada nombre en el texto.
  const conPoligono = barrios.filter((barrio) => encontrados.has(barrio));
  const sinPoligono = [...encontrados.keys()].filter((nombre) => !conPoligono.includes(nombre));
  return [...conPoligono, ...sinPoligono].map((nombre) => encontrados.get(nombre)!);
}

/** Igual que `extraerMencionesDeTexto`, pero solo con los nombres. */
export function extraerBarriosDeTexto(texto: string, barrios: string[] = BARRIOS_CONOCIDOS): string[] {
  return extraerMencionesDeTexto(texto, barrios).map((mencion) => mencion.barrio);
}

/**
 * Clasifica el tipo de afectación a partir del título del boletín. Función pura y expuesta
 * aparte para que la misma regla se aplique tanto a lotes (determinarEstadoBarrios) como a
 * un boletín suelto en pantallas que lo necesiten (p.ej. la bitácora).
 */
export function determinarEstadoBoletin(titulo: string): EstadoServicioBoletin | null {
  // Solo el título, no el cuerpo. Probado contra los 20 boletines más recientes: clasificar
  // por el cuerpo da 21/21 mal porque un boletín largo termina conteniendo todas las palabras
  // —el de la avería del 9-ago decía "restablecer" al explicar el plan y quedaba clasificado
  // como CON_SERVICIO para 126 barrios en plena rotación—. El título sí declara la intención.
  const tituloNorm = normalizar(titulo);
  const alguna = (...claves: string[]) => claves.some((clave) => tituloNorm.includes(clave));

  // El orden importa: "CULMINA LA REPARACIÓN" es un cierre, no un trabajo en curso, así que
  // el cierre se evalúa antes que las palabras de obra. `fortalecio` va en pasado a propósito:
  // "PARA FORTALECER" (#2838) es trabajo por venir, no trabajo terminado.
  if (alguna('restablec', 'normaliz', 'culmin', 'finaliz', 'concluy', 'fortalecio', 'recupera')) {
    return 'CON_SERVICIO';
  }

  if (alguna('interrupcion', 'suspension', 'suspende', 'sin servicio', 'sin agua',
             'averia', 'emergencia', 'falla')) {
    return 'SIN_SERVICIO';
  }

  if (alguna('mantenimiento', 'rotacion de sectores', 'intervencion', 'rehabilitacion',
             'renovacion de redes', 'obras', 'trabajos', 'reparacion', 'avance')) {
    return 'CORTE_PROGRAMADO';
  }

  // `null` y no `CORTE_PROGRAMADO`: antes este era el caso por defecto, así que cualquier
  // boletín institucional —un premio, la calidad del agua, un programa ambiental para
  // niños— marcaba con corte programado a todo barrio que apareciera nombrado de paso.
  // Un corte inventado destruye la credibilidad del mapa (CLAUDE.md §Ética de datos, regla 4):
  // si el boletín no habla del servicio, no dice nada de ningún barrio.
  return null;
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
    if (boletin.menciones.length === 0) continue;

    const estado = determinarEstadoBoletin(boletin.titulo);
    // El boletín no reporta nada del servicio: los barrios que nombre son de paso.
    if (estado === null) continue;

    const fechaBoletin = new Date(boletin.fecha).getTime();
    const horasTranscurridas = (ahora - fechaBoletin) / (1000 * 60 * 60);
    const esVigente = horasTranscurridas <= HORAS_VIGENCIA;

    for (const mencion of boletin.menciones) {
      // Solo agregar si no existe ya uno más reciente
      if (!mapaEstados.has(mencion.barrio)) {
        mapaEstados.set(mencion.barrio, {
          nombre: mencion.barrio,
          estado,
          fuente: boletin.numero,
          fechaBoletin: boletin.fecha,
          esVigente,
          cita: mencion.cita,
          sinPoligono: mencion.sinPoligono,
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
