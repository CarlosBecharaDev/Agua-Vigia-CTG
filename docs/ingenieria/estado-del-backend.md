# Estado del backend — documento de traspaso

> **Para qué sirve este archivo.** Es el punto de entrada para quien retome el backend: una sesión
> de trabajo nueva, un compañero del equipo o el propio autor dentro de un mes. Recoge qué hace el
> proyecto, en qué estado está, qué se hizo, qué falta, qué se decidió dejar fuera y las trampas del
> entorno que cuestan una hora si nadie las avisa.
>
> **Última actualización:** 2026-08-12 · **Rama:** `main`
>
> Si al leerlo algo no cuadra con el código, gana el código: este documento se actualiza a mano.
> Lo que sí está garantizado por la build es la [matriz de trazabilidad](matriz-trazabilidad.md),
> donde cada ✅ lleva el nombre de la prueba que lo sostiene.
>
> **Nota de la sesión 2026-08-12:** este documento sigue narrando la ronda de trabajo que termina en
> §4 (backend en solitario, antes del merge con el rediseño de frontend). Desde entonces `frontend/`
> se conectó a este backend real de punta a punta — ver
> [`../../frontend/INTEGRACION-BACKEND.md`](../../frontend/INTEGRACION-BACKEND.md) para el estado
> vigente de esa integración. El único cambio de backend de esa sesión fue que
> `/api/suscripciones/confirmar` y `/cancelar` ahora responden HTML de cortesía a un navegador
> (`ADR-030`); no agregó, quitó ni cambió ninguna otra ruta.

---

## 1. Qué es AguaVigía CTG

Plataforma ciudadana e independiente de monitoreo del servicio de acueducto en Cartagena de Indias.
Proyecto de aula de la Fundación Universitaria Tecnológico Comfenalco, Tecnología en Desarrollo de
Software, 2026. **No está afiliada a Aguas de Cartagena S.A. E.S.P.** ni a ninguna entidad distrital.

**La pregunta que responde:** *"¿tengo agua o no, y hasta cuándo?"* en menos de 5 segundos, desde un
celular, sin registrarse y sin hacer scroll (`DESIGN.md` §1).

**El diferencial —lo que justifica el proyecto— es el Índice de Cumplimiento (M6):** cruza la
duración *prometida* de cada corte con la *real*. No es un puntaje aislado; se presenta siempre como
comparación (`Prometieron 2 horas · Fueron 8`).

De ahí sale un principio que atraviesa todo el código y conviene interiorizar antes de tocar nada:

> **Nada se publica sin poder sustentarlo.** Un sector sin dato verificado viaja con `estado: null`,
> no como "con servicio" (`ADR-014`). La ingesta automática propone, no publica (`ADR-028`). Open311
> expone estado agregado por barrio y no la coordenada de cada reporte (`ADR-026`). Un mapa que
> admite que no sabe es mejor que uno que miente.

### Reparto del equipo

Cinco integrantes. **El backend, las bases de datos y el DevOps son de una sola persona; el frontend
es de otros compañeros.** Para una sesión de trabajo esto significa: `frontend/` no se toca salvo
petición explícita, y **cualquier cambio en el contrato de la API tiene que ser aditivo** para no
romperles el trabajo.

---

## 2. Estado actual — verificable, no declarativo

| Métrica | Valor | Cómo se comprueba |
|---|---|---|
| Pruebas | **457**, todas en verde (447 era el conteo de la ronda que narra este documento; subió con commits posteriores, ver nota de cabecera) | `cd backend && ./mvnw verify` |
| Cobertura `domain/` | **91%** | JaCoCo; la build falla por debajo del 85% |
| Cobertura `application/` | **99%** | ídem |
| Cobertura `infrastructure.cache` | **100%** (era 69.6%) | JaCoCo, ver §4 de esta ronda |
| Clases de producción | 207 | `find backend/src/main -name '*.java'` |
| Clases de prueba | 90 | `find backend/src/test -name '*.java'` |
| Rutas publicadas en el contrato | 30 (sin cambios — ningún endpoint nuevo) | `grep -cE '^  /' backend/openapi.yaml` |
| Vulnerabilidades altas o críticas | **0** | Job "Despliegue y dependencias" del CI |
| ADRs registrados | 30 | `docs/design-decisions.md` |
| Workflows de CI | 3, los tres en verde | `gh run list` |

**Requisitos:** todos implementados salvo **RF041** (webhook real de WhatsApp/Telegram), que depende
de credenciales de terceros. **RNF002 ya se midió** (ver §4) y queda ✅ en la matriz. **RNF001** sigue
🟡 — es de frontend (D4), fuera de este alcance.

---

## 3. Arquitectura — lo que hay que respetar

Arquitectura Limpia (puertos y adaptadores). **No es decorativa: la build falla si se viola.**

```
domain/          Java puro. Cero imports de Spring o MongoDB.
  port/in/       Casos de uso (lo que la aplicación ofrece)
  port/out/      Puertos de salida (lo que la aplicación necesita)
application/     Un caso de uso = una clase = una acción. Depende solo de domain/.
api/             Controladores, DTOs y mappers de MapStruct. Traduce HTTP a caso de uso.
infrastructure/  Adaptadores: Mongo, Redis, correo, ingesta, almacenamiento, seguridad, jobs.
```

`ReglaDeOroArchitectureTest` verifica cinco reglas en cada build:

1. `domain/` no depende de `org.springframework..`
2. `domain/` no depende de `com.mongodb..`
3. `application/` no depende de `..infrastructure..`
4. `application/` no depende de `org.springframework.data..` ni `com.mongodb..`
   *(existe porque un servicio inyectaba `MongoTemplate` directamente y ninguna de las otras lo veía)*
5. `EventoBitacora` solo se construye desde su factory o desde el adaptador Mongo que lo rehidrata

### Convenciones que sigue todo el código

- **Nombres, comentarios y mensajes en español.** Los identificadores también (`RegistrarReporteService`,
  `buscarPorId`). La única excepción es Open311, cuyos campos son los del estándar en inglés.
- **Los comentarios explican el *porqué*, no el *qué*.** Casi todos citan el requisito (`RF006`), el
  ADR (`ADR-022`) o el bug que motivó la decisión (`BUG-041`). Al modificar algo, si el comentario
  deja de ser cierto, se corrige el comentario.
- **Errores en RFC 7807** centralizados en `ManejadorGlobalDeErrores`. Ningún manejador devuelve el
  mensaje de una excepción interna: un fallo de Mongo puede traer host y puerto.
- **`RelojPort` en todo lo que necesite tiempo.** Nada de `Instant.now()` disperso — ver §5, punto 3,
  para el bug que causó saltárselo.
- **Pruebas:** `@WebMvcTest` + `@Import` del `…MapperImpl` + `@MockitoBean` para controladores;
  `@DataMongoTest` / `@DataRedisTest` + Testcontainers para adaptadores. Se llaman `*Test` y no `*IT`
  a propósito: el `pom` no configura failsafe, así que un `*IT` no lo correría nadie.

---

## 4. Qué se hizo en esta ronda

35 commits, de `ef40973` a `7d320c3`. Todo en `main`, con CI en verde.

### Fase 1 — Lo que le mentía al usuario

| Hallazgo | Qué pasaba |
|---|---|
| `/api/estadisticas` | El `$lookup` cruzaba slug contra `_id`. El sembrador inserta sin `_id`, así que no empataba nunca: **los cinco sectores salían como "Desconocido"**. La prueba pasaba porque su fixture hacía `setId(slug)`, cosa que producción no hace |
| `CORTE_PROGRAMADO` | Declarado y jamás asignado. Registrar un corte no cambiaba el estado del sector, y el correo decía *"cambió su estado a: Desconocido"* |
| Correos duplicados | `GestionarCorteOficialService` recorría suscripciones a mano *además* de que el evento ya las notificaba: dos correos por corte |
| RF003 | `actualizadoEn` viajaba siempre `null`: el dominio no transportaba la fecha y el mapper la ignoraba |
| Correo de aviso | Le decía al vecino `SIN_SERVICIO`, sin enlace de baja (RF015 lo exige en **cada** correo) |

### Fase 2 — La ingesta propone, no publica (`ADR-028`)

`HeuristicaExtractor` documentaba que su confianza de 0.6 *"obliga a moderación manual"*. No era
cierto: nadie leía ese número y el pipeline escribía el estado directo. Una expresión regular sobre
una nota de prensa cambiaba el estado público de un barrio y disparaba correo, push y SSE.

Ahora existe `PropuestaIngesta`: nace `PENDIENTE` y el mapa no cambia hasta que un veedor aprueba
desde `/api/veedor/ingesta/propuestas`. `citaTextual` y `confianza` dejaron de ser código muerto —
son lo que el veedor lee para decidir.

También: aislamiento por colector (un 5xx de Acuacar ya no impide leer el RSS) y el deduplicador
marca como visto **después** de procesar, no antes.

### Fase 3 — Resiliencia y observabilidad

- **RNF005:** `resilience4j` llevaba desde el Sprint 3 en el `pom.xml` **sin un solo uso**. Ahora hay
  retry exponencial y un cortacircuitos por fuente que abre a los 3 fallos consecutivos.
- **RNF007:** no existía ningún `HealthIndicator`. Ahora `/actuator/health` refleja la salud de los
  colectores, con el detalle autenticado en `/api/veedor/ingesta/salud`.
- `@Async` sin executor caía en `SimpleAsyncTaskExecutor`: **un hilo del SO por correo, sin cola ni
  tope**. Un barrio con 500 suscriptores eran 500 hilos.
- El listener de SSE corría en el hilo del `POST /api/reportes` del ciudadano.

### Fase 4 — RF024 y RF025

Serie mensual del Índice (`/api/cumplimiento/serie`) reutilizando la misma agregación que el índice
global, para que no diverjan. Exportación CSV con separador `;`, BOM UTF-8 y coma decimal fijada en
`es-CO` — las tres decisiones existen para que Excel en español lo abra sin romper las tildes.

### Fase 5 — Seguridad y despliegue

- **El procedimiento del Anexo 5 reexponía las bases de datos.** Indicaba combinar ambos compose,
  pero `docker-compose.prod.yml` no es una superposición sino un archivo autónomo: combinarlos
  publicaba `27017`, `6379`, `8081`, `1025` y `8025`. Verificado con `docker compose config`.
- Producción aborta el arranque si faltan `JWT_SECRET` o `VEEDOR_PASSWORD_HASH`.
- Los sensores IoT dejaron de autobloquearse con el cupo ciudadano (RF006).
- Open311 conforme a GeoReport v2, aditivo.

### Fase 6 y cierre

- `infrastructure.mail` pasó de **21.6% a 97.7%** de cobertura.
- `ContratoOpenApiTest` impide que `openapi.yaml` se desvíe del código.
- **Paginación** en bitácora y las dos colas del veedor.
- **TOCTOU del cupo RF006 cerrado** con reserva atómica en Redis, demostrado con 50 hilos concurrentes.
- **Spring Boot 3.4.1 → 3.5.16 + Netty 4.1.136:** el escaneo nuevo encontró **38 vulnerabilidades
  altas o críticas**, incluida `CVE-2025-24813` (RCE en Tomcat). Quedaron en **0**.

---

## 5. Tres bugs que solo aparecieron al implementar

Merecen mención aparte porque ninguno era visible leyendo el código, y los tres habrían fallado en
producción y no en desarrollo.

1. **El caché de Redis rompía con `Instant`.** Al añadir `estadoActualizadoEn` a `Sector`, el
   `GenericJackson2JsonRedisSerializer` empezó a lanzar: su `ObjectMapper` no trae `JavaTimeModule`.
   El síntoma habría sido el mapa entero fallando en la primera lectura tras un cambio de estado.
2. **El CSV dependía del locale del servidor.** `"%.1f".formatted(...)` usa `Locale.getDefault()`:
   el archivo salía distinto en cada máquina del equipo y en el contenedor.
3. **El JWT nacía vencido con relojes distintos.** Al pasar `JwtProvider` a `RelojPort`, emitía con
   el reloj inyectado pero validaba con el del sistema, porque jjwt usa su propio `Clock`. En
   producción habría sido un fallo intermitente imposible de reproducir.

---

## 6. Qué falta

### 6.1 Dentro del alcance del backend

Los cinco puntos que esta tabla listaba se cerraron en una ronda de trabajo posterior a `7d320c3`
(sin commitear todavía — ver la nota de cabecera). Quedan documentados aquí para que quede rastro de
qué cambió y dónde mirar:

| Qué estaba abierto | Cómo se cerró |
|---|---|
| **RNF002** — confirmar reporte en < 1 s, declarado sin medir | k6 contra `POST /api/reportes` (`scripts/carga/rnf002-registrar-reporte.js`): p(95)=16.49 ms, 0% de errores. Detalle en `matriz-trazabilidad.md` |
| **Índice global sin paginar** — `cortes.listarTodos()` traía todos los cortes cerrados a memoria | `CorteAguaRepository.agregarCerrados`/`agregarCerradosPorMes`: pipeline Mongo (`$match`+`$group`) en `CorteAguaMongoAdapter`. `CalcularCumplimientoService.global()`/`serieMensual()` solo calculan el porcentaje sobre el agregado |
| **SSE de una sola instancia** — `emitters` en memoria del controlador | `SseSectoresBroadcaster` (Redis pub/sub, canal `aguavigia:sse:sectores`, wireado en `SseConfig`): cualquier instancia que publique, todas las suscritas reenvían a sus propios clientes |
| **Logs sin estructura ni correlation ID** | `logging.structured.format.console=ecs` (nativo de Boot 3.4+) + `CorrelationIdFilter`/`MdcTaskDecorator` en `infrastructure/logging/` |
| **`infrastructure.cache` al 69.6%** | `CachePropertiesTest` — la validación del TTL no tenía prueba propia. Cobertura ahora 100% |
| **RNF021 (mitad backend)** — fotos sin comprimir ni sin limpiar EXIF | `CompresorDeImagenes` (`infrastructure/storage/`): decodifica y recodifica jpg/png antes de guardar — comprime y descarta EXIF de paso (un GPS embebido en la foto no debe exponer más ubicación que la que el vecino autorizó en RF007). `.webp` no se toca, el JDK no trae lector nativo. La otra mitad de RNF021 (bucket) sigue en §6.2 |

No queda ningún pendiente reconocido dentro del alcance del backend, aparte de lo de §6.2.

### 6.2 Requiere decisión o credenciales de otros

| Qué | Bloqueo real |
|---|---|
| **RF041** — webhook de WhatsApp/Telegram | Exige credenciales de WhatsApp Business API o un bot de Telegram. La cadena evento → caso de uso → puerto ya está cableada y probada: falta **solo** el adaptador que llame al proveedor. Telegram es la vía realista |
| **RNF021** — bucket en vez de disco local | La compresión y la limpieza de EXIF ya están cerradas (§6.1). Solo falta el bucket, y se decidió **no migrar** mientras el despliegue sea de servidor único (2026-08-11) — mismo criterio que TLS. `AlmacenamientoPort` ya aísla el cambio si algún día se necesita |
| **RNF001** — mapa < 3 s en 3G | Es de frontend (Lighthouse), no del backend |

---

## 7. Fuera de alcance, y por qué

Esto **no** es una lista de olvidos: son decisiones tomadas con el alcance acordado —*calidad de
producción con despliegue de aula*— y están escritas para que nadie las descubra por sorpresa.

| Qué | Por qué se dejó fuera | Cuándo deja de ser aceptable |
|---|---|---|
| **TLS / HTTPS** | nginx sirve solo `:80`. Exige un dominio real y un certificado, que no dependen del código | **Antes de cualquier despliegue público.** Hoy el token del veedor viaja en claro |
| **Autenticación en MongoDB y Redis** | Ambos van sin credenciales, protegidos por la red interna de Docker y sin publicar puertos en producción | Antes de un despliegue público, o si alguna vez se publican los puertos |
| **Métricas (Prometheus/Grafana)** | Solo se expone `health`. Añadir `/actuator/prometheus` sin protegerlo sería una fuga de información operativa | Cuando haya usuarios reales y haga falta diagnosticar rendimiento |
| **Boot 4.x** | Arrastra Spring Framework 7. Se eligió 3.5.16 —que parchea las mismas CVE— por no hacer un salto mayor a días de sustentar | Cuando haya margen para probarlo |
| **Todo `frontend/`** | Es de los compañeros | — |

---

## 8. Trampas del entorno (esto ahorra una hora)

Encontradas en esta sesión, en esta máquina concreta.

1. **El puerto 8080 está ocupado** por otro proceso del usuario. Para levantar el backend a mano usar
   `SERVER_PORT=8099`.
2. **Detener un proceso en segundo plano mata el wrapper de Maven, no la JVM hija.** El backend sigue
   escuchando y el arranque siguiente falla con "port already in use". Para cerrarlo de verdad:
   ```bash
   powershell "(Get-NetTCPConnection -LocalPort 8099 -State Listen).OwningProcess | Stop-Process -Force"
   ```
3. **Docker Desktop muestra un error del "Inference manager"** (`dockerInference`) al arrancar. Es
   del Model Runner, **no del motor**: la parte que usamos arranca igual. Verificar con
   `docker run --rm hello-world` antes de dar por caído Docker.
4. **Sin Docker fallan 3 pruebas de Testcontainers** con "Could not find a valid Docker environment".
   No es un fallo de código.
5. **Maven Central responde 429** si se escanean dependencias sin poblar `~/.m2` primero. El job del
   CI lo hace con `dependency:resolve`.
6. **Hay contenedores de otros proyectos** (`pgadmin4`, `my-database`) en el mismo Docker. **No
   tocarlos.**
7. **`@SpringBootTest(classes = X)` con `@TestConfiguration` no sirve para aislar:** Spring sigue
   buscando hacia arriba, encuentra `CtgApplication` y levanta la aplicación entera con su scheduler
   llamando a acuacar.com. Usar `@Configuration` (bajó una prueba de 35 s a 1.8 s).
8. **Las etiquetas de `aquasecurity/trivy-action` llevan prefijo `v`** (`@v0.36.0`). Sin él, el job
   falla en "Set up job" sin llegar a escanear.

---

## 9. Comandos

```bash
cd backend && ./mvnw -B verify
```

```bash
docker compose up -d mongo redis mailhog
```

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

**Regenerar el contrato OpenAPI** (con la app corriendo en 8099; `ContratoOpenApiTest` falla si se
olvida):

```bash
curl -sf http://localhost:8099/v3/api-docs.yaml -o backend/openapi.yaml
```

**Comprobar que producción no expone nada** — solo debe aparecer el `80` del frontend:

```bash
docker compose -f docker-compose.prod.yml ps --format 'table {{.Service}}\t{{.Ports}}'
```

Mailhog (correos de prueba): `http://localhost:8025` · Swagger: `/swagger-ui.html`

---

## 10. Un cambio que se le pasó al frontend, y ya se cerró

**Tres rutas paginan.** Sin parámetros devuelven **50 elementos en vez de todos**:

- `GET /api/bitacora`
- `GET /api/veedor/reportes/pendientes`
- `GET /api/veedor/ingesta/propuestas`

El cuerpo **sigue siendo un arreglo JSON** —no rompe nada— y los metadatos van en cabeceras:
`X-Total-Count`, `X-Total-Pages`, `X-Page`, `X-Page-Size` y `Link` con `rel="next"` (RFC 8288).
Parámetros: `?pagina=0&tamano=50`, máximo 200.

**2026-08-12 — encontrado sin cerrar y corregido.** El frontend nunca leyó este aviso: las dos
colas del veedor (`listarReportesPendientes`, `listarPropuestasIngesta`) pedían la página por
defecto sin mirar `X-Total-Count`, así que un reporte o una propuesta más allá del elemento 50
era invisible para el veedor, sin ningún aviso. `GET /api/bitacora` no tenía el mismo problema:
su sección en el mapa muestra a propósito solo los últimos 20 eventos como feed reciente, no una
cola que haya que vaciar entera.

Corregido en `frontend/src/api/services.ts`: ambas colas piden `tamano=200` (el máximo) de una
vez y devuelven `{ items, totalCount }`; si `totalCount` supera lo que trajo esa página, el panel
del veedor muestra un aviso ("Mostrando N de M…") en vez de ocultar el resto en silencio.

Si la pantalla de bitácora asumía recibirlo todo, ahí hay que paginar.

---

## 11. Dónde está cada cosa

| Documento | Qué contiene |
|---|---|
| [`matriz-trazabilidad.md`](matriz-trazabilidad.md) | Requisito → historia → prueba → implementación. **La fuente de verdad del estado.** Cada ✅ nombra su prueba |
| [`../design-decisions.md`](../design-decisions.md) | 28 ADRs. Los de esta ronda: **026** Open311 agregado por privacidad, **027** retención de evidencia, **028** la ingesta propone |
| [`../product-requirements.md`](../product-requirements.md) | RF001–RF041 y RNF001–RNF021, con su redacción literal |
| [`../../DESIGN.md`](../../DESIGN.md) | Sistema de diseño. **Aplica al backend también:** los cuatro estados del servicio, cómo se le escribe al usuario, cifras con contexto |
| [`../anexos/anexo-5-manual-tecnico.md`](../anexos/anexo-5-manual-tecnico.md) | Despliegue y QA manual. Corregido en esta ronda |
| [`respaldo-y-restauracion.md`](respaldo-y-restauracion.md) | Respaldo de Mongo y de las fotos |
| [`entorno-local.md`](entorno-local.md) | `JWT_SECRET`/`VEEDOR_PASSWORD_HASH` vacías en `.env` — cómo dejar el panel del veedor funcionando en un clon nuevo, con la clave de equipo lista para copiar |
| `backend/openapi.yaml` | Contrato que consume el frontend. **Generado, no escrito a mano** |

---

## 12. Si retomas el trabajo, empieza por aquí

1. **`./mvnw verify` con Docker abierto.** Si algo falla, no es por lo que ibas a hacer.
2. **Lee la matriz antes de creer que algo falta.** Muchas cosas que parecen pendientes están
   implementadas y probadas; otras están declaradas fuera de alcance con razón.
3. **Antes de cambiar el contrato de la API, pregunta.** El frontend es de otros y el acuerdo vigente
   es que los cambios sean aditivos.
4. **Si tocas un comportamiento, actualiza el comentario y la matriz.** El valor de este proyecto no
   es que funcione: es que lo que dice de sí mismo sea verdad.
