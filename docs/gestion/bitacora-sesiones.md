# Bitácora de sesiones de trabajo

> Registro **append-only** de cada sesión de trabajo con IA que produjo un cambio en el repositorio.
> Existe para que la sesión siguiente —tuya o de otro compañero— arranque sabiendo dónde quedó todo,
> sin reconstruir una conversación de horas.
>
> **Para agregar una entrada: usa la skill `cerrar-sesion`.**
> **Formato: 3 líneas máximo.** Una entrada larga es una entrada que nadie lee.

---

## Cómo se lee esto

| Campo | Qué significa |
|---|---|
| **Fecha** | AAAA-MM-DD |
| **Quién** | D1–D5 |
| **Rama** | Dónde quedó el trabajo |
| **Qué** | Una frase, en pasado, con el resultado — no la intención |
| **Sigue** | El siguiente paso concreto. Sin esto, la próxima sesión empieza decidiendo |

Referencias cruzadas: `ADR-NNN` · `BUG-NNN` · `RF0NN` · `archivo:línea`.
**Nunca se pega código aquí.**

---

## Sprint 0

### 2026-08-07 · D5 · `feature/d5-sprint0-infraestructura`
**Qué:** Creada `develop`, `.env.example`, `docker-compose.yml` base (Mongo+Redis+Mailhog) y workflows
de GitHub Actions (backend-ci, frontend-ci, secret-scan). Abierto PR #1 hacia `develop`. Registrado
BL-001: sin permiso `admin` en el repo remoto, no se pudo configurar branch protection.
**Sigue:** Que alguien con revisión apruebe/fusione el PR #1, y que Carlos (dueño del repo) configure
branch protection o le dé admin a Yordy para cerrar BL-001. C0 sigue cerrada: falta que existan
`/backend` y `/frontend` (sin dueño explícito de esa tarea en Sprint 0 — a discutir en planning).

### 2026-08-07 · Todos · `main`
**Qué:** Auditoría completa de la documentación. Se unificó `equipo/` dentro de `docs/equipo/`, se
crearon `docs/gestion/`, `docs/anexos/` e `docs/informe-metodologico/`, se estableció el sistema de
registro (bitácora, bugs, implementaciones) y el protocolo de contexto. Ver `ADR-008`.
**Sigue:** Cada integrante lee `docs/gestion/protocolo-de-contexto.md` antes de su primera sesión.

### 2026-08-06 · Todos · `main`
**Qué:** Auditoría de fuentes de datos con peticiones reales. Se corrigió el supuesto falso sobre el
`robots.txt` de Acuacar y se encontró su API REST (307 boletines). `ADR-004`, `ADR-005`.
**Sigue:** Reintentar GDELT, RCN, Caracol y W Radio con throttling (ver auditoría §8).

---

<!--
Plantilla — copiar, rellenar, pegar ARRIBA de la entrada más reciente del sprint en curso.

### AAAA-MM-DD · D<N> · `rama`
**Qué:** <resultado en pasado, máx. 2 líneas, con referencias ADR/BUG/RF>
**Sigue:** <siguiente paso concreto, una línea>

Rotación: al superar 30 entradas, las más viejas pasan a
docs/gestion/historico/bitacora-sprint-<N>.md. Lo hace quien cierra el sprint.
-->
