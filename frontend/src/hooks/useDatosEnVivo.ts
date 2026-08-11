/**
 * useDatosEnVivo.ts — Hook central que orquesta TODAS las fuentes de datos reales.
 *
 * Combina:
 *  1. Acuacar WordPress API → boletines oficiales → estado de barrios
 *  2. Open-Meteo → clima en tiempo real
 *  3. Google News RSS → noticias relevantes
 *
 * Expone un estado unificado que las páginas consumen directamente.
 * Si CUALQUIER API falla, se usan los datos mock como fallback
 * para que la app nunca se vea vacía.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Sector, EstadoServicio } from '../types/tipos-dominio';
import { obtenerBoletinesRecientes, determinarEstadoBarrios } from '../api/acuacar';
import type { BoletinAcuacar, EstadoBarrioAcuacar } from '../api/acuacar';
import { obtenerClimaActual } from '../api/clima';
import type { ClimaCartagena } from '../api/clima';
import { obtenerNoticiasAgua } from '../api/noticias';
import type { NoticiaAgua } from '../api/noticias';
import { obtenerBarriosCartagena } from '../data/barriosCartagena';

// ──────────────────────────────────────────────────────────────
// DATOS MOCK de respaldo — idénticos a los que venían en PaginaMapa.tsx
// Se usan SOLO si la API de Acuacar no responde.
// ──────────────────────────────────────────────────────────────
const SECTORES_MOCK: Sector[] = [
  { id: '1', nombre: 'BOCAGRANDE',         estado: 'CON_SERVICIO',     actualizadoEn: new Date(Date.now() - 5 * 60_000).toISOString() },
  { id: '2', nombre: 'CASTILLOGRANDE',     estado: 'SIN_SERVICIO',     actualizadoEn: new Date(Date.now() - 2 * 60_000).toISOString() },
  { id: '3', nombre: 'EL LAGUITO',         estado: 'PRESION_BAJA',     actualizadoEn: new Date(Date.now() - 8 * 60_000).toISOString() },
  { id: '4', nombre: 'MANGA',              estado: 'CORTE_PROGRAMADO', actualizadoEn: new Date(Date.now() - 1 * 60_000).toISOString() },
  { id: '5', nombre: 'PIE DE LA POPA',     estado: 'CON_SERVICIO',     actualizadoEn: new Date(Date.now() - 12 * 60_000).toISOString() },
  { id: '6', nombre: 'OLAYA HERRERA',      estado: 'SIN_SERVICIO',     actualizadoEn: new Date(Date.now() - 3 * 60_000).toISOString() },
  { id: '7', nombre: 'GETSEMANI',          estado: 'CON_SERVICIO',     actualizadoEn: new Date(Date.now() - 6 * 60_000).toISOString() },
  { id: '8', nombre: 'EL CENTRO',          estado: 'PRESION_BAJA',     actualizadoEn: new Date(Date.now() - 20 * 60_000).toISOString() },
  { id: '9', nombre: 'LA BOQUILLA',        estado: 'CON_SERVICIO',     actualizadoEn: new Date(Date.now() - 4 * 60_000).toISOString() },
  { id: '10', nombre: 'TORICES',           estado: 'CON_SERVICIO',     actualizadoEn: new Date(Date.now() - 15 * 60_000).toISOString() },
];

/** Intervalo de actualización automática (5 minutos) */
const INTERVALO_ACTUALIZACION_MS = 5 * 60 * 1000;

// Red de seguridad si el GeoJSON de barrios (D5) no llega a cargar: una lista corta en vez
// del universo completo de ~211 barrios. Con el GeoJSON disponible, obtenerBarriosCartagena()
// la reemplaza siempre por la lista real — ver cargarDatos más abajo.
const BARRIOS_PRINCIPALES_RESPALDO = [
  'BOCAGRANDE', 'CASTILLOGRANDE', 'EL LAGUITO', 'MANGA',
  'PIE DE LA POPA', 'GETSEMANI', 'EL CENTRO', 'LA BOQUILLA',
  'TORICES', 'CRESPO', 'SAN DIEGO', 'DANIEL LEMAITRE',
  'OLAYA HERRERA', 'NELSON MANDELA', 'EL SOCORRO',
  'ZARAGOCILLA', 'NUEVO BOSQUE', 'TERNERA', 'PASACABALLOS'
];

export interface DatosEnVivo {
  // Estado general
  cargando: boolean;
  error: string | null;
  usandoDatosReales: boolean;

  // Sectores/Barrios con estado del agua
  sectores: Sector[];
  ultimaActualizacion: string | null;

  // Boletines oficiales de Acuacar
  boletines: BoletinAcuacar[];
  estadoBarrios: EstadoBarrioAcuacar[];

  // Clima actual
  clima: ClimaCartagena | null;

  // Noticias
  noticias: NoticiaAgua[];

  // Estadísticas derivadas
  totalReportesMes: number;
  barriosAfectados: number;
  sectoresConCorte: Sector[];

  // Acciones
  recargar: () => void;
}

/**
 * Hook principal: orquesta todas las fuentes de datos.
 * Lo usa cualquier página que necesite datos en vivo.
 */
export function useDatosEnVivo(): DatosEnVivo {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usandoDatosReales, setUsandoDatosReales] = useState(false);

  const [sectores, setSectores] = useState<Sector[]>(SECTORES_MOCK);
  const [boletines, setBoletines] = useState<BoletinAcuacar[]>([]);
  const [estadoBarrios, setEstadoBarrios] = useState<EstadoBarrioAcuacar[]>([]);
  const [clima, setClima] = useState<ClimaCartagena | null>(null);
  const [noticias, setNoticias] = useState<NoticiaAgua[]>([]);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);

  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Convierte los estados de barrios (de los boletines de Acuacar)
   * al formato Sector[] que el mapa y la lista entienden.
   */
  const convertirAEstadoSectores = useCallback((estados: EstadoBarrioAcuacar[], barriosCartagena: string[]): Sector[] => {
    // Crear un mapa de barrios afectados (el más reciente gana)
    const mapaEstados = new Map<string, EstadoBarrioAcuacar>();
    estados.forEach(e => {
      const existente = mapaEstados.get(e.nombre);
      if (!existente || new Date(e.fechaBoletin) > new Date(existente.fechaBoletin)) {
        mapaEstados.set(e.nombre, e);
      }
    });

    // Convertir a Sector[]
    const sectoresReales: Sector[] = [];
    let idCounter = 1;

    mapaEstados.forEach((estado, nombre) => {
      const estadoServicio: EstadoServicio = estado.esVigente
        ? estado.estado as EstadoServicio
        : 'CON_SERVICIO'; // Si el boletín ya no es vigente, se asume restablecido

      sectoresReales.push({
        id: String(idCounter++),
        nombre,
        estado: estadoServicio,
        actualizadoEn: estado.fechaBoletin,
      });
    });

    // Agregar TODOS los barrios reales de Cartagena que no aparecen en ningún boletín vigente
    // (con servicio normal) — antes solo se completaba con 19 barrios fijos, así que el
    // buscador y el mapa se quedaban sin datos reales para el resto de los ~211 del GeoJSON
    // y el clic caía en el sector sintético de MapaCartagena (ver onEachFeature ahí).
    const nombresAfectados = new Set(sectoresReales.map(s => s.nombre));

    barriosCartagena.forEach(nombre => {
      if (!nombresAfectados.has(nombre)) {
        sectoresReales.push({
          id: String(idCounter++),
          nombre,
          estado: 'CON_SERVICIO',
          actualizadoEn: new Date().toISOString(),
        });
      }
    });

    return sectoresReales;
  }, []);

  /**
   * Carga TODAS las fuentes de datos en paralelo.
   */
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      // El universo de barrios se necesita antes de pedir los boletines (para que la
      // extracción de nombres reconozca los ~211 reales, no solo los 55 de respaldo) — por
      // eso va aparte y no dentro del Promise.allSettled de abajo.
      const barriosCartagena = await obtenerBarriosCartagena().catch(() => BARRIOS_PRINCIPALES_RESPALDO);

      const [boletinesRes, climaRes, noticiasRes] = await Promise.allSettled([
        obtenerBoletinesRecientes(20, barriosCartagena),
        obtenerClimaActual(),
        obtenerNoticiasAgua(),
      ]);

      // Procesar boletines de Acuacar
      if (boletinesRes.status === 'fulfilled' && boletinesRes.value.length > 0) {
        const bols = boletinesRes.value;
        setBoletines(bols);

        const estados = determinarEstadoBarrios(bols);
        setEstadoBarrios(estados);

        const sectoresReales = convertirAEstadoSectores(estados, barriosCartagena);
        if (sectoresReales.length > 0) {
          setSectores(sectoresReales);
          setUsandoDatosReales(true);
        }
      }

      // Procesar clima
      if (climaRes.status === 'fulfilled') {
        setClima(climaRes.value);
      }

      // Procesar noticias
      if (noticiasRes.status === 'fulfilled') {
        setNoticias(noticiasRes.value);
      }

      setUltimaActualizacion(new Date().toISOString());
    } catch (err) {
      console.warn('Error cargando datos en vivo, usando fallback:', err);
      setError('No pudimos conectar con las fuentes de datos. Mostrando datos de demostración.');
      setSectores(SECTORES_MOCK);
      setUsandoDatosReales(false);
    } finally {
      setCargando(false);
    }
  }, [convertirAEstadoSectores]);

  // Cargar datos al montar y configurar auto-refresh
  useEffect(() => {
    cargarDatos();

    intervaloRef.current = setInterval(cargarDatos, INTERVALO_ACTUALIZACION_MS);

    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [cargarDatos]);

  // Estadísticas derivadas
  const sectoresConCorte = sectores.filter(
    s => s.estado === 'SIN_SERVICIO' || s.estado === 'CORTE_PROGRAMADO'
  );

  return {
    cargando,
    error,
    usandoDatosReales,
    sectores,
    ultimaActualizacion,
    boletines,
    estadoBarrios,
    clima,
    noticias,
    totalReportesMes: boletines.length > 0 ? boletines.length : 15,
    barriosAfectados: sectoresConCorte.length,
    sectoresConCorte,
    recargar: cargarDatos,
  };
}
