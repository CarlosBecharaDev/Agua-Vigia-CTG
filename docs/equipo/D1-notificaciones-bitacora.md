# D1 — Desarrollador Full-Stack (Notificaciones & Bitácora) / Documentación Asistida por IA

> ⚠️ **Titular interino: Yordy Pardo Pajaro (D5), desde 2026-08-08** — reasignación temporal
> mientras no exista un 5.º integrante real. Detalle y alternativas: `ADR-011`. Cuando se confirme
> el 5.º integrante, esta línea vuelve a su nombre y el ADR pasa a *Reemplazada*.
> **Responsable de Código:** M4 (Alertas por correo) y M8 (Bitácora pública inmutable).
> **Responsable de Documentación:** Generación y validación del informe metodológico y anexos académicos **utilizando Inteligencia Artificial**.
> **Capa del código:** `/backend/src/main/java/com/aguavigia/ctg/infrastructure/mail`, `/backend/src/main/java/com/aguavigia/ctg/api` y `/frontend/src/components/bitacora` & `suscripcion`.
> **Compuertas:** empieza cuando **C1** está abierta · **abre C2** junto con D3, en la parte del
> contrato que le corresponde (suscripciones y bitácora).
> Ver [`secuencia-de-trabajo.md`](secuencia-de-trabajo.md) §2.

---

## 1. Especificación del Rol

- **Desarrollo de Código**:
  - Implementa el sistema de suscripciones a sectores y envío de alertas por correo (M4) con Spring Mail, plantillas HTML, doble opt-in (Ley 1581/2012) y desuscripción de 1-clic.
  - Implementa la vista y servicios de la **Bitácora Pública** (M8) de solo anexado (append-only log), garantizando que los eventos de servicio sean consultables sin registro de forma inmutable.
- **Documentación elaborada con IA**:
  - Utiliza herramientas de IA (Claude / Antigravity Agent) para la redacción acelerada del Informe Metodológico (Capítulos I a IV) y Anexos (1 a 4).
  - Actúa como "Prompt Engineer & Validator Academic": proporciona el contexto, revisa la exactitud de las citas APA 7 y valida que los entregables cumplan con la plantilla institucional Comfenalco.

---

## 2. Plan de Tareas por Sprint (Código + IA)

| Sprint | Tareas de Desarrollo de Código | Tareas de Documentación con IA |
|---|---|---|
| **Sprint 0** | • Configurar repositorio y estructura de componentes para M4 y M8.<br>• Crear plantillas de correo en HTML/CSS responsive. | • Generar Anexos 1, 2 y 3 mediante prompts de IA con datos de campo.<br>• Solicitar acceso a Meta Content Library. |
| **Sprint 1** | • Definir DTOs para suscripción (`POST /api/suscripciones`).<br>• Implementar servicio de envío de correos asíncronos con `@Async` y JavaMailSender. | • Generar Capítulo I del informe (Planteamiento del problema, justificación, objetivos) asistido por IA.<br>• Redactar Anexo 4 (Historias de Usuario en formato Gherkin). |
| **Sprint 2** | • Implementar lógica de confirmación doble opt-in mediante token de un solo uso.<br>• Crear endpoint `GET /api/suscripciones/cancelar` (baja en 1-clic). | • Generar Capítulo II (Marco teórico, conceptual y legal: Ley 142/1994, Ley 1581/2012, fallo del Tribunal) validando citas APA 7. |
| **Sprint 3** | • Desarrollar backend de **Bitácora Pública (M8)** (`GET /api/bitacora`).<br>• Garantizar inmutabilidad de registros en BD (append-only). | • Generar Capítulo III (Metodología proyectiva, enfoque mixto).<br>• Diseñar encuestas de satisfacción generadas con IA. |
| **Sprint 4** | • Desarrollar componentes Frontend en React para la Bitácora Pública (timeline interactivo).<br>• Formulario de suscripción en Frontend con respuesta inmediata. | • Asistir en el procesamiento y tabulación de encuestas.<br>• Participar en la jornada de etiquetado del Conjunto Dorado. |
| **Sprint 5** | • Pruebas unitarias e integración de envío de correo y bitácora.<br>• Integración de eventos de cambio de estado con el emisor de correos. | • Generar informe de pruebas y matriz de trazabilidad con la IA. |
| **Sprint 6** | • Optimización de rendimiento en el envío masivo de correos.<br>• Pulido de UI para la bitácora pública. | • Generar Capítulo IV (Resultados y Conclusiones) y consolidar el informe final institucional. |

---

## 3. Criterios de Aceptación (Definition of Done - DoD)

Un entregable de D1 está **Terminado** cuando:
1. **Código**: El envío de correos funciona asíncronamente sin bloquear solicitudes HTTP, la Bitácora Pública despliega eventos inmutables y posee pruebas unitarias.
2. **Documentación**: El texto generado por IA ha sido verificado, cumple con la plantilla de Comfenalco y contiene citas APA 7 precisas.
