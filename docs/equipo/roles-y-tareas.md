# Roles y tareas por desarrollador

> Quién hace qué, con qué entregables y en qué sprint. Cada persona es **dueña** de sus módulos:
> nadie más los toca sin avisar, y nadie más responde por ellos en la sustentación.
>
> **Los 5 integrantes escriben código de producción.** La documentación académica se elabora con
> asistencia de IA, pero la valida y la firma una persona.

---

## Quién es quién — asignación oficial

Esta tabla es la **fuente única** de la correspondencia entre persona y rol. En el resto del
repositorio se usa el código (`D1`–`D5`); si necesitas el nombre, vuelve aquí.

| Rol | Integrante | Responsabilidad en una línea |
|---|---|---|
| **D1** | **Yordy Pardo Pajaro** ⚠️ *interino, además de D5 — ver nota* | Notificaciones, bitácora pública y documentación académica asistida por IA |
| **D2** | **Carlos Bechara Arias** | Dominio y casos de uso: Java puro, responde por la Regla de Oro |
| **D3** | **Sebastián Montes Olivera** | Infraestructura e integraciones: MongoDB, Redis, ingesta con IA, contrato OpenAPI |
| **D4** | **José Daniel Zambrano** | Frontend: SPA React, mapas, accesibilidad |
| **D5** | **Yordy Pardo Pajaro** | DevOps, QA y datos geoespaciales |

**La asignación es firme, no indicativa.** Cada quien responde por su rol ante el docente en la
sustentación, y el registro de contribución individual (commits, PRs, registros de `docs/gestion/`)
es evidencia evaluable. Un cambio de rol se acuerda en equipo y se escribe aquí el mismo día.

⚠️ **D1 es una reasignación temporal, no una vacante cubierta.** El equipo sigue en cuatro
integrantes reales; Yordy absorbió D1 el 2026-08-08 para destrabar `BL-003` (plantilla del informe,
solicitud a ICPSR, Anexos 1–3, Scrum Master del Sprint 0). Detalle y alternativas consideradas:
`ADR-011`. El día que se confirme un 5.º integrante, esta fila vuelve a la persona nueva y el ADR
pasa a *Reemplazada*.

---

## Resumen del equipo

| # | Rol | Módulos | Capas del código | Entregables académicos |
|---|---|---|---|---|
| **D1** | Full-Stack · Notificaciones y Bitácora | **M4** Alertas · **M8** Bitácora | `application/`, `infrastructure/mail/`, `api/`, `frontend/` | Informe metodológico (Cap. I–IV), Anexos 1–4 |
| **D2** | Backend · Dominio y Aplicación | **M3** Consenso · **M6** Índice de Cumplimiento ⭐ | `domain/`, `application/` | Diagrama de clases, patrones y demostración SOLID |
| **D3** | Backend · Infraestructura e Integraciones | **M2** Reporte · **M5** Veedor · **M9** Ingesta IA ⭐ | `infrastructure/`, `api/` | Anexo 6 (modelo de datos), diagramas de componentes, OpenAPI |
| **D4** | Frontend | **M1** Mapa · **M2** UI · **M5** UI | `frontend/` (React 19 + TS) | Prototipos, manual de usuario, accesibilidad WCAG AA |
| **D5** | DevOps · QA · Datos geoespaciales | **M7** Estadísticas + infraestructura global | Docker, CI/CD, E2E, GeoJSON | Anexo 5 (plan de pruebas), manual técnico |

**Ficha detallada de cada rol** — especificación, tareas por sprint y definición de terminado:

| [D1](D1-notificaciones-bitacora.md) | [D2](D2-backend-dominio.md) | [D3](D3-backend-infraestructura.md) | [D4](D4-frontend.md) | [D5](D5-devops-qa.md) |
|---|---|---|---|---|

**Orden de trabajo, compuertas y dependencias entre roles:**
[`secuencia-de-trabajo.md`](secuencia-de-trabajo.md) — **de cumplimiento obligatorio.**

---

## Scrum Master — rotativo

No hay un Scrum Master fijo: **el rol rota cada sprint**, en orden D1 → D2 → D3 → D4 → D5 → D1 → D2.

| Sprint | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| **Scrum Master** | D1 (Yordy, interino) | D2 | D3 | D4 | D5 | D1 ⚠️ | D2 |

**Sprint 0 ya tiene Scrum Master interino: Yordy (D1 + D5), desde el 2026-08-08 (`ADR-011`).** Antes
de eso el Sprint 0 fue sin Scrum Master — razón de que nadie convocara planning, de que
`sprint-0.md` no existiera hasta el 2026-08-07 y de que la creación de `/backend` pasara dos
sesiones sin dueño (`BL-003`, cerrado). El Sprint 5 sigue marcado ⚠️: si para entonces no hay un 5.º
integrante real, el equipo vuelve a designar un interino.

**Por qué rota:** son 5 estudiantes con la misma carga académica; un Scrum Master fijo pierde un
desarrollador y concentra en una persona el aprendizaje de la gestión, que también se evalúa.

**Qué hace el Scrum Master del sprint** (además de sus propias tareas de código):

1. Convoca planning, review y retrospectiva, y deja `docs/gestion/sprint-N.md` lleno.
2. Revisa a diario `docs/gestion/registro-de-bloqueos.md` y persigue lo que esté abierto.
   **No resuelve los bloqueos: los desatasca**, y verifica que las compuertas abiertas se anunciaron.
3. Al cerrar el sprint, rota los registros que superaron su límite
   (`docs/gestion/protocolo-de-contexto.md` §5) y actualiza la matriz de trazabilidad.

Trámites externos que arranca el Scrum Master del Sprint 0: solicitud de acceso a **Meta Content
Library** vía ICPSR (ver `docs/ingenieria/pipeline-ingesta-datos.md` §5).

---

## Reglas de colaboración

1. **Todos escriben código.** Ningún integrante está excluido del desarrollo.
2. **Contrato primero.** D3 y D1 publican su especificación OpenAPI **antes** de que D4 construya los
   componentes que la consumen. Sin contrato publicado, D4 está bloqueado — y eso es un bloqueo que
   se reporta, no que se rodea inventando el tipo a mano.
3. **Independencia del dominio.** D2 garantiza que `domain/` no importe Spring ni MongoDB. ArchUnit lo
   verifica en CI: no es un acuerdo, es una restricción del sistema.
4. **Nada entra directo a `main` ni a `develop`.** Todo por Pull Request con al menos 1 revisor,
   enlazando su issue y su `RF`.
5. **Dueño ≠ propietario exclusivo.** Puedes leer y proponer cambios sobre el módulo de cualquiera;
   lo que no puedes es fusionarlos sin que su dueño revise.
6. **La secuencia se respeta.** Antes de empezar una tarea se verifica la **compuerta** de la que
   depende (`secuencia-de-trabajo.md` §2). Si está cerrada, el trabajo **se detiene, se registra y
   se avisa** — nunca se rodea inventando el insumo que falta. Aplica igual a las personas y a sus
   agentes de IA; para los agentes es obligación explícita (`secuencia-de-trabajo.md` §5).

---

## Qué registra cada quien

Aplica a los cinco, sin excepción. Detalle en [`../gestion/README.md`](../gestion/README.md).

| Cuándo | Qué haces | Skill |
|---|---|---|
| Fusionas un PR a `develop` | Fila en `registro-de-implementaciones.md` | `registrar-implementacion` |
| Encuentras un bug, aunque lo arregles en el acto | Entrada en `registro-de-bugs.md` | `registrar-bug` |
| Terminas una sesión de trabajo con IA | 3 líneas en `bitacora-sesiones.md` | `cerrar-sesion` |
| Eliges entre alternativas técnicas | ADR en `design-decisions.md` | `registrar-decision` |
| Evalúas una fuente de datos nueva | Entrada en la auditoría de fuentes | `verificar-fuente` |
| No puedes avanzar porque falta el insumo de otro rol | Entrada en `registro-de-bloqueos.md` **y aviso en el chat** | `registrar-bloqueo` |

**Esto no es burocracia: es el Capítulo IV.** Los resultados del informe se construyen desde estos
registros. Quien no registre durante el sprint tendrá que inventarlo en el Sprint 6, y eso se nota.

---

## D1 — Full-Stack · Notificaciones y Bitácora

**Dueño de:** M4 (alertas por correo y suscripciones), M8 (bitácora pública inmutable).
**Además:** coordina el informe metodológico y los Anexos 1–4, apoyándose en IA para la redacción y
validando personalmente cada cita APA 7.

| Sprint | Código | Documentación |
|---|---|---|
| **0** | Infraestructura de correo y plantillas HTML | Anexos 1–3 · conseguir la **plantilla oficial** del informe (bloqueante) · solicitar Meta Content Library |
| **1** | `POST /api/suscripciones` y envío `@Async` | Capítulo I · Anexo 4 (historias de usuario) |
| **2** | Doble opt-in y baja en 1 clic | Capítulo II (marco teórico, conceptual y legal) |
| **3** | Backend de la bitácora (`GET /api/bitacora`) | Capítulo III (metodología) · encuestas de satisfacción |
| **4** | Frontend de la bitácora y formulario de suscripción | Tabulación de encuestas · etiquetado del conjunto dorado |
| **5** | Pruebas de integración de correo y bitácora | Informe de pruebas · matriz de trazabilidad |
| **6** | Envío masivo optimizado · pulido visual | Capítulo IV y consolidación final |

Detalle: [`D1-notificaciones-bitacora.md`](D1-notificaciones-bitacora.md)

---

## D2 — Backend · Dominio y Aplicación

**Dueño de:** M3 (consenso automático), M6 (Índice de Cumplimiento ⭐).
**Capas:** `domain/`, `application/`. Es quien responde por la Regla de Oro de la arquitectura.

Detalle y tareas por sprint: [`D2-backend-dominio.md`](D2-backend-dominio.md)

---

## D3 — Backend · Infraestructura e Integraciones

**Dueño de:** M2 (backend), M5 (backend), M9 (pipeline de ingesta con IA ⭐).
**Capas:** `infrastructure/`, `api/`. Publica el contrato OpenAPI del que depende D4.

Detalle y tareas por sprint: [`D3-backend-infraestructura.md`](D3-backend-infraestructura.md)

---

## D4 — Frontend

**Dueño de:** M1 (mapa en vivo), M2 (UI de reporte), M5 (UI del panel del veedor).
**Capa:** `frontend/` (React 19 + Vite + TypeScript). Responde por el cumplimiento de `DESIGN.md`.

Detalle y tareas por sprint: [`D4-frontend.md`](D4-frontend.md)

---

## D5 — DevOps · QA · Datos geoespaciales

**Dueño de:** M7 (estadísticas) e infraestructura global.
**Capas:** Docker, CI/CD, GeoJSON, Playwright. Es quien habilita a todos los demás en el Sprint 0.

Detalle y tareas por sprint: [`D5-devops-qa.md`](D5-devops-qa.md)
