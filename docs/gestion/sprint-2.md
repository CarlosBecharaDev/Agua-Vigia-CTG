# Sprint 2 — Reporte ciudadano y consenso

**Abierto:** 2026-08-09 · **Cerrado:** — *(cierra cuando un vecino pueda reportar "no tengo agua"
desde el mapa, sin registro, y el sistema cambie el estado del sector solo cuando varios reportes
independientes coincidan)* · **Scrum Master del sprint:** Sebastián Montes Olivera (D3) — le toca
por rotación normal (`roles-y-tareas.md` § Scrum Master, retomada desde este sprint). Convocado por
Yordy Pardo Pajaro (D5), Scrum Master saliente, por instrucción explícita del usuario para no dejar
el planning sin abrir — Sebastián toma la posta desde aquí.

> **Este sprint también abre con parte de su alcance ya entregada**, igual que pasó con el Sprint 1.
> La hoja de ruta (`../equipo/secuencia-de-trabajo.md` §4) le asigna a D5 tres tareas para este
> sprint — Testcontainers, JaCoCo en CI, y que ArchUnit tumbe la build — **las tres ya están
> construidas** desde el Sprint 0/1 (`backend-ci.yml` ya corre `./mvnw verify` con Testcontainers
> real y publica el reporte JaCoCo; ArchUnit es parte de esa misma verificación). D5 no tiene
> compromiso nuevo este sprint: queda disponible para QA del resto.

---

## 1. Objetivo del sprint

**Que un vecino de Cartagena reporte "no tengo agua" desde el mapa en dos toques, sin crear cuenta,
y que el sistema confirme automáticamente el corte de su sector cuando varios reportes
independientes coincidan en una ventana de tiempo.**

El Sprint 1 dejó `RegistrarReporteService` construido y probado en `application/` (RF005–RF008,
incluido RF006 real — límite de reportes por dispositivo), pero **sin `POST /api/reportes`**: la API
queda cerrada a propósito hasta este sprint (`registro-de-bloqueos.md` §1, alcance de C2). Ese es el
primer entregable. El segundo es `EvaluarConsensoService` (RF009–RF011): hoy `ContadorReportesPort`
ya acumula reportes por sector en Redis, pero nada los lee para decidir un cambio de estado.

---

## 2. Compromisos

| Resp. | RF/RNF | Entregable | Depende de |
|---|---|---|---|
| D3 (Sebastián) | RF005–RF008 | `POST /api/reportes`, exponiendo `RegistrarReporteService` (ya entregado). Aplicar `@Cacheable` a `GET /api/sectores` (infra lista desde el PR #61, sin usar todavía). Decidir si activa una regla de rate limiting (`aguavigia.rate-limit.reglas`) para `/api/reportes`, o si RF006 (ya cubierto en el servicio) es suficiente | C1 ✅ · `RegistrarReporteService` ✅ (Sprint 1) |
| D2 (Carlos) | RF009–RF011 | `EvaluarConsensoService` con patrón Strategy (umbral fijo y umbral proporcional a población), leyendo `ContadorReportesPort.contarRecientes`. Publicación del evento de dominio que dispara la notificación (RF014, capa de D1) | C1 ✅ · `ContadorReportesPort` ✅ (Sprint 1, PR #57) |
| D1 (Rafael) | RF013 (completo) · RF015 | ✅ `GET /api/suscripciones/confirmar` (token de un solo uso, doble opt-in real) y `GET /api/suscripciones/cancelar` (baja en 1 clic). `SuscribirseService` y la plantilla de correo ya existen. Pendiente: revisión y merge | C1 ✅ · `SuscribirseService` ✅ (Sprint 1, PR #78) |
| D4 (José) | RF008 | Conectar `FormularioReporte` a `POST /api/reportes` real en cuanto D3 lo publique — hoy usa el fallback que produce `BUG-017` (éxito falso si la API falla) | `POST /api/reportes` (D3, este sprint) |
| D5 (Yordy) | — | Nada nuevo comprometido: Testcontainers, JaCoCo en CI y ArchUnit-rompe-build, los tres ya entregados en Sprint 0/1. Disponible para QA de lo que entregue el resto | — *(no depende de nadie)* |

La columna **Depende de** es la importante: es donde se ven los bloqueos antes de que ocurran.
Cadena de dependencias y compuertas: [`../equipo/secuencia-de-trabajo.md`](../equipo/secuencia-de-trabajo.md) §1 y §2.

### Ya entregado antes de abrir el sprint (adelantado desde Sprint 0/1)

| Frente | Quién | Dónde | Estado |
|---|---|---|---|
| Testcontainers real en pruebas de integración | D5 | `backend-ci.yml`, 8 clases de test | ✅ |
| Cobertura JaCoCo publicada en CI | D5 | `backend-ci.yml` | ✅ |
| Build falla si ArchUnit falla | D5 | `backend-ci.yml` (`./mvnw verify`) | ✅ |
| `RegistrarReporteService` + RF006 real | D5 (en capa de D2, Sprint 1) | PR #84, #89 | ✅ — falta solo el endpoint |
| Ventana deslizante de consenso en Redis (`ContadorReportesPort`) | D3 | PR #57 (Sprint 1) | ✅ — falta quien la lea |
| Rate limiting Redis (`RateLimitingInterceptor`) | D3 | PR #60 (Sprint 1) | ✅ infra, sin reglas activas |
| Caché sobre Redis (`@EnableCaching`) | D3 | PR #61 (Sprint 1) | ✅ infra, sin `@Cacheable` en uso |
| Colectores de ingesta M9 (`AcuacarApiCollector`, `RssCollector`) | D3 | PR #98 (Sprint 1, adelantado de Sprint 4) | ✅ — capa de IA sigue bloqueada por `BL-005` |

**Lo que no adelantó nadie, y es el corazón de este sprint:** la API de reportes y la lógica de
consenso. Son los dos entregables que de verdad cierran M2 y abren M3.

---

## 3. Bloqueos del sprint — resumen

| ID | Compuerta | Quién quedó detenido | Días | Cómo se resolvió |
|---|---|---|---|---|
| BL-005 | — | D3 (capa de IA de M9, Sprint 4) | — | Sigue abierto — falta `ANTHROPIC_API_KEY`. No bloquea este sprint: M9-IA es Sprint 4 |

---

## 4. Review — qué se demostró funcionando

*(Se llena el último día del sprint. Solo lo que se pudo mostrar corriendo.)*

| RF/RNF | Qué se demostró | ¿Aceptado? |
|---|---|---|

**Comprometido:** — · **Entregado:** — · **Arrastrado al siguiente sprint:** —

---

## 5. Métricas del sprint

| Métrica | Valor |
|---|---|
| Requisitos entregados / comprometidos | |
| PRs fusionados | |
| Bugs abiertos / cerrados | *(al abrir: 11 abiertos / 21 cerrados — `registro-de-bugs.md`)* |
| Cobertura `domain/` + `application/` | *(al abrir: `domain/` 74,3% · `application/` 100% — ambas ya superan `RNF017`)* |
| Build en verde al cierre | |

---

## 6. Retrospectiva

*(Se llena después del review. Máximo 3 por bloque, concretos, sobre el proceso.)*

**Qué funcionó**

**Qué no funcionó**

**Acciones para el próximo sprint**

| Acción | Resp. | Para cuándo |
|---|---|---|
