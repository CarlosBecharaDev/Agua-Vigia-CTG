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
- `POST /api/reportes` — reportes ciudadanos (M2).
- `POST /api/suscripciones` — avisos por correo (M3).
- `POST /api/veedor/sesion`, `GET/PATCH /api/veedor/reportes/*`, `GET/POST/PATCH /api/veedor/cortes/*` — panel del veedor (M4/M5).
- `GET /api/estadisticas` — estadísticas públicas (M7).
- `GET /api/bitacora` — bitácora pública (M8).
- `GET /api/cumplimiento/*` — índice de cumplimiento (M6).

Antes de cambiar un contrato, regenerar los tipos con `npm run api:sync` (lee
`backend/openapi.yaml`) y correr `npm run api:check` en CI para detectar el desfase.
