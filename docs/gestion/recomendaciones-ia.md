# Recomendaciones de la IA

> Observaciones que Claude registra al trabajar en este repositorio, cuando nota algo que se está
> haciendo mal o que podría hacerse mejor. No es un defecto (eso va a `registro-de-bugs.md`) ni una
> decisión ya tomada entre alternativas (eso va a `design-decisions.md`) — es una lectura que el
> equipo valida o descarta.
>
> **Para agregar una entrada: usa la skill `registrar-recomendacion`.**
> Aparecen en la Sala de control (sección **Recomendaciones**) en cada regeneración — no hace falta
> tocar el HTML a mano.

---

## Tabla de estado

| ID | Fecha | Título | Estado |
|---|---|---|---|
| REC-001 | 2026-08-08 | Formalizar quién es Rafael Sarmiento (`sarmientordev`) | Resuelta |
| REC-002 | 2026-08-08 | BUG-005 (PRs sin revisor) sigue abierto y el patrón no mejora | Pendiente |
| REC-003 | 2026-08-08 | C2 (contrato OpenAPI) es el cuello de botella real ahora mismo | Resuelta |
| REC-004 | 2026-08-08 | La cobertura de pruebas del frontend está muy por debajo de la del backend | Pendiente |
| REC-005 | 2026-08-08 | El ROSTER de `generar-dashboard.mjs` está escrito a mano, no se lee de ningún documento | Pendiente |
| REC-006 | 2026-08-09 | `RateLimitConfig` se cuela en cualquier `@WebMvcTest` aunque no se importe, y rompe pruebas en silencio al activar reglas reales | Pendiente |
| REC-007 | 2026-08-28 | Las ramas fusionadas se acumulan en GitHub porque falta activar el borrado automático | Pendiente |
| REC-008 | 2026-08-30 | El fuente de `index.css` está semi-minificado: el breakpoint móvil completo vive en una sola línea de 2.509 caracteres | Pendiente |
| REC-009 | 2026-08-30 | 25 reglas usan `transition: all`, que anima también propiedades de layout y dispara reflow en cada hover | Pendiente |

**Estado:** `Pendiente` (sin revisar) · `Validada` (el equipo está de acuerdo, puede pasar a
ADR/issue/tarea) · `Descartada` (el equipo no está de acuerdo — deja el motivo en el detalle) ·
`Resuelta` (ya se actuó sobre ella)

---

## Detalle

### REC-001 — Formalizar quién es Rafael Sarmiento (`sarmientordev`)

- **Fecha:** 2026-08-08 · **Estado:** Resuelta

Tiene acceso de escritura al repositorio pero no aparece en `docs/equipo/roles-y-tareas.md` ni tiene
un solo PR o commit todavía. Si es el 5.º integrante que se estaba esperando, formalícenlo (rol, ADR
de reasignación si corresponde) y agréguenlo al `ROSTER` de `scripts/generar-dashboard.mjs` — hoy ese
script lo excluye de todas las estadísticas del equipo por no estar en esa lista.

**Resuelta:** el 2026-08-08 se confirmó a Rafael como 5.º integrante y D1 quedó en su nombre
(`docs/design-decisions.md` — ADR-021, reemplaza a `ADR-011`; `roles-y-tareas.md`). Se agregó
`sarmientordev` al `ROSTER` de `scripts/lib/datos-proyecto.mjs`. Sigue pendiente que Rafael haga su
primer PR para que entre en las estadísticas reales. Misma tarea cerrada por PR #81, el resto del
traspaso (ADR, ficha D1, sprint-1.md, bloqueos) ya estaba fusionado en `develop` (commit `9cea8ee`).

### REC-002 — BUG-005 (PRs sin revisor) sigue abierto y el patrón no mejora

- **Fecha:** 2026-08-08 · **Estado:** Pendiente

`ADR-010` decidió conscientemente no usar branch protection técnica, y es una decisión razonable —
pero el propio registro de bugs admite que la disciplina no está sosteniendo la política sola. Antes
de escalar a protección técnica, algo más barato: una plantilla de PR con un checklist de "revisor
asignado" y que el Scrum Master del sprint lo audite en la retro, como ya dice `roles-y-tareas.md`
que debería hacer.

### REC-003 — C2 (contrato OpenAPI) es el cuello de botella real ahora mismo

- **Fecha:** 2026-08-08 · **Estado:** Resuelta — el 2026-08-08, al fusionar el PR #56

D4 ya construyó cuatro pantallas completas contra datos simulados (5 issues de reconciliación
abiertos: #34, #35, #36, #38, #39) y ese es trabajo real que se pierde si el contrato final no
coincide con la forma que asumieron los mocks. Vale la pena que D3 y D1 publiquen aunque sea un
`openapi.yaml` parcial pronto — no hace falta que esté completo para reducir el riesgo de que la UI
ya construida tenga que rehacerse.

**Resuelta:** el PR #56 publicó `backend/openapi.yaml` (`GET /api/sectores` y `/api/sectores/{id}`) y
abrió C2 formalmente. Los 5 issues de reconciliación siguen abiertos — falta que D4 conecte el
frontend al contrato real y los cierre — pero eso ya no es un bloqueo de C2, es trabajo normal de D4.

### REC-004 — La cobertura de pruebas del frontend está muy por debajo de la del backend

- **Fecha:** 2026-08-08 · **Estado:** Pendiente

El backend tiene 23 pruebas reales, incluido ArchUnit protegiendo la Regla de Oro. El frontend tiene
2 (`InsigniaEstado.test.tsx`, `PaginaVeedor.test.tsx`) contra 20 archivos de componentes. `RNF017`
pide ≥70% de cobertura — vale la pena empezar a cerrar esa brecha antes de que el Sprint 2 traiga más
superficie de UI todavía sin probar.

### REC-005 — El ROSTER de `generar-dashboard.mjs` está escrito a mano, no se lee de ningún documento

- **Fecha:** 2026-08-08 · **Estado:** Pendiente

Es exactamente el mismo tipo de dato "vive en un solo lugar" que `protocolo-de-contexto.md` pide
evitar duplicar. Si el roster cambia (como en `REC-001`) y alguien actualiza `roles-y-tareas.md` sin
tocar el script, el dashboard queda mintiendo con toda confianza. Vale la pena, en algún momento,
mover ese mapeo a un archivo que ambos lean.

### REC-006 — `RateLimitConfig` se cuela en cualquier `@WebMvcTest` aunque no se importe, y rompe pruebas en silencio al activar reglas reales

- **Fecha:** 2026-08-09 · **Estado:** Pendiente

Al llenar `aguavigia.rate-limit.reglas` con las reglas de `/api/veedor/sesion` y `/api/reportes`
(`feature/d3-cache-sectores-y-rate-limit`), 9 pruebas en `ReporteControllerTest` y
`VeedorAuthControllerTest` empezaron a fallar con 500: `RateLimitConfig` implementa
`WebMvcConfigurer`, así que Spring lo instancia en cualquier slice `@WebMvcTest` aunque la clase no
lo importe, y con reglas vacías nadie lo había notado. Se resolvió con
`@TestPropertySource(properties = "aguavigia.rate-limit.reglas=")` en los dos slices afectados. Vale
la pena que el equipo decida si dejarlo anotado en el propio `RateLimitConfig.java` o como convención
de plantilla para nuevos `@WebMvcTest`, para que no vuelva a morder a la próxima persona que agregue
una regla.

### REC-007 — Las ramas fusionadas se acumulan en GitHub porque falta activar el borrado automático

- **Fecha:** 2026-08-28 · **Estado:** Pendiente

Al auditar `https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/branches` se encontraron 4 ramas
remotas y 11 locales completamente fusionadas a `main` (0 commits propios cada una), incluida
`fix/consenso-desempate-2` con un worktree local aparte (`ctg-fix-consenso`) que también quedó
huérfano. Ninguna traía trabajo pendiente, pero nadie las había borrado tras fusionar sus PRs. Vale la
pena activar **"Automatically delete head branches"** en Settings → General → Pull Requests del repo
para que esto no se repita cada pocos sprints.

### REC-008 — El fuente de `index.css` está semi-minificado: el breakpoint móvil completo vive en una sola línea de 2.509 caracteres

- **Fecha:** 2026-08-30 · **Estado:** Pendiente

`frontend/src/index.css` tiene 3.702 líneas y 147 KB, pero 29 de esas líneas concentran 32,5 KB: la
más larga son 4.680 caracteres (`index.css:202`) y **todo el breakpoint móvil está en
`index.css:214`, en una sola línea de 2.509 caracteres**. No es el CSS compilado, es el fuente que
se versiona. Eso hace que cualquier ajuste de responsividad sea ilegible en el diff de un PR —
tocar una regla móvil marca la línea entera como cambiada, así que el revisor no puede ver qué
cambió, que es justo lo que exige la política de 1 revisor por PR. Basta correr Prettier sobre el
archivo una vez; el riesgo es un diff enorme irrepetible, así que conviene hacerlo en un PR propio
que no mezcle ningún cambio de estilo.

### REC-009 — 25 reglas usan `transition: all`, que anima también propiedades de layout y dispara reflow en cada hover

- **Fecha:** 2026-08-30 · **Estado:** Pendiente

Hay 25 `transition: all` repartidas entre `ModalReporte.css`, `ModalSuscripcion.css`,
`PanelVeedor.css`, `SeccionBitacora.css`, `SeccionEstadisticas.css` y `GooeyNav.css` (por ejemplo
`PanelVeedor.css:87`). `all` no distingue: si la regla cambia `padding`, `width` o `border-width`,
el navegador recalcula layout y repinta en cada hover, en vez de quedarse en la GPU como haría con
`transform` y `opacity`. Se nota sobre todo en el móvil de gama baja, que es el dispositivo del
usuario objetivo de esta plataforma. La corrección no es mecánica —hay que mirar qué propiedad
cambia de verdad en cada regla y nombrarla— así que conviene repartirla por componente y no
intentarla de una sola pasada.
