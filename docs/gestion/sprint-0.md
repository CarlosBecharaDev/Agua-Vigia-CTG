# Sprint 0 — Preparación e infraestructura

**Abierto:** 2026-08-06 · **Cerrado:** — *(cierra cuando cualquiera pueda clonar el repositorio y
levantar el entorno con un comando, demostrado en el review)* · **Scrum Master del sprint:** Yordy
Pardo Pajaro (D5), interino desde 2026-08-08 (`ADR-011`, `BL-003` cerrado)

> Este archivo se creó tarde, en la auditoría del 2026-08-07, cuando el sprint ya llevaba dos días
> corriendo. Su ausencia tuvo un costo medible: la creación de `/backend` —lo único que bloquea a los
> cinco— pasó dos sesiones sin dueño porque no hubo planning donde asignarla.

---

## 1. Objetivo del sprint

**Que cualquiera de los cinco pueda clonar el repositorio, levantar el entorno con un comando y
empezar a escribir código de su capa sin preguntarle nada a nadie.**

No entra funcionalidad. El Sprint 0 no se mide en requisitos entregados, sino en si el Sprint 1 puede
arrancar sin fricción. Qué se permite escribir y qué no: `ADR-009`.

---

## 2. Compromisos

| Resp. | RF/RNF | Entregable | Depende de | Estado |
|---|---|---|---|---|
| D5 | — | Repositorio, ramas, `.env.example`, plantillas de PR e issue | — | ✅ PR #1 |
| D5 | — | `docker-compose.yml` (Mongo + Redis + Mailhog) y 3 workflows de CI | — | ✅ PR #1 |
| D5 | — | GeoJSON de los 213 barrios, validado contra boletines reales | — | ✅ PRs #2 y #6 |
| D5 | — | **Verificar y declarar C0 abierta**, y anunciarlo al equipo | — *(ya no depende de nada)* | ✅ Declarada 2026-08-08 — de paso se encontró y corrigió `BUG-003` (`docker compose config -q` fallaba sin `.env`) |
| D2 | — | **Proyecto base de `/backend`**: Maven, Java 21, Spring Boot 3.4.1, paquetes vacíos de Arquitectura Limpia | — | ✅ PR #10 |
| D2 | — | Diseño del dominio de M3/M6 en `docs/ingenieria/modelo-de-dominio.md` | — | ✅ PR #4 |
| D4 | — | Esqueleto de `/frontend`: React 19 + Vite + TS + Tailwind, tokens de `DESIGN.md`, rutas vacías | — | ✅ PR #5 |
| D4 | — | Docker Desktop instalado y `docker compose up` corriendo en su máquina | — | ✅ `BL-002` cerrado 2026-08-08 |
| D3 | — | Andamiaje de infraestructura: dependencias de build (`pom.xml`), `RedisConfig` y paquetes vacíos de `infrastructure/` | C1 *(abierta 2026-08-08)* | ✅ PR #40 — sus entregables de código (adaptador Mongo, `GET /api/sectores`, OpenAPI) son del Sprint 1 |
| D1 (Yordy, interino) | — | Anexos 1–2 redactados; Anexo 3 pendiente de datos reales · plantilla oficial del informe · solicitud a Meta Content Library | — | 🟡 Anexos 1–2 ✅ PR #32 · plantilla e ICPSR aún sin enviar |
| D5 | — | Dockerfile multi-etapa backend y frontend, JaCoCo en CI, perfiles de Spring, `/actuator/health` | — | ✅ PRs #27 y #33 |

La columna **Depende de** es la importante: es donde se ven los bloqueos antes de que ocurran.
Cadena de dependencias y compuertas: [`../equipo/secuencia-de-trabajo.md`](../equipo/secuencia-de-trabajo.md) §1 y §2.

### Camino crítico — resuelto

```
✅ D2 subió /backend (PR #10)  →  ✅ D5 verificó y declaró C0 (2026-08-08)  →  D2 empieza el dominio  →  C1  →  D3 y D1
                                                                          →  D4 integra el frontend (cierra BL-002)
```

**C0 está abierta.** D2 y D3 pueden empezar su trabajo de dominio y puertos sin esperar a nadie más.
Solo queda `BL-002` (D4 instala Docker en su máquina — tarea suya, no depende de nadie) y `BL-003`
(vacante de D1).

---

## 3. Bloqueos del sprint — resumen

| ID | Compuerta | Quién quedó detenido | Días | Cómo se resolvió |
|---|---|---|---|---|
| BL-001 | C0 (parcial) | D5 | 0 | Branch protection descartada como control técnico, política documentada (`ADR-010`). Yordy queda en `write`, no `admin` — GitHub no permite subir el rol de un colaborador existente en un repo personal |
| BL-002 | C0 | D4 | 1 | Cerrado 2026-08-08 — D5 declaró C0 abierta y D4 instaló Docker Desktop |
| BL-003 | — | D1 (vacante) | 1 | Cerrado 2026-08-08 — D1 reasignado temporalmente a Yordy Pardo Pajaro (D5), `ADR-011` |
| DT-001 a DT-005 | C2 | — | — | Regularizados el 2026-08-08, caducan **al cerrar el Sprint 1**. DT-001/002/003 por D3 (titular); DT-004/005 (M7, M8) autorizados por D5/D1 según confirma D3. Detalle: `registro-de-bloqueos.md` §4 |

---

## 4. Review — qué se demostró funcionando

*(Se llena el último día del sprint. Solo lo que se pudo mostrar corriendo.)*

> ⚠️ **Borrador preparado por el agente el 2026-08-08 para que Yordy (D5, Scrum Master interino) lo
> verifique y marque la columna "¿Aceptado?".** El agente reunió la evidencia; no le corresponde
> aceptarla — eso es del equipo, en el Review real. Mientras esta columna no se llene, el sprint
> sigue sin cerrar y `BL-004` sigue abierto.

| RF/RNF | Qué se demostró | ¿Aceptado? |
|---|---|---|
| — | `docker compose config -q && ls backend frontend` → sale limpio: `.env.example`, plantillas de PR/issue, 3 workflows de CI (PR #1) | |
| — | GeoJSON de los 213 barrios de Cartagena, contrastado contra boletines reales de Acuacar (PRs #2, #6) | |
| — | `docs/ingenieria/modelo-de-dominio.md`: diseño de dominio de M3/M6 (PR #4) | |
| — | `/frontend`: React 19 + Vite + TS + Tailwind, temas claro/oscuro, 4 rutas — `npm run build` en verde (PR #5) | |
| — | `/backend`: Maven, Java 21, Spring Boot 3.4.1, Arquitectura Limpia vacía — `./mvnw verify` → BUILD SUCCESS (PR #10) | |
| — | **C0 declarada abierta** 2026-08-08 — `docker compose config -q && ls backend frontend` en verde | |
| — | Población real por barrio (DANE 2018 + CORVIVIENDA) sembrada en Mongo — 211 sectores, `$geoIntersects` verificado (PR #13) | |
| — | Dockerfiles multi-etapa (backend + frontend), JaCoCo en CI, perfiles de Spring, `/actuator/health` → `mongo: UP` (PRs #27, #33) | |
| — | Anexos 1 y 2 (encuesta, guion de entrevista) trazados a RF001, RF005/RF008, RF009, RF012–RF014, RF020–RF022, RNF008 (PR #32) | |
| — | Andamiaje de infraestructura de D3: dependencias de build, `RedisConfig`, paquetes vacíos — `./mvnw verify` en verde (PR #40) | |
| — | **C1 abierta** (dominio y puertos, PR #21) — `ls backend/.../domain/port/out` en verde, ArchUnit incluido | |
| — | **C2 abierta** (contrato OpenAPI, PR #56) — `git show develop:backend/openapi.yaml \| head -5` responde | |

**Lo que se demostró de más, fuera del alcance formal del Sprint 0** (evidencia de que el objetivo del
sprint —"empezar a escribir código de su capa sin preguntarle nada a nadie"— ya se cumple en la
práctica, aunque la ceremonia no haya cerrado): D3 fusionó 6 PRs de Sprint 1 a Sprint 5
(`#56`–`#61`: adaptador Mongo + API de sectores, adaptador Redis de consenso, JWT del veedor,
pipeline de ingesta parcial, rate limiting HTTP, caché sobre Redis), todos con `./mvnw clean verify`
en verde y ArchUnit incluido. Sigue en `andamio`/`infra`, no `func`, según
`registro-de-implementaciones.md` — la cobertura de requisitos sigue en 0% hasta que D2 conecte
casos de uso reales en `application/`, que es exactamente lo que `BL-004` tiene detenido.

**Comprometido:** 0 requisitos *(por diseño — `ADR-009`)* · **Entregado:** — · **Arrastrado:** —

---

## 5. Métricas del sprint

| Métrica | Valor |
|---|---|
| Requisitos entregados / comprometidos | 0 / 0 — el Sprint 0 no entrega requisitos |
| PRs fusionados | 32 al 2026-08-08 (numeración #1–33, el #9 no llegó a fusionarse) |
| PRs fusionados **sin revisor registrado** | 18 de 32 — control de `ADR-010`, reverificado con `gh pr view --json reviews` el 2026-08-08 |
| Bugs abiertos / cerrados | 0 / 4 (BUG-001, BUG-002, BUG-003, BUG-004) |
| Bloqueos abiertos / cerrados | 0 / 3 (BL-001, BL-002, BL-003) |
| Desbloqueos temporales sin registrar | 0 — DT-001 a 005 regularizados y autorizados el 2026-08-08 (issues [#34](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/34)–[#36](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/36), [#38](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/38), [#39](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/39)) — ver `registro-de-bloqueos.md` §4 |
| Cobertura `domain/` + `application/` | `domain/` tiene 16 archivos (entidades, VOs, puertos) desde el PR #21; `application/` sigue vacío — es Sprint 2 |
| Build en verde al cierre | Frontend CI ✅ · Backend CI ✅ · Escaneo de secretos ✅ |

---

## 6. Retrospectiva

*(Se llena después del review. Máximo 3 por bloque, concretos, sobre el proceso.)*

**Qué funcionó**

1. La disciplina de verificar antes de afirmar: los bloqueos se registraron con el comando y su
   salida real, no con una impresión.
2. La revisión por pares atrapó dos defectos de CI antes de que llegaran a `develop`.

**Qué no funcionó**

1. **El sprint arrancó sin planning y sin `sprint-0.md`**, y por eso la tarea del camino crítico
   estuvo dos sesiones sin dueño.
2. **7 de 11 PRs se fusionaron sin revisor registrado**, contra la regla del equipo.
3. **Los registros se llenaron tarde**: 8 PRs fusionados, 2 bugs corregidos y un desbloqueo temporal
   (`DT-001`) no aparecieron en `docs/gestion/` hasta la auditoría.

**Acciones para el próximo sprint**

| Acción | Resp. | Para cuándo |
|---|---|---|
| Designar Scrum Master interino mientras D1 esté vacante | Equipo | Antes del planning del Sprint 1 |
| Crear `sprint-N.md` el primer día del sprint, antes de la primera tarea | Scrum Master | Día 1 del Sprint 1 |
| Llenar el registro en el mismo PR, no después | Todos | Continuo |
