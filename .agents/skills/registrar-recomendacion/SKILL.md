---
name: registrar-recomendacion
description: Registra en docs/gestion/recomendaciones-ia.md una observación de mejora que Codex detecta al trabajar en el repositorio — algo que se está haciendo mal o podría hacerse mejor, para que el equipo la valide. Aparece automáticamente en la Sala de control (sección Recomendaciones) en la próxima regeneración. Úsala en el momento en que se nota algo, no al final de la sesión.
---

# Registrar una recomendación

Es una lectura para que el equipo valide, no un veredicto ni una tarea asignada. Se distingue de los
otros registros por lo que NO es:

- No es un defecto → eso es la skill `registrar-bug`.
- No es una decisión ya tomada entre alternativas → eso es la skill `registrar-decision`.
- No es una tarea pendiente → eso es un issue de GitHub.

## Cuándo usar esto

Al notar, en el trabajo normal de una sesión, algo que se está haciendo peor de lo que podría ser —un
riesgo, una inconsistencia, una deuda que crece, un cuello de botella entre roles. No hace falta que
sea grave ni que se pueda arreglar ahora mismo: el punto es dejarlo escrito para que el equipo lo vea
y decida, no resolverlo en silencio ni quedárselo para el resumen final.

## Paso 1 — Escribir la entrada

Toma el siguiente `REC-NNN` de la tabla en `docs/gestion/recomendaciones-ia.md`. Agrega la fila **y**
el detalle:

```markdown
| REC-NNN | AAAA-MM-DD | <título: la conclusión en una frase> | Pendiente |
```

```markdown
### REC-NNN — <mismo título>

- **Fecha:** AAAA-MM-DD · **Estado:** Pendiente

<2-4 frases: qué se observó, por qué importa, y si hay una acción concreta más barata que la obvia,
sugiérela. Cita archivo:línea o el ID del issue/PR/ADR que lo respalda — nunca una afirmación sin
dónde verificarla.>
```

## Paso 2 — Fecha real

Verifica la fecha con `date`, no con la que traigas en contexto — la misma regla de
`protocolo-de-contexto.md` §3 aplica aquí igual que en los bugs.

## Paso 3 — Cuando el equipo la resuelve

Alguien del equipo —no Codex— cambia el `Estado` a `Validada`, `Descartada` (con el motivo en una
línea) o `Resuelta`. No cambies tú ese estado a menos que el usuario te diga explícitamente en el
chat que la validó o descartó: es su lectura la que cuenta, no la tuya sobre la tuya.

## Reglas de escritura

- **El título es la conclusión, no la causa que supones.** `El ROSTER está duplicado entre el script
  y roles-y-tareas.md`, no `hay que refactorizar el script`.
- **Sin exagerar severidad.** Esto no es un bug: no uses S1–S4 ni digas "urgente" a menos que de
  verdad bloquee algo.
- **Máximo un párrafo corto por entrada.** Si necesita más espacio, probablemente es un ADR o un
  issue, no una recomendación.
