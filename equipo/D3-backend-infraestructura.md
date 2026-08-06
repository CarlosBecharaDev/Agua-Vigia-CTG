# D3 — Backend · Infraestructura e Integraciones

> **Responsable:** Adaptadores tecnológicos, base de datos MongoDB, Redis, API REST pública y Pipeline de Ingesta con IA.
> **Módulos asignados:** M2 (Reporte ciudadano - Backend), M5 (Panel veedor - Backend), M9 (Ingesta IA ⭐).
> **Capa del código:** `/backend/src/main/java/com/aguavigia/ctg/infrastructure` y `/backend/src/main/java/com/aguavigia/ctg/api`.

---

## 1. Especificación del Rol

- Implementa adaptadores de persistencia en **MongoDB** con soporte para consultas geoespaciales (`2dsphere`).
- Implementa soporte en **Redis** para caching de mapa, rate limiting por IP/dispositivo y ventanas deslizantes de consenso.
- Desarrolla los controladores REST `@RestController`, DTOs con validación y mappers con MapStruct.
- Diseña e implementa el **Pipeline de Ingesta M9**: Colectores (`AcuacarApiCollector`, `RssCollector`), deduplicación por hash SHA-256, prefiltro determinista y llamada estructurada a Anthropic Java SDK con regla anti-alucinación (`citaTextual`).
- Expone el contrato OpenAPI (`springdoc-openapi`) para consumo del Frontend.

---

## 2. Plan de Tareas por Sprint

| Sprint | Entregables y Tareas Específicas |
|---|---|
| **Sprint 1** | • Adaptador MongoDB con índices geoespaciales `2dsphere`.<br>• Mappers DTO $\leftrightarrow$ Dominio con MapStruct.<br>• Endpoints REST `GET /api/sectores` y `GET /api/sectores/{id}`.<br>• Manejo global de excepciones RFC 7807 (`@RestControllerAdvice`).<br>• Configurar `springdoc-openapi` para publicar la especificación OpenAPI. |
| **Sprint 2** | • Endpoint `POST /api/reportes`.<br>• Rate limiting en Redis (`INCR` + `EXPIRE`).<br>• Ventana deslizante de consenso en Redis con `ZSET`.<br>• Caching de respuestas del mapa en Redis.<br>• Implementación de Server-Sent Events (SSE) para actualización en tiempo real. |
| **Sprint 3** | • Endpoints de administración (CRUD de cortes oficiales) con autenticación JWT.<br>• Moderación de reportes dudosos por parte del veedor. |
| **Sprint 4** | • **Pipeline de Ingesta M9 completo**:<br>  - `AcuacarApiCollector` (API REST de WordPress `/wp-json/wp/v2/posts`).<br>  - `RssCollector` (Google News y Zona Cero).<br>  - Deduplicador por Hash SHA-256.<br>  - Prefiltro determinista por expresiones regulares.<br>  - Capa de IA con `anthropic-java` y salida estructurada.<br>  - Validación obligatoria de `citaTextual` (`documento.texto().contains(cita)`).<br>  - Resiliencia con Resilience4j (Circuit Breakers, Retries). |
| **Sprint 5** | • Consultas de agregación en MongoDB para estadísticas.<br>• Decorador de caché sobre servicios de consulta.<br>• Reprocesamiento en lote del histórico de 307 boletines de Acuacar con la IA. |
| **Sprint 6** | • Redactar Anexo 6 (Modelo de documentos Mongo, índices, diagrama E-R).<br>• Diagramas UML de componentes y de secuencia. |

---

## 3. Criterios de Aceptación (Definition of Done - DoD)

Un adaptador o servicio de infraestructura entregado por D3 está **Terminado** cuando:
1. Incluye pruebas de integración (con Testcontainers para Mongo/Redis).
2. Maneja fallos de servicios externos sin interrumpir el funcionamiento general del backend.
3. No expone tipos o clases de infraestructura hacia las capas de dominio o aplicación.

---

## 4. Recomendaciones Específicas para D3

- **Parametrizar modelo de IA**: Usar la variable de entorno `ANTHROPIC_MODEL` para intercambiar entre modelos rápidos (Haiku/Sonnet) en desarrollo y Opus en producción.
- **TTL en llaves de Redis**: Garantizar que todas las entradas creadas en Redis tengan tiempo de vida limitado para optimizar memoria en planes cloud.
