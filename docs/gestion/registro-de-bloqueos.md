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
| **C0** · Entorno reproducible | D5 (verificó y declaró) · D2 aportó `/backend`, D4 aportó `/frontend` | Todos | `docker compose config -q && ls backend frontend` | 🟢 **Abierta** | 2026-08-08 |
| **C1** · Dominio y puertos | D2 | D3 · D1 | `ls backend/src/main/java/com/aguavigia/ctg/domain/port/out` | 🟢 Abierta — entidades, VOs y `domain/port/**` en `develop` (PR #21), ArchUnit en verde | 2026-08-08 |
| **C2** · Contrato OpenAPI | D3 · D1 | D4 | `git show develop:backend/openapi.yaml \| head -5` | 🟡 **Parcial — abre al fusionar el PR de D3** | 2026-08-08 |
| **C3** · SPA integrada contra API real | D4 | D5 (E2E · despliegue) | `cd frontend && npm run build` | 🔴 Cerrada | — |

Estados: 🔴 Cerrada · 🟡 Parcial (abierta solo para parte del alcance, detállalo) · 🟢 Abierta

**Quien abre una compuerta la marca aquí en el mismo PR que la abre**, y avisa en el chat del equipo.
Una compuerta abierta y no anunciada deja a un compañero bloqueado sin motivo.

### Alcance exacto de C2 (D3, 2026-08-08)

`backend/openapi.yaml` está versionado y generado desde la aplicación corriendo, no escrito a mano.
**El comando de verificación solo dará salida cuando el PR se fusione a `develop`** — hasta entonces
la compuerta figura 🟡 y no 🟢, porque el repositorio manda sobre la tabla.

**Abierto para D4:**

| Endpoint | Estado |
|---|---|
| `GET /api/sectores` | ✅ Contrato y backend terminados, probados contra Mongo real (211 sectores) |
| `GET /api/sectores/{id}` | ✅ Ídem, con 404 en `application/problem+json` (RFC 7807) |

**Sigue cerrado** (fuera de alcance, no empezar contra él): `POST /api/reportes` (Sprint 2), CRUD del
veedor (Sprint 3), estadísticas de M7 y bitácora de M8 — estos dos últimos son de D5 y D1, no de D3.

Dos avisos para D4 al generar el cliente:

1. `estado` y `actualizadoEn` son **anulables** en el contrato, y hoy vienen nulos en los 211
   sectores. No es un caso de borde: es el estado normal hasta el Sprint 2. Ver `ADR-014` y `BUG-008`.
2. El contrato se publica en **OpenAPI 3.0.1** a propósito: en 3.1 springdoc descarta `nullable` y el
   cliente generado tiparía `estado` como si siempre trajera valor.

Al conectar el frontend a estos dos endpoints caducan `DT-001` y `DT-002`.

---

## 2. Bloqueos abiertos — detalle

### BL-004 — D2 (Carlos) no puede empezar la lógica de consenso ni la de reportes: el Sprint 0 no ha cerrado formalmente

- **Fecha:** 2026-08-08 · **Rol bloqueado:** D2 · **Compuerta:** ninguna — es la frontera de fase de
  `ADR-009`, no una compuerta C0–C3 · **Titular que lo resuelve:** D5 (Yordy Pardo Pajaro, Scrum Master
  interino del Sprint 0)
- **Estado:** Abierto

**Tarea detenida:** `EvaluarConsensoService` (RF009–RF011, patrón Strategy) y `RegistrarReporteService`
(RF005–RF007) — lo que la hoja de ruta de `secuencia-de-trabajo.md` §4 marca como Sprint 2 de D2, pero
que ya podría empezar en cuanto exista un sprint abierto que lo autorice.
**Insumo que falta:** el Review de cierre del Sprint 0 (`sprint-0.md` §4, sin filas todavía) y el
Planning del Sprint 1 — son ceremonias del Scrum Master, no un artefacto de código.
**Verificación:** `ls docs/gestion/sprint-1.md` → no existe. `sprint-0.md` §4 "Review — qué se
demostró funcionando" está vacío. `ADR-009`: *"¿este código implementa un RF? Si la respuesta es sí,
no va en el Sprint 0"* — sigue vigente mientras el Sprint 0 no cierre. C0 y C1 (lo único que el
trabajo de D2 consume) ya están abiertas, así que **no es que falte el insumo de otro rol en el
sentido técnico** — es que falta la ceremonia que autoriza escribir el siguiente RF.
**Avisado en el chat:** sí, a Carlos (D2), 2026-08-08.
**Trabajo alterno tomado:** poner al día `registro-de-implementaciones.md` (faltan PR #21 y #44–48) y
`bitacora-sesiones.md` (sin entradas después del PR #33); ratificar `ADR-012`; corregir la mención de
`NotificacionPort` en `secuencia-de-trabajo.md` §3 Paso 2, que ya no es tarea de D2 desde la corrección
del `modelo-de-dominio.md` §5.
**Cierre:** pendiente.

---

**Nota aparte, no bloqueante — cerrada, 2026-08-08:** el cierre de BL-001 (tabla §3) decía que Carlos
le había dado rol `admin` a Yordy. **Causa raíz encontrada:** en un repositorio personal (no una
organización), GitHub no ofrece forma de cambiar el rol de un colaborador ya existente — ni por API
(`PUT .../collaborators/{user}` responde `204` pero no aplica el cambio) ni por la UI de Settings →
Collaborators, que solo muestra un botón para quitar el acceso, no un selector de rol. La única vía es
quitar a la persona y volver a invitarla con el rol nuevo, lo que le revoca el acceso hasta que acepte
una invitación nueva. Carlos decidió no hacerlo: la interrupción no vale la pena porque la resolución
de BL-001 ya es política documentada, sin bloqueo técnico (`ADR-010`). Yordy queda en `write`
permanentemente, por decisión explícita, no por un permiso que falló en aplicarse.

### BL-002 — D4 no puede integrar el frontend con el entorno Docker ni con el backend *(cerrado, ver §3)*

- **Fecha:** 2026-08-07 · **Rol bloqueado:** D4 · **Compuerta:** C0 · **Titular que la abre:** D5 (Yordy Pardo Pajaro)
- **Estado:** Cerrado — ver tabla §3

---

### BL-003 — Nadie puede ejecutar las tareas de D1 ni ser Scrum Master del Sprint 0 *(cerrado, ver §3)*

- **Fecha:** 2026-08-07 · **Rol bloqueado:** D1 (vacante) · **Compuerta:** ninguna · **Titular que lo resuelve:** el equipo
- **Estado:** Cerrado — ver tabla §3 y `ADR-011`

---

## 3. Bloqueos cerrados

| ID | Fecha | Rol bloqueado | Compuerta | Días detenido | Cómo se resolvió |
|---|---|---|---|---|---|
| BL-001 | 2026-08-07 | D5 | C0 (tarea parcial) | 0 | El equipo acordó no configurar branch protection técnica: la regla "no se hace push directo a `main`/`develop` sin PR revisado" queda como **política documentada**, formalizado en `ADR-010`. Yordy queda en `write`, no `admin` — en un repo personal no hay forma de subir el rol de un colaborador existente sin quitarlo y reinvitarlo, y Carlos decidió no interrumpirlo por esto (ver nota en §2). No bloquea nada porque la resolución fue política, no técnica. |
| — | 2026-08-08 | D5 (verificación de C0) | C0 | 1 | Mientras tanto, Carlos (D2, dueño del repo) había corrido el comando completo en su máquina y autorizó por escrito empezar el dominio sin esperar la declaración formal de D5 — excepción registrada, no un rodeo silencioso. D5 instaló el cliente de Docker (no lo tenía) para verificar por su cuenta con el comando **literal** de la compuerta. Al correrlo encontró un bug real (`BUG-003`): fallaba en cualquier clon limpio por depender de un `.env` no versionado. Lo corrigió (`env_file` opcional), volvió a correr `docker compose config -q && ls backend frontend` → **exit code 0**, y declaró C0 abierta formalmente. |
| BL-002 | 2026-08-07 | D4 | C0 | 1 | El único insumo pendiente era que D5 declarara C0 abierta (ya ocurrió el 2026-08-08, ver fila anterior) y que D4 instalara Docker Desktop — tarea propia, sin dependencia de nadie. Reverificado el 2026-08-08: `docker compose config -q && ls backend frontend` → exit code 0, `backend/` y `frontend/` presentes. D4 ya puede integrar el frontend contra el entorno Docker. |
| BL-003 | 2026-08-07 | D1 (vacante) | ninguna | 1 | D1 se reasigna temporalmente a Yordy Pardo Pajaro (D5), efectivo 2026-08-08 — `ADR-011`. Yordy pasa a responder también por M4, M8, documentación académica con IA y Scrum Master interino del Sprint 0. Reverificado: `grep "por asignar" docs/equipo/roles-y-tareas.md docs/equipo/D1-notificaciones-bitacora.md` → sin coincidencias. Sigue pendiente, pero ya no como bloqueo sino como trabajo por hacer de D1: enviar los dos correos (plantilla oficial, ICPSR) y producir los Anexos 1–3. |

**Los días detenidos son un dato del Capítulo IV**, no un reproche. Miden si la secuencia funcionó.

---

## 4. Desbloqueos temporales autorizados

Excepción única a la regla de no avanzar. **Solo la autoriza el titular de la compuerta**, por
escrito, y siempre con fecha de caducidad y tarea de reconciliación. Un desbloqueo sin caducidad es
deuda técnica disfrazada de permiso.

| ID | Compuerta | Autoriza | Qué se permite exactamente | Caduca | Issue de reconciliación | Estado |
|---|---|---|---|---|---|---|
| DT-001 | C2 | ✅ Sebastián Montes Olivera (D3, titular de C2) — 2026-08-08 | `SECTORES_MOCK` en `PaginaMapa.tsx:21`: datos de sectores escritos a mano donde debería ir `GET /api/sectores`. Introducido por el PR #12 (M1) | **Al cerrar el Sprint 1** — cuando D3 abra C2 para `/api/sectores` | [#34](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/34) | 🟡 **Vigente** |
| DT-002 | C2 | ✅ Sebastián Montes Olivera (D3, titular de C2) — 2026-08-08 | `SECTORES_MOCK` en `FormularioReporte.tsx:5` (M2): mismo patrón que DT-001, en el formulario de reporte. Introducido por el PR #19 | **Al cerrar el Sprint 1** — cuando D3 abra C2 para `POST /api/reportes` | [#35](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/35) | 🟡 **Vigente** |
| DT-003 | C2 | ✅ Sebastián Montes Olivera (D3, titular de C2) — 2026-08-08 | "Mock data de reportes" en `PaginaVeedor.tsx:75` (M5): datos de reportes ciudadanos para moderar, escritos a mano. Introducido por el PR #20 | **Al cerrar el Sprint 1** — cuando D3 abra C2 para la moderación de reportes | [#36](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/36) | 🟡 **Vigente** |
| DT-004 | C2 | ✅ D5 (Yordy Pardo Pajaro) — según confirma Sebastián Montes Olivera (D3) el 2026-08-08, decisión de equipo | "MOCK DATA" en `PaginaEstadisticas.tsx:20` (M7): `roles-y-tareas.md` asigna M7 a D5 | **Al cerrar el Sprint 1** | [#38](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/38) | 🟡 **Vigente** |
| DT-005 | C2 | ✅ D1 (Yordy Pardo Pajaro) — según confirma Sebastián Montes Olivera (D3) el 2026-08-08, decisión de equipo | `MOCK_EVENTOS` en `PaginaBitacora.tsx:10` (M8): módulo de D1 | **Al cerrar el Sprint 1** | [#39](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/39) | 🟡 **Vigente** |

**Sobre DT-001/002/003.** Los PRs #12, #19 y #20 se fusionaron con datos simulados en lugar de la API,
que no existe porque C2 está cerrada. Es una salida legítima —`secuencia-de-trabajo.md` §5 la
contempla— y D3 (titular de C2 para M2 y M5) las autoriza por escrito aquí el 2026-08-08, con
caducidad al cerrar el Sprint 1. No es un reproche a D4: ninguna de las tres pantallas se podía construir de
otro modo, y los propios PRs declaran que el mock se reemplaza al abrir C2. Issues de reconciliación
abiertos: [#34](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/34) (DT-001),
[#35](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/35) (DT-002),
[#36](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/36) (DT-003).

**Sobre DT-004 y DT-005.** Se detectaron en la auditoría del 2026-08-08 (mismo patrón: mock
sustituyendo una API bloqueada por C2). D3 no es su titular formal —M7 (`PaginaEstadisticas.tsx`)
tiene dueño ambiguo entre D3 y D5 según `roles-y-tareas.md`; M8 (`PaginaBitacora.tsx`) es
explícitamente de D1—, pero **Sebastián Montes Olivera (D3) confirma que D1 y D5 lo autorizaron
directamente en una conversación de equipo el 2026-08-08** y pidió dejarlo registrado en su nombre.
Se deja constancia de que esta autorización queda respaldada por el reporte de D3, no por un mensaje
escrito de D1/D5 verificable en este repositorio — igual que otras decisiones de equipo ya registradas
aquí (p. ej. `ADR-010`) se apoyan en la palabra de quien las cuenta. Si D1 o D5 la contradicen más
adelante, esta fila se corrige en el mismo momento.

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
