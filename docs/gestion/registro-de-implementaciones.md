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
| **RF/RNF** | El id de `docs/product-requirements.md`. Obligatorio. |
| **Qué** | Una frase en pasado. `Endpoint POST /api/reportes con rate limiting`, no `trabajo en reportes`. |
| **PR** | Enlace al Pull Request. Es la traza a quién, cuándo y quién revisó. |
| **Prueba** | Cómo se verifica. `RegistrarReporteServiceTest`, `E2E reporte.spec.ts`. Sin prueba, no está terminado. |

---

## Sprint 0 — Configuración e infraestructura

| RF/RNF | Módulo | Qué | Resp. | PR | Prueba |
|---|---|---|---|---|---|
| — | — | *Fase de documentación. El código de la aplicación aún no ha iniciado.* | — | — | — |

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
