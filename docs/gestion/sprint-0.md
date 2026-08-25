# Sprint 0 — Preparación e infraestructura

**Abierto:** 2026-08-06 · **Cerrado:** 2026-08-08 *(entregable demostrado: el repositorio se clona,
el entorno se declara con un comando y los cinco escriben en su capa sin preguntar)* · **Scrum
Master del sprint:** Yordy Pardo Pajaro (D5), interino desde 2026-08-08 (`ADR-011`, `BL-003` cerrado)

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

Solo lo que se pudo **mostrar corriendo**. La columna "¿Aceptado?" la llenó Yordy Pardo Pajaro (D5,
Scrum Master interino) en el Review del **2026-08-08**, corriendo cada comando de nuevo sobre
`develop` en su máquina. Dos filas quedan aceptadas **por evidencia de CI y no por verificación
propia**: están marcadas como tales y el motivo se explica bajo la tabla.

| RF/RNF | Qué se demostró | ¿Aceptado? |
|---|---|---|
| — | `docker compose config -q && ls backend frontend` → sale limpio: `.env.example`, plantillas de PR/issue, 3 workflows de CI (PR #1) | ✅ Reverificado 2026-08-08, exit 0 |
| — | GeoJSON de los 213 barrios de Cartagena, contrastado contra boletines reales de Acuacar (PRs #2, #6) | ✅ |
| — | `docs/ingenieria/modelo-de-dominio.md`: diseño de dominio de M3/M6 (PR #4) | ✅ |
| — | `/frontend`: React 19 + Vite + TS + Tailwind, temas claro/oscuro, 4 rutas — `npm run build` en verde (PR #5) | ✅ Reverificado 2026-08-08 tras `npm ci`, build en 450 ms |
| — | `/backend`: Maven, Java 21, Spring Boot 3.4.1, Arquitectura Limpia vacía — `./mvnw verify` → BUILD SUCCESS (PR #10) | ✅ |
| — | **C0 declarada abierta** 2026-08-08 — `docker compose config -q && ls backend frontend` en verde | ✅ **con salvedad** — ver nota 1 |
| — | Población real por barrio (DANE 2018 + CORVIVIENDA) sembrada en Mongo — 211 sectores, `$geoIntersects` verificado (PR #13) | ✅ por CI y por la verificación de D3 contra Mongo real (PR #56); D5 no pudo reproducirla — ver nota 1 |
| — | Dockerfiles multi-etapa (backend + frontend), JaCoCo en CI, perfiles de Spring, `/actuator/health` → `mongo: UP` (PRs #27, #33) | ✅ por CI; D5 no pudo reproducir el `health` — ver nota 1 |
| — | Anexos 1 y 2 (encuesta, guion de entrevista) trazados a RF001, RF005/RF008, RF009, RF012–RF014, RF020–RF022, RNF008 (PR #32) | ✅ |
| — | Andamiaje de infraestructura de D3: dependencias de build, `RedisConfig`, paquetes vacíos — `./mvnw verify` en verde (PR #40) | ✅ |
| — | **C1 abierta** (dominio y puertos, PR #21) — `ls backend/.../domain/port/out` en verde, ArchUnit incluido | ✅ Reverificado 2026-08-08: 6 puertos presentes |
| — | **C2 abierta** (contrato OpenAPI, PR #56) — `git show develop:backend/openapi.yaml \| head -5` responde | ✅ Reverificado 2026-08-08: OpenAPI 3.0.1 |
| — | **C3 abierta** (SPA integrada contra la API real de sectores, PR #67) — `cd frontend && npm run build` | ✅ Reverificado 2026-08-08 |

**Nota 1 — la máquina de D5 no tiene motor de contenedores, y eso debilita la propia compuerta C0.**
Descubierto el 2026-08-08 al reverificar: `docker` está instalado como **cliente** (Homebrew), sin
Docker Desktop, colima ni podman. `docker compose config -q` pasa igual porque **solo valida el YAML;
no levanta nada ni habla con un daemon**. Consecuencia: el comando que define C0 —"entorno
reproducible"— nunca probó que el entorno arranque: ni cuando se declaró la compuerta esa mañana, ni
ahora en el Review. Por eso `./mvnw clean
verify` local da **60 pruebas, 0 fallos y 6 errores**, todos de Testcontainers por ausencia de daemon
(`SectorMongoAdapterTest`, `RedisContadorReportesAdapterTest`, `DeduplicadorRecienteTest`,
`RateLimitingInterceptorTest`, `RateLimitConfigTest`, `CacheConfigTest`), no por el código: los mismos
tests pasan en Backend CI, que sí tiene daemon (última ejecución sobre `develop`, PR #61, en verde).
Se acepta el sprint con esta salvedad explícita en vez de ocultarla, y se corrige en el Sprint 1
(acción de la retrospectiva).

**Lo que se demostró de más, fuera del alcance formal del Sprint 0** (evidencia de que el objetivo del
sprint —"empezar a escribir código de su capa sin preguntarle nada a nadie"— ya se cumple en la
práctica): D3 fusionó 6 PRs de Sprint 1 a Sprint 5 (`#56`–`#61`) y D4 otros tantos hasta el `#69`,
incluida la integración real del mapa contra `GET /api/sectores` y la PWA instalable. Sigue
clasificado en `andamio`/`infra`, no `func`, según `registro-de-implementaciones.md`.

**Comprometido:** 0 requisitos *(por diseño — `ADR-009`)* · **Entregado:** 0 · **Arrastrado:** —
La cobertura de requisitos sigue en 0% hasta que D2 conecte casos de uso reales en `application/`,
que es exactamente lo que `BL-004` tenía detenido y este Review desbloquea.

---

## 5. Métricas del sprint

| Métrica | Valor |
|---|---|
| Requisitos entregados / comprometidos | 0 / 0 — el Sprint 0 no entrega requisitos |
| PRs fusionados | **61** al cierre (2026-08-08), `gh pr list --state merged --json number --jq 'length'` |
| PRs fusionados **sin revisor registrado** | **47 de 61 (77 %)** — control de `ADR-010`. En la auditoría de la mañana eran 18 de 32 (56 %): de los 29 PRs fusionados desde entonces, **29 no tienen revisor**. El patrón **empeoró 21 puntos** en un solo día. `BUG-005` sigue abierto por esto |
| Bugs abiertos / cerrados | 1 / 15 — abierto solo `BUG-005` (proceso, PRs sin revisor); 16 registrados en total |
| Bloqueos abiertos / cerrados | 2 / 4 — cerrados BL-001/002/003 y **BL-004 con este Review**; siguen abiertos `BL-005` (clave de Anthropic) y `BL-006` (correo real del colector, titular D1) |
| Desbloqueos temporales sin registrar | 0 — DT-001 a 005 regularizados y autorizados el 2026-08-08 (issues [#34](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/34)–[#36](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/36), [#38](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/38), [#39](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/39)) — ver `registro-de-bloqueos.md` §4 |
| Cobertura `domain/` + `application/` | `domain/` tiene 16 archivos (entidades, VOs, puertos) desde el PR #21; `application/` sigue con solo `package-info.java`. No es anomalía: lo entregado es lectura sin regla de negocio y va directo al puerto por `ADR-015`. Los casos de uso llegan en el Sprint 1 |
| Build en verde al cierre | Frontend CI ✅ · Backend CI ✅ (PR #61, último que tocó `backend/**`) · Escaneo de secretos ✅ · Sala de control ✅ · `npm run build` y `./mvnw verify` reverificados a mano el 2026-08-08 (ver nota 1 del §4) |

---

## 6. Retrospectiva

Cerrada en el Review del 2026-08-08.

**Qué funcionó**

1. **Detenerse en vez de inventar el insumo que faltaba.** D3 tenía dos tareas del pipeline M9 sin
   poder tocar la red (`BL-005`, `BL-006`) y construyó todo lo que no la cruzaba —normalización,
   prefiltro, deduplicador— en lugar de fingir un colector. Es lo contrario de lo que suele pasar.
2. **Verificar antes de afirmar.** Los bloqueos se registraron con el comando y su salida real. Esa
   costumbre es la que hoy encontró que la máquina de D5 no tiene motor de contenedores (nota 1, §4):
   un supuesto que llevaba dos días en pie sin que nadie lo probara.
3. **Los desbloqueos temporales se regularizaron con caducidad y responsable** (`DT-001`–`DT-005`),
   en vez de quedar como mocks huérfanos que nadie retira.

**Qué no funcionó**

1. **La ceremonia se volvió el cuello de botella del proyecto.** El Sprint 0 estuvo tres días sin
   cerrar por una firma que faltaba, no por trabajo pendiente. Mientras tanto el equipo entregó 29
   PRs de sprints posteriores que, formalmente, `ADR-009` no permitía. **El proceso quedó detrás de
   la realidad y el registro tuvo que clasificar como `andamio` lo que ya era funcionalidad.**
2. **La revisión por pares se degradó, no mejoró.** 47 de 61 PRs sin revisor (77 %), contra 18 de 32
   (56 %) dos días antes. `BUG-005` se registró y el patrón siguió empeorando: registrar un problema
   de proceso no lo corrige.
3. **La compuerta C0 se declaró con un comando que no prueba lo que promete.** `docker compose
   config -q` valida YAML; no levanta el entorno. "Entorno reproducible" nunca se demostró
   reproduciéndolo.

**Acciones para el próximo sprint**

| Acción | Resp. | Para cuándo |
|---|---|---|
| Instalar un motor de contenedores (Docker Desktop o colima) y **reverificar C0 levantando el entorno de verdad**, con `docker compose up -d` y `./mvnw verify` completo sin errores de Testcontainers | D5 (Yordy) | Día 2 del Sprint 1 |
| Cambiar el comando de verificación de C0 en `registro-de-bloqueos.md` §1 por uno que arranque los servicios, no que solo lea el YAML | D5 (Yordy) | Con la acción anterior |
| Cerrar `BUG-005` con una medida que no dependa de la buena voluntad: exigir revisor en la plantilla de PR y revisarlo en la daily | Equipo | Primera daily del Sprint 1 |
