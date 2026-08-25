---
name: registrar-bug
description: Registra un defecto en docs/gestion/registro-de-bugs.md con severidad, reproducción, causa raíz y corrección. Úsala en cuanto se detecte un comportamiento incorrecto —aunque se vaya a arreglar de inmediato— y también al cerrar un bug ya registrado.
---

# Registrar un bug

Se registra **al encontrarlo**, no al arreglarlo. Un bug que se corrige en cinco minutos y nunca se
escribe es un bug que el equipo no aprendió y que el informe final no puede contar.

## Cuándo usar esto

- El sistema hace algo distinto de lo que dice su requisito
- Una prueba que pasaba empieza a fallar
- Un compañero reporta un comportamiento raro, aunque todavía no se reproduzca
- Se cierra un bug ya registrado (actualizar su fila y comprimir su detalle)

**No** para: tareas pendientes (van a issues), mejoras deseables (van al backlog), ni deuda técnica
conocida y aceptada.

## Paso 1 — Asignar severidad

| Sev | Criterio |
|---|---|
| **S1** | Bloquea el uso del sistema **o publica información falsa** |
| **S2** | Una funcionalidad no sirve, pero hay forma de rodearla |
| **S3** | Molesta, no impide |
| **S4** | Cosmético |

**Regla dura del proyecto:** cualquier defecto que haga que la plataforma muestre un corte inexistente
o un Índice de Cumplimiento equivocado es **S1 siempre**, por raro que sea el caso. El único activo de
este proyecto es la credibilidad. Ver `ADR-006`.

## Paso 2 — Escribir la entrada

Toma el siguiente `BUG-NNN` del comentario al final de `docs/gestion/registro-de-bugs.md`.
Agrega la fila a la tabla de estado **y** el detalle en la sección de bugs abiertos:

```markdown
### BUG-NNN — <título: describe el síntoma, no la causa que supones>

- **Fecha:** AAAA-MM-DD · **Severidad:** S<N> · **Módulo:** M<N> · **Responsable:** D<N>
- **Estado:** Abierto

**Síntoma:** qué se observó. Hechos, no interpretación.
**Reproducción:** pasos exactos. Si no se reproduce de forma consistente, dilo — es parte del dato.
**Esperado:** qué debería pasar y por qué. Cita el `RF` si aplica.
**Causa raíz:** (al diagnosticar)
**Corrección:** (al cerrar)
```

## Paso 3 — Al cerrar el bug

1. **Escribe la causa raíz de verdad**, no el síntoma. `El parser asumía zona horaria UTC y los
   boletines vienen en America/Bogota` es una causa raíz; `fallaba la fecha` no lo es.
2. **Anota la prueba que impide que vuelva**, con su nombre. **Sin prueba, el bug no está cerrado** —
   está esperando.
3. **Si la causa raíz fue un requisito ambiguo o incompleto, corrige el requisito** en
   `docs/product-requirements.md`. Arreglar solo el código deja la trampa puesta para el siguiente.
4. Cambia el estado a `Cerrado` en la tabla y **comprime el detalle**: los bugs cerrados viven en la
   tabla resumen, no en la sección de detalle (`protocolo-de-contexto.md` §5).

## Reglas de escritura

- **El título describe el síntoma observable.** `El mapa muestra sectores en gris tras recargar`, no
  `error en el store de React`. La causa que supones al principio suele estar equivocada.
- **Nada de "a veces falla".** Di en qué condiciones lo viste, cuántas veces de cuántas, y en qué
  navegador o entorno.
- **No pegues stack traces completos.** La línea que importa y la referencia `archivo:línea`.

## Efecto en la Sala de control

La tabla de estado de `registro-de-bugs.md` es la fuente de la sección de bugs de la Sala de control
(`docs/gestion/README.md`), que se regenera sola en cada push a `develop`. Mantén las columnas `Sev`,
`Estado` y `Responsable` con los valores esperados (`S1`–`S4`, `Abierto`/`Cerrado`): el tablero
ordena por severidad y le atribuye el bug a su responsable a partir de ahí.
