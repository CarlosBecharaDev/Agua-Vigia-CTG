---
name: cerrar-sesion
description: Cierra una sesión de trabajo dejando registro en la bitácora del proyecto y distribuyendo lo aprendido a los archivos que corresponde (MEMORY.md, ADR, registro de bugs, registro de implementaciones). Úsala al terminar una jornada de trabajo, antes de un /clear, o cuando el usuario diga que va a parar, retomar mañana o cambiar de tarea.
---

# Cerrar una sesión de trabajo

La conversación se pierde; la bitácora no. El objetivo es que la próxima sesión —de esta persona o de
otro compañero del equipo— arranque en tres líneas en vez de reconstruir horas de contexto.

## Procedimiento

### Paso 1 — Decide si hay algo que registrar

Se registra si la sesión **cambió el repositorio, descubrió algo, o dejó trabajo a medias**.

**No se registra** una sesión que solo consultó documentación o respondió preguntas sin producir
cambios. Una bitácora llena de entradas vacías es peor que no tener bitácora.

### Paso 2 — Reparte lo aprendido antes de escribir la entrada

Esto es lo que evita que la bitácora se convierta en el basurero donde va todo. Cada cosa a su sitio:

| Lo que pasó en la sesión | Dónde va | Cómo |
|---|---|---|
| Se eligió entre alternativas técnicas | `docs/design-decisions.md` | skill `registrar-decision` |
| Se descubrió un hecho verificado que costó descubrir | `MEMORY.md` | Edición directa, 3 líneas |
| Se encontró un defecto | `docs/gestion/registro-de-bugs.md` | skill `registrar-bug` |
| Se fusionó un PR a `develop` | `docs/gestion/registro-de-implementaciones.md` | skill `registrar-implementacion` |
| Se verificó una fuente de datos | `docs/ingenieria/auditoria-fuentes-de-datos.md` | skill `verificar-fuente` |
| Nada de lo anterior — solo avance de trabajo | Solo la bitácora | Paso 3 |

**Si una información ya quedó en un ADR o en `MEMORY.md`, en la bitácora va solo la referencia**
(`ADR-008`, `BUG-003`), nunca el contenido repetido.

### Paso 3 — Escribe la entrada

Va en `docs/gestion/bitacora-sesiones.md`, **arriba de la entrada más reciente** del sprint en curso.

```markdown
### AAAA-MM-DD · D<N> · `rama`
**Qué:** <resultado en pasado, máximo 2 líneas>
**Sigue:** <siguiente paso concreto, una línea>
```

### Paso 4 — Verifica los presupuestos

Si en esta sesión se agregó algo a `CLAUDE.md`, `MEMORY.md` o `DESIGN.md`, comprueba que sigan dentro
de su presupuesto de líneas (`docs/gestion/protocolo-de-contexto.md` §1). Si se pasó, mueve el detalle
a `docs/` y deja un puntero.

Si la bitácora superó las 30 entradas, rota las más viejas a
`docs/gestion/historico/bitacora-sprint-<N>.md`.

## Reglas de escritura

- **En pasado y con resultado, no con intención.** `Implementado POST /api/reportes con rate limiting
  en Redis`, no `trabajando en el endpoint de reportes`.
- **Referencias, no contenido.** `Corrige BUG-004`, no la explicación del bug otra vez.
- **Nunca código en la bitácora.** Solo `archivo:línea`.
- **"Sigue" es obligatorio y concreto.** `Falta conectar el SSE del mapa al store de TanStack Query`
  sirve; `continuar con el frontend` no dice nada.
- Si la sesión dejó algo roto o a medias, **dilo explícitamente** en "Sigue". Una bitácora que solo
  cuenta éxitos obliga al siguiente a descubrir el desastre por su cuenta.

## Al terminar

Confirma al usuario, en una línea, qué se registró y dónde. Si algo quedó sin registrar por decisión
suya, dilo también.
