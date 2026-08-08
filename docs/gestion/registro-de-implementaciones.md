# Registro de implementaciones

> Qué se construyó de verdad, sprint por sprint, con su trazabilidad a requisitos. No es una lista de
> tareas ni un tablero: es la evidencia de que un requisito pasó de escrito a funcionando.
>
> Se actualiza **al fusionar un Pull Request a `develop`**, no antes.

---

## Cómo se llena

Una fila por unidad entregada. Si no tiene requisito asociado, o no debería haberse construido, o
falta un requisito por escribir — ambas cosas hay que resolverlas antes de agregar la fila.

| Campo | Regla |
|---|---|
| **RF/RNF** | El id de `docs/product-requirements.md`. Obligatorio **para todo lo que implemente funcionalidad**. El andamiaje del Sprint 0 y el trabajo de proceso llevan `—` (ver `ADR-009`). |
| **Tipo** | `func` funcionalidad · `infra` infraestructura · `datos` conjunto de datos · `andamio` estructura sin funcionalidad · `proceso` reglas y documentación de trabajo. Solo `func` cuenta para la cobertura de requisitos. |
| **Qué** | Una frase en pasado. `Endpoint POST /api/reportes con rate limiting`, no `trabajo en reportes`. |
| **PR** | Enlace al Pull Request. Es la traza a quién, cuándo y quién revisó. |
| **Prueba** | Cómo se verifica. `RegistrarReporteServiceTest`, `E2E reporte.spec.ts`. Sin prueba, no está terminado. Para `proceso`, el comando o el documento que lo evidencia. |

---

## Sprint 0 — Configuración e infraestructura

| RF/RNF | Tipo | Qué | Resp. | PR | Prueba |
|---|---|---|---|---|---|
| — | infra | `docker-compose.yml` base (Mongo 7 + Redis 7 + Mailhog), `.env.example`, plantillas de PR e issue y 3 workflows de GitHub Actions | D5 | [#1](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/1) | `docker compose config -q` sin errores |
| — | datos | GeoJSON de los 213 barrios de Cartagena (ArcGIS de Cartagena Cómo Vamos, WGS84) en `data/geoespacial/` | D5 | [#2](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/2) | 213 *features*; nombres contrastados con boletines reales de Acuacar en el PR #6 |
| — | proceso | Regla de anuncio de avance en toda tarea (`secuencia-de-trabajo.md` §5) | D5 | [#3](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/3) | `secuencia-de-trabajo.md` §5 |
| — | proceso | Diseño del dominio de M3/M6 en `docs/ingenieria/modelo-de-dominio.md`; resuelta la duplicación de `SuscribirseService` entre D1 y D2 | D2 | [#4](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/4) | `docs/ingenieria/modelo-de-dominio.md` |
| — | andamio | Proyecto `/frontend`: React 19 + Vite + TypeScript + Tailwind v4, tokens de `DESIGN.md`, temas claro/oscuro, 4 rutas marcador de posición | D4 | [#5](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/5) | `npm run build` y `npm run lint` en verde en Frontend CI |
| — | datos | Validación del GeoJSON contra boletines #2785, #2787 y #2547; hallazgo de granularidad por tramo de calle y manzana | D5 | [#6](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/6) | `data/geoespacial/README.md` + `MEMORY.md` |
| — | proceso | Regla de lenguaje llano al comunicar bloqueos en el chat | D5 | [#7](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/7) | `secuencia-de-trabajo.md` §5 |
| — | proceso | Asignación a D2 del proyecto base de `/backend`, tarea que nadie tenía y sin la cual C0 no abre | D2 | [#8](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/8) | `D2-backend-dominio.md` §2, fila Sprint 0 |

**Cobertura de requisitos del Sprint 0: 0 de 36.** Es lo esperado y no es un retraso: por `ADR-009`
el Sprint 0 no implementa funcionalidad. Lo de arriba es lo que hace posible implementarla.

---

## Estado de cobertura de requisitos

Se actualiza al cerrar cada sprint. Es el insumo directo de `docs/ingenieria/matriz-trazabilidad.md`
y del Capítulo IV del informe.

| Módulo | Requisitos | Implementados | % |
|---|---|---|---|
| M1 Mapa en vivo | 4 | 0 | 0% |
| M2 Reporte ciudadano | 4 | 0 | 0% |
| M3 Consenso automático | 3 | 0 | 0% |
| M4 Alertas por correo | 4 | 0 | 0% |
| M5 Panel del veedor | 4 | 0 | 0% |
| M6 Índice de Cumplimiento ⭐ | 3 | 0 | 0% |
| M7 Estadísticas | 3 | 0 | 0% |
| M8 Bitácora pública | 3 | 0 | 0% |
| M9 Ingesta con IA ⭐ | 8 | 0 | 0% |
| **Total funcionales** | **36** | **0** | **0%** |
| **No funcionales** | **20** | **0** | **0%** |

---

<!--
Rotación: al cerrar el sprint N+2, el sprint N se comprime a una sola fila de resumen
(módulos tocados, requisitos cubiertos, PRs) y el detalle se archiva en
docs/gestion/historico/implementaciones-sprint-<N>.md. Ver protocolo-de-contexto.md §5.
-->
