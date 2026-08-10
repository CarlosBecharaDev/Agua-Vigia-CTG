# Sprint 3 — Moderación y Operación Oficial

**Abierto:** 2026-08-09 · **Cerrado:** 2026-08-09
· **Scrum Master del sprint:** José Daniel Zambrano (D4)

---

## 1. Objetivo del sprint

Un veedor de la alcaldía (o Acuacar) puede iniciar sesión de forma segura para moderar los reportes ciudadanos y publicar los cortes oficiales de agua con trazabilidad.

---

## 2. Compromisos

| Resp. | RF/RNF | Entregable | Depende de |
|---|---|---|---|
| D3 | RF019 / RNF011 | ✅ Autenticación del Veedor (JWT y SecurityConfig) y `VeedorAuthController`. | C1 |
| D2 | RF018 | ✅ Lógica de negocio para moderar (aprobar/descartar) reportes y `ModeracionReporteController`. | C1 |
| D5 | RF016-RF017 | ✅ Módulo de cortes oficiales (anunciados, en curso, restablecidos) y `CorteController`. | C1 |
| D4 | RF016-RF019 | ✅ Panel del Veedor en el frontend conectado a los endpoints de moderación y cortes oficiales. | C2 |

*Nota: La totalidad de estos compromisos fueron adelantados y fusionados a `develop` por el equipo antes de la ceremonia formal de apertura de este sprint.*

---

## 3. Bloqueos del sprint — resumen

| ID | Compuerta | Quién quedó detenido | Días | Cómo se resolvió |
|---|---|---|---|---|
| BL-005 | — | M9 (Capa IA) | 1 | Se removió la dependencia del SDK de Anthropic (`anthropic-java`) del repositorio para desatascar el desarrollo, según decisión de equipo (PR #137). |

---

## 4. Review — qué se demostró funcionando

| RF/RNF | Qué se demostró | ¿Aceptado? |
|---|---|---|
| RF019 / RNF011 | Inicio de sesión con JWT temporal (8 horas). | Sí |
| RF018 | Aprobación y descarte de reportes en estado pendiente. | Sí |
| RF016-RF017 | Registro y cierre de cortes oficiales por sector. | Sí |

**Comprometido:** 4 requisitos · **Entregado:** 4 · **Arrastrado al siguiente sprint:** 0

---

## 5. Métricas del sprint

| Métrica | Valor |
|---|---|
| Requisitos entregados / comprometidos | 4 / 4 |
| PRs fusionados | Múltiples (adelantados a `develop`) |
| Build en verde al cierre | Sí |

---

## 6. Retrospectiva

**Qué funcionó**
1. La velocidad del equipo de desarrollo (D2, D3, D5) para adelantar la lógica core del sistema antes del planning.
2. La arquitectura base permitió ensamblar `PanelVeedor.tsx` de forma directa y sin bloqueos de API.

**Qué no funcionó**
1. La sincronización documental: el código se fusionó a `develop` sin tener un sprint abierto que amparara el trabajo (deuda de proceso).

**Acciones para el próximo sprint**
| Acción | Resp. | Para cuándo |
|---|---|---|
| Abrir el Sprint 4 formalmente antes de escribir el código de las estadísticas y la nueva ingesta M9. | D5 (Scrum Master S4) | Inicio Sprint 4 |
