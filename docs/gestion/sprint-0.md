# Sprint 0 — Preparación e infraestructura

**Fechas:** 2026-08-06 → 2026-09-02 *(4 semanas · confirmar en el planning)* · **Scrum Master del
sprint:** ⚠️ por designar — corresponde a D1, que no tiene titular (`BL-003`)

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
| D5 | — | **Verificar y declarar C0 abierta**, y anunciarlo al equipo | Proyecto base de `/backend` | 🔴 Bloqueado |
| D2 | — | **Proyecto base de `/backend`**: Maven, Java 21, Spring Boot 3.4, paquetes vacíos de Arquitectura Limpia | — | 🟡 En curso |
| D2 | — | Diseño del dominio de M3/M6 en `docs/ingenieria/modelo-de-dominio.md` | — | ✅ PR #4 |
| D4 | — | Esqueleto de `/frontend`: React 19 + Vite + TS + Tailwind, tokens de `DESIGN.md`, rutas vacías | — | ✅ PR #5 |
| D4 | — | Docker Desktop instalado y `docker compose up` corriendo en su máquina | — | 🔴 `BL-002` |
| D3 | — | Sin compromisos de código en el Sprint 0 — entra con **C1** | C1 | — |
| D1 | — | Anexos 1–3 · plantilla oficial del informe · solicitud a Meta Content Library | **Titular de D1** | 🔴 `BL-003` |

La columna **Depende de** es la importante: es donde se ven los bloqueos antes de que ocurran.
Cadena de dependencias y compuertas: [`../equipo/secuencia-de-trabajo.md`](../equipo/secuencia-de-trabajo.md) §1 y §2.

### Camino crítico — una sola cosa

```
D2 sube /backend  →  D5 verifica y abre C0  →  D2 empieza el dominio  →  C1  →  D3 y D1
                                            →  D4 integra el frontend (cierra BL-002)
```

**Todo lo demás del Sprint 0 ya está hecho.** El sprint depende hoy de un solo entregable.

---

## 3. Bloqueos del sprint — resumen

| ID | Compuerta | Quién quedó detenido | Días | Cómo se resolvió |
|---|---|---|---|---|
| BL-001 | C0 (parcial) | D5 | 0 | Rol `admin` concedido; branch protection descartada como control técnico (`ADR-010`) |
| BL-002 | C0 | D4 | en curso | Abierto — falta `/backend` y Docker en la máquina de D4 |
| BL-003 | — | D1 (vacante) | en curso | Abierto — no es técnico: falta la persona |

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
| PRs fusionados | 8 al 2026-08-07 |
| PRs fusionados **sin revisor** | 4 de 8 (#2, #4, #6, #7) — control de `ADR-010` |
| Bugs abiertos / cerrados | 0 / 2 (BUG-001, BUG-002) |
| Cobertura `domain/` + `application/` | n/a — no existe código de dominio todavía |
| Build en verde al cierre | Frontend CI ✅ · Backend CI no ha corrido nunca |

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
2. **La mitad de los PRs se fusionaron sin revisor**, contra la regla del equipo.
3. **Los registros se llenaron tarde**: 8 PRs fusionados y 2 bugs corregidos no aparecieron en
   `docs/gestion/` hasta la auditoría.

**Acciones para el próximo sprint**

| Acción | Resp. | Para cuándo |
|---|---|---|
| Designar Scrum Master interino mientras D1 esté vacante | Equipo | Antes del planning del Sprint 1 |
| Crear `sprint-N.md` el primer día del sprint, antes de la primera tarea | Scrum Master | Día 1 del Sprint 1 |
| Llenar el registro en el mismo PR, no después | Todos | Continuo |
