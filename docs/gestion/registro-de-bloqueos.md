# Registro de bloqueos y estado de las compuertas

> Un **bloqueo** es una tarea que no puede avanzar porque su insumo lo produce otro rol y todavía no
> existe. Se registra aquí **en el momento en que se detecta** y se avisa en el chat a la persona
> que está trabajando. No avanzar es la conducta correcta; avanzar inventando el insumo faltante es
> lo que rompe el proyecto.
>
> **Para agregar o cerrar una entrada: usa la skill `registrar-bloqueo`.**
> Las compuertas, quién las abre y qué habilitan: [`../equipo/secuencia-de-trabajo.md`](../equipo/secuencia-de-trabajo.md) §2.

---

## 1. Estado de las compuertas — tabla viva

**Esta tabla es la fuente de verdad del avance del equipo.** El agente la lee antes de empezar
cualquier tarea, y **la verifica con el comando de la columna**: la tabla puede estar desactualizada,
el repositorio no.

| Compuerta | La abre | Habilita a | Comando de verificación | Estado | Abierta el |
|---|---|---|---|---|---|
| **C0** · Entorno reproducible | D5 (verifica y declara) · D2 aportó `/backend`, D4 aportó `/frontend` | Todos | `docker compose config -q && ls backend frontend` | 🟡 Parcial — el comando completo ya pasó en la máquina de D2 (ver detalle abajo); falta que D5 lo confirme en la suya y declare | — |
| **C1** · Dominio y puertos | D2 | D3 · D1 | `ls backend/src/main/java/com/aguavigia/ctg/domain/port/out` | 🟢 Abierta — entidades, VOs y `domain/port/**` en `develop` (PR #21), ArchUnit en verde | 2026-08-08 |
| **C2** · Contrato OpenAPI | D3 · D1 | D4 | `git show develop:backend/openapi.yaml \| head -5` | 🔴 Cerrada | — |
| **C3** · SPA integrada contra API real | D4 | D5 (E2E · despliegue) | `cd frontend && npm run build` | 🔴 Cerrada | — |

Estados: 🔴 Cerrada · 🟡 Parcial (abierta solo para parte del alcance, detállalo) · 🟢 Abierta

**Quien abre una compuerta la marca aquí en el mismo PR que la abre**, y avisa en el chat del equipo.
Una compuerta abierta y no anunciada deja a un compañero bloqueado sin motivo.

---

## 2. Bloqueos abiertos — detalle

### C0 · verificación parcial (2026-08-08, D5 y D2)

`ls backend frontend` → **existen los dos** (Carlos creó el proyecto base del backend en el PR #10,
José Daniel ya tenía `/frontend` desde Sprint 0). D5 no tiene Docker en su máquina y no pudo correr
`docker compose config -q`. **D2 sí lo tiene y corrió el comando completo** (`docker compose config -q
&& ls backend frontend`, con un `.env` temporal a partir de `.env.example`, no comiteado) → sin
errores. Falta que D5 lo confirme en su entorno y declare C0 — no lo hace D2, D2 no es el titular.

**Excepción registrada, 2026-08-08:** Carlos (dueño del repositorio, rol D2) autoriza explícitamente
empezar el trabajo de dominio de Sprint 1 sin esperar la declaración formal de D5, porque el criterio
técnico de C0 ya se verificó dos veces con el comando exacto de la compuerta. No es un desbloqueo
temporal de los de §4 (esos aplican a datos simulados con caducidad) — es la persona con autoridad
sobre el proyecto decidiendo avanzar con el riesgo ya medido, y queda escrito aquí para que no sea un
rodeo silencioso. **Pendiente:** D5 sigue debiendo declarar C0 formalmente cuando pueda verificarla en
su propio entorno; si al hacerlo encuentra algo distinto a lo que reportó D2, se reabre como bug.

**Nota aparte, no bloqueante — actualizada:** el cierre de BL-001 (tabla §3) dice que Carlos le dio rol
`admin` a Yordy, pero **sigue sin verificarse de verdad**: `gh api
repos/.../collaborators/Jordy-Lv/permission` devuelve `write`, no `admin`, incluso después de repetir
el `PUT` de concesión dos veces (ambas responden `204 No Content`, pero el permiso no cambia — no hay
invitación pendiente que lo explique). No afecta la resolución acordada (política documentada, sin
bloqueo técnico de GitHub — `ADR-010`), pero el dato de BL-001/§3 es impreciso: falta que alguien lo
confirme o corrija manualmente desde Settings → Collaborators.

### BL-002 — D4 no puede integrar el frontend con el entorno Docker ni con el backend

- **Fecha:** 2026-08-07 · **Rol bloqueado:** D4 · **Compuerta:** C0 · **Titular que la abre:** D5 (Yordy Pardo Pajaro)
- **Estado:** Abierto

**Tarea detenida:** Integrar el proyecto `/frontend` con `docker compose` (backend + Redis + MongoDB corriendo). Sin entorno reproducible no se puede validar el flujo completo.
**Insumo que falta** *(actualizado el 2026-08-07 tras la auditoría)*: **ninguno del lado del equipo.** Solo falta que D5 declare C0 abierta, y que D4 instale Docker Desktop en su máquina — tarea suya, que no depende de nadie.
**Ya no falta:** el PR #1 de D5 (fusionado en `43cb22d`), `/frontend` (PR #5) ni `/backend` (PR #10).
**Verificación** *(2026-08-07, contra `develop` al día)*:
```
> ls backend frontend
backend  frontend
```
**Avisado en el chat:** Sí · a José Daniel Zambrano (D4).
**Trabajo alterno tomado:** Esqueleto de `/frontend` creado (React 19 + Vite + TypeScript + Tailwind CSS v4), tokens de `DESIGN.md` como custom properties CSS, selector de tema claro/oscuro, rutas placeholder para M1/M2/M7/M8 — todo trabajo de Sprint 0 que no cruza ninguna compuerta.
**Cierre:** —

---

### BL-003 — Nadie puede ejecutar las tareas de D1 ni ser Scrum Master del Sprint 0

- **Fecha:** 2026-08-07 · **Rol bloqueado:** D1 (vacante) · **Compuerta:** ninguna · **Titular que lo resuelve:** el equipo
- **Estado:** Abierto

**Tarea detenida:** todo el Sprint 0 de D1 y la conducción del sprint. Concretamente:

| Qué está detenido | Por qué urge |
|---|---|
| Conseguir la **plantilla oficial** del informe | Marcada como *bloqueante* en `CLAUDE.md`, `informe-metodologico/README.md` y `anexos/README.md`. Los 4 capítulos y los 6 anexos son hoy una reconstrucción sin validar |
| Solicitar **Meta Content Library** vía ICPSR | `MEMORY.md` advierte que *puede tardar semanas y puede no aprobarse*. Cada día sin enviarla es riesgo puro sobre el alcance |
| **Anexos 1–3** (encuesta, guion de entrevista, validación) | Vencen en el Sprint 0; el Alfa de Cronbach ≥ 0.75 depende de que el instrumento exista a tiempo |
| **Scrum Master del Sprint 0** | `roles-y-tareas.md` lo asigna a D1. Sin él, nadie convoca planning ni llena `sprint-0.md` — que es justamente por lo que la creación de `/backend` pasó dos sesiones sin dueño |

**Insumo que falta:** el 5.º integrante, o una reasignación temporal acordada. `roles-y-tareas.md` marca D1 como *"por asignar"* desde el 2026-08-07.
**Verificación:**
```
> grep "por asignar" docs/equipo/roles-y-tareas.md
| **D1** | ⚠️ *por asignar — 5.º integrante* | Notificaciones, bitácora pública y ...
```
**Avisado en el chat:** Sí · al equipo, en la auditoría del 2026-08-07.
**Trabajo alterno tomado:** ninguno posible — no es un bloqueo técnico que se pueda rodear trabajando en otra cosa: es una vacante.
**Lo mínimo para destrabar hoy**, sin esperar al 5.º integrante: que un titular cualquiera envíe los dos correos (plantilla al docente, solicitud a ICPSR) y que el equipo designe Scrum Master del Sprint 0 entre los cuatro. Ambas cosas toman minutos y destraban meses.
**Cierre:** —

---

## 3. Bloqueos cerrados

| ID | Fecha | Rol bloqueado | Compuerta | Días detenido | Cómo se resolvió |
|---|---|---|---|---|---|
| BL-001 | 2026-08-07 | D5 | C0 (tarea parcial) | 0 | El equipo acordó no configurar branch protection técnica: la regla "no se hace push directo a `main`/`develop` sin PR revisado" queda como **política documentada**, formalizado en `ADR-010`. Carlos intentó darle rol `admin` a Yordy (2 veces, `204 No Content` ambas) pero la API sigue reportando `write` — sin confirmar, ver nota en §2. No bloquea nada porque la resolución fue política, no técnica. |

**Los días detenidos son un dato del Capítulo IV**, no un reproche. Miden si la secuencia funcionó.

---

## 4. Desbloqueos temporales autorizados

Excepción única a la regla de no avanzar. **Solo la autoriza el titular de la compuerta**, por
escrito, y siempre con fecha de caducidad y tarea de reconciliación. Un desbloqueo sin caducidad es
deuda técnica disfrazada de permiso.

| ID | Compuerta | Autoriza | Qué se permite exactamente | Caduca | Issue de reconciliación | Estado |
|---|---|---|---|---|---|---|
| DT-001 | C2 | ⚠️ **nadie todavía** — lo debe autorizar D3 (titular de C2) | `SECTORES_MOCK` en `/frontend`: datos de sectores escritos a mano donde debería ir `GET /api/sectores`. Introducido por el PR #12 (M1) | *por fijar* | *por abrir* | ⚠️ **Por regularizar** |

**Sobre DT-001.** El PR #12 se fusionó con datos simulados en lugar de la API, que no existe porque
C2 está cerrada. Es una salida legítima —`secuencia-de-trabajo.md` §5 la contempla— pero requiere
autorización escrita del titular, caducidad e issue de reconciliación, y ninguna de las tres se
registró. No es un reproche a D4: el mapa no se podía construir de otro modo y el propio PR declara
que `SECTORES_MOCK` se reemplaza al abrir C2. Lo que falta es dejarlo escrito, que es justamente lo
que impide que un dato simulado sobreviva hasta el Sprint 6.

**Para cerrarlo:** D3 autoriza y fija caducidad (propuesta: al abrir C2), se abre el issue de
reconciliación y se marca la fila como vigente. Si caduca sin reconciliar, pasa a bug S2.

Condiciones obligatorias de todo desbloqueo temporal:

1. Lo provisional queda **detrás de una bandera o en un archivo con sufijo `.provisional`**, nunca
   mezclado con el código definitivo.
2. Existe un issue abierto para retirarlo, enlazado en la fila.
3. **Si caduca y sigue vigente, se convierte en bug S2** y se registra como tal.

---

<!--
Plantilla de bloqueo abierto — copiar a la sección 2.

### BL-NNN — <qué no se puede hacer, en una línea>

- **Fecha:** AAAA-MM-DD · **Rol bloqueado:** D<N> · **Compuerta:** C<N> · **Titular que la abre:** D<N>
- **Estado:** Abierto

**Tarea detenida:** qué se iba a hacer + RF que implementa.
**Insumo que falta:** el artefacto concreto, con su ruta esperada.
**Verificación:** el comando que se corrió y su salida real. Sin esto la entrada no vale — el
proyecto ya pagó una vez el precio de afirmar sin verificar (ver `MEMORY.md`).
**Avisado en el chat:** sí/no · a quién.
**Trabajo alterno tomado:** en qué se avanzó mientras tanto, o "ninguno" si no lo había.
**Cierre:** fecha + cómo se abrió la compuerta.

Siguiente número disponible: BL-004
-->
