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

### 2026-08-08 · D2 · `feature/d2-backend-base`
**Qué:** Creado el proyecto base de `/backend` (issue #9, PR #10): Maven, Java 21, Spring Boot 3.4.1,
estructura vacía de Arquitectura Limpia. `./mvnw verify` → BUILD SUCCESS local y en CI. El comando de
C0 (`docker compose config -q && ls backend frontend`) ya pasa completo.
**Sigue:** Avisar a D5 (Yordy) para que verifique C0 con su comando y la marque abierta en
`registro-de-bloqueos.md` §1 — no la abre D2, el titular de esa compuerta es D5.

### 2026-08-08 · D2 · `docs/d2-diseno-dominio-sprint0`
**Qué:** Diseño adelantado del dominio de M3/M6 (`docs/ingenieria/modelo-de-dominio.md`) mientras C0
sigue cerrada. Corregida la duplicación de `SuscribirseService` entre D1 y D2 (era de D1 por M4).
**Sigue:** Resolver quién crea el esqueleto de `/backend` en Sprint 0 para poder abrir C0.

### 2026-08-07 · D4 · `feature/d4-sprint0-esqueleto`
**Qué:** Esqueleto de `/frontend` creado: React 19 + Vite + TypeScript + Tailwind CSS v4. Tokens de `DESIGN.md` como custom properties CSS (paleta, temas claro/oscuro, tipografía, estado del servicio). `useTheme` hook + `SelectorTema` + `Encabezado` + rutas placeholder para M1, M2, M7, M8. `BL-002` registrado (D4 bloqueado por C0). Dev server en `localhost:5173`.
**Sigue:** Fusionar PR a `develop` con al menos 1 revisor, y esperar que D5 (Yordy) cierre BL-001 para que C0 quede abierta.

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
