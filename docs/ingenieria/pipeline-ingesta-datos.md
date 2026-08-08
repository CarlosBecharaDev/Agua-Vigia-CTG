# Pipeline de ingesta de datos y detección con IA

> **Estado:** diseño aprobado, pendiente de implementación.
> **Corrige:** una afirmación previa errónea sobre el `robots.txt` de Acuacar (ver §1).

---

## 1. Hallazgo que cambia la estrategia

En un análisis anterior se afirmó que el sitio de Acuacar **prohibía el acceso automatizado** vía `robots.txt`.
**Esa afirmación era incorrecta.** El archivo real (verificado el 2026-08-06) es:

```
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php

Sitemap: https://www.acuacar.com/sitemap_index.xml

User-agent: *
Disallow: /wp-content/uploads/wpo/wpo-plugins-tables-list.json
```

Solo se excluye el panel administrativo. **Todo el contenido público es rastreable**, y el sitio incluso
publica un sitemap para facilitarlo.

Más aún: `acuacar.com` es un **WordPress con la API REST habilitada**. Verificado en producción:

| Endpoint | Resultado |
|---|---|
| `GET /wp-json/wp/v2/posts` | **HTTP 200**, `application/json`, 307 posts, 103 páginas |
| `GET /feed/` | **HTTP 200**, `application/rss+xml` |
| `GET /sitemap_index.xml` | **HTTP 200**, 3 sitemaps, actualizado a diario |

Campos disponibles por boletín: `id`, `date`, `modified`, `link`, `title.rendered`,
`content.rendered`, `excerpt.rendered`, `categories`. Cabeceras `X-WP-Total` y `X-WP-TotalPages`
para paginar. Además soporta `?after=`, `?modified_after=` y `?_fields=` para traer solo lo nuevo.

**No necesitamos scraping de HTML frágil: hay una API estructurada, pública y estable.** El proyecto
gana un pilar técnico que antes no tenía, y la "decisión ética de no scrapear" se reemplaza por algo
más honesto: *consumir la fuente oficial de la forma menos invasiva posible*.

Los boletines relevantes existen y son abundantes. Ejemplos reales del sitemap:

- `#2846 — AGUAS DE CARTAGENA ANUNCIA SUSPENSIÓN PROGRAMADA DEL SERVICIO … EN EL 40 % DE LA CIUDAD`
- `#2547 — SUSPENSIONES EN EL ACUEDUCTO AL 63 % DE CARTAGENA POR OBRAS PRIORITARIAS`
- `#2549 — RESTABLECIMIENTO GRADUAL DEL SERVICIO DE ACUEDUCTO`
- `#2574 — EMERGENCIA EN TIERRA BAJA: ROTURA DE CONDUCCIÓN TERRESTRE`

Cada uno contiene sectores, fechas, horas prometidas y causa: exactamente lo que alimenta el
**Índice de Cumplimiento** (M6).

---

## 2. Las cuatro capas de datos

El sistema no depende de una sola fuente. Cada capa tiene distinta confiabilidad, latencia y estatus legal.

| Capa | Fuente | Método | Latencia | Confiabilidad | Estatus |
|---|---|---|---|---|---|
| **L1 — Oficial** | `acuacar.com` | WP REST API + RSS | ~minutos | Alta (es la fuente autoritativa) | ✅ Permitido por `robots.txt` |
| **L2 — Prensa** | Medios locales y nacionales | Google News RSS + RSS propios | ~horas | Media (puede exagerar o simplificar) | ✅ RSS es publicación deliberada |
| **L3 — Social** | Facebook / Instagram / X | Meta Content Library (académico) | ~horas | Baja (ruido, sarcasmo, duplicados) | ⚠️ Solo vía API oficial — ver §5 |
| **L4 — Ciudadana** | La propia plataforma | Reportes de usuarios (M2/M3) | **segundos** | Alta en agregado, baja individual | ✅ Datos propios |

**L4 es la más valiosa y la más rápida**, y es la única que nadie más tiene. L1 dice lo que se
prometió; L4 dice lo que realmente pasó. El Índice de Cumplimiento vive exactamente en esa diferencia.

### L2 — Prensa, verificado

Google News RSS funciona y agrega todos los medios en una sola consulta:

```
https://news.google.com/rss/search
  ?q=acuacar+OR+%22corte+de+agua%22+Cartagena
  &hl=es-419&gl=CO&ceid=CO:es-419
```

Devuelve **100 ítems** con `title`, `link`, `pubDate` y `source`. Resultados reales incluyen boletines
de Acuacar, comunicados de la Alcaldía Mayor de Cartagena y notas de prensa sobre el fallo del Tribunal.

De los medios locales, **Zona Cero** expone RSS propio y funcional (`zonacero.com/rss.xml`).
**Caracol Radio y W Radio, reverificados el 2026-08-08, también funcionan**: el feed real no estaba
en `/rss/` (esa ruta nunca existió) sino en `/arc/outboundfeeds/google-news-feed/?outputType=xml`
—mismo CMS Arc/PEP en ambos—, permitido explícitamente por su `robots.txt` (que sí bloquea la ruta
legacy `/feed.aspx`, evitada). **RCN Radio sigue sin feed localizado** pese a probar cuatro rutas
candidatas — su `robots.txt` lo permite, pero no se encontró el feed real.

**El Universal, El Tiempo, El Heraldo y Blu Radio quedan fuera del pipeline automatizado por decisión
explícita del propio medio**: sus archivos `robots.txt` bloquean directamente a `anthropic-ai`,
`Claude-Web`, `GPTBot` y `CCBot` con `Disallow: /` sobre el sitio completo. Se respeta sin excepción,
aunque un colector con `User-Agent` propio técnicamente podría no ser detectado — spoofear el origen
para saltarse una restricción declarada sería incoherente con lo que este proyecto le exige a Acuacar.
Esa cobertura se recibe igualmente, de forma indirecta, a través de Google News RSS. Detalle completo
de cada medio probado, con la petición y el resultado exacto, en
`docs/ingenieria/auditoria-fuentes-de-datos.md`.

---

## 3. Arquitectura del pipeline

Cinco etapas, cada una aislada y con su propia política de fallo. Encaja en la Arquitectura Limpia:
cada colector es un **adaptador** que implementa un puerto del dominio.

```
┌── COLECTORES (infrastructure/ingest/) ─────────────────────────┐
│  AcuacarApiCollector ·  RssCollector ·  MetaLibraryCollector   │
│  cada uno implementa FuenteDatosPort                           │
└───────────────────────────┬────────────────────────────────────┘
                            ▼
┌── 1. NORMALIZACIÓN ────────────────────────────────────────────┐
│  Todo se convierte a DocumentoCrudo:                           │
│  { fuente, urlOriginal, publicadoEn, titulo, texto, hash }     │
│  hash = SHA-256(texto normalizado)  → clave de idempotencia    │
└───────────────────────────┬────────────────────────────────────┘
                            ▼
┌── 2. DEDUPLICACIÓN ────────────────────────────────────────────┐
│  ¿El hash ya existe en Mongo?  → descartar, no cuesta nada     │
│  Set de hashes recientes en Redis para el chequeo rápido       │
└───────────────────────────┬────────────────────────────────────┘
                            ▼
┌── 3. PREFILTRO DETERMINISTA (sin IA, sin costo) ───────────────┐
│  Regex/keywords: suspensión · racionamiento · corte · avería   │
│  restablecimiento · fuga · PTAP · acueducto · presión          │
│  Descarta ~70 % del volumen (deportes, patrocinios, concursos) │
└───────────────────────────┬────────────────────────────────────┘
                            ▼
┌── 4. EXTRACCIÓN CON IA (Claude) ───────────────────────────────┐
│  Salida estructurada obligatoria + puntaje de confianza        │
│  Solo se invoca sobre candidatos que pasaron la etapa 3        │
└───────────────────────────┬────────────────────────────────────┘
                            ▼
┌── 5. ENRUTAMIENTO POR CONFIANZA ───────────────────────────────┐
│  ≥ 0.85  → publica automáticamente, marcado "auto"             │
│  0.5–0.85→ cola de revisión humana en el panel del veedor      │
│  < 0.5   → se archiva, no se publica                           │
└────────────────────────────────────────────────────────────────┘
```

**Nada llega al mapa público sin pasar por la etapa 5.** Un modelo alucinando un corte que no existe
sería peor que no tener el dato: destruiría la credibilidad del proyecto.

---

## 4. La capa de IA

### Qué hace exactamente

Dos tareas distintas, no una:

1. **Clasificar** — ¿este texto habla de una interrupción del servicio de acueducto en Cartagena?
   (sí / no / relacionado pero no es interrupción)
2. **Extraer** — si es que sí: sectores afectados, tipo de evento, fecha y hora de inicio, hora
   prometida de restablecimiento, causa declarada, y **cuánto de esto estaba explícito en el texto
   frente a cuánto fue inferido**.

Ese último punto es el que evita el desastre. El modelo debe reportar qué dedujo, no presentar
inferencias como hechos.

### Contrato de salida

Se usa **salida estructurada** (`output_config.format`), no parsing de texto libre. El esquema es el
contrato; el modelo no puede devolver algo que no valide.

```java
public record EventoExtraido(
    boolean esInterrupcionDeAcueducto,
    TipoEvento tipo,              // SUSPENSION_PROGRAMADA | EMERGENCIA | RESTABLECIMIENTO | RACIONAMIENTO
    List<String> sectoresMencionados,
    Instant inicioDeclarado,
    Instant finPrometido,
    String causaDeclarada,
    double confianza,             // 0.0 – 1.0
    List<String> camposInferidos, // qué NO estaba explícito en el texto
    String citaTextual            // fragmento exacto que sustenta la extracción
) {}
```

`citaTextual` es la defensa contra alucinaciones: si el modelo no puede citar la frase del boletín que
respalda su extracción, la extracción no se publica. Es verificable automáticamente —
`documento.texto().contains(cita)`.

### Llamada al modelo

Backend en Java, así que se usa el SDK oficial de Anthropic:

```xml
<dependency>
  <groupId>com.anthropic</groupId>
  <artifactId>anthropic-java</artifactId>
</dependency>
```

```java
AnthropicClient client = AnthropicOkHttpClient.fromEnv();  // lee ANTHROPIC_API_KEY

StructuredMessageCreateParams<EventoExtraido> params = MessageCreateParams.builder()
    .model("claude-opus-5")
    .maxTokens(4096L)
    .system(PROMPT_SISTEMA)          // estable → se cachea entre peticiones
    .outputConfig(EventoExtraido.class)
    .addUserMessage(documento.texto())
    .build();

EventoExtraido evento = client.messages().create(params)
    .content().stream()
    .flatMap(cb -> cb.text().stream())
    .findFirst()
    .orElseThrow()
    .text();
```

> Verificar los nombres exactos del builder contra la versión del SDK que quede en el `pom.xml`
> antes de dar por buena esta firma.

### Control de costo (sin sacrificar calidad del modelo)

| Palanca | Efecto |
|---|---|
| Prefiltro determinista (etapa 3) | Elimina ~70 % del volumen antes de gastar un solo token |
| Deduplicación por hash (etapa 2) | El mismo boletín replicado en 5 medios se procesa **una** vez |
| Caché de prompt del sistema | El prompt de instrucciones es idéntico siempre → se cobra a ~0.1× |
| Procesamiento por lotes nocturno | El histórico se carga con la Batch API a mitad de precio |
| Solo texto nuevo o modificado | `?modified_after=` en la API de Acuacar |

El volumen real es modesto: Acuacar publica ~300 boletines en su histórico completo y unos pocos por
semana. Esto **no** es un problema de escala; es un problema de precisión.

### Cómo se sabe si la IA funciona

Sin esto, la capa de IA es fe ciega:

- **Conjunto dorado**: 100 boletines históricos etiquetados a mano por el equipo (sí/no + campos).
  Es trabajo de una tarde entre cinco personas y se convierte en un anexo del informe.
- **Métricas**: precisión, exhaustividad y F1 sobre ese conjunto. Se reportan en el Capítulo IV.
- **Prueba de regresión**: el conjunto dorado corre en CI. Si un cambio de prompt baja el F1, la build falla.
- **Falsos positivos son peores que falsos negativos**: un corte inventado destruye la confianza; un
  corte omitido lo reporta la comunidad (L4). El umbral de confianza se calibra sesgado hacia la precisión.

Esto convierte "usamos IA" en una afirmación medible y defendible ante el docente.

---

## 5. Facebook e Instagram: la respuesta honesta

**No se va a scrapear Facebook ni Instagram, y no es por pereza técnica.**

Hacerlo viola los Términos de Servicio de Meta, y las herramientas de acceso público que existían
desaparecieron: CrowdTangle cerró en agosto de 2024, y la Instagram Basic Display API fue descontinuada
en diciembre de 2024. Leer publicaciones públicas de páginas de terceros vía Graph API exige el permiso
*Page Public Content Access*, que requiere revisión de la app y verificación de empresa — inviable
para un proyecto de aula, y honestamente inviable para casi cualquiera.

**Existe una vía legítima y encaja perfecto con el proyecto: Meta Content Library.** Es el reemplazo
oficial de CrowdTangle, diseñado específicamente para **investigadores de instituciones académicas**.
Da acceso a contenido público de Facebook e Instagram para investigación. El acceso se solicita a
través del ICPSR y exige afiliación institucional — que ustedes tienen.

**Plan realista:**

1. **Sprint 0**: el Scrum Master solicita el acceso, respaldado por el Tecnológico Comfenalco. Es un
   trámite, no una garantía, y toma semanas.
2. **Si lo aprueban**: se implementa `MetaLibraryCollector` como una fuente L3 más. Es material
   excelente para la sustentación.
3. **Si no lo aprueban** (lo más probable en el plazo del proyecto): **la capa L4 lo reemplaza**. Los
   reportes ciudadanos dentro de la propia plataforma cumplen exactamente la misma función —
   capturar la voz del vecino en tiempo real — sin depender del permiso de una empresa extranjera y
   sin recolectar datos personales de terceros.

El diseño ya lo contempla: `MetaLibraryCollector` implementa `FuenteDatosPort` igual que los demás. Si
llega, se enchufa sin tocar nada más. **Eso es el principio Abierto/Cerrado demostrado con un caso real,
no con un ejemplo de libro.**

Lo mismo aplica a X/Twitter: el nivel gratuito de su API no permite búsqueda de publicaciones, y el
plan pagado cuesta más de lo que justifica un proyecto de aula. Queda documentado como fuera de alcance.

---

## 6. Robustez: "que no falle tan fácil"

Todo colector externo **va a fallar**. La pregunta no es si, sino qué pasa cuando falle.

| Modo de fallo | Qué ocurre sin protección | Mitigación |
|---|---|---|
| Acuacar cae o cambia de host | El colector lanza excepción en cada ciclo y satura los logs | **Circuit breaker** (Resilience4j): tras N fallos abre el circuito, deja de intentar, reintenta con backoff creciente |
| Respuesta lenta que nunca cierra | Un hilo bloqueado indefinidamente | Timeouts explícitos de conexión **y** de lectura en el cliente HTTP |
| Error transitorio 500 / 429 | Se pierde ese ciclo de datos | **Reintento con backoff exponencial + jitter**, máximo 3 intentos |
| Cambia la forma del JSON | El parser revienta o —peor— devuelve nulos silenciosos | **Detección de deriva de esquema**: si faltan campos obligatorios, no se descarta el dato: se manda a la cola muerta y se alerta |
| Ítem individual malformado | Un ítem corrupto tumba el lote completo | Procesamiento **ítem por ítem** con aislamiento de errores; un fallo no contamina a los demás |
| Doble ejecución del scheduler | Datos duplicados en el mapa | Idempotencia por hash de contenido + índice único en Mongo |
| La API de Claude falla o limita | El documento se pierde | Cola de reintentos en Redis; el documento crudo **ya está guardado**, la extracción se puede reintentar después |
| Nos bloquean por exceso de peticiones | Perdemos la fuente entera | Rate limiting propio (1 petición cada 30 s), `User-Agent` identificable con correo de contacto, `If-Modified-Since` para no pedir lo que no cambió |
| Todas las fuentes caen a la vez | El mapa queda congelado mostrando datos viejos como si fueran actuales | **Sello de frescura**: cada sector muestra "actualizado hace X"; si una fuente lleva más de N horas muda, se marca como degradada en la interfaz |

### Principios que sostienen todo lo anterior

**Guardar crudo primero, procesar después.** El `DocumentoCrudo` se persiste apenas llega, antes de
cualquier análisis. Si la extracción falla, el dato no se perdió: se reprocesa. Si mejoramos el prompt
en el Sprint 4, se puede **reprocesar todo el histórico** con la versión nueva.

**Cola muerta, no `catch` vacío.** Nada se descarta en silencio. Lo que falla queda en
`documentos_fallidos` con el motivo, visible en el panel del veedor. Un pipeline que pierde datos
callado es peor que uno que se cae ruidosamente.

**Salud de fuentes visible.** Endpoint `/actuator/health` extendido: por cada colector se expone última
ejecución exitosa, ítems procesados y tasa de error. Es una de las pantallas de la demo de sustentación.

**Ciudadano educado de la web.** `User-Agent` que identifica el proyecto y da un correo de contacto,
peticiones condicionales, límite de una cada 30 segundos, y respeto programático del `robots.txt` (se
lee y se cumple, no se asume). Costo casi nulo y es la diferencia entre un proyecto serio y uno que
molesta al operador.

---

## 7. Frecuencia de sondeo

| Fuente | Cada | Por qué |
|---|---|---|
| Acuacar WP REST API | 10 min | Es la fuente autoritativa; los anuncios de suspensión son urgentes |
| Acuacar RSS | 15 min | Redundancia por si la API REST falla |
| Google News RSS | 30 min | La prensa siempre va detrás del boletín oficial |
| Zona Cero RSS | 30 min | Igual |
| Caracol Radio RSS | 30 min | Igual — verificado 2026-08-08, `/arc/outboundfeeds/google-news-feed/` |
| W Radio RSS | 30 min | Igual — mismo CMS y ruta que Caracol Radio |
| Meta Content Library | 6 h | Solo si se aprueba el acceso; no es tiempo real |
| Reportes ciudadanos | **tiempo real** | Es un evento entrante, no un sondeo |

Con jitter aleatorio para no golpear siempre en el mismo segundo, y `If-Modified-Since` para que la
mayoría de las peticiones devuelvan `304 Not Modified` sin transferir nada.

---

## 8. Lo que esto le suma al proyecto académico

- **Requisitos no funcionales medibles**: disponibilidad del pipeline, latencia de detección,
  precisión del clasificador. Deja de ser "el sistema debe ser confiable" y pasa a ser verificable.
- **Un patrón de diseño más, aplicado de verdad**: Strategy sobre `FuenteDatosPort`, con cuatro
  implementaciones reales y una quinta condicionada a un permiso externo.
- **Un ADR con sustancia**: por qué API REST y no scraping de HTML; por qué no se toca Meta sin
  permiso; qué se hace cuando el permiso no llega.
- **Un capítulo de resultados con números**: precisión y exhaustividad sobre el conjunto dorado,
  no impresiones.
- **Una lección honesta documentada**: la primera versión del proyecto afirmó que el `robots.txt`
  prohibía el acceso, sin verificarlo. Verificarlo abrió la mejor fuente de datos del proyecto.
  Eso va en las conclusiones — un docente valora más una corrección documentada que una certeza inventada.

---

## 9. Qué implementar y en qué sprint

| Sprint | Entregable de ingesta |
|---|---|
| 1 | `DocumentoCrudo` + `FuenteDatosPort` en el dominio; `AcuacarApiCollector`; carga histórica de los 307 boletines |
| 2 | Prefiltro determinista; deduplicación por hash; cola muerta; salud de fuentes en Actuator |
| 3 | `RssCollector` (Google News + Zona Cero); circuit breakers y política de reintentos |
| 4 | Capa de IA: extracción estructurada, umbrales de confianza, cola de revisión humana, conjunto dorado y métricas |
| 5 | Reproceso del histórico con el prompt final; prueba de regresión del clasificador en CI |
