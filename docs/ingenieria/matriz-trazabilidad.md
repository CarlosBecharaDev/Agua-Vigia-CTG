# Matriz de trazabilidad

> Cadena completa: **objetivo específico → requisito → historia de usuario → caso de prueba →
> implementación**. Es la evidencia de que nada se construyó de más y nada quedó sin verificar.
>
> **Se actualiza a mano al cerrar cada unidad de trabajo relevante**, contrastando el requisito
> contra el código y su prueba. `docs/gestion/` (el registro de implementaciones por sprint que
> alimentaba esta tabla) se retiró del proyecto al fusionar el rediseño de frontend en `main`
> (2026-08-12) — la trazabilidad vive solo aquí desde entonces.

---

## Convenciones

| Id | Qué es | Dónde vive |
|---|---|---|
| `RF0NN` / `RNF0NN` | Requisito | `docs/product-requirements.md` |
| `HU0NN` | Historia de usuario en Gherkin | Anexo 4 |
| `CP0NN` | Caso de prueba | Anexo 5 |
| `M<N>` | Módulo del producto | `docs/brief.md` |

**Numeración pareja:** `RF001 → HU001 → CP001`. Un requisito puede necesitar más de un caso de prueba
(`CP001a`, `CP001b`), pero **ninguno puede quedarse sin historia ni sin prueba**.

**Estado:** ⬜ pendiente · 🟡 en curso · ✅ implementado y probado

---

## Nivel 1 — Objetivos específicos

| # | Objetivo específico | Requisitos | Evidencia |
|---|---|---|---|
| **1** | Analizar los requisitos del sistema mediante técnicas de elicitación con usuarios del servicio | RF001–RF036 (elicitados) | Anexos 1, 2, 4 |
| **2** | Diseñar la arquitectura del software bajo Arquitectura Limpia y un modelo de datos geoespacial | RNF018, RF001, RF007, RF009 | Anexo 6 · ADR-001 · ADR-003 |
| **3** | Implementar la plataforma con Spring Boot, MongoDB, Redis y React aplicando principios SOLID | Todos los RF de M1–M9 | `registro-de-implementaciones.md` |
| **4** | Validar el funcionamiento y la aceptación de la plataforma | RNF017, RNF019, RF023 + instrumentos | Anexos 3, 5 · Capítulo IV |

---

## Nivel 2 — Requisitos funcionales

### M1 — Mapa en vivo · D4

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF001 Mapa con sectores coloreados por estado | HU001 | CP001 | 1, 2, 3 | 1 | ✅ |
| RF002 Detalle del sector al seleccionarlo | HU002 | CP002 | 3 | 1 | ✅ |
| RF003 Antigüedad del dato visible por sector | HU003 | CP003 | 3 | 2 | ✅ (`SectorMongoAdapterTest.debeDevolverLaFechaDelEstadoAlLeerElSector`) |
| RF004 Lista textual accesible alternativa al mapa | HU004 | CP004 | 3, 4 | 1 | ✅ |

### M2 — Reporte ciudadano · D3 + D4

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF005 Reportar sin registro ni cuenta | HU005 | CP005 | 1, 3 | 2 | ✅ |
| RF006 Límite de reportes por dispositivo | HU006 | CP006 | 3 | 2 | ✅ |
| RF007 Coordenada del reporte e inferencia de sector | HU007 | CP007 | 2, 3 | 2 | ✅ |
| RF008 Reporte en máximo dos toques | HU008 | CP008 | 3, 4 | 2 | ✅ |

### M3 — Consenso automático · D2

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF009 Cambio de estado por N reportes coincidentes | HU009 | CP009 | 2, 3 | 2 | ✅ |
| RF010 Dos estrategias de consenso intercambiables | HU010 | CP010 | 3 | 2 | ✅ |
| RF011 Registro de los reportes que sustentaron el cambio | HU011 | CP011 | 3, 4 | 2 | ✅ |

### M4 — Alertas por correo · D1

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF012 Suscripción a sectores solo con correo | HU012 | CP012 | 1, 3 | 1 | ✅ |
| RF013 Confirmación por doble opt-in | HU013 | CP013 | 3 | 2 | ✅ |
| RF014 Notificación al cambiar el estado del sector | HU014 | CP014 | 3 | 3 | ✅ |
| RF015 Baja en un clic sin credenciales | HU015 | CP015 | 3 | 2 | ✅ |

### M5 — Panel del veedor · D3 + D4

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF016 Registrar corte oficial con fin prometido | HU016 | CP016 | 1, 3 | 3 | ✅ |
| RF017 Cerrar corte con hora real de restablecimiento | HU017 | CP017 | 3 | 3 | ✅ |
| RF018 Moderar reportes dudosos | HU018 | CP018 | 3 | 3 | ✅ |
| RF019 Autenticación con token para el panel | HU019 | CP019 | 3 | 3 | ✅ |

### M6 — Índice de Cumplimiento ⭐ · D2

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF020 Desviación entre duración prometida y real | HU020 | CP020 | 3, 4 | 4 | ✅ |
| RF021 Índice agregado por sector y global | HU021 | CP021 | 3, 4 | 4 | ✅ |
| RF022 Presentación como comparación, no como puntaje | HU022 | CP022 | 3 | 4 | ✅ |

### M7 — Estadísticas · D5 + D4

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF023 Sectores más afectados, duración y frecuencia | HU023 | CP023 | 3, 4 | 4 | ✅ (`EstadisticasMongoAdapterTest`) |
| RF024 Evolución del índice en el tiempo | HU024 | CP024 | 4 | 4 | ✅ (`GET /api/cumplimiento/serie` · `SerieMensualCumplimientoTest`) |
| RF025 Exportación en CSV | HU025 | CP025 | 3 | 5 | ✅ (`/api/estadisticas/exportar.csv` y `/api/cumplimiento/serie.csv` · `EscritorCsvTest`) |

### M8 — Bitácora pública · D1

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF026 Registro de todo evento relevante, solo anexado | HU026 | CP026 | 2, 3 | 3 | ✅ |
| RF027 Consulta pública sin autenticación | HU027 | CP027 | 3 | 4 | ✅ |
| RF028 Inmutabilidad: no se edita ni se elimina | HU028 | CP028 | 2, 3 | 3 | ✅ |

### M9 — Ingesta automática con IA ⭐ · D3

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF029 Consumo periódico de la API oficial | HU029 | CP029 | 3 | 1 | ✅ (`AcuacarApiCollectorTest`) |
| RF030 Consumo de prensa vía RSS de agregadores | HU030 | CP030 | 3 | 3 | ✅ (`RssCollectorTest`) |
| RF031 Descarte de duplicados por hash | HU031 | CP031 | 3 | 2 | ✅ (`DeduplicadorRecienteTest` · `PipelineOrquestadorTest`) |
| RF032 Clasificación y extracción con IA estructurada | HU032 | CP032 | 3, 4 | 4 | ❌ (Descartado) |
| RF033 Confianza y cita textual en toda extracción | HU033 | CP033 | 3, 4 | 4 | ❌ (Descartado) |
| RF034 Rechazo automático si la cita no es literal | HU034 | CP034 | 3, 4 | 4 | ❌ (Descartado) |
| RF035 Confianza intermedia a revisión humana | HU035 | CP035 | 3 | 4 | ❌ (Descartado) |
| RF036 No acceder a fuentes que bloquean agentes de IA | HU036 | CP036 | 3 | 1 | ❌ (Descartado) |

### M10 — Evidencia Multimedia (Fase 2)

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF037 Adjuntar fotografías a reportes ciudadanos | HU037 | CP037 | 3, 4 | Fase 2 | ✅ |

### M11 — Validación Comunitaria Rápida (Fase 2)

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF038 Confirmar reporte con un solo clic | HU038 | CP038 | 3 | Fase 2 | ✅ |

### M12 — API Abierta Open311 (Fase 2)

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF039 Exponer reportes bajo estándar Open311 | HU039 | CP039 | 3 | Fase 2 | ✅ (`Open311ControllerTest`. Se expone estado **agregado por sector**, no cada reporte: ver `ADR-026` — publicar la coordenada de cada reporte permitiría inferir domicilios, contra RNF008) |

### M13 — Integración IoT Pasiva (Fase 2)

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF040 Endpoint para alertas automáticas de IoT | HU040 | CP040 | 3 | Fase 2 | ✅ |

### M14 — Alertas Push Instantáneas (Fase 2)

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF041 Suscripción por WhatsApp/Telegram | HU041 | CP041 | 1, 3 | Fase 2 | ⬜ (Pendiente — `NotificadorPushWebhookAdapter` solo registra un log "Simulando envío", sin webhook real) |

---

## Nivel 3 — Requisitos no funcionales

Los RNF no llevan historia de usuario: se verifican con una medición, no con un flujo.

| RNF | Umbral | Cómo se verifica | Sprint | Estado |
|---|---|---|---|---|
| RNF001 | Mapa completo < 3 s en 3G | Lighthouse con throttling | 6 | 🟡 **Medido y corregido en parte, 2026-08-12.** Primera medición (Regular 3G dura: 300 ms RTT, 400 Kbps, CPU 4×): puntaje 27/100, FCP 21.3 s, LCP 46.4 s, 6.04 MB de página — culpa principal, `logo-aguavigia-animado.gif` de **4.5 MB** (75% del peso) más el chunk `PaginaMapa` sin dividir (715 KB). Corrección aplicada: el logo pasó a WebP animado a 200 px (mismos 120 frames y transparencia, **404 KB**, −91%), `PaginaMapa` se dividió con `lazy()`+`Suspense` (`PanelDetalleSector`, `SeccionBitacora`, `SeccionEstadisticas`), sacando `recharts` del bundle inicial (715 KB → **355 KB**), y se agregó `<link rel="preconnect">`/`dns-prefetch` a los dominios de tiles del mapa (`index.html`) — el elemento del LCP bajo throttling duro es un tile de CartoDB/OSM (`img.leaflet-tile`), no algo servido por nuestro origen. Con el throttling estándar de Lighthouse (1.6 Mbps/150 ms, más representativo de un "3G" real): **puntaje 42/100, FCP 3.9 s, LCP 9.7 s** — mejora real, pero sigue sin cumplir el umbral de 3 s. **Lo que queda:** bajo el throttling duro (400 Kbps compartidos entre *todo* lo que carga la página), 2.03 MB tarda >40 s solo en transferencia — el preconnect a los tiles ayudó al FCP (17.4 s → 13.2 s) pero apenas movió el LCP, porque el cuello de botella ya no es la latencia de conexión sino el ancho de banda total disponible. Cerrar esto del todo exigiría bajar el peso total muy por debajo de lo que cualquier mapa interactivo con tiles externos puede pesar, o aceptar que 3 s sobre 400 Kbps reales es un presupuesto que ninguna SPA con mapa cumple hoy |
| RNF002 | Confirmación de reporte < 1 s | Prueba de carga | 5 | ✅ **Medido 2026-08-11** — k6 (`scripts/carga/rnf002-registrar-reporte.js`), 20 solicitudes/min durante 2 min contra el stack de `docker compose`: p(95)=16.49 ms, 0% de errores |
| RNF003 | Caché del mapa con TTL ≤ 60 s | Inspección de Redis | 2 | ✅ (TTL de 15 s en `application.yml` · `SectorMongoAdapterCacheTest`) |
| RNF004 | Fuente caída no tumba el sistema | Prueba de caos | 4 | ✅ (`PipelineOrquestadorTest.unColectorCaidoNoDebeImpedirQueSeLeaElOtro`) |
| RNF005 | Backoff + cortacircuitos tras 3 fallos | Test de integración | 4 | ✅ (`ResilienciaDeColectoresTest.debeAbrirElCortacircuitosAlTercerFalloConsecutivo`) |
| RNF006 | Cero descartes silenciosos | Revisión de la cola muerta | 2 | ✅ (`PipelineOrquestadorTest.noDebeMarcarComoVistoUnDocumentoQueFalloAlProcesarse`) |
| RNF007 | Salud por colector expuesta | `/actuator/health` | 4 | ✅ (`ColectorHealthIndicatorTest` · detalle autenticado en `GET /api/veedor/ingesta/salud`) |
| RNF008 | Sin datos personales del reportante | Revisión del modelo de datos | 2 | ✅ (`ADR-007` huella anónima · `ADR-026` Open311 agregado · `ADR-027` evidencia) |
| RNF009 | Correos con acceso restringido, borrados al darse de baja | Revisión de código y prueba | 2 | ✅ (`MailNotificacionAdapterTest.debeIncluirElEnlaceDeBajaEnElAviso`) |
| RNF010 | Cero credenciales en el repositorio | `gitleaks` en CI | 0 | ✅ |
| RNF011 | JWT con expiración ≤ 8 h | Test de seguridad | 3 | ✅ |
| RNF012 | Contraste AA en ambos temas | axe / Lighthouse | 5 | ✅ |
| RNF013 | Operable solo con teclado | Prueba manual | 5 | ✅ |
| RNF014 | Objetivos táctiles ≥ 44×44 px | Inspección de CSS | 5 | ✅ |
| RNF015 | Funcional desde 360 px | Prueba responsive | 5 | ✅ |
| RNF016 | El estado nunca solo por color | Revisión de diseño | 5 | ✅ |
| RNF017 | Cobertura ≥ 70% en `domain/` y `application/` | JaCoCo en CI | 5 | ✅ (real: **92.4%** en `domain/`, **99.2%** en `application/`, sobre 406 pruebas. El `jacoco:check` del `pom.xml` falla la build por debajo del 85%) |
| RNF018 | Build falla si se viola una capa | ArchUnit en CI | 1 | ✅ (`ReglaDeOroArchitectureTest`, 5 reglas) |
| RNF019 | Precisión del clasificador ≥ 90% | Regresión sobre el conjunto dorado | 5 | ❌ (Descartado) |
| RNF020 | Levanta con un solo comando | `docker compose up` en máquina limpia | 0 | ✅ (verificado en CI: `.github/workflows/despliegue-ci.yml` construye la imagen y valida ambos compose en cada push) |
| RNF021 | Imágenes en bucket con compresión automática | Inspección de bucket y metadatos | Fase 2 | 🟡 **Parcial.** Compresión y limpieza de EXIF ✅ (`CompresorDeImagenes`, recodifica jpg/png y descarta metadatos al reescribir — `CompresorDeImagenesTest`). El bucket sigue siendo disco local por decisión explícita (2026-08-11): ver §6.2 de `estado-del-backend.md`. `.webp` no se procesa — el JDK no trae lector nativo |

---

## Huecos de trazabilidad detectados

Se revisa al cerrar cada sprint. Un hueco aquí es un hallazgo del docente esperando a ocurrir.

| Hueco | Detectado | Estado |
|---|---|---|
| Ninguna historia de usuario redactada todavía (Anexo 4, Sprint 1) | 2026-08-07 | ✅ **Cerrado 2026-08-08** — `docs/anexos/anexo-4-historias-de-usuario.md` cubre RF001–RF036 (HU001–HU036), uno por cada requisito |
| Ningún caso de prueba redactado todavía (Anexo 5, Sprint 5) | 2026-08-07 | ✅ **Cerrado 2026-08-10** — Se incluyeron en el Anexo 5 |
| RNF005 marcado ✅ sin implementación: `resilience4j` estaba en el `pom.xml` sin un solo uso | 2026-08-11 | ✅ **Cerrado 2026-08-11** — `@Retry`/`@CircuitBreaker` en ambos colectores, configurados en `application.yml` y verificados en `ResilienciaDeColectoresTest` |
| RNF007 marcado ✅ sin implementación: no existía ningún `HealthIndicator` | 2026-08-11 | ✅ **Cerrado 2026-08-11** — `ColectorHealthIndicator` + `EstadoColectorRegistry`, detalle en `/api/veedor/ingesta/salud` |
| RF003 marcado ✅ pero imposible desde el contrato: `SectorApiMapper` ignoraba `actualizadoEn` y el dominio no transportaba la fecha | 2026-08-11 | ✅ **Cerrado 2026-08-11** — `Sector.estadoActualizadoEn` llega hasta `SectorRespuesta` |
| RNF004/RNF006 marcados ✅ mientras un fallo de Acuacar tumbaba el ciclo entero y el deduplicador descartaba en silencio | 2026-08-11 | ✅ **Cerrado 2026-08-11** — aislamiento por colector y marcado como visto solo tras procesar |
| M9 cambiaba el estado público de un barrio sin revisión humana, contra lo que prometía su propio extractor | 2026-08-11 | ✅ **Cerrado 2026-08-11** — cola de revisión del veedor (`ADR-028`) |
| `backend/openapi.yaml` es un archivo generado que se comitea a mano, sin nada que garantice que siga al día | 2026-08-11 | ✅ **Cerrado 2026-08-11** — `ContratoOpenApiTest` compara las rutas publicadas contra el archivo versionado |
| Ningún endpoint paginaba: `/api/bitacora` devolvía la bitácora entera, que por RF028 crece sin cota | 2026-08-11 | ✅ **Cerrado 2026-08-11** — paginación con metadatos en cabeceras en bitácora y las dos colas del veedor |
| El cupo por dispositivo (RF006) contaba y luego guardaba: dos peticiones simultáneas del mismo dispositivo pasaban ambas | 2026-08-11 | ✅ **Cerrado 2026-08-11** — reserva atómica con INCR de Redis, con prueba de 50 hilos concurrentes |
| RNF020 marcado ✅ sin verificación: el CI no construía las imágenes ni validaba los compose | 2026-08-11 | ✅ **Cerrado 2026-08-11** — `despliegue-ci.yml`, que además falla si producción publica un puerto de base de datos |
| RNF001 y RNF002 marcados ✅ sin ninguna medición | 2026-08-11 | 🟡 **RNF001 sigue abierto** (es de frontend, D4) · ✅ **RNF002 cerrado 2026-08-11** — k6 midió p(95)=16.49 ms contra el umbral de 1 s |
| El backend paginó `/api/veedor/reportes/pendientes` y `/api/veedor/ingesta/propuestas` (fila anterior), pero el frontend nunca leyó `X-Total-Count`: un reporte o propuesta más allá del elemento 50 era invisible para el veedor, sin aviso | 2026-08-12 | ✅ **Cerrado 2026-08-12** — ambas colas piden el máximo (`tamano=200`) y el panel avisa si aun así sobra más de lo mostrado (`PanelVeedor.tsx`) |

### Pendientes reconocidos

No son huecos de trazabilidad: están declarados y con su razón.

| Qué | Por qué sigue abierto |
|---|---|
| RF041 (webhook real de WhatsApp/Telegram) | Exige credenciales de WhatsApp Business API o un bot de Telegram, que no dependen del backend. La cadena evento → caso de uso → puerto ya está cableada y probada; falta el adaptador que llame al proveedor |
| RNF021 (bucket, no disco local) | Decisión explícita del 2026-08-11: mantener disco local mientras el despliegue sea de servidor único (Anexo 5). `AlmacenamientoPort` ya aísla el cambio si se migra después |
