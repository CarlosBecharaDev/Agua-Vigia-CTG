# Registro de bugs

> Todo defecto encontrado se registra aquí **en el momento en que se encuentra**, aunque se arregle
> cinco minutos después. Un bug que se arregla sin registrar es un bug que el equipo no aprendió.
>
> **Para agregar una entrada: usa la skill `registrar-bug`.**

---

## Por qué se registra incluso lo que ya se arregló

Tres razones concretas, no burocráticas:

1. **El informe final (Capítulo IV) necesita datos, no impresiones.** "Se detectaron 23 defectos, 19
   en pruebas automatizadas antes de llegar a `develop`" es un resultado medible. "Hubo algunos
   errores" no es nada.
2. **Los bugs se repiten.** El mismo error de zona horaria aparece tres veces si nadie lo escribió la
   primera.
3. **La causa raíz suele ser un requisito mal escrito.** Un bug que se rastrea hasta un `RF` ambiguo
   corrige el requisito, no solo el código.

---

## Tabla de estado

| ID | Fecha | Sev | Módulo | Título | Estado | Responsable |
|---|---|---|---|---|---|---|
| — | — | — | — | *Sin bugs registrados. El código de la aplicación aún no ha iniciado.* | — | — |

**Severidad:** `S1` bloquea el uso o publica dato falso · `S2` funcionalidad rota con rodeo posible ·
`S3` molesto pero no impide · `S4` cosmético
**Estado:** `Abierto` · `En curso` · `Cerrado` · `No se corrige` (con motivo)

---

## Bugs abiertos — detalle

*(Vacío. Los bugs abiertos se detallan completos aquí; al cerrarse, el detalle se reduce a su fila en
la tabla de arriba — ver `protocolo-de-contexto.md` §5.)*

---

## Regla especial: bugs que publican información falsa

Un defecto que haga que la plataforma muestre un corte que no existe, o un Índice de Cumplimiento
equivocado, es **siempre S1**, sin discusión y sin importar cuán raro sea el caso.

El único activo de este proyecto es la credibilidad. Un mapa que se ve lento es un problema; un mapa
que miente es el final del proyecto. Ver `ADR-006` y `MEMORY.md`.

---

<!--
Plantilla de bug abierto — copiar a la sección "Bugs abiertos — detalle".

### BUG-NNN — <título en una línea, describe el síntoma, no la causa supuesta>

- **Fecha:** AAAA-MM-DD · **Severidad:** S<N> · **Módulo:** M<N> · **Responsable:** D<N>
- **Estado:** Abierto

**Síntoma:** qué se observó. Hechos, no interpretación.
**Reproducción:** pasos exactos. Si no se puede reproducir, dilo — es parte del reporte.
**Esperado:** qué debería pasar, y por qué (cita el RF si aplica).
**Causa raíz:** se llena al diagnosticar. Si el origen es un requisito ambiguo, corrige también el requisito.
**Corrección:** qué se cambió + `archivo:línea` + prueba que lo cubre. Sin prueba, el bug vuelve.

Siguiente número disponible: BUG-001
-->
