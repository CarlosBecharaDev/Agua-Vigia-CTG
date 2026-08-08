# D2 — Backend · Dominio y Aplicación

> **Titular:** Carlos Bechara Arias.
> **Responsable:** Reglas de negocio puras, modelos del dominio, casos de uso y cálculo del Índice de Cumplimiento.
> **Módulos asignados:** M3 (Consenso automático), M6 (Índice de Cumplimiento ⭐).
> **Capa del código:** `/backend/src/main/java/com/aguavigia/ctg/domain` y `/backend/src/main/java/com/aguavigia/ctg/application`.
> **Compuertas:** empieza cuando **C0** está abierta · **abre C1** (dominio y puertos) para D3 y D1.
> Ver [`secuencia-de-trabajo.md`](secuencia-de-trabajo.md) §2.

---

## 1. Especificación del Rol

- Diseña las entidades del dominio (`CorteAgua`, `Sector`, `ReporteCiudadano`, `EventoBitacora`).
- Garantiza la **Regla de Oro de Arquitectura Limpia**: `domain/` es Java puro (cero imports de Spring o MongoDB).
- Implementa la verificación de arquitectura con **ArchUnit** para romper la build si se violan las capas.
- Modela los patrones de diseño (Strategy para algoritmo de consenso, Builder, Factory Method).
- Sustenta los principios SOLID y la arquitectura ante los jurados académicos.

---

## 2. Plan de Tareas por Sprint

| Sprint | Entregables y Tareas Específicas |
|---|---|
| **Sprint 1** | • Modelar entidades de dominio y Value Objects (`Coordenada`, `EstadoServicio`, `VentanaTiempo`).<br>• Definir contratos de puertos de entrada (`port/in`) y salida (`port/out`).<br>• **Escribir el test de ArchUnit** en JUnit 5 para auditar aislamiento de `domain/`.<br>• Pruebas unitarias de las invariantes del dominio. |
| **Sprint 2** | • Implementar `RegistrarReporteService`.<br>• Implementar `EvaluarConsensoService` con **patrón Strategy** (Estrategia 1: Umbral fijo; Estrategia 2: Umbral proporcional a población).<br>• Publicación de eventos del dominio (`SectorCambioEstadoEvent`). |
| **Sprint 3** | • Implementar `GestionarCorteOficialService`.<br>• Implementar `SuscribirseService` (validación de reglas para doble opt-in).<br>• Validación inmutable de `CorteAgua` mediante patrón Builder (impedir horas fin < inicio). |
| **Sprint 4** | • **`CalcularCumplimientoService`** (módulo estrella): comparar duración prometida vs. real.<br>• `RegistrarEventoBitacoraService` usando Factory Method.<br>• Implementación de Specification Pattern para filtros de estadísticas. |
| **Sprint 5** | • Elevar cobertura de pruebas unitarias en `domain/` y `application/` a **$\ge 70\%$** (con JaCoCo).<br>• Refactorización de casos de uso basada en análisis de calidad de código. |
| **Sprint 6** | • Documentar patrones de diseño aplicados y matriz de demostración SOLID (clase, línea y principio).<br>• Diagrama de clases UML definitivo. |

---

## 3. Criterios de Aceptación (Definition of Done - DoD)

Un caso de uso o entidad entregada por D2 está **Terminado** cuando:
1. Posee pruebas unitarias que cubren el flujo principal y casos de borde.
2. No contiene ninguna anotación de Spring Framework, JPA o MongoDB en la capa `domain/`.
3. El test de ArchUnit se ejecuta limpiamente y aprueba el empaquetado.

---

## 4. Recomendaciones Específicas para D2

- **Diseñar `SectorAliasResolver`**: Incluir en el dominio un componente para resolver variaciones de nombres de sectores o barrios provenientes de los textos no estructurados.
- **Inmutabilidad estricta**: Definir los Value Objects como `record` de Java 21 para garantizar inmutabilidad thread-safe por diseño.
