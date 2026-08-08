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
| REC-001 | 2026-08-08 | Formalizar quién es Rafael Sarmiento (`sarmientordev`) | Pendiente |
| REC-002 | 2026-08-08 | BUG-005 (PRs sin revisor) sigue abierto y el patrón no mejora | Pendiente |
| REC-003 | 2026-08-08 | C2 (contrato OpenAPI) es el cuello de botella real ahora mismo | Resuelta |
| REC-004 | 2026-08-08 | La cobertura de pruebas del frontend está muy por debajo de la del backend | Pendiente |
| REC-005 | 2026-08-08 | El ROSTER de `generar-dashboard.mjs` está escrito a mano, no se lee de ningún documento | Pendiente |

**Estado:** `Pendiente` (sin revisar) · `Validada` (el equipo está de acuerdo, puede pasar a
ADR/issue/tarea) · `Descartada` (el equipo no está de acuerdo — deja el motivo en el detalle) ·
`Resuelta` (ya se actuó sobre ella)

---

## Detalle

### REC-001 — Formalizar quién es Rafael Sarmiento (`sarmientordev`)

- **Fecha:** 2026-08-08 · **Estado:** Pendiente

Tiene acceso de escritura al repositorio pero no aparece en `docs/equipo/roles-y-tareas.md` ni tiene
un solo PR o commit todavía. Si es el 5.º integrante que se estaba esperando, formalícenlo (rol, ADR
de reasignación si corresponde) y agréguenlo al `ROSTER` de `scripts/generar-dashboard.mjs` — hoy ese
script lo excluye de todas las estadísticas del equipo por no estar en esa lista.

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
