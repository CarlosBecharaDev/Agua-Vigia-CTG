# D4 — Frontend

> **Responsable:** Desarrollo de la aplicación web de una sola página (SPA), interfaz de usuario, mapas interactivos, accesibilidad y experiencia móvil.
> **Módulos asignados:** M1 (Mapa en vivo), M2 (Reporte ciudadano - UI), M5 (Panel del veedor - UI).
> **Capa del código:** `/frontend` (React 19 + Vite + TypeScript + Tailwind CSS).

---

## 1. Especificación del Rol

- Construye la interfaz web optimizada para dispositivos móviles (responsive desde 360px de ancho).
- Integra mapas interactivos con **Leaflet / React-Leaflet** renderizando polígonos geoespaciales por estado.
- **Genera el cliente HTTP tipado** a partir de la especificación OpenAPI publicada por D3 y D1.
- Enforza los principios visuales de [`DESIGN.md`](file:///C:/Users/Usuario/Desktop/aguavigia-ctg/DESIGN.md):
  - Respuesta a *"¿Tengo agua?"* en menos de 5 segundos.
  - Paleta cromática estricta de 4 estados (Verde, Rojo, Ámbar, Azul) con respaldo táctil/textual.
  - Modo Claro y Oscuro nativos.
- Garantiza accesibilidad **WCAG AA** (contraste 4.5:1, navegación por teclado, alternativa textual al mapa).

---

## 2. Plan de Tareas por Sprint

| Sprint | Entregables y Tareas Específicas |
|---|---|
| **Sprint 0** | • Esqueleto React 19 + Vite + TypeScript + Tailwind CSS.<br>• Configurar tokens de color de `DESIGN.md` como custom properties CSS.<br>• Implementar selector de tema claro/oscuro desde el día 1. |
| **Sprint 1** | • Componente de Mapa con Leaflet cargando sectores de `GET /api/sectores`.<br>• Coloreado dinámico según estado del servicio.<br>• Detalle modal/panel del sector.<br>• **Lista textual de sectores como alternativa accesible al mapa (RF004)**.<br>• Configurar script para generación automática del cliente TypeScript desde OpenAPI. |
| **Sprint 2** | • Formulario de reporte ciudadano en **máximo 2 toques** desde el mapa.<br>• Integrar Server-Sent Events (SSE) para actualizaciones del mapa en vivo.<br>• Componente indicador de frescura del dato (`Actualizado hace X min`).<br>• Skeleton loaders y estados vacíos/error. |
| **Sprint 3** | • Interfaz del Panel del Veedor: Carga de cortes oficiales, registro de hora real y moderación. |
| **Sprint 4** | • **Visualización del Índice de Cumplimiento**: Barras comparativas (*Duración Prometida vs. Duración Real*).<br>• Integración del Dashboard de estadísticas con Recharts. |
| **Sprint 5** | • Auditoría de accesibilidad WCAG AA con hacha (axe).<br>• Garantizar tamaño mínimo de target táctil (44x44 px).<br>• Configuración Progressive Web App (PWA) con Service Worker.<br>• Pruebas de interfaz con Vitest y React Testing Library. |
| **Sprint 6** | • Manual de usuario con capturas explicativas.<br>• Ajustes finales de interfaz y optimización de bundle para carga rápida en 3G. |

---

## 3. Criterios de Aceptación (Definition of Done - DoD)

Una pantalla o componente entregado por D4 está **Terminado** cuando pasa el **Checklist de `DESIGN.md` §10**:
1. Responde *"¿tengo agua?"* en menos de 5 segundos.
2. Es totalmente funcional en 360px de ancho y navegable solo con teclado.
3. Cumple el contraste WCAG AA en temas claro y oscuro, y el color siempre va acompañado de texto o forma.

---

## 4. Recomendaciones Específicas para D4

- **Soporte PWA Offline**: Implementar caché local del JSON de sectores en el Service Worker para mostrar un banner de *"Datos en caché (sin conexión)"* si falla la red 3G.
- **Generación de Cliente HTTP**: Usar `openapi-typescript` o `orval` para sincronizar los tipos de endpoints directamente desde la especificación backend de D3/D1.
