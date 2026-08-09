# Integracion frontend-backend

El frontend mantiene `VITE_FRONTEND_MODE=simulation` por defecto. Esto permite continuar
con la interfaz mientras D2/D3 implementan y verifican los casos de uso del backend.

## Cuando el backend este listo

1. Copiar `.env.example` a `.env.local`.
2. Configurar `VITE_API_URL` con el origen de Spring Boot.
3. Cambiar `VITE_FRONTEND_MODE=api`.
4. Validar cada endpoint contra `backend/openapi.yaml`.
5. Ejecutar `npm run build` y `npm test -- --run` antes de retirar un fallback.

El cliente ya apunta al login publicado por backend:

`POST /api/veedor/sesion` con `{ "clave": "..." }` y respuesta `{ "token": "..." }`.

Pendientes de backend que el frontend espera consumir:

- `POST /api/reportes` para el formulario ciudadano.
- Endpoints de reportes pendientes, moderacion y cortes oficiales para el panel del veedor.
- Endpoints reales de estadisticas y bitacora.
