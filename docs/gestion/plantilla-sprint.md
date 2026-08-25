# Plantilla de sprint

> Copia este archivo a `docs/gestion/sprint-N.md` al abrir cada sprint. Se llena en tres momentos:
> planning (§1–2), durante (§3) y cierre (§4–6).
>
> **Cabe en una página.** Un documento de sprint de cinco páginas no lo lee nadie, ni el docente.

---

# Sprint N — <foco en tres palabras>

**Abierto:** AAAA-MM-DD · **Cerrado:** — *(se llena el día que el entregable se demuestra funcionando)*
· **Scrum Master del sprint:** D<N>

---

## 1. Objetivo del sprint

Una frase que describe qué podrá hacer un usuario al final que hoy no puede.

> Ejemplo: *Un vecino de Cartagena puede abrir el mapa y ver el estado real de su sector.*

**No sirve:** "avanzar en el backend", "terminar el sprint 2".

---

## 2. Compromisos

| Resp. | RF/RNF | Entregable | Depende de |
|---|---|---|---|
| D1 | | | |
| D2 | | | |
| D3 | | | |
| D4 | | | |
| D5 | | | |

La columna **Depende de** es la importante: es donde se ven los bloqueos antes de que ocurran.
Escríbela con la **compuerta** correspondiente (C0–C3), no con un nombre propio. Cadena de
dependencias y compuertas: `docs/equipo/secuencia-de-trabajo.md` §1 y §2.

---

## 3. Bloqueos del sprint — resumen

El detalle de cada bloqueo vive en `registro-de-bloqueos.md`; aquí solo el resumen del sprint, para
la retrospectiva. Un sprint sin bloqueos anotados y con entregables retrasados significa que hubo
bloqueos y no se registraron.

| ID | Compuerta | Quién quedó detenido | Días | Cómo se resolvió |
|---|---|---|---|---|

---

## 4. Review — qué se demostró funcionando

Solo lo que se pudo **mostrar corriendo**. Código fusionado que no se puede demostrar no cuenta.

| RF/RNF | Qué se demostró | ¿Aceptado? |
|---|---|---|

**Comprometido:** N requisitos · **Entregado:** N · **Arrastrado al siguiente sprint:** N

---

## 5. Métricas del sprint

| Métrica | Valor |
|---|---|
| Requisitos entregados / comprometidos | |
| PRs fusionados | |
| Bugs abiertos / cerrados | |
| Cobertura `domain/` + `application/` | |
| Build en verde al cierre | Sí / No |

---

## 6. Retrospectiva

**Qué funcionó** — máximo 3, concretos.

**Qué no funcionó** — máximo 3. Sobre el proceso, no sobre las personas.

**Acciones para el próximo sprint** — máximo 3, cada una con responsable y fecha. Una acción sin
responsable no se ejecuta.

| Acción | Resp. | Para cuándo |
|---|---|---|
