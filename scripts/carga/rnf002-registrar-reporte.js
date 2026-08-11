/**
 * RNF002 — "confirmar un reporte ciudadano en menos de 1 segundo".
 *
 * estado-del-backend.md #6.1: el camino de POST /api/reportes ya está optimizado (índice
 * compuesto, cupo por INCR en Redis, notificaciones y SSE fuera del hilo HTTP — ver
 * SectorController.onSectorActualizado), pero "optimizado" no es "medido". Este script mide.
 *
 * Uso:
 *   1. Levantar el stack:      docker compose up -d --wait
 *   2. Instalar k6:            https://k6.io/docs/get-started/installation/
 *   3. Correr la prueba:       k6 run scripts/carga/rnf002-registrar-reporte.js
 *      Contra otro host/puerto: k6 run -e BASE_URL=http://localhost:8099 scripts/carga/rnf002-registrar-reporte.js
 *
 * Por qué 20 solicitudes/minuto y no más:
 *   `aguavigia.rate-limit.reglas` (application.yml) limita `/api/reportes/**` a 30 solicitudes por
 *   IP cada 60s (ADR-018) — el mismo límite que protege el endpoint en producción. k6 golpea desde
 *   una sola IP, así que una tasa más alta mide el 429 del limitador, no la latencia de RNF002. Para
 *   medir con más carga concurrente, sube temporalmente ese límite (o vacíalo) en el entorno de
 *   prueba — nunca en producción — y ajusta `rate` aquí.
 *
 * Por qué la huella es única por solicitud:
 *   RF006 limita reportes por dispositivo (huella) y sector en una ventana de 30 min. Una huella
 *   fija haría que la mayoría de las solicitudes fallaran con 429 por cupo agotado, no por
 *   latencia — y un k6 real simula vecinos distintos, no el mismo dispositivo insistiendo.
 */
import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081';
const TIPOS = ['SIN_AGUA', 'PRESION_BAJA', 'SERVICIO_RESTABLECIDO'];

export const options = {
    scenarios: {
        reportar_ciudadano: {
            executor: 'constant-arrival-rate',
            rate: 20,
            timeUnit: '1m',
            duration: '2m',
            preAllocatedVUs: 10,
            maxVUs: 30,
        },
    },
    thresholds: {
        // RNF002: el 95% de las confirmaciones, por debajo de 1 segundo.
        'http_req_duration{expected_response:true}': ['p(95)<1000'],
        http_req_failed: ['rate<0.01'],
    },
};

export function setup() {
    const respuesta = http.get(`${BASE_URL}/api/sectores`);
    if (respuesta.status !== 200) {
        throw new Error(`No se pudo obtener /api/sectores (status ${respuesta.status}) — ¿está el backend arriba?`);
    }

    const sectores = JSON.parse(respuesta.body).sectores.map((s) => s.id);
    if (sectores.length === 0) {
        throw new Error(
            'El backend no tiene sectores sembrados. Corre scripts/sembrar-sectores.mjs antes de esta prueba.');
    }

    return { sectores };
}

export default function (data) {
    const sectorId = data.sectores[Math.floor(Math.random() * data.sectores.length)];
    const tipo = TIPOS[Math.floor(Math.random() * TIPOS.length)];
    // Un "vecino" simulado distinto por solicitud — ver comentario de cabecera sobre RF006.
    const huella = `k6-${__VU}-${__ITER}-${Date.now()}`;

    const payload = JSON.stringify({ sectorId, tipo, huella });
    const params = { headers: { 'Content-Type': 'application/json' } };

    const respuesta = http.post(`${BASE_URL}/api/reportes`, payload, params);

    check(respuesta, {
        'respondió 201 (registrado)': (r) => r.status === 201,
    });
}
