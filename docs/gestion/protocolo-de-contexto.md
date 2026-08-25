# Protocolo de contexto y ahorro de tokens

> Cinco personas trabajando el mismo repositorio con agentes de IA. Sin reglas, cada sesión vuelve a
> descubrir lo que otro ya descubrió, y cada archivo se lee entero para responder una pregunta de una
> línea. Este documento existe para que eso no pase.
>
> **Regla de fondo:** el contexto es un recurso con presupuesto, igual que el tiempo del sprint.
> Lo que se lee en cada sesión se paga en cada sesión.

---

## 1. Las tres capas de contexto

El proyecto separa a propósito lo que el agente lee **siempre** de lo que lee **cuando hace falta**.

| Capa | Archivos | Cuándo se lee | Presupuesto |
|---|---|---|---|
| **Permanente** | `CLAUDE.md`, `MEMORY.md`, `DESIGN.md` | En cada sesión, automáticamente | **≤ 200 · ≤ 150 · ≤ 200 líneas** |
| **Bajo demanda** | `docs/**` | Solo cuando la tarea lo pide | Sin techo, pero con índice |
| **Efímero** | Conversación, salidas de comandos | Se pierde al cerrar | Se resume en la bitácora |

**La consecuencia práctica:** cada línea que agregues a `CLAUDE.md` o `MEMORY.md` la pagan las cinco
personas del equipo, en cada una de sus sesiones, durante seis meses. Antes de agregar algo ahí,
pregúntate si no pertenece a `docs/`.

**Si un archivo permanente supera su presupuesto**, no se recorta borrando información: se mueve el
detalle a `docs/` y en el archivo permanente queda una línea con el puntero.

---

## 2. Qué va en cada archivo — fuente única de verdad

Una información vive en **un solo lugar**. Si aparece en dos, tarde o temprano se contradicen y nadie
sabe cuál manda.

| Tipo de información | Único lugar válido |
|---|---|
| Cómo se trabaja aquí (reglas, convenciones, arquitectura) | `CLAUDE.md` |
| Hallazgo verificado, restricción externa, acuerdo del equipo | `MEMORY.md` |
| Por qué se eligió A en vez de B | `docs/design-decisions.md` (ADR) |
| Reglas visuales y de interfaz | `DESIGN.md` |
| Qué construimos y para quién | `docs/brief.md` |
| Requisitos con id y prioridad | `docs/product-requirements.md` |
| Quién hace qué y cuándo | `docs/equipo/` |
| Qué se implementó | `docs/gestion/registro-de-implementaciones.md` |
| Qué se rompió y cómo se arregló | `docs/gestion/registro-de-bugs.md` |
| Quién está detenido esperando a quién, y el estado de las compuertas | `docs/gestion/registro-de-bloqueos.md` |
| Qué hizo cada sesión de trabajo con IA | `docs/gestion/bitacora-sesiones.md` |
| Estado de tareas en curso | GitHub Issues / Projects — **no** en archivos |
| Cómo va el proyecto de un vistazo | La **Sala de control** — generada, nunca escrita a mano (`docs/gestion/README.md`) |

**La Sala de control no es un lugar donde se escribe: es la lectura de los archivos de esta tabla.**
Por eso mantenerla al día no cuesta trabajo extra — cuesta *no saltarse* el registro que ya era
obligatorio. Quien avanza, actualiza su registro; el tablero se encarga solo.

**Si detectas la misma afirmación en dos archivos, es un defecto.** Repórtalo o arréglalo dejando el
detalle en uno y un puntero en el otro.

---

## 3. Reglas para el agente

Estas reglas están escritas para que el agente las siga, y para que el humano sepa exigirlas.

### Al leer

1. **No leas un archivo completo para responder una pregunta puntual.** Usa `Grep` para localizar y
   lee solo el rango que importa.
2. **No releas lo que ya está en `CLAUDE.md` o `MEMORY.md`.** Ya está en contexto.
3. **Antes de proponer una alternativa técnica, lee `docs/design-decisions.md`.** Si el camino ya se
   descartó, proponerlo otra vez cuesta tokens y credibilidad.
4. **Para búsquedas amplias** (barrer muchos archivos y quedarte solo con la conclusión), usa un
   subagente de exploración: su contexto se descarta al terminar y solo vuelve el resultado.

### Al escribir documentación

5. **Tablas antes que prosa.** Una tabla de 6 filas dice lo que tres párrafos, con un tercio de los
   tokens y sin ambigüedad.
6. **Sin preámbulos ni recapitulaciones.** Nada de "como se mencionó anteriormente" ni resúmenes de
   lo que el lector acaba de leer.
7. **Nunca pegues código en documentos de gestión.** Referencia `archivo:línea`. El código cambia; la
   copia pegada queda mintiendo.
8. **Un dato, un lugar.** Ver §2.
9. **Las fechas van en hora local de Cartagena (UTC-5), nunca en UTC.** Un agente que toma la fecha
   del sistema en UTC escribe el día siguiente cada noche después de las 7 p.m., y el registro queda
   con fechas futuras. La auditoría del 2026-08-07 encontró seis entradas así. Verifica con `date`,
   no con la fecha que traigas en contexto.

### Al cerrar

9. **Toda sesión que produzca un cambio relevante termina con una entrada en la bitácora.** Ver §4.
10. **Si la sesión reveló algo que costó descubrir, va a `MEMORY.md`.** Si fue una elección entre
    alternativas, va a un ADR. Si fue un defecto, va al registro de bugs.

---

## 4. Cuándo limpiar la conversación

| Situación | Qué hacer |
|---|---|
| Terminaste una tarea y empiezas otra **no relacionada** | `/clear` — arranca en limpio |
| La misma tarea continúa pero la conversación se alargó | `/compact` — conserva el hilo, descarta el ruido |
| Vas a repetir mañana un trabajo largo | Cierra con entrada en la bitácora; mañana la lees en 3 líneas en vez de reconstruir 200 mensajes |
| Pegaste un volcado largo (logs, JSON, salida de build) y ya lo analizaste | `/compact` — ese volcado ya no aporta |

**El error caro:** arrastrar una conversación de ocho horas porque "ahí está todo el contexto". No lo
está: está en `CLAUDE.md`, en `MEMORY.md` y en la bitácora. Para eso existen.

---

## 5. Rotación de los registros

Los archivos de registro crecen para siempre; el contexto no. Por eso rotan.

| Archivo | Límite en el archivo activo | Qué pasa al superarlo |
|---|---|---|
| `bitacora-sesiones.md` | Últimas **30** entradas | Las anteriores se mueven a `docs/gestion/historico/bitacora-<sprint>.md` |
| `registro-de-bugs.md` | Todos los **abiertos** en detalle | Los cerrados quedan en la tabla resumen, una línea cada uno |
| `registro-de-implementaciones.md` | Sprint actual + anterior | Los anteriores se agrupan en un resumen por sprint |
| `MEMORY.md` | 150 líneas | Se consolidan hallazgos redundantes; lo obsoleto se borra, no se acumula |

La rotación la hace quien cierra el sprint (ver `docs/equipo/roles-y-tareas.md`, ceremonia de review).

---

## 6. Qué NO hacer

- **No pegues el `CLAUDE.md` en el chat.** El agente ya lo leyó.
- **No expliques el proyecto al inicio de cada sesión.** Si tuviste que hacerlo, falta algo en
  `CLAUDE.md` o en `MEMORY.md`: arréglalo ahí, no lo repitas cada vez.
- **No guardes en `MEMORY.md` lo que se deduce del código o del historial de Git.** Eso se consulta,
  no se memoriza.
- **No uses la bitácora como diario personal.** Es un registro de trabajo, no un blog. Una entrada
  larga es una entrada que nadie va a leer.
- **No abras cinco subagentes para una tarea que resuelves tú.** Cada subagente arranca en frío y
  vuelve a leer el contexto que tú ya tienes.

---

## 7. Chequeo rápido antes de cerrar una sesión

- [ ] ¿Lo que aprendí está registrado donde corresponde (§2)?
- [ ] ¿La entrada de bitácora cabe en 3 líneas?
- [ ] ¿Agregué algo a un archivo permanente? ¿Sigue dentro de su presupuesto (§1)?
- [ ] ¿Dejé escrito el **siguiente paso**, para que la próxima sesión no empiece decidiendo qué hacer?
