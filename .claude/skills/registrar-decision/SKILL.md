---
name: registrar-decision
description: Registra una decisión de diseño o arquitectura en la bitácora del proyecto (docs/design-decisions.md) con el formato ADR acordado. Úsala cuando el equipo escoja entre alternativas, descarte un enfoque, cambie una decisión previa, o cuando se descubra algo que invalide un supuesto anterior.
---

# Registrar una decisión (ADR)

Añade una entrada a `docs/design-decisions.md`. Esa bitácora existe para que nadie —humano o
agente— vuelva a proponer un camino que ya se exploró y se descartó.

## Cuándo usar esto

- Se eligió entre dos o más alternativas técnicas
- Se descartó un enfoque tras probarlo
- Se cambió una decisión anterior (entonces la vieja se marca como *Reemplazada*)
- Se descubrió un hecho que invalida un supuesto sobre el que ya se había construido

**No** uses esto para registrar tareas terminadas, avances de sprint ni notas personales.

## Procedimiento

1. **Lee `docs/design-decisions.md` completo** antes de escribir. Puede que la decisión ya esté
   registrada, o que esta la contradiga — en ese caso hay que marcar la anterior como reemplazada,
   no dejar dos entradas en conflicto.
2. Toma el siguiente número consecutivo (`ADR-001`, `ADR-002`…).
3. Añade la entrada **al final** del archivo. La bitácora es cronológica y append-only: las entradas
   viejas **no se editan** salvo para cambiar su estado a *Reemplazada por ADR-NNN*.
4. Si la decisión cambia el entendimiento del producto o es un hallazgo verificado, añade también
   una línea en `MEMORY.md`.

## Plantilla

```markdown
## ADR-NNN — <Título en una línea, afirmativo>

- **Fecha:** AAAA-MM-DD
- **Estado:** Aceptada | Reemplazada por ADR-NNN | Descartada
- **Decide:** <rol o nombre>

### Contexto
Qué situación obligó a decidir. Incluye el dato verificado que la motivó, con su fuente.

### Alternativas consideradas
| Opción | A favor | En contra |
|---|---|---|
| A | | |
| B | | |

### Decisión
Qué se eligió, en una frase directa.

### Consecuencias
Qué se gana, qué se pierde y qué queda condicionado a esta decisión.

### Cómo se revierte
Qué habría que cambiar si en el futuro resulta equivocada. Si es irreversible, dilo.
```

## Reglas de escritura

- **El título afirma la decisión**, no la pregunta: *"Consumir la API REST de Acuacar en vez de
  scrapear HTML"*, no *"¿Cómo obtener datos de Acuacar?"*.
- **El contexto cita hechos verificados**, no impresiones. Si dice que un endpoint responde 200,
  alguien lo probó.
- **Las consecuencias incluyen lo malo.** Un ADR que solo lista ventajas no es un registro de
  decisión, es publicidad.
- Sin adornos ni relleno. Una entrada útil cabe en media página.
