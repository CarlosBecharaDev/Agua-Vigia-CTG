/**
 * clima.ts — Servicio de clima en tiempo real para Cartagena de Indias.
 *
 * Fuente: Open-Meteo (https://open-meteo.com)
 *  - Gratis, sin API key
 *  - CORS habilitado (se puede llamar directo desde el browser)
 *  - Coordenadas de Cartagena: 10.3910, -75.5364
 */

export interface ClimaCartagena {
  temperatura: number;        // °C
  humedad: number;            // %
  precipitacion: number;      // mm
  codigoClima: number;        // WMO weather code
  descripcion: string;        // Texto legible
  icono: string;              // Emoji representativo
  horaActualizacion: string;  // ISO string
}

/** Mapeo de códigos WMO a descripción e ícono */
function interpretarCodigoClima(code: number): { descripcion: string; icono: string } {
  if (code === 0) return { descripcion: 'Despejado', icono: '☀️' };
  if (code <= 3)  return { descripcion: 'Parcialmente nublado', icono: '⛅' };
  if (code === 45 || code === 48) return { descripcion: 'Neblina', icono: '🌫️' };
  if (code >= 51 && code <= 55) return { descripcion: 'Llovizna', icono: '🌦️' };
  if (code >= 56 && code <= 57) return { descripcion: 'Llovizna helada', icono: '🌧️' };
  if (code >= 61 && code <= 65) return { descripcion: 'Lluvia', icono: '🌧️' };
  if (code >= 66 && code <= 67) return { descripcion: 'Lluvia helada', icono: '🌧️' };
  if (code >= 71 && code <= 77) return { descripcion: 'Nieve', icono: '❄️' };
  if (code >= 80 && code <= 82) return { descripcion: 'Aguacero', icono: '🌧️' };
  if (code >= 95 && code <= 99) return { descripcion: 'Tormenta eléctrica', icono: '⛈️' };
  return { descripcion: 'Variable', icono: '🌤️' };
}

/**
 * Obtiene las condiciones climáticas actuales de Cartagena.
 * Llama directamente a Open-Meteo (API pública con CORS habilitado).
 */
export async function obtenerClimaActual(): Promise<ClimaCartagena> {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=10.3910'
      + '&longitude=-75.5364'
      + '&current=temperature_2m,relative_humidity_2m,precipitation,weather_code'
      + '&timezone=America/Bogota';

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`);

    const data = await res.json();
    const current = data.current;

    const { descripcion, icono } = interpretarCodigoClima(current.weather_code);

    return {
      temperatura: Math.round(current.temperature_2m * 10) / 10,
      humedad: current.relative_humidity_2m,
      precipitacion: current.precipitation,
      codigoClima: current.weather_code,
      descripcion,
      icono,
      horaActualizacion: current.time
        ? new Date(current.time).toISOString()
        : new Date().toISOString(),
    };
  } catch (error) {
    console.warn('No se pudo obtener el clima de Cartagena:', error);
    return {
      temperatura: 28,
      humedad: 78,
      precipitacion: 0,
      codigoClima: -1,
      descripcion: 'Sin datos',
      icono: '🌡️',
      horaActualizacion: new Date().toISOString(),
    };
  }
}
