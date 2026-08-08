# Sprint 0 — Preparación e infraestructura

**Fechas:** 2026-08-06 → 2026-09-02 *(4 semanas · confirmar en el planning)* · **Scrum Master del
sprint:** Yordy Pardo Pajaro (D5), interino desde 2026-08-08 (`ADR-011`, `BL-003` cerrado)

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
| D3 | — | Sin compromisos de código en el Sprint 0 — entra con **C1** | C1 | — |
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
| DT-001 | C2 | — | — | Desbloqueo temporal **sin regularizar**: `SECTORES_MOCK` del PR #12. Pendiente autorización de D3, titular de C2 |

---

## 4. Review — qué se demostró funcionando

*(Se llena el último día del sprint. Solo lo que se pudo mostrar corriendo.)*

| RF/RNF | Qué se demostró | ¿Aceptado? |
|---|---|---|

**Comprometido:** 0 requisitos *(por diseño — `ADR-009`)* · **Entregado:** — · **Arrastrado:** —

---

## 5. Métricas del sprint

| Métrica | Valor |
|---|---|
| Requisitos entregados / comprometidos | 0 / 0 — el Sprint 0 no entrega requisitos |
| PRs fusionados | 32 al 2026-08-08 |
| PRs fusionados **sin revisor registrado** | 18 de 32 — control de `ADR-010` |
| Bugs abiertos / cerrados | 0 / 3 (BUG-001, BUG-002, BUG-003) — BUG-004 también cerrado |
| Bloqueos abiertos / cerrados | 0 / 3 (BL-001, BL-002, BL-003) |
| Desbloqueos temporales sin regularizar | 1 (DT-001, `SECTORES_MOCK` del PR #12) |
| Cobertura `domain/` + `application/` | n/a — todavía sin casos de uso implementados (`port/in` es andamio, PR #21) |
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
