# Roles y tareas por desarrollador

> Quién hace qué, con qué entregables y en qué sprint. Cada persona es **dueña** de sus módulos de código:
> nadie más los toca sin avisar, y nadie más responde por ellos en la sustentación.
>
> **Nota de organización:** Todos los 5 integrantes del equipo escriben código de producción. La documentación académica y metodológica de D1 se apalanca y elabora eficientemente con Inteligencia Artificial.

---

## Resumen del equipo (100% Desarrolladores de Código)

| # | Rol | Módulos de Código | Capas del código | Entregables académicos / Documentación |
|---|---|---|---|---|
| **D1** | Full-Stack (Notificaciones y Bitácora) / Docs con IA | **M4** (Alertas correo), **M8** (Bitácora pública) | `application/`, `infrastructure/mail/`, `api/`, `frontend/` | Informe metodológico, Anexos 1–4, encuestas (Generados con IA) |
| **D2** | Backend · Dominio y Aplicación | **M3** (Consenso), **M6** (Índice Cumplimiento ⭐) | `domain/`, `application/` | Diagrama de clases, patrones y demostración SOLID |
| **D3** | Backend · Infraestructura e Integraciones | **M2** (Reporte Back), **M5** (Veedor Back), **M9** (IA Ingesta ⭐) | `infrastructure/`, `api/` | Anexo 6 (Base de datos), diagramas de componentes, OpenAPI |
| **D4** | Frontend | **M1** (Mapa), **M2** (Reporte UI), **M5** (Veedor UI) | `frontend/` (React 19 + TS) | Prototipos, manual de usuario, accesibilidad WCAG AA |
| **D5** | DevOps / QA / Datos geoespaciales | **M7** (Estadísticas) + Infraestructura global | Docker, CI/CD, E2E | Plan de pruebas, manual técnico, GeoJSON |

---

## D1 — Desarrollador Full-Stack (Notificaciones & Bitácora) / Documentación Asistida por IA

**Es dueño de:** M4 (Alertas por correo y suscripciones) y M8 (Bitácora pública inmutable).
**Desarrolla código de producción** en backend y frontend. Utiliza herramientas de IA agéntica para generar el informe metodológico institucional.

### Especificación del rol
- Implementa el sistema de suscripciones a sectores y envío de alertas por correo con Spring Mail, doble opt-in (Ley 1581/2012) y desuscripción de 1-clic.
- Implementa la vista y servicios de la Bitácora Pública de solo anexado.
- Utiliza la IA para la redacción acelerada del Informe Metodológico (Capítulos I a IV) y Anexos (1 a 4).

### Tareas por sprint

| Sprint | Tareas de Código | Tareas de Documentación con IA |
|---|---|---|
| **0** | Configurar infraestructura de correo y plantillas HTML. | Generar Anexos 1, 2 y 3 mediante prompts de IA. Solicitar Meta Content Library. |
| **1** | Endpoint `POST /api/suscripciones` y servicio asíncrono `@Async`. | Generar Capítulo I del informe (Problema, justificación, objetivos) y Anexo 4 (Historias de Usuario). |
| **2** | Lógica de confirmación doble opt-in y baja en 1-clic. | Generar Capítulo II (Marco teórico, conceptual, legal). |
| **3** | Backend de Bitácora Pública (M8) (`GET /api/bitacora`). | Generar Capítulo III (Metodología) y encuestas de satisfacción. |
| **4** | Frontend de Bitácora Pública (timeline en React) y formulario de suscripción. | Tabulación de encuestas e integración en el dataset dorado. |
| **5** | Pruebas de integración del flujo de correo y bitácora. | Generar informe de pruebas y matriz de trazabilidad. |
| **6** | Optimización de envío masivo y pulido visual. | Generar Capítulo IV (Resultados y Conclusiones) y consolidación final. |

---

## D2 — Backend · Dominio y Aplicación

**Es dueño de:** M3 (consenso automático) y M6 (Índice de Cumplimiento ⭐).
**Capa:** `domain/` y `application/`.

*(Ver detalle de tareas en `equipo/D2-backend-dominio.md`)*

---

## D3 — Backend · Infraestructura e Integraciones

**Es dueño de:** M2 (reporte backend), M5 (panel veedor backend), M9 (pipeline de ingesta con IA ⭐).
**Capa:** `infrastructure/` y `api/`.

*(Ver detalle de tareas en `equipo/D3-backend-infraestructura.md`)*

---

## D4 — Frontend

**Es dueño de:** M1 (mapa en vivo), M2 (reporte UI), M5 (panel veedor UI).
**Capa:** `frontend/` (React 19 + Vite + TypeScript).

*(Ver detalle de tareas en `equipo/D4-frontend.md`)*

---

## D5 — DevOps / QA / Datos geoespaciales

**Es dueño de:** M7 (estadísticas) + infraestructura global.
**Capa:** Docker, CI/CD, GeoJSON, Playwright.

*(Ver detalle de tareas en `equipo/D5-devops-qa.md`)*
