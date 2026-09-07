## Why

La interfaz actual conserva los flujos del producto, pero su presentación contradice `DESIGN.md` y el ADR-041: retrasa el mapa con una pantalla de entrada, utiliza una estética morada y futurista, contiene emojis como iconos y reduce textos críticos hasta volverlos difíciles de leer. Además, cuando la API no está disponible, presenta cuatro contadores en cero como si fueran observaciones válidas en vez de admitir que no pudo consultar el estado.

## What Changes

- Reordenar la página principal para que el estado del agua y la búsqueda de barrio sean la primera respuesta útil, sin pantalla de entrada ni efectos que bloqueen el contenido.
- Sustituir gradientes morados, halos, neón, glassmorphism y microtexto por una interfaz cívica sobria basada en los tokens turquesa y azulados de `DESIGN.md`, conservando los cuatro colores exclusivamente para estados del servicio.
- Eliminar emojis de la interfaz y usar texto o iconos vectoriales accesibles ya disponibles en el proyecto.
- Unificar la presentación de mapa, reporte, suscripción, acceso del veedor, estadísticas y bitácora sin alterar rutas, contratos OpenAPI ni reglas de negocio.
- Presentar fallos de API, SSE o teselas como estados degradados explícitos con acción de reintento; nunca convertir la ausencia de respuesta en contadores operativos iguales a cero.
- Mantener la geometría local y la alternativa textual utilizables cuando falle el proveedor de teselas.
- Corregir la especificación del mapa para distinguir un sector monitoreado sin alertas activas (`CON_SERVICIO`, ADR-035) de una geometría sin correspondencia en la API (`sin dato`, ADR-014).
- Añadir pruebas de regresión visual/funcional, accesibilidad, ancho de 360 px y manejo de API no disponible.
- Documentar la decisión visual en un ADR y entregar a D3/D5 los hallazgos de API, MongoDB, Docker y cabeceras de seguridad que requieran cambios fuera de `frontend/`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `mapa-en-vivo`: precisa la semántica de “con servicio” frente a “sin dato” y exige una degradación honesta cuando la API o el mapa base no están disponibles.

## Impact

- **Frontend:** `App.tsx`, página principal, componentes de navegación, mapa, estados de servicio, formularios, secciones informativas y hojas de estilo.
- **Contrato/API:** no cambia ninguna ruta ni DTO; el cliente continúa generado desde `backend/openapi.yaml`.
- **Rendimiento:** se retira trabajo visual bloqueante y se reduce la dependencia de animaciones y efectos GPU en la primera vista.
- **Accesibilidad:** foco, contraste, objetivos táctiles, estados de carga/error y reducción de movimiento se verifican en claro y oscuro.
- **Seguridad:** `npm audit` reportó 0 vulnerabilidades sobre 658 dependencias el 2026-09-05; la revisión de CSP/cabeceras y del stack Docker queda como tarea verificable con titular D5.
- **Entorno local:** Vite responde en `5173`, pero `/api/sectores`, `/api/estadisticas` y `/api/bitacora` devuelven 502 porque no hay backend disponible; Docker no encuentra el motor en ejecución. No se modificarán MongoDB, Redis ni código backend desde una tarea de D4.
