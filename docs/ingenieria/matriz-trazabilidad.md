# Matriz de trazabilidad

> Cadena completa: **objetivo específico → requisito → historia de usuario → caso de prueba →
> implementación**. Es la evidencia de que nada se construyó de más y nada quedó sin verificar.
>
> **Se actualiza al cerrar cada sprint**, desde `docs/gestion/registro-de-implementaciones.md`.
> Reconstruirla en el Sprint 6 es imposible: por eso se registra desde el primer día.

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
| RF001 Mapa con sectores coloreados por estado | HU001 | CP001 | 1, 2, 3 | 1 | ⬜ |
| RF002 Detalle del sector al seleccionarlo | HU002 | CP002 | 3 | 1 | ⬜ |
| RF003 Antigüedad del dato visible por sector | HU003 | CP003 | 3 | 2 | ⬜ |
| RF004 Lista textual accesible alternativa al mapa | HU004 | CP004 | 3, 4 | 1 | ⬜ |

### M2 — Reporte ciudadano · D3 + D4

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF005 Reportar sin registro ni cuenta | HU005 | CP005 | 1, 3 | 2 | ⬜ |
| RF006 Límite de reportes por dispositivo | HU006 | CP006 | 3 | 2 | ⬜ |
| RF007 Coordenada del reporte e inferencia de sector | HU007 | CP007 | 2, 3 | 2 | ⬜ |
| RF008 Reporte en máximo dos toques | HU008 | CP008 | 3, 4 | 2 | ⬜ |

### M3 — Consenso automático · D2

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF009 Cambio de estado por N reportes coincidentes | HU009 | CP009 | 2, 3 | 2 | ⬜ |
| RF010 Dos estrategias de consenso intercambiables | HU010 | CP010 | 3 | 2 | ⬜ |
| RF011 Registro de los reportes que sustentaron el cambio | HU011 | CP011 | 3, 4 | 2 | ⬜ |

### M4 — Alertas por correo · D1

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF012 Suscripción a sectores solo con correo | HU012 | CP012 | 1, 3 | 1 | ⬜ |
| RF013 Confirmación por doble opt-in | HU013 | CP013 | 3 | 2 | ⬜ |
| RF014 Notificación al cambiar el estado del sector | HU014 | CP014 | 3 | 3 | ⬜ |
| RF015 Baja en un clic sin credenciales | HU015 | CP015 | 3 | 2 | ⬜ |

### M5 — Panel del veedor · D3 + D4

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF016 Registrar corte oficial con fin prometido | HU016 | CP016 | 1, 3 | 3 | ⬜ |
| RF017 Cerrar corte con hora real de restablecimiento | HU017 | CP017 | 3 | 3 | ⬜ |
| RF018 Moderar reportes dudosos | HU018 | CP018 | 3 | 3 | ⬜ |
| RF019 Autenticación con token para el panel | HU019 | CP019 | 3 | 3 | ⬜ |

### M6 — Índice de Cumplimiento ⭐ · D2

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF020 Desviación entre duración prometida y real | HU020 | CP020 | 3, 4 | 4 | ⬜ |
| RF021 Índice agregado por sector y global | HU021 | CP021 | 3, 4 | 4 | ⬜ |
| RF022 Presentación como comparación, no como puntaje | HU022 | CP022 | 3 | 4 | ⬜ |

### M7 — Estadísticas · D5 + D4

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF023 Sectores más afectados, duración y frecuencia | HU023 | CP023 | 3, 4 | 4 | ⬜ |
| RF024 Evolución del índice en el tiempo | HU024 | CP024 | 4 | 4 | ⬜ |
| RF025 Exportación en CSV | HU025 | CP025 | 3 | 5 | ⬜ |

### M8 — Bitácora pública · D1

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF026 Registro de todo evento relevante, solo anexado | HU026 | CP026 | 2, 3 | 3 | ⬜ |
| RF027 Consulta pública sin autenticación | HU027 | CP027 | 3 | 4 | ⬜ |
| RF028 Inmutabilidad: no se edita ni se elimina | HU028 | CP028 | 2, 3 | 3 | ⬜ |

### M9 — Ingesta automática con IA ⭐ · D3

| RF | Historia | Caso de prueba | Obj. | Sprint | Estado |
|---|---|---|---|---|---|
| RF029 Consumo periódico de la API oficial | HU029 | CP029 | 3 | 1 | ⬜ |
| RF030 Consumo de prensa vía RSS de agregadores | HU030 | CP030 | 3 | 3 | ⬜ |
| RF031 Descarte de duplicados por hash | HU031 | CP031 | 3 | 2 | ⬜ |
| RF032 Clasificación y extracción con IA estructurada | HU032 | CP032 | 3, 4 | 4 | ⬜ |
| RF033 Confianza y cita textual en toda extracción | HU033 | CP033 | 3, 4 | 4 | ⬜ |
| RF034 Rechazo automático si la cita no es literal | HU034 | CP034 | 3, 4 | 4 | ⬜ |
| RF035 Confianza intermedia a revisión humana | HU035 | CP035 | 3 | 4 | ⬜ |
| RF036 No acceder a fuentes que bloquean agentes de IA | HU036 | CP036 | 3 | 1 | ⬜ |

---

## Nivel 3 — Requisitos no funcionales

Los RNF no llevan historia de usuario: se verifican con una medición, no con un flujo.

| RNF | Umbral | Cómo se verifica | Sprint | Estado |
|---|---|---|---|---|
| RNF001 | Mapa completo < 3 s en 3G | Lighthouse con throttling | 6 | ⬜ |
| RNF002 | Confirmación de reporte < 1 s | Prueba de carga | 5 | ⬜ |
| RNF003 | Caché del mapa con TTL ≤ 60 s | Inspección de Redis | 2 | ⬜ |
| RNF004 | Fuente caída no tumba el sistema | Prueba de caos | 4 | ⬜ |
| RNF005 | Backoff + cortacircuitos tras 3 fallos | Test de integración | 4 | ⬜ |
| RNF006 | Cero descartes silenciosos | Revisión de la cola muerta | 2 | ⬜ |
| RNF007 | Salud por colector expuesta | `/actuator/health` | 4 | ⬜ |
| RNF008 | Sin datos personales del reportante | Revisión del modelo de datos | 2 | ⬜ |
| RNF009 | Correos con acceso restringido, borrados al darse de baja | Revisión de código y prueba | 2 | ⬜ |
| RNF010 | Cero credenciales en el repositorio | `gitleaks` en CI | 0 | ⬜ |
| RNF011 | JWT con expiración ≤ 8 h | Test de seguridad | 3 | ⬜ |
| RNF012 | Contraste AA en ambos temas | axe / Lighthouse | 5 | ⬜ |
| RNF013 | Operable solo con teclado | Prueba manual | 5 | ⬜ |
| RNF014 | Objetivos táctiles ≥ 44×44 px | Inspección de CSS | 5 | ⬜ |
| RNF015 | Funcional desde 360 px | Prueba responsive | 5 | ⬜ |
| RNF016 | El estado nunca solo por color | Revisión de diseño | 5 | ⬜ |
| RNF017 | Cobertura ≥ 70% en `domain/` y `application/` | JaCoCo en CI | 5 | ⬜ |
| RNF018 | Build falla si se viola una capa | ArchUnit en CI | 1 | ⬜ |
| RNF019 | Precisión del clasificador ≥ 90% | Regresión sobre el conjunto dorado | 5 | ⬜ |
| RNF020 | Levanta con un solo comando | `docker compose up` en máquina limpia | 0 | ⬜ |

---

## Huecos de trazabilidad detectados

Se revisa al cerrar cada sprint. Un hueco aquí es un hallazgo del docente esperando a ocurrir.

| Hueco | Detectado | Estado |
|---|---|---|
| Ninguna historia de usuario redactada todavía (Anexo 4, Sprint 1) | 2026-08-07 | ✅ **Cerrado 2026-08-08** — `docs/anexos/anexo-4-historias-de-usuario.md` cubre RF001–RF036 (HU001–HU036), uno por cada requisito |
| Ningún caso de prueba redactado todavía (Anexo 5, Sprint 5) | 2026-08-07 | Abierto |
