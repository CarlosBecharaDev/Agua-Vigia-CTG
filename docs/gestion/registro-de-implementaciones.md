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

Sin `RF` asociado a propósito: es arquitectura base, no funcionalidad (`ADR-009`).

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
| — | andamio | Proyecto base de `/backend`: Maven, Java 21, Spring Boot 3.4.1, estructura vacía de Arquitectura Limpia (`domain/`, `application/`, `infrastructure/`, `api/`) | D2 | [#10](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/10) | `./mvnw verify` → BUILD SUCCESS, local y en Backend CI |
| — | proceso | Registro del proyecto base de `/backend` en implementaciones y bitácora | D2 | [#11](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/11) | esta tabla |
| — | proceso | Auditoría de coherencia del repositorio: 10 contradicciones corregidas, `ADR-009`, `ADR-010`, `BUG-001`, `BUG-002`, `BL-003`, `sprint-0.md` | D3 | [#14](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/14) | `wc -l`/`grep` verificados en la revisión |
| — | datos | Población real por barrio (DANE 2018 + CORVIVIENDA) + script de siembra en Mongo, probado contra Mongo real | D5 | [#13](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/13) | 211 sectores sembrados, `$geoIntersects` verificado |
| — | proceso | Verificación parcial de C0 (falta Docker en la máquina de D5); confirmado que el `admin` de Yordy no se aplicó pese a 2 intentos | D5 | [#15](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/15) | `docker compose config -q` en máquina de D2 |
| — | andamio | Reparado el build de frontend en `develop`, roto por un merge de PR anterior al fix | D2 | [#16](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/16) | `npm run build` |
| — | proceso | Estrategia del plan de pruebas (borrador Anexo 5), trazada a los 20 RNF | D5 | [#17](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/17) | `docs/ingenieria/plan-de-pruebas.md` |
| — | proceso | Decisión: `Sector.poblacion` nulable, respuesta a la pregunta del PR #13 | D2 | [#18](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/18) | `modelo-de-dominio.md` §3.1 |
| — | proceso | D2 abre **C1** (dominio y puertos fusionados en el PR #21) y pone al día este registro con los PRs #13–21 | D2 | [#22](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/22) | `registro-de-bloqueos.md` §1 |
| — | infra | `env_file` opcional en `docker-compose.yml` (corrige `BUG-003`) y declaración formal de **C0** abierta | D5 | [#23](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/23) | `docker compose config -q && ls backend frontend` → exit 0 |
| — | proceso | Registro de `BUG-004` (contraseña mock en `PaginaVeedor.tsx`), sin corregirlo — es capa de D4 | D5 | [#26](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/26) | `registro-de-bugs.md` |
| — | infra | Dockerfile multi-etapa del backend + activación del servicio `backend` en `docker-compose.yml` | D5 | [#27](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/27) | `docker compose config -q` en verde, `hadolint backend/Dockerfile` limpio |
| — | infra | `.gitattributes` fuerza `eol=lf` en `backend/mvnw` — corrige `exec format error` al construir la imagen Docker en Windows | D2 | [#28](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/28) | `docker build -t ctg-backend-test backend/` → BUILD SUCCESS |
| — | proceso | Causa raíz documentada de por qué el rol `admin` de Yordy no se pudo aplicar (repo personal, sin selector de rol para colaborador existente) | D2 | [#29](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/29) | `registro-de-bloqueos.md` §2 |
| — | andamio | `BUG-004` corregido: se retira el campo de contraseña mock de `PaginaVeedor.tsx`; se cierra `BL-002` | D5 | [#30](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/30) | `PaginaVeedor.test.tsx` — 2 archivos, 4 pruebas en verde |
| — | proceso | `ADR-011`: reasignación temporal de D1 a Yordy Pardo Pajaro; cierra `BL-003` | D5 | [#31](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/31) | `design-decisions.md` (ADR-011), `roles-y-tareas.md` |
| — | proceso | Redacción de Anexos 1 y 2 (encuesta y guion de entrevista), trazados a RF001, RF005/RF008, RF009, RF012–RF014, RF020–RF022 y RNF008 | D1 | [#32](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/32) | `docs/anexos/anexo-1-encuesta.md`, `anexo-2-guion-entrevista.md` |
| — | infra | Dockerfile del frontend, JaCoCo en `pom.xml` + CI, perfiles de Spring (`dev`/`docker`/`prod`), `/actuator/health` | D5 | [#33](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/33) | `./mvnw verify` → 23/23, JaCoCo 61.1 %; `curl localhost:8080/actuator/health` → `mongo: UP` |
| — | andamio | Andamiaje de D3: dependencias de build en `pom.xml` (Testcontainers, MapStruct, `springdoc-openapi`, Resilience4j, Lombok), `RedisConfig` y paquetes vacíos de `infrastructure/persistence` | D3 | [#40](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/40) | `./mvnw verify` en verde en Backend CI |
| — | proceso | Regularización de `DT-001` a `DT-005` (mocks de frontend autorizados, caducan al cerrar el Sprint 1) y puesta al día de los registros de gestión | D3 | [#41](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/41) | `registro-de-bloqueos.md` §4 · issues [#34](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/34)–[#36](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/36), [#38](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/38), [#39](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/issues/39) abiertos |
| — | proceso | `ADR-012` propuesto: permiso cruzado entre roles. **Queda en estado Propuesta** — ver nota abajo | D3 | [#42](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/42) | `design-decisions.md` (ADR-012) |

⚠️ **Los PRs #40, #41 y #42 se fusionaron el 2026-08-08 sin ningún revisor registrado.** Registrado
como `BUG-005` en `registro-de-bugs.md`, que es donde vive el detalle y la acción pendiente. Es
relevante en el caso del #42: el propio `ADR-012` condiciona su aprobación a que Carlos, José Daniel y
Yordy lo aprueben **en el Pull Request**, y eso no ocurrió.

**Cobertura de requisitos del Sprint 0: 0 de 36.** Es lo esperado y no es un retraso: por `ADR-009`
el Sprint 0 no implementa funcionalidad. Lo de arriba es lo que hace posible implementarla.

**Con el PR #10, el comando de C0 pasa completo.** Falta que D5 lo verifique y la declare abierta —
no la abre quien la produce el insumo, la abre su titular (`secuencia-de-trabajo.md` §2, regla 1).

---

## Sprint 1 — Mapa base y dominio core

| RF/RNF | Tipo | Qué | Resp. | PR | Prueba |
|---|---|---|---|---|---|
| RF001 · RF004 | func | M1: `MapaCartagena` (Leaflet + los 213 barrios reales), `ListaSectores` accesible, `InsigniaEstado`, `EtiquetaFrescura` | D4 | [#12](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/12) | `npm run build` en verde · ⚠️ **se alimenta de `SECTORES_MOCK`, no de la API** |
| RF009–RF011, RF016–RF017, RF020–RF022 | andamio | Dominio de M3/M6: Value Objects, entidades (`CorteAgua` con Builder), `domain/port/in` y `port/out`, test de ArchUnit. Abre **C1** | D2 | [#21](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/21) | `./mvnw verify` → 23 pruebas, 0 fallos, ArchUnit incluido |
| RF001 · RF002 · RF004 | func | M1 backend: adaptador Mongo de `SectorRepository` (índice `2dsphere`, geometría preservada al guardar), adaptador de `RelojPort`, `GET /api/sectores` y `/api/sectores/{id}`, errores RFC 7807, contrato OpenAPI publicado. **Abre C2** | D3 | [#56](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/56) | `./mvnw clean verify` → **34 pruebas, 0 fallos**, ArchUnit incluido · verificado además contra Mongo real: 211 sectores servidos, 404 en `application/problem+json` |
| RF009–RF011 | infra | M3: adaptador Redis de `ContadorReportesPort` — ventana deslizante de reportes por sector sobre un `ZSET` (score = instante epoch millis), TTL de retención de 24h. No deduplica por `HuellaDispositivo` a propósito (responsabilidad del rate limiting HTTP, todavía sin construir). Sin consumidor todavía: `EvaluarConsensoUseCase` sigue sin existir en `application/` (capa de D2) | D3 | [#57](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/57) | `./mvnw clean verify` → 40 pruebas, 0 fallos, ArchUnit incluido · `RedisContadorReportesAdapterTest` — 6 pruebas de integración contra `redis:7-alpine` real (Testcontainers) |
| RF019 · RNF011 | func | M5: infraestructura JWT del panel del veedor — `POST /api/veedor/sesion` (credencial única BCrypt, RF019), `SecurityConfig` protege `/api/veedor/**` y deja el resto público, token expira a las 8h exactas (RNF011). Sin CRUD de cortes ni moderación todavía: necesitan casos de uso de `application/`, capa de D2 | D3 | [#58](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/58) | `./mvnw clean verify` → 52 pruebas, 0 fallos, ArchUnit incluido · `JwtProviderTest` (6), `VeedorAuthControllerTest` (8) · verificado además en vivo: login, 401/404 según corresponda, expiración exacta de 8h |
| — (parte de M9, RF029–RF036) | infra | M9: `DocumentoCrudo` (normalización + hash SHA-256), `PrefiltroDeterminista` (9 palabras clave ya aprobadas en el diseño, descarta ~70% del volumen antes de gastar un token de IA) y `DeduplicadorReciente` (mitad Redis del diseño, ventana de 7 días, deliberadamente no permanente). Sin colectores (`AcuacarApiCollector`, `RssCollector`) ni capa de IA — bloqueados por `BL-004`/`BL-005`, no rodeados | D3 | [#59](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/59) | `./mvnw clean verify` → 70 pruebas, 0 fallos, ArchUnit incluido · `PrefiltroDeterministaTest` (11, con titulares reales del diseño), `DeduplicadorRecienteTest` (3, integración contra `redis:7-alpine`), `DocumentoCrudoTest` (4) |
| — (RNF de rate limiting, ADR-007) | infra | Rate limiting HTTP genérico — `RateLimitingInterceptor` + `RateLimitConfig` (Redis `INCR`+`EXPIRE`), configurable por `application.yml` (`aguavigia.rate-limit.reglas`), **opt-in**: sin reglas configuradas, no protege nada. Cierra el hueco de fuerza bruta señalado en `ADR-016` (login del veedor) sin depender del PR que lo introdujo. `ADR-018`: clave por IP, no por huella de dispositivo | D3 | [#60](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/60) | `./mvnw clean verify` → 75 pruebas, 0 fallos, ArchUnit incluido · `RateLimitingInterceptorTest` (3, integración contra `redis:7-alpine`), `RateLimitConfigTest` (2, extremo a extremo con `MockMvc`) · verificado además en vivo: 3 peticiones pasan, la 4ª y 5ª reciben `429` con `Retry-After` |

⚠️ **El PR #12 introdujo datos simulados sin desbloqueo temporal registrado.** `SECTORES_MOCK`
sustituye a `GET /api/sectores`, que no existe porque C2 está cerrada. La regla del proyecto
(`secuencia-de-trabajo.md` §5) permite exactamente esto, pero **solo** con autorización escrita del
titular de la compuerta, caducidad e issue de reconciliación. Registrado como pendiente de regularizar
en `registro-de-bloqueos.md` §4. No cuenta como RF001/RF004 implementados hasta que consuma la API
real; la tabla de cobertura sigue en 0%.

**El trabajo de D3 abre C2 pero no mueve la cobertura a más de 0%.** El backend ya sirve los 211
sectores reales, pero `PaginaMapa.tsx` sigue leyendo `SECTORES_MOCK`: mientras el frontend no consuma
`GET /api/sectores`, RF001–RF004 no están cubiertos de extremo a extremo. La fila va como `func`
porque el backend sí está terminado y probado; la cobertura la mueve D4 al conectar y retirar
`DT-001`/`DT-002`. Contar antes sería inflar el Capítulo IV.

**El PR #21 lleva `andamio`, no `func`:** define contratos (interfaces `port/in`) y entidades, pero
ningún caso de uso está implementado todavía — eso es Sprint 2 en `docs/equipo/D2-backend-dominio.md`.
La cobertura de requisitos sigue en 0% hasta que exista una implementación real detrás de un `port/in`.

**El PR #57 lleva `infra`, no `func`:** implementa un adaptador de salida contra un puerto que ya
existía (`ContadorReportesPort`, de `port/out`), pero ningún caso de uso lo invoca todavía —
`EvaluarConsensoUseCase` sigue sin escribirse en `application/`. La cobertura de RF009–RF011 sigue en
0% hasta que exista ese caso de uso.

⚠️ **El PR #57 se fusionó sin ningún revisor humano** (`reviews: []`), el mismo patrón que `BUG-005`
—quinta ocurrencia registrada. Antes de fusionar, el agente revisó el código (arquitectura, tests,
casos de borde) y resolvió los conflictos contra `develop` (que ya traía el PR #56 fusionado); la
decisión de fusionar sin un segundo humano fue autorización explícita de Carlos (D2) en el chat, no
un rodeo silencioso de la política. Detalle de la recurrencia en `registro-de-bugs.md` (`BUG-005`).

**El PR #58 lleva `func`:** a diferencia del PR #57, sí expone un endpoint que funciona de extremo a
extremo — `POST /api/veedor/sesion` emite un JWT real y `SecurityConfig` lo exige de verdad en
`/api/veedor/**`, verificado en vivo. **Aun así la cobertura de RF019 sigue en 0%:** `PaginaVeedor.tsx`
todavía usa el botón "Simular ingreso" (`BUG-004`), no el login real — falta que D4 lo conecte.

⚠️ **El PR #58 se fusionó sin ningún revisor humano** (`reviews: []`) — sexta ocurrencia de `BUG-005`.
Al resolver el merge contra `develop` (que ya traía los PR #56 y #57) apareció `BUG-011`: un error 500
que no existía en ninguno de los dos PRs por separado, solo en su combinación (`ManejadorGlobalDeErrores`
sin manejar `MethodArgumentNotValidException`/`NoResourceFoundException`, y `SectorControllerTest` sin
`@Import(SecurityConfig.class)`). Se corrigió antes de fusionar; detalle en `registro-de-bugs.md`
(`BUG-011`).

**El PR #59 no tiene `RF` porque es explícitamente parcial:** cubre solo la parte del pipeline M9 que
no toca la red externa. Sin `RF029`–`RF036` en la columna a propósito — asignárselos inflaría la
cobertura de un módulo que todavía no tiene ni un colector ni la capa de IA conectados. `BL-004`
(correo de contacto real, de D1) y `BL-005` (clave de Anthropic, del equipo) documentan por qué se
detuvo ahí en vez de rodearlo.

⚠️ **El PR #59 se fusionó sin ningún revisor humano** (`reviews: []`) — séptima ocurrencia de
`BUG-005`. Igual que en los PR #57 y #58, el agente revisó el código y las pruebas antes de fusionar,
autorizado explícitamente por Carlos (D2) en el chat.

**El PR #60 tampoco tiene `RF` directo:** es infraestructura transversal, no acoplada a ningún
módulo — el propio PR evitó depender del PR #58 (login del veedor, sin fusionar en ese momento)
construyendo un interceptor genérico en vez de uno específico. **Opt-in real:** la cobertura de
`ADR-016` (freno de fuerza bruta) sigue sin cerrarse del todo — el interceptor existe y funciona,
pero nadie ha activado todavía `aguavigia.rate-limit.reglas` para `/api/veedor/sesion`.

⚠️ **El PR #60 se fusionó sin ningún revisor humano** (`reviews: []`) — octava ocurrencia de
`BUG-005`. Al resolver el merge contra `develop` (que ya traía los PR #56, #58 y #59) apareció
`BUG-012`: `RateLimitConfig` implementa `WebMvcConfigurer`, y `@WebMvcTest` lo autodetecta en
*cualquier* slice de prueba del proyecto aunque no se importe — tumbó `SectorControllerTest` y
`VeedorAuthControllerTest` (que no tenían un `RedisTemplate` disponible) y dejó sin efecto la
protección de `SecurityConfig` en el propio `RateLimitConfigTest`. Ninguno de los PRs lo tenía por
separado; se corrigió antes de fusionar. Detalle en `registro-de-bugs.md` (`BUG-012`).

---

## Trabajo de UI adelantado por D4 (Sprints 2–5, sin API real)

D4 maquetó varias pantallas de sprints futuros mientras **C2** seguía cerrada, con el mismo patrón que
el PR #12: datos escritos a mano en vez de la API. Ninguna de estas filas suma a la cobertura de
requisitos —son `andamio`, no `func`— hasta que consuman la API real. Estado de cada mock en
`registro-de-bloqueos.md` §4 (`DT-001` a `DT-005`).

| RF/RNF | Tipo | Qué | Resp. | PR | Prueba |
|---|---|---|---|---|---|
| RF005, RF007, RF008 | andamio | M2: `FormularioReporte` accesible — flujo sin registro, preselección de sector por URL (`?sector=X`), consentimiento de geolocalización | D4 | [#19](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/19) | `tsc --noEmit` en verde · ⚠️ usa `SECTORES_MOCK` (`DT-002`, vigente) |
| RF016, RF018 | andamio | M5: `PaginaVeedor` — acceso simulado, registro de cortes oficiales, moderación de reportes ciudadanos | D4 | [#20](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/20) | `tsc --noEmit` en verde · ⚠️ mock de reportes (`DT-003`, vigente) |
| RF023, RF024 | andamio | M7: `PaginaEstadisticas` — gráficos de Índice de Cumplimiento y sectores afectados (Recharts), botón de exportación | D4 | [#20](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/20) | `tsc --noEmit` en verde · ⚠️ mock regularizado (`DT-004`, autorizado por D5 según confirma D3) |
| RF026, RF027 | andamio | M8: `PaginaBitacora` — línea de tiempo vertical de eventos | D4 | [#25](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/25) | `tsc --noEmit` en verde · ⚠️ `MOCK_EVENTOS` regularizado (`DT-005`, autorizado por D1 según confirma D3) |
| RNF020 (parcial) | andamio | PWA offline (`vite-plugin-pwa`, cachea el GeoJSON local) + primera prueba unitaria con Vitest (`InsigniaEstado.test.tsx`) | D4 | [#24](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/24) | `npm test` en verde |

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
