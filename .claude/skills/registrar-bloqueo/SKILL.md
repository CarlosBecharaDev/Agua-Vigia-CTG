---
name: registrar-bloqueo
description: Registra en docs/gestion/registro-de-bloqueos.md que una tarea no puede avanzar porque falta un insumo que produce otro rol, y avisa en el chat con el formato acordado. Úsala en cuanto detectes que una compuerta de la secuencia de trabajo está cerrada, y también al cerrar un bloqueo o al abrir una compuerta.
---

# Registrar un bloqueo

Se registra **antes de intentar rodearlo**. Un bloqueo que se rodea inventando el insumo faltante
—tipos escritos a mano, un DTO "provisional", un mock que nadie retira— no se ve hasta la
integración, y para entonces cuesta un sprint.

Contexto de por qué existe la secuencia y qué compuerta habilita a quién:
`docs/equipo/secuencia-de-trabajo.md` §2 y §5.

## Cuándo usar esto

- Vas a empezar una tarea y el insumo que necesita **no existe todavía en `develop`**
- La compuerta de la que dependes está 🔴 o 🟡 en `docs/gestion/registro-de-bloqueos.md` §1
- El titular de la compuerta autoriza un **desbloqueo temporal** (se registra igual, en §4)
- **Se abre** una compuerta o se resuelve un bloqueo (actualizar, no borrar)

**No** para: una tarea que simplemente no has empezado, una duda de diseño (eso es un ADR), ni un
defecto en algo que sí existe (eso es `registrar-bug`).

## Paso 1 — Verificar, no suponer

Corre el comando de verificación de la compuerta que aparece en la tabla §1 del registro y **guarda
su salida real**. Sin verificación no hay bloqueo: hay una suposición.

Este proyecto ya perdió trabajo por afirmar sin comprobar (`MEMORY.md`, corrección del 2026-08-06).
La misma disciplina aplica aquí: no se declara bloqueado ni desbloqueado a nadie de memoria.

## Paso 2 — Escribir la entrada

Toma el siguiente `BL-NNN` del comentario al final de `docs/gestion/registro-de-bloqueos.md` y
copia la plantilla a la sección **2. Bloqueos abiertos**. Los campos no son decorativos:

- **Insumo que falta** — el artefacto y su ruta esperada, no "el backend".
- **Verificación** — comando + salida. Literal.
- **Trabajo alterno tomado** — qué sí se puede hacer sin cruzar la compuerta. Un bloqueo casi nunca
  detiene el 100% del rol; detiene una tarea.

## Paso 3 — Avisar en el chat — obligatorio

Registrar sin avisar no sirve: nadie lee un archivo que no sabe que cambió. Usa este formato exacto:

```
🚧 BLOQUEO — no puedo avanzar
Rol · tarea:  D4 · componente MapaSectores (RF-004)
Depende de:   compuerta C2 — contrato OpenAPI (titular D3)
Verificación: `git show develop:backend/openapi.yaml` → fatal: path no existe (2026-08-07)
Registrado:   docs/gestion/registro-de-bloqueos.md → BL-003
Sí puedo avanzar en: tokens de DESIGN.md, layout sin datos, pruebas de accesibilidad estáticas
Necesito de ti: que D3 publique el contrato, o un desbloqueo temporal por escrito
```

Se avisa **aunque el bloqueo ya esté registrado por otra persona**. El registro es memoria del
proyecto; el aviso es lo que desatasca a un humano hoy.

## Paso 4 — Al cerrar

1. Verifica de nuevo con el comando. **La compuerta se abre con evidencia, no con un "ya quedó".**
2. Marca 🟢 en la tabla §1 con la fecha, mueve el bloqueo a la tabla §3 con los días detenido.
3. Avisa en el chat:

```
✅ DESBLOQUEO — C2 abierta
Verificación: `git show develop:backend/openapi.yaml | head -5` → openapi: 3.1.0 …
Cierra: BL-003 (4 días detenido)
D4 puede retomar MapaSectores.
```

4. Si hubo un desbloqueo temporal asociado, comprueba que su issue de reconciliación se cerró. Si
   caducó y sigue vigente, regístralo como **bug S2** con `registrar-bug`.

## Reglas de escritura

- **Nombra la compuerta y a su titular.** "Estoy esperando el backend" no es accionable.
- **Un bloqueo es del trabajo, no de la persona.** Se escribe qué falta, no quién falló.
- **Nunca cierres un bloqueo sin la salida del comando.** Es la única diferencia entre un registro
  y una impresión.

## Efecto en la Sala de control

La sección **"Quién está detenido, y por qué"** de la Sala de control se arma con los campos de §2:
**Rol bloqueado**, **Insumo que falta**, **Titular que lo resuelve** y **Tarea detenida**. Escríbelos
con ese nombre exacto y en negrita — si cambias el rótulo, el bloqueo aparece incompleto en el
tablero que miran los cinco. Al cerrarlo, mueve la fila a §3: la cuenta de bloqueos abiertos sale de
cuántos bloques quedan en §2 sin marca de cerrado.
