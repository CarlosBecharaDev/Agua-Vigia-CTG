# Integración frontend-backend

El frontend consume siempre la API real del backend en `/api` — no hay modo simulación.
En desarrollo, Vite hace de proxy hacia el backend local (ver `vite.config.ts`); en
producción, Nginx lo hace bajo el mismo origen (ver `nginx.conf`).

## Arrancar contra un backend local

1. Levantar el backend (`cd backend && ./mvnw spring-boot:run`, o `docker-compose up`).
2. Copiar `.env.example` a `.env.local` si necesitas cambiar el puerto del backend
   (`VITE_BACKEND_PROXY_TARGET`, por defecto `http://localhost:8080`).
3. `npm run dev` — las llamadas a `/api/*` se redirigen automáticamente al backend.

## Endpoints que consume el frontend

- `GET /api/sectores` + `GET /api/sectores/stream` (SSE) — mapa en vivo (M1).
- `GET /api/sectores/{id}` — detalle de un sector (`/sectores/:id`, destino del enlace "ver mi
  sector" del correo de cambio de estado — `MailNotificacionAdapter`).
- `POST /api/reportes` — reportes ciudadanos (M2).
- `POST /api/reportes/{id}/foto` — adjuntar evidencia fotográfica a un reporte propio (M10).
- `POST /api/reportes/{id}/confirmar` — confirmar el reporte de otro vecino (M11, RF038), vía el
  enlace compartido `/confirmar/:id` (no hay listado público de reportes por sector, así que el
  único id de reporte que un vecino puede confirmar es el que otro le compartió a propósito).
- `POST /api/suscripciones` — avisos por correo (M3/M4).
- `GET /api/suscripciones/confirmar` y `/cancelar` — el enlace de correo vive en el backend, no en
  el frontend: responde HTML o JSON según el `Accept` de quien pide (ADR-030), el frontend no llama
  a esta ruta directamente.
- `POST /api/veedor/sesion`, `GET/PATCH /api/veedor/reportes/*`, `GET/POST/PATCH /api/veedor/cortes/*`,
  `GET /api/veedor/cortes/{id}` (detalle de un corte, expandible en el panel) — panel del veedor (M4/M5).
- `GET /api/estadisticas` + `GET /api/estadisticas/exportar.csv` — estadísticas públicas y su
  exportación (M7, RF025).
- `GET /api/bitacora` — bitácora pública (M8).
- `GET /api/cumplimiento` (global), `/sectores/{id}` (por sector, en el panel de detalle del mapa),
  `/cortes/{id}` (por corte, expandible en el panel del veedor), `/serie` y `/serie.csv` — índice de
  cumplimiento (M6).
- `GET/PATCH /api/veedor/ingesta/propuestas/*`, `GET /api/veedor/ingesta/salud` — cola de revisión
  de la ingesta automatizada (M9, ADR-028).

**Deliberadamente sin conectar** (son para otros consumidores, no para esta SPA):
`POST /api/iot/presion` (sensores externos empujando telemetría) y `GET /api/v2/requests.json`
(Open311, formato estándar para sistemas cívicos de terceros).

Antes de cambiar un contrato, regenerar los tipos con `npm run api:sync` (lee
`backend/openapi.yaml`) y correr `npm run api:check` en CI para detectar el desfase.
