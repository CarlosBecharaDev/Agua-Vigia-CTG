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
| **C0** · Entorno reproducible | D5 | Todos | `docker compose config -q && ls backend frontend` | 🔴 Cerrada | — |
| **C1** · Dominio y puertos | D2 | D3 · D1 | `ls backend/src/main/java/com/aguavigia/ctg/domain/port/out` | 🔴 Cerrada | — |
| **C2** · Contrato OpenAPI | D3 · D1 | D4 | `git show develop:backend/openapi.yaml \| head -5` | 🔴 Cerrada | — |
| **C3** · SPA integrada contra API real | D4 | D5 (E2E · despliegue) | `cd frontend && npm run build` | 🔴 Cerrada | — |

Estados: 🔴 Cerrada · 🟡 Parcial (abierta solo para parte del alcance, detállalo) · 🟢 Abierta

**Quien abre una compuerta la marca aquí en el mismo PR que la abre**, y avisa en el chat del equipo.
Una compuerta abierta y no anunciada deja a un compañero bloqueado sin motivo.

---

## 2. Bloqueos abiertos — detalle

### BL-001 — No se puede configurar branch protection en `main`/`develop` por falta de permiso `admin`

- **Fecha:** 2026-08-07 · **Rol bloqueado:** D5 · **Compuerta:** C0 (tarea parcial, no la compuerta completa) · **Titular que la abre:** D5, pero requiere admin del repositorio (Carlos Bechara, D2, dueño de `CarlosBecharaDev/Agua-Vigia-CTG`)
- **Estado:** Abierto

**Tarea detenida:** configurar reglas de protección de rama en `main` y `develop` — tarea de Sprint 0
de D5 (`docs/equipo/D5-devops-qa.md` §2: "ramas main/develop y reglas de protección de PR").
**Insumo que falta:** permiso `admin` sobre `github.com/CarlosBecharaDev/Agua-Vigia-CTG`. La cuenta
autenticada del agente (Jordy-Lv, de D5) solo tiene `push` y `triage`.
**Verificación:**
1. `gh api repos/CarlosBecharaDev/Agua-Vigia-CTG --jq '{permissions}'` →
   `{"admin":false,"maintain":false,"pull":true,"push":true,"triage":true}`
2. `gh api repos/CarlosBecharaDev/Agua-Vigia-CTG/branches/main/protection -X PUT ...` → `404 Not Found`
   (2026-08-07)
**Avisado en el chat:** sí · a Yordy Pardo Pajaro (D5).
**Trabajo alterno tomado:** resto del alcance de Sprint 0 de D5 completado sin necesitar admin — rama
`develop` creada y publicada, `.env.example`, `docker-compose.yml` base (Mongo+Redis+Mailhog) y
workflows de GitHub Actions (backend-ci, frontend-ci, secret-scan). Ver PR #1:
`feature/d5-sprint0-infraestructura` → `develop`.
**Cierre:** pendiente — se cierra cuando Carlos Bechara configure la protección él mismo, o le dé
rol `admin` a Yordy en Settings → Collaborators del repositorio.

---

### BL-002 — D4 no puede integrar el frontend con el entorno Docker ni con el backend

- **Fecha:** 2026-08-07 · **Rol bloqueado:** D4 · **Compuerta:** C0 · **Titular que la abre:** D5 (Yordy Pardo Pajaro)
- **Estado:** Abierto

**Tarea detenida:** Integrar el proyecto `/frontend` con `docker compose` (backend + Redis + MongoDB corriendo). Sin entorno reproducible no se puede validar el flujo completo.
**Insumo que falta:** PR #1 de D5 fusionado en `develop`, Docker instalado en el entorno local, y carpeta `/backend` inicializada. Ruta esperada: raíz del repositorio.
**Verificación:**
```
> docker compose config -q && ls backend && ls frontend
docker : El término 'docker' no se reconoce como nombre de un cmdlet...
ls: No se encuentra la ruta 'backend' porque no existe.
ls: No se encuentra la ruta 'frontend' porque no existe.
```
**Avisado en el chat:** Sí · a José Daniel Zambrano (D4).
**Trabajo alterno tomado:** Esqueleto de `/frontend` creado (React 19 + Vite + TypeScript + Tailwind CSS v4), tokens de `DESIGN.md` como custom properties CSS, selector de tema claro/oscuro, rutas placeholder para M1/M2/M7/M8 — todo trabajo de Sprint 0 que no cruza ninguna compuerta.
**Cierre:** —

---

## 3. Bloqueos cerrados

| ID | Fecha | Rol bloqueado | Compuerta | Días detenido | Cómo se resolvió |
|---|---|---|---|---|---|
| — | — | — | — | — | *Sin bloqueos registrados.* |

**Los días detenidos son un dato del Capítulo IV**, no un reproche. Miden si la secuencia funcionó.

---

## 4. Desbloqueos temporales autorizados

Excepción única a la regla de no avanzar. **Solo la autoriza el titular de la compuerta**, por
escrito, y siempre con fecha de caducidad y tarea de reconciliación. Un desbloqueo sin caducidad es
deuda técnica disfrazada de permiso.

| ID | Compuerta | Autoriza | Qué se permite exactamente | Caduca | Issue de reconciliación | Estado |
|---|---|---|---|---|---|---|
| — | — | — | *Sin desbloqueos vigentes.* | — | — | — |

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

Siguiente número disponible: BL-003
-->
