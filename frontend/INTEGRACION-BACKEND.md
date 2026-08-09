# Integración con el backend

El navegador consume exclusivamente rutas del mismo origen bajo `/api`.

- Desarrollo: Vite reenvía `/api` a `VITE_BACKEND_PROXY_TARGET` o `http://localhost:8080`.
- Docker: Nginx reenvía `/api` al servicio `backend:8080`.
- Contrato: `npm run api:sync` genera `src/api/generated/schema.ts` desde `backend/openapi.yaml`.
- CI: `npm run api:check` falla si el cliente generado quedó desactualizado.

Las pantallas sin endpoint OpenAPI se presentan como no disponibles y no envían solicitudes.
