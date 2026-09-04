# Requisitos de producto — AguaVigía CTG

> Especificación de requisitos (base del SRS académico, formato IEEE 830 adaptado).
> Cada requisito tiene id, prioridad MoSCoW, módulo y origen. Sin origen, un requisito es una opinión.

**Convenciones de prioridad (MoSCoW):**
`Debe` = sin esto el producto no existe · `Debería` = alto valor, no bloqueante ·
`Podría` = si sobra tiempo · `No esta vez` = fuera de alcance declarado

---

## 1. Requisitos funcionales

### M1 — Mapa en vivo

| ID | Requisito | Prioridad | Actor | Origen |
|---|---|---|---|---|
| RF001 | El sistema debe mostrar un mapa de Cartagena con todos los sectores coloreados según su estado actual (con servicio, sin servicio, presión baja, corte programado). | Debe | Vecino | Objetivo general |
| RF002 | El sistema debe permitir consultar el detalle de un sector (estado, último cambio, histórico de cortes) al seleccionarlo. | Debe | Vecino | Observación de campo |
| RF003 | El sistema debe mostrar, junto a cada sector, cuánto tiempo hace que se actualizó su información. | Debe | Vecino | Riesgo: mapa congelado con datos viejos |
| RF004 | El sistema debe ofrecer una lista textual de sectores y sus estados como alternativa accesible al mapa. | Debe | Vecino con lector de pantalla | RNF de accesibilidad |

### M2 — Reporte ciudadano

| ID | Requisito | Prioridad | Actor | Origen |
|---|---|---|---|---|
| RF005 | El sistema debe permitir reportar "no tengo agua", "presión baja" o "ya volvió el servicio" **sin requerir registro ni cuenta**. | Debe | Vecino | Brief: el usuario no se va a registrar |
| RF006 | El sistema debe limitar la cantidad de reportes por dispositivo en una ventana de tiempo, para contener el abuso sin usar login. | Debe | Sistema | Sustituto del registro |
| RF007 | El sistema debe registrar la coordenada del reporte cuando el usuario lo autorice, e inferir el sector a partir de ella. | Debería | Vecino | Precisión del consenso |
| RF008 | El sistema debe permitir reportar en un máximo de dos toques desde el mapa. | Debe | Vecino | DESIGN.md |

### M3 — Consenso automático

| ID | Requisito | Prioridad | Actor | Origen |
|---|---|---|---|---|
| RF009 | El sistema debe cambiar el estado de un sector automáticamente cuando N reportes independientes coincidan dentro de una ventana de tiempo configurable. | Debe | Sistema | Diferencial del producto |
| RF010 | El sistema debe soportar al menos dos estrategias de consenso intercambiables (umbral fijo y umbral proporcional a la población del sector). | Debería | Sistema | Patrón Strategy — evidencia académica |
| RF011 | El sistema debe registrar qué reportes sustentaron cada cambio de estado por consenso. | Debe | Veedor | Trazabilidad |

### M4 — Alertas por correo

| ID | Requisito | Prioridad | Actor | Origen |
|---|---|---|---|---|
| RF012 | El sistema debe permitir suscribirse a uno o más sectores indicando solo un correo electrónico. | Debe | Vecino | Brief |
| RF013 | El sistema debe confirmar la suscripción mediante doble opt-in antes de enviar cualquier alerta. | Debe | Sistema | Ley 1581/2012 (datos personales) |
| RF014 | El sistema debe notificar al suscriptor cuando su sector cambie de estado (corte anunciado, confirmado o restablecido). | Debe | Vecino | Objetivo general |
| RF015 | Todo correo debe incluir un enlace de baja que funcione en un clic, sin pedir credenciales. | Debe | Vecino | Ley 1581/2012 |

### M5 — Panel del veedor

| ID | Requisito | Prioridad | Actor | Origen |
|---|---|---|---|---|
| RF016 | El sistema debe permitir a un usuario autenticado registrar un corte oficial con sectores afectados, inicio, fin prometido y causa. | Debe | Veedor | Fallo del Tribunal |
| RF017 | El sistema debe permitir cerrar un corte registrando la hora real de restablecimiento. | Debe | Veedor | Insumo del Índice de Cumplimiento |
| RF018 | El sistema debe permitir moderar (aprobar o descartar) reportes ciudadanos marcados como dudosos. | Debería | Veedor | Control de calidad |
| RF019 | El acceso al panel debe requerir autenticación con token; el resto de la plataforma es público. | Debe | Sistema | Seguridad |

### M6 — Índice de Cumplimiento ⭐

| ID | Requisito | Prioridad | Actor | Origen |
|---|---|---|---|---|
| RF020 | El sistema debe calcular, por cada corte cerrado con hora prometida, la desviación entre duración prometida y duración real. | Debe | Sistema | **Diferencial central** |
| RF021 | El sistema debe publicar un índice agregado de cumplimiento por sector y uno global de la ciudad. | Debe | Ciudadanía | Fallo del Tribunal |
| RF022 | El sistema debe presentar el índice como comparación explícita (prometido vs. real), no como puntaje aislado. | Debe | Ciudadanía | DESIGN.md |

### M7 — Estadísticas

| ID | Requisito | Prioridad | Actor | Origen |
|---|---|---|---|---|
| RF023 | El sistema debe mostrar los sectores más afectados, la duración promedio de los cortes y su frecuencia mensual. | Debe | Veedor, periodista | Objetivo específico 4 |
| RF024 | El sistema debe mostrar la evolución del índice de cumplimiento en el tiempo. | Debería | Veedor | Evidencia acumulada |
| RF025 | El sistema debería permitir exportar las estadísticas en formato abierto (CSV). | Podría | Periodista | Uso periodístico |

### M8 — Bitácora pública

| ID | Requisito | Prioridad | Actor | Origen |
|---|---|---|---|---|
| RF026 | El sistema debe registrar cada evento relevante (corte anunciado, confirmado por ciudadanos, restablecido) en una bitácora de solo anexado. | Debe | Sistema | Trazabilidad |
| RF027 | La bitácora debe ser consultable públicamente sin autenticación. | Debe | Ciudadanía | Transparencia |
| RF028 | Ningún evento de la bitácora puede editarse ni eliminarse una vez registrado. | Debe | Sistema | Valor probatorio |

### M9 — Ingesta automática con IA

| ID | Requisito | Prioridad | Actor | Origen |
|---|---|---|---|---|
| RF029 | El sistema debe consumir periódicamente la API oficial del operador y detectar publicaciones nuevas o modificadas. | Debe | Sistema | Auditoría de fuentes |
| RF030 | El sistema debe consumir fuentes de prensa vía RSS de agregadores públicos. | Debería | Sistema | Auditoría de fuentes |
| RF031 | El sistema debe descartar automáticamente contenido duplicado mediante hash del contenido normalizado. | Debe | Sistema | Robustez |
| RF032 | El sistema debe clasificar cada documento (¿habla de una interrupción del acueducto en Cartagena?) y extraer sectores, fechas, horas y causa mediante IA con salida estructurada. | No esta vez | Sistema | Automatización |
| RF033 | Toda extracción debe incluir un puntaje de confianza y la cita textual del fragmento que la sustenta. | No esta vez | Sistema | **Anti-alucinación** |
| RF034 | El sistema debe rechazar automáticamente cualquier extracción cuya cita textual no aparezca literalmente en el documento origen. | No esta vez | Sistema | **Anti-alucinación** |
| RF035 | Las extracciones con confianza intermedia deben enviarse a una cola de revisión humana en vez de publicarse. | No esta vez | Veedor | Precisión sobre exhaustividad |
| RF036 | El sistema **no debe** acceder a fuentes cuyo `robots.txt` bloquee agentes de IA. | No esta vez | Sistema | Política ética del proyecto |

---

## 2. Requisitos no funcionales

Todos medibles. Un RNF sin métrica y umbral no es verificable y no cuenta.

### Rendimiento

| ID | Requisito | Verificación |
|---|---|---|
| RNF001 | El mapa debe mostrar el estado de todos los sectores en **menos de 3 segundos** sobre conexión 3G simulada. | Lighthouse con throttling 3G |
| RNF002 | El envío de un reporte ciudadano debe confirmarse al usuario en **menos de 1 segundo** en condiciones normales. | Prueba de carga |
| RNF003 | La consulta del estado del mapa debe servirse desde caché con **TTL máximo de 60 segundos**. | Inspección de cabeceras / Redis |

### Disponibilidad y robustez

| ID | Requisito | Verificación |
|---|---|---|
| RNF004 | La caída de cualquier fuente externa **no debe** impedir que el resto del sistema funcione. | Prueba de caos: apagar una fuente |
| RNF005 | Ante fallo de una fuente externa, el sistema debe reintentar con retroceso exponencial y abrir un cortacircuitos tras **3 fallos consecutivos**. | Test de integración con fuente simulada |
| RNF006 | Ningún documento ingerido puede descartarse en silencio: todo fallo va a una cola muerta con su motivo. | Revisión de la colección de fallidos |
| RNF007 | El sistema debe exponer el estado de salud de cada colector (última ejecución exitosa, ítems procesados, tasa de error). | Endpoint `/actuator/health` |

### Seguridad y privacidad

| ID | Requisito | Verificación |
|---|---|---|
| RNF008 | El sistema **no debe** almacenar datos personales identificables de quien reporta, más allá de una huella anónima de dispositivo. | Revisión del modelo de datos |
| RNF009 | Los correos de suscripción deben almacenarse con acceso restringido y eliminarse al darse de baja. | Revisión de código y prueba |
| RNF010 | No debe haber credenciales en el código fuente ni en el repositorio. | Escaneo de secretos en CI |
| RNF011 | El panel administrativo debe requerir token JWT con expiración máxima de 8 horas. | Test de seguridad |
| RNF022 | El panel debe autorizar cada acción contra un permiso concreto, nunca contra el rol. | ArchUnit + pruebas de contrato por endpoint |
| RNF023 | Suspender una cuenta o cambiar sus permisos debe invalidar sus sesiones vivas de inmediato, sin esperar a que expire el token. | Prueba de integración de revocación |
| RNF024 | El registro, el ingreso y el restablecimiento de clave no deben revelar qué correos tienen cuenta, ni por el mensaje ni por el tiempo de respuesta. | Pruebas de igualdad de respuesta y de tiempo equivalente |
| RNF025 | Las cuentas con rol ADMIN deben exigir un segundo factor TOTP conforme al RFC 6238. | Vectores de prueba del propio RFC |

### Usabilidad y accesibilidad

| ID | Requisito | Verificación |
|---|---|---|
| RNF012 | La interfaz debe cumplir contraste **WCAG AA (4.5:1)** en tema claro y oscuro. | Auditoría axe / Lighthouse |
| RNF013 | Toda funcionalidad debe ser operable solo con teclado, con foco visible. | Prueba manual |
| RNF014 | Los objetivos táctiles deben medir al menos **44×44 px**. | Inspección de CSS |
| RNF015 | La interfaz debe funcionar correctamente desde **360 px** de ancho. | Prueba responsive |
| RNF016 | El estado del servicio nunca debe comunicarse solo por color. | Revisión de diseño |

### Calidad del software

| ID | Requisito | Verificación |
|---|---|---|
| RNF017 | La cobertura de pruebas en `domain/` y `application/` debe ser **≥ 70%**. El umbral que la build exige es **85%**, y no 70, porque un umbral 20 puntos por debajo del valor real no protege de nada — justificado en el `pom.xml`. | JaCoCo con `check` en fase `verify`: la build falla por debajo del 85% |
| RNF018 | La build debe fallar si se viola una regla de arquitectura. | ArchUnit en CI |
| RNF019 | La precisión del clasificador de IA sobre el conjunto dorado debe ser **≥ 90%**. | Descartado (No esta vez) |
| RNF020 | El sistema completo debe levantarse en una máquina limpia con **un solo comando**. | `docker compose up` |

---

## 3. Fuera de alcance (declarado)

| Qué | Por qué |
|---|---|
| App móvil nativa | El frontend es responsive y PWA; una app nativa duplica el esfuerzo sin valor adicional |
| Integración con sistemas internos del operador | No existe API pública ni convenio |
| Scraping de Facebook, Instagram o X | Viola sus términos; la vía legítima (Meta Content Library) requiere aprobación externa |
| Scraping de medios que bloquean agentes de IA | Política ética del proyecto — se respeta `robots.txt` sin excepción |
| Predicción de cortes futuros | Requiere datos operativos que no tenemos; sería especulación presentada como dato |
| Reparación o intervención en la infraestructura hidráulica | No es un problema de software |
| Clasificación e Ingesta con IA (RF032-RF036, RNF019) | Descartado por la eliminación de la dependencia del SDK de Anthropic para desbloquear M9 |

---

## 4. Trazabilidad

| Objetivo específico | Requisitos que lo cumplen |
|---|---|
| 1. Analizar requisitos mediante elicitación | Este documento + anexos 1, 2 y 4 |
| 2. Diseñar arquitectura limpia y modelo geoespacial | RNF018, RF001, RF007 |
| 3. Implementar con Spring Boot, MongoDB, Redis y React aplicando SOLID | Todos los RF de M1–M9 |
| 4. Validar funcionamiento y aceptación | RNF017, RNF019, RF023, instrumentos de percepción |

> La matriz completa `objetivo → RF → historia de usuario → caso de prueba` se mantiene en
> `docs/ingenieria/matriz-trazabilidad.md`.

---

## 5. Fase 2: Expansión Cívica y Estándares Abiertos (Propuestos)

A partir de la estabilización del núcleo del sistema, se proponen las siguientes características inspiradas en plataformas globales de tecnología cívica (Civic Tech):

### M10 — Evidencia Multimedia (Inspirado en Ushahidi)
| ID | Requisito | Prioridad | Actor | Origen |
|---|---|---|---|---|
| RF037 | El sistema debe permitir a los ciudadanos adjuntar fotografías a sus reportes (ej. tubo roto). | Debería | Vecino | Propuesta Fase 2 |
| RNF021 | Las imágenes deben almacenarse en un bucket seguro (ej. AWS S3) con compresión automática y limpieza de metadatos EXIF. | Debe | Sistema | Privacidad / Optimización |

### M11 — Validación Comunitaria Rápida (Inspirado en Pol.is/Waze)
| ID | Requisito | Prioridad | Actor | Origen |
|---|---|---|---|---|
| RF038 | El sistema debe permitir confirmar un reporte ciudadano temprano en el mapa mediante un solo clic ("¿Tú también estás sin agua?"). | Debe | Vecino | Propuesta Fase 2 |

### M12 — API Abierta Open311
| ID | Requisito | Prioridad | Actor | Origen |
|---|---|---|---|---|
| RF039 | El sistema debe exponer los reportes confirmados y cortes oficiales mediante una API que cumpla el estándar global Open311. | Debería | Sistema | Interoperabilidad cívica |

### M13 — Integración IoT Pasiva
| ID | Requisito | Prioridad | Actor | Origen |
|---|---|---|---|---|
| RF040 | El sistema debe exponer un endpoint seguro para recibir reportes automáticos de caída de presión desde sensores IoT residenciales (ej. ESP32). | Podría | Sensor IoT | Automatización comunitaria |

### M14 — Alertas Push Instantáneas
| ID | Requisito | Prioridad | Actor | Origen |
|---|---|---|---|---|
| RF041 | El sistema debe permitir la suscripción a alertas de sector mediante plataformas de mensajería instantánea (Telegram/WhatsApp) como alternativa al correo. | Debe | Vecino | Propuesta Fase 2 |

### M15 — Cuentas y permisos del panel

Amplían `RF019`, que solo exige "autenticación con token" y no dice nada del modelo de cuentas.
Decisión y alternativas descartadas en `ADR-039`, que reemplaza a `ADR-016`.

| ID | Requisito | Prioridad | Actor | Origen |
|---|---|---|---|---|
| RF042 | El sistema debe permitir que una persona solicite una cuenta del panel con su correo, y no debe concederle ningún permiso hasta que verifique el correo y un administrador la apruebe. | Debe | Aspirante a veedor | ADR-039 |
| RF043 | El sistema debe permitir a un administrador invitar a una persona por correo con un rol ya asignado; al fijar su clave desde el enlace, la cuenta queda activa sin otra aprobación. | Debe | Administrador | ADR-039 |
| RF044 | El sistema debe permitir a un administrador aprobar, rechazar, suspender y reactivar cuentas, y asignarles un rol con ajustes de permisos por persona. | Debe | Administrador | ADR-039 |
| RF045 | El sistema debe registrar en una bitácora inmutable quién cambió el acceso de quién, cuándo y desde qué IP. | Debe | Administrador | ADR-039 · carencia declarada en ADR-016 |
| RF046 | El sistema debe permitir restablecer la clave mediante un enlace de un solo uso enviado al correo, y ese cambio debe cerrar todas las sesiones abiertas de la cuenta. | Debería | Veedor | ADR-039 |
