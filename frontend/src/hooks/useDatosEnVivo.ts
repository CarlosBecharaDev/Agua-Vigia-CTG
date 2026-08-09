/**
 * useDatosEnVivo.ts — Hook central que orquesta TODAS las fuentes de datos reales.
 *
 * Combina:
 *  1. Acuacar WordPress API → boletines oficiales → estado de barrios
 *  2. Open-Meteo → clima en tiempo real
 *  3. Google News RSS → noticias relevantes
 *
 * Expone un estado unificado que las páginas consumen directamente.
 * Si una fuente falla, esa parte del estado queda vacía — nunca se inventa un valor
 * de respaldo (ética de datos, CLAUDE.md: "nada llega al mapa público sin verificación").
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Sector, EstadoServicio } from '../types/tipos-dominio';
import { obtenerBoletinesRecientes, determinarEstadoBarrios } from '../api/acuacar';
import type { BoletinAcuacar, EstadoBarrioAcuacar } from '../api/acuacar';
import { obtenerClimaActual } from '../api/clima';
import type { ClimaCartagena } from '../api/clima';
import { obtenerNoticiasAgua } from '../api/noticias';
import type { NoticiaAgua } from '../api/noticias';
import { AguaVigiaAPI } from '../api/services';

/** Intervalo de actualización automática (5 minutos) */
const INTERVALO_ACTUALIZACION_MS = 5 * 60 * 1000;

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

  const [sectores, setSectores] = useState<Sector[]>([]);
  const [boletines, setBoletines] = useState<BoletinAcuacar[]>([]);
  const [estadoBarrios, setEstadoBarrios] = useState<EstadoBarrioAcuacar[]>([]);
  const [clima, setClima] = useState<ClimaCartagena | null>(null);
  const [noticias, setNoticias] = useState<NoticiaAgua[]>([]);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);

  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Convierte los estados de barrios (de los boletines de Acuacar)
   * y los combina con la lista real de sectores del backend (C2).
   */
  const combinarSectoresConAcuacar = useCallback((sectoresBackend: Sector[], estadosAcuacar: EstadoBarrioAcuacar[]): Sector[] => {
    // Crear un mapa de barrios afectados (el más reciente gana)
    const mapaEstados = new Map<string, EstadoBarrioAcuacar>();
    estadosAcuacar.forEach(e => {
      const existente = mapaEstados.get(e.nombre);
      if (!existente || new Date(e.fechaBoletin) > new Date(existente.fechaBoletin)) {
        mapaEstados.set(e.nombre, e);
      }
    });

    return sectoresBackend.map(sector => {
      const estadoAcuacar = mapaEstados.get(sector.nombre);
      if (estadoAcuacar) {
        return {
          ...sector,
          estado: estadoAcuacar.esVigente ? (estadoAcuacar.estado as EstadoServicio) : 'CON_SERVICIO',
          actualizadoEn: estadoAcuacar.fechaBoletin,
        };
      }
      // Si el sector no tiene datos en Acuacar, mantiene su estado del backend (que es null por defecto)
      return sector;
    });
  }, []);

  /**
   * Carga TODAS las fuentes de datos en paralelo.
   */
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      // Lanzar las peticiones en paralelo (ahora incluyendo el backend real para los 211 sectores)
      const [sectoresRes, boletinesRes, climaRes, noticiasRes] = await Promise.allSettled([
        AguaVigiaAPI.obtenerSectores(),
        obtenerBoletinesRecientes(20),
        obtenerClimaActual(),
        obtenerNoticiasAgua(),
      ]);

      let sectoresBackend: Sector[] = [];
      if (sectoresRes.status === 'fulfilled') {
        // La API devuelve { sectores, generadoEn }
        sectoresBackend = sectoresRes.value.sectores || [];
      }

      const boletinesDisponibles = boletinesRes.status === 'fulfilled' && boletinesRes.value.length > 0;
      const sectoresDisponibles = sectoresBackend.length > 0;

      // Promise.allSettled no entra al catch cuando una fuente falla. Dejamos
      // constancia del estado para que la interfaz pueda mostrar el fallback
      // sin confundirlo con datos oficiales.
      setError(!sectoresDisponibles && !boletinesDisponibles
        ? 'No hay conexion con las fuentes oficiales.'
        : null);

      // Procesar boletines de Acuacar
      if (boletinesDisponibles) {
        const bols = boletinesRes.value;
        setBoletines(bols);

        const estados = determinarEstadoBarrios(bols);
        setEstadoBarrios(estados);

        if (sectoresDisponibles) {
          setSectores(combinarSectoresConAcuacar(sectoresBackend, estados));
        }
        setUsandoDatosReales(sectoresDisponibles || boletinesDisponibles);
      } else if (sectoresBackend.length > 0) {
        // Si no hay datos de Acuacar, igual mostramos los sectores del backend
        setSectores(sectoresBackend);
        setUsandoDatosReales(true);
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
      console.warn('Error cargando datos en vivo:', err);
      setError('No pudimos conectar con las fuentes de datos.');
      setSectores([]);
      setUsandoDatosReales(false);
    } finally {
      setCargando(false);
    }
  }, [combinarSectoresConAcuacar]);

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
    totalReportesMes: boletines.length,
    barriosAfectados: sectoresConCorte.length,
    sectoresConCorte,
    recargar: cargarDatos,
  };
}
