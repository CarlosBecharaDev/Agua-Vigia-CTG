# Informe metodológico — estructura del entregable

> El entregable académico principal. Sigue la plantilla del Tecnológico Comfenalco:
> **4 capítulos + 6 anexos + referencias APA 7**.
>
> **Responsable:** D1, con asistencia de IA. **Valida:** el equipo completo.

---

## ⚠️ Antes de escribir una sola línea

**Este índice es una reconstrucción a partir de lo que el equipo ya documentó, no una copia de la
plantilla oficial.** La plantilla institucional del Tecnológico Comfenalco todavía no está en el
repositorio.

**Tarea bloqueante del Sprint 0 (D1):** conseguir el documento oficial de la plantilla, compararlo con
este índice y corregir lo que difiera. El docente evalúa contra la plantilla real; los títulos de
sección **no se inventan ni se renombran**.

Mientras eso no ocurra, cada archivo de capítulo debe llevar arriba la marca
`> ESTRUCTURA SIN VALIDAR CONTRA LA PLANTILLA OFICIAL`.

---

## Los cuatro capítulos

| Archivo | Capítulo | Contenido | Sprint |
|---|---|---|---|
| `capitulo-1-problema.md` | I — El problema | Planteamiento, formulación, justificación, objetivo general y específicos, alcance y limitaciones | 1 |
| `capitulo-2-marco-referencial.md` | II — Marco referencial | Antecedentes, marco teórico, conceptual y legal | 2 |
| `capitulo-3-metodologia.md` | III — Metodología | Enfoque proyectivo mixto, población y muestra, instrumentos, validación (Alfa de Cronbach ≥ 0.75), fases del desarrollo | 3 |
| `capitulo-4-resultados.md` | IV — Resultados | Resultados por objetivo específico, métricas del sistema, análisis de las encuestas, conclusiones y recomendaciones | 6 |
| `referencias.md` | Referencias | APA 7, ordenadas alfabéticamente | Continuo |

---

## De dónde sale el contenido — no se escribe desde cero

Casi todo el material ya existe en el repositorio. El trabajo de D1 es **transformar y citar**, no
inventar. Escribir desde cero lo que ya está documentado produce contradicciones.

| Capítulo | Fuente en el repositorio |
|---|---|
| I — Problema | `docs/brief.md` (problema, actores, diferencial, indicadores de éxito) · `MEMORY.md` (contexto citable: 15% de la población, planta El Bosque, fallo del Tribunal) |
| II — Marco legal | Ley 142/1994 · Ley 1581/2012 · fallo del Tribunal Administrativo de Bolívar (junio 2026) · CRA · SUI (`docs/ingenieria/auditoria-fuentes-de-datos.md` §5) |
| II — Marco teórico | Arquitectura Limpia y SOLID (`docs/design-decisions.md` ADR-001) · patrones aplicados (`docs/equipo/D2-backend-dominio.md`) |
| III — Metodología | Scrum de 7 sprints (`docs/gestion/README.md`) · instrumentos (Anexos 1–3) |
| IV — Resultados | `docs/gestion/registro-de-implementaciones.md` · `docs/gestion/registro-de-bugs.md` · métricas del clasificador de IA (`docs/ingenieria/pipeline-ingesta-datos.md` §4) · `docs/ingenieria/matriz-trazabilidad.md` |

---

## Los seis anexos

Detalle y responsables en [`docs/anexos/README.md`](../anexos/README.md).

---

## Reglas de redacción

- **Toda afirmación de dato lleva fuente citable.** Este proyecto ya tuvo un error por afirmar sin
  verificar (`MEMORY.md`); repetirlo en el informe sería la peor forma posible de hacerlo.
- **Las citas APA 7 se verifican una por una.** Una cita generada por IA que no corresponde a una
  fuente real es una falta académica grave, y la responsabilidad es de quien firma el informe.
- **La lección del `robots.txt` va en las conclusiones del Capítulo IV.** Una corrección documentada
  vale más que una certeza inventada, y está registrada con fecha en `ADR-004`.
- **Sin relleno.** Un capítulo inflado para llegar a un número de páginas se nota, y compite con lo
  que sí importa.
