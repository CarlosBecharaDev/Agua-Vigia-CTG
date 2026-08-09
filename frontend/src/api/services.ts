import { apiClient } from './client';

export interface Sector {
  id: string;
  nombre: string;
  cortes?: number;
}

export interface ReportePendiente {
  id: number;
  barrio: string;
  problema: string;
  tiempo: string;
  color?: string;
}

export interface KPIEstadisticas {
  totalReportesMes: number;
  tiempoPromedioCorte: string;
  barriosAfectadosHoy: string | number;
}

export const AguaVigiaAPI = {
  // --- CIUDADANOS ---
  enviarReporte: async (datos: { sectorId: string, tipo: string, comentario?: string, ubicacionGPS?: boolean }) => {
    const response = await apiClient.post('/reportes', datos);
    return response.data;
  },

  // --- ESTADÍSTICAS ---
  obtenerKPIs: async (): Promise<KPIEstadisticas> => {
    const response = await apiClient.get('/estadisticas/kpis');
    return response.data;
  },
  
  obtenerDatosCumplimiento: async (periodo: string) => {
    const response = await apiClient.get(`/estadisticas/cumplimiento?periodo=${periodo}`);
    return response.data;
  },
  
  obtenerSectoresAfectados: async () => {
    const response = await apiClient.get('/estadisticas/sectores-afectados');
    return response.data;
  },

  // --- VEEDOR ---
  loginVeedor: async (password: string) => {
    const response = await apiClient.post('/auth/veedor', { password });
    if (response.data.token) {
      localStorage.setItem('token_veedor', response.data.token);
    }
    return response.data;
  },
  
  obtenerReportesPendientes: async (): Promise<ReportePendiente[]> => {
    const response = await apiClient.get('/veedor/reportes-pendientes');
    return response.data;
  },

  procesarReporte: async (id: number, accion: 'aprobar' | 'rechazar') => {
    const response = await apiClient.post(`/veedor/reportes/${id}/${accion}`);
    return response.data;
  },

  registrarCorteOficial: async (datos: { sectorId: string, tipo: string, mensaje?: string }) => {
    const response = await apiClient.post('/veedor/cortes-oficiales', datos);
    return response.data;
  }
};
