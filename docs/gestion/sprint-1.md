# Sprint 1 — Mapa base y dominio core

**Abierto:** 2026-08-08 · **Cerrado:** — *(cierra cuando el mapa muestre los sectores reales de
Cartagena servidos por la API, con los datos de demostración ya retirados del código)* · **Scrum
Master del sprint:** Yordy Pardo Pajaro (D5) — sigue por continuidad operativa aunque D1 pasó a
Rafael Sarmiento Peña a mitad de sprint (`ADR-021`)

> **Este sprint abre con la mayor parte de su alcance ya entregada.** No es un error de planificación:
> es la consecuencia de que el Sprint 0 tardara tres días en cerrar formalmente mientras el equipo
> seguía trabajando. La hoja de ruta (`../equipo/secuencia-de-trabajo.md` §4) asignaba cinco frentes
> al Sprint 1 y cuatro ya están en `develop`. El planning honesto no es fingir que empiezan hoy, sino
> **decir qué queda y qué hay que limpiar**.

---

## 1. Objetivo del sprint

**Que un vecino de Cartagena abra el mapa y vea el estado real de su sector, servido por la API y sin
un solo dato de demostración en el camino.**

Hoy el mapa ya consume la API real y, cuando algo falla, cae a datos simulados **avisándolo en
pantalla**: `PaginaMapa.tsx:55-66` muestra "Sin conexión · Simulación" o "Acuacar inactivo ·
Simulación", y `PaginaBitacora.tsx:153-183` hace lo propio en rojo. Esa señalización es correcta y
respeta la ética de datos del proyecto (`CLAUDE.md`, punto 4): el mapa no afirma como verificado lo
que no lo es.

Lo que queda es retirar los datos simulados en sí. `DT-001`–`DT-005` **caducan al cerrar este
sprint** (`registro-de-bloqueos.md` §4), y ya no hay motivo para conservarlos: C2 y C3 están
abiertas. Un modo demo que sobrevive a la compuerta que lo justificaba deja de ser un andamio y pasa
a ser código muerto que alguien confundirá con producción.

---

## 2. Compromisos

| Resp. | RF/RNF | Entregable | Depende de |
|---|---|---|---|
| D1 (Yordy) | RF012–RF014 | ✅ Entregado — `POST /api/suscripciones` con DTOs y envío de correo asíncrono (`@Async` + `JavaMailSender`) contra Mailhog, probado extremo a extremo contra Mailhog real | C1 ✅ · plantillas HTML ya listas, sin fusionar · [PR #78](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/78) |
| D1 (Rafael) | — | Capítulo I del informe (planteamiento, justificación, objetivos) y validación de la plantilla oficial de Comfenalco | — *(no depende de nadie; heredado de Yordy como D1 interino, `ADR-021`)* |
| D4 | RF001–RF004 | ✅ Entregado — datos de demostración retirados de `useDatosEnVivo.ts`, `PaginaVeedor.tsx` y `PaginaBitacora.tsx`, más `BUG-032` encontrado y cerrado en el camino (reportes ciudadanos inventados en `ListaSectores.tsx`). Escrito y fusionado por D5 (Yordy) directo, por decisión explícita — no pasó por revisión de José | C2 ✅ · C3 ✅ |
| D2 | RF005–RF007 | ✅ Entregado — `RegistrarReporteService` en `application/`, primer caso de uso real del proyecto. Escrito y fusionado por D5 (Yordy) directo, por decisión explícita — no pasó por revisión de Carlos | C1 ✅ · Review del Sprint 0 ✅ · [PR #84](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/84) |
| D5 (Yordy) | RNF | Motor de contenedores instalado y **C0 reverificada levantando el entorno de verdad**; cambiar su comando de verificación | — *(no depende de nadie)* |
| D3 | — | Nada nuevo comprometido: su alcance de Sprint 1 (adaptador Mongo, API de sectores, OpenAPI) ya está entregado en el PR #56. Disponible para `BL-005`/`BL-006` en cuanto se destraben | `BL-006` 🔴 · `BL-005` 🔴 |

La columna **Depende de** es la importante: es donde se ven los bloqueos antes de que ocurran.
Cadena de dependencias y compuertas: [`../equipo/secuencia-de-trabajo.md`](../equipo/secuencia-de-trabajo.md) §1 y §2.

### Ya entregado antes de abrir el sprint

| Frente | Quién | Dónde | Estado |
|---|---|---|---|
| Script de siembra del GeoJSON en Mongo | D5 | PR #13 | ✅ 211 sectores |
| Entidades, VOs, puertos y ArchUnit | D2 | PR #21 | ✅ Abre C1 |
| Adaptador Mongo, `GET /api/sectores`, OpenAPI | D3 | PR #56 | ✅ Abre C2 |
| Mapa Leaflet y lista accesible, integrados contra la API real | D4 | PRs #12, #67 | ✅ Abre C3 |

**Cuatro de los cinco frentes del sprint ya están cerrados.** Lo que queda es la parte de D1 (nunca
empezada, porque el rol estuvo vacante hasta el 2026-08-08) y la limpieza de los datos simulados.

---

## 3. Bloqueos del sprint — resumen

| ID | Compuerta | Quién quedó detenido | Días | Cómo se resolvió |
|---|---|---|---|---|
| BL-004 | — | D2 | 3 | Cerrado 2026-08-08 con el Review del Sprint 0 (`sprint-0.md` §4) |
| BL-005 | — | D3 | — | Abierto — falta `ANTHROPIC_API_KEY` |
| BL-006 | — | D3 | — | Abierto — falta el correo real del colector. **Lo destraba D1 (Rafael)** |

---

## 4. Review — qué se demostró funcionando

*(Se llena el último día del sprint. Solo lo que se pudo mostrar corriendo.)*

| RF/RNF | Qué se demostró | ¿Aceptado? |
|---|---|---|

**Comprometido:** — · **Entregado:** — · **Arrastrado al siguiente sprint:** —

---

## 5. Métricas del sprint

| Métrica | Valor |
|---|---|
| Requisitos entregados / comprometidos | |
| PRs fusionados | |
| PRs fusionados **sin revisor registrado** | *(al abrir: 47 de 61 acumulados — 77 %)* |
| Bugs abiertos / cerrados | |
| Cobertura `domain/` + `application/` | *(al abrir: `application/` solo tiene `package-info.java`)* |
| Build en verde al cierre | |

---

## 6. Retrospectiva

*(Se llena después del review. Máximo 3 por bloque, concretos, sobre el proceso.)*

**Qué funcionó**

**Qué no funcionó**

**Acciones para el próximo sprint**

| Acción | Resp. | Para cuándo |
|---|---|---|
