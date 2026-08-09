# Bitácora de sesiones de trabajo

> Registro **append-only** de cada sesión de trabajo con IA que produjo un cambio en el repositorio.
> Existe para que la sesión siguiente —tuya o de otro compañero— arranque sabiendo dónde quedó todo,
> sin reconstruir una conversación de horas.
>
> **Para agregar una entrada: usa la skill `cerrar-sesion`.**
> **Formato: 3 líneas máximo.** Una entrada larga es una entrada que nadie lee.

---

## Cómo se lee esto

| Campo | Qué significa |
|---|---|
| **Fecha** | AAAA-MM-DD |
| **Quién** | D1–D5 |
| **Rama** | Dónde quedó el trabajo |
| **Qué** | Una frase, en pasado, con el resultado — no la intención |
| **Sigue** | El siguiente paso concreto. Sin esto, la próxima sesión empieza decidiendo |

Referencias cruzadas: `ADR-NNN` · `BUG-NNN` · `RF0NN` · `archivo:línea`.
**Nunca se pega código aquí.**

---

## Sprint 1

### 2026-08-08 · D5/D1 (Yordy) · `docs/cierre-sprint-0-y-planning-sprint-1`
**Qué:** Se celebró el **Review del Sprint 0** reverificando cada compuerta con su comando (C0, C1,
C2 y C3 abiertas) y se abrió el **Planning del Sprint 1**, que arranca con 4 de sus 5 frentes ya
entregados. Cerrado `BL-004`: Carlos (D2) queda libre para escribir los casos de uso de
`application/`. Hallazgo del Review: la máquina de D5 tiene el **cliente** de Docker pero ningún
motor, así que `docker compose config -q` —el comando que define C0— solo valida YAML y nunca probó
que el entorno levante; el sprint se aceptó con la salvedad escrita, no oculta.
**Sigue:** D5 instala un motor de contenedores y reverifica C0 de verdad; D1 (Yordy) retoma el PR de
las plantillas de correo de M4, que sigue sin fusionar en `feature/d5-dockerfile-frontend-y-jacoco`.

---

## Sprint 0

### 2026-08-08 · D4 · `vista-previa-total`
**Qué:** Misión 1 (Dividir rama gigante y reporte offline interactivo con IA). Construcción masiva de todas las vistas (Estadísticas, Bitácora, Mapa, Veedor, Reportar) con componentes nativos interactivos, glassmorphism y tooltips SVG puros (offline). Arreglamos `BUG-016` (cortes en línea SVG por stroke-dasharray) y `BUG-006` (quitamos la clave mock 1234 en el panel del Veedor). 
**Sigue:** PR hacia develop para integrar esta base colosal de UI y continuar conectando con la sala de control y backend.

### 2026-08-08 · D3 · `feature/d3-sprint1-mongo-y-api-sectores`
**Qué:** Entregables de Sprint 1 de D3: adaptador Mongo de `SectorRepository` (índice `2dsphere`,
conserva la geometría de D5 al guardar), adaptador de `RelojPort`, `GET /api/sectores` y
`/api/sectores/{id}`, errores RFC 7807 y `backend/openapi.yaml` generado desde la app — **abre C2**.
`./mvnw clean verify` → 34 pruebas, 0 fallos. `ADR-014` (estado nulo en vez de `CON_SERVICIO` sin
dato verificado) y `ADR-015` (consultas de lectura van al puerto de salida, sin invadir
`application/`, que es de D2). Encontrados `BUG-007` (Testcontainers vs. Docker Engine 29, corregido
aquí mismo) y `BUG-008` (el mapa pinta de verde los 211 sectores sin dato — es de D4).
**Sigue:** Abrir PR con revisor y avisar a D4 de que C2 abre al fusionarse, con los dos avisos del
contrato (`estado` anulable, OpenAPI 3.0.1). Sprint 2 de D3: `POST /api/reportes` y rate limiting.

### 2026-08-08 · D3 · `feature/d3-sprint2-redis-consenso`
**Qué:** Adelanto de Sprint 2 de D3 mientras el PR #56 (Sprint 1) espera revisor: adaptador Redis de
`ContadorReportesPort` (ventana deslizante con `ZSET`, TTL de retención) para RF009–RF011. Encontrado
y corregido `BUG-009` (bean `RedisTemplate<String,String>` ambiguo con `stringRedisTemplate` de
Spring — afectaba a cualquier futura inyección por tipo, no solo a este adaptador).
`./mvnw clean verify` → 29 pruebas, 0 fallos, incluida integración contra `redis:7-alpine` real.
**No se tocó** `POST /api/reportes` ni `EvaluarConsensoUseCase`: son casos de uso de `application/`,
capa de D2, que sigue vacía. El resto del backlog de Sprint 2 (rate limiting HTTP, caché del mapa,
SSE) sigue pendiente y depende de decisiones de diseño que no me corresponde tomar solo.
**Sigue:** Rama publicada sin PR todavía — junto con el PR #56, ambos esperan revisor humano. Cuando
D2 implemente `EvaluarConsensoUseCase`, este adaptador queda listo para conectarse sin cambios.

### 2026-08-08 · D3 · `feature/d3-sprint3-jwt-veedor`
**Qué:** Adelanto de Sprint 3 de D3, tercer PR de la sesión: infraestructura JWT del panel del
veedor (RF019, RNF011) — `JwtProvider`, `JwtAuthenticationFilter`, `SecurityConfig`
(`/api/veedor/**` protegido, el resto público) y `POST /api/veedor/sesion`. `ADR-016`: credencial
única compartida (BCrypt en `VEEDOR_PASSWORD_HASH`), no cuentas individuales — no existe entidad
`Usuario` en `domain/` y crearla es decisión de D2. Encontrado y corregido `BUG-010` antes de
comitear (validación perezosa del secreto que casi tumbaba rutas públicas con 500).
`./mvnw clean verify` → 35 pruebas, 0 fallos. Verificado además en vivo: login correcto (200+token),
incorrecto (401), ruta protegida sin token (401), con token válido pasa el filtro (404, no 401/403),
expiración exacta de 8h, `/actuator/health` sigue público.
**No se tocó** el CRUD de cortes oficiales ni la moderación de reportes: ambos necesitan casos de
uso de `application/` (`GestionarCorteOficialUseCase` y uno de moderación aún sin definir), capa de
D2. Señalado en el ADR, sin construirlo: no hay rate limiting en el login todavía.
**Sigue:** Rama publicada sin PR todavía — con los PR #56 y #57, van tres esperando revisor humano.
Cuando D2 defina los casos de uso de M5, el controlador que los use puede vivir bajo `/api/veedor/**`
sin tocar `SecurityConfig`.

### 2026-08-08 · D3 · `feature/d3-sprint4-prefiltro-dedup`
**Qué:** Adelanto de Sprint 4 de D3, cuarto PR de la sesión: la parte del pipeline M9 que no toca
la red — `DocumentoCrudo` (normalización + hash SHA-256), `PrefiltroDeterminista` (9 palabras clave
ya aprobadas en `pipeline-ingesta-datos.md`, sin ampliarlas por cuenta propia) y
`DeduplicadorReciente` (Redis, ventana de 7 días). `./mvnw clean verify` → 41 pruebas, 0 fallos.
**No se construyeron** `AcuacarApiCollector` ni `RssCollector`: `COLLECTOR_USER_AGENT` sigue con un
correo de contacto literalmente `pendiente`, y hacerles una petición real a Acuacar/Google
News/Zona Cero con esa identidad sería incoherente con la ética de datos del proyecto —
`BL-006` (renumerado desde `BL-004`, que ya estaba tomado), para D1. Tampoco se construyó la capa de IA: sin `ANTHROPIC_API_KEY` no se puede probar
ni una vez, y el propio diseño avisa que hay que verificar la firma del SDK contra código real
antes de darla por buena — `BL-005`, para el equipo.
**Sigue:** Van **cuatro PRs** de esta sesión (#56, #57, #58 y este, sin número todavía) esperando
revisor humano. En cuanto D1 fije el correo real y alguien configure una clave de Anthropic, los
colectores y la capa de IA se conectan directo después del prefiltro sin rehacer nada de esto.

### 2026-08-08 · D3 · `feature/d3-sprint2-rate-limiting-http`
**Qué:** Quinto PR de la sesión: rate limiting HTTP genérico (Redis `INCR`+`EXPIRE`), pendiente de
Sprint 2 y hueco señalado en `ADR-016`. `RateLimitingInterceptor` + `RateLimitConfig`, configurable
por `application.yml` (`aguavigia.rate-limit.reglas`), opt-in, sin depender de ningún PR sin
fusionar. `ADR-018`: clave por IP, no por huella de dispositivo (eso es de M2/negocio, no de este
componente genérico). `./mvnw clean verify` → 28 pruebas, 0 fallos. Verificado en vivo contra la
app corriendo y Redis real: 3 peticiones pasan, la 4ª y 5ª reciben `429` con `Retry-After`.
Confirmado (y documentado en el código) que `/actuator/**` no queda cubierto porque Actuator usa su
propio `HandlerMapping`. En el camino: diagnosticado que Git Bash (MSYS) reescribe rutas tipo
`/actuator/health` a rutas de Windows al pasarlas por variable de entorno — no es un bug del
proyecto, es del entorno de verificación local (`MSYS_NO_PATHCONV=1` lo evita).
**Sigue:** Cuando el PR #58 (JWT del veedor) se fusione, activar
`aguavigia.rate-limit.reglas[0].ruta=/api/veedor/sesion` con `limite: 5, ventanaSegundos: 300`.

### 2026-08-08 · D3 · `feature/d3-cache-redis`
**Qué:** Sexto PR de la sesión: configuración de caché sobre Redis (`@EnableCaching` +
`RedisCacheManager`, valores en JSON no serialización Java), pendiente de Sprint 2 ("caching de
respuestas del mapa") y Sprint 5 ("decorador de caché") — misma pieza para ambos. TTL configurable
por `application.yml`, 30s por defecto, con overrides por nombre de cache. `./mvnw clean verify` →
27 pruebas, 0 fallos, incluida verificación del TTL real vía inspección directa de Redis.
**Contradicción encontrada, no resuelta por mi cuenta:** `D3-backend-infraestructura.md` Sprint 5
sigue listando "agregaciones MongoDB para estadísticas" como mío, pero `ADR-013` (misma fecha,
sigue 🟡 Propuesta) dice que las métricas de M7 son de D5. Señalado al equipo, no construido.
**Sigue:** Cuando D2/D3 tengan un caso de uso de consulta real que valga la pena cachear
(`GET /api/sectores` una vez fusione el PR #56), anotarlo con `@Cacheable("sectores")`.

### 2026-08-08 · D5 · `feature/d5-dockerfile-frontend-y-jacoco`
**Qué:** Registrados en `registro-de-implementaciones.md` los PRs #27 y #33 (Dockerfiles backend/frontend,
JaCoCo, perfiles de Spring, `/actuator/health`), fusionados sin registrar. Actualizados `docs/anexos/README.md`
y `docs/gestion/sprint-0.md` (BL-002/BL-003 cerrados, Scrum Master interino, 32 PRs, 4 bugs cerrados),
desactualizados desde el 2026-08-07. Confirmado que `ReglaDeOroArchitectureTest` ya falla el Backend CI.
**Sigue:** Testcontainers espera a que D3 cree el primer adaptador real de infraestructura (Sprint 2).
Correos pendientes (plantilla al docente, ICPSR) — Yordy decidió dejarlos para otra sesión.

### 2026-08-08 · D5 · `feature/d5-dockerfile-backend`
**Qué:** Declarada C0 abierta con evidencia real (encontró y corrigió `BUG-003` en el camino). Resueltos
los conflictos de los PR #19, #24 y #25 verificando build/tests después de cada uno. Registrado `BUG-004`
(contraseña mock en `PaginaVeedor.tsx`, avisado a D4). Escrito el Dockerfile multi-etapa del backend y
activado en `docker-compose.yml`, revisado con hadolint pero sin construir la imagen (sin daemon Docker).
**Sigue:** Que alguien con Docker completo confirme `docker compose build backend`. Pendiente: D1 sigue
vacante (`BL-003`), C2 sigue cerrada (falta que D3/D1 publiquen el contrato OpenAPI).

### 2026-08-08 · D2 · `feature/d2-dominio-sprint1`
**Qué:** Modelado el dominio de M3/M6 (PR #21): Value Objects, entidades (`CorteAgua` con Builder),
`domain/port/in` y `port/out`, test de ArchUnit. 23 pruebas, 0 fallos. Abierta **C1**. Adelantado con
autorización explícita de Carlos porque C0 seguía en 🟡 (criterio técnico ya verificado dos veces).
**Sigue:** D3 y D1 ya pueden empezar a implementar los puertos de infraestructura contra `domain/port/out`.

### 2026-08-07 · D4 · `feature/d4-sprint2-reportar`
**Qué:** M2 completado (UI): FormularioReporte con selecciones accesibles, sin registro (RF005), 2 toques desde el mapa leyendo sector de URL (RF008) y opción de ubicación (RF007). Pantalla de éxito. Usa datos mock provisionales. PR pendiente de crear.
**Sigue:** Crear PR a `develop` y esperar C2 para integrar `POST /api/reportes` con TanStack Query.

### 2026-08-07 · D3 · `docs/alistamiento-sprint0`
**Qué:** Auditoría de coherencia de todo el repositorio (8 PRs, 4 ramas, 20 documentos). Corregidas 10
contradicciones entre documentos y la realidad del repositorio: `ADR-009` (el Sprint 0 admite
andamiaje, no funcionalidad) y `ADR-010` (branch protection es política, no candado). Registrados los
8 PRs del Sprint 0, `BUG-001` y `BUG-002` —encontrados en revisión y nunca registrados— y `BL-003`
(D1 sin titular). Creado `sprint-0.md`. Normalizadas 6 fechas escritas en UTC a hora de Cartagena.
**Sigue:** Que D5 verifique y declare C0 abierta —el PR #10 ya la habilitó— y que se regularice el
desbloqueo temporal de `SECTORES_MOCK` del PR #12. En paralelo, designar Scrum Master interino y
enviar los dos correos de `BL-003` (plantilla al docente, ICPSR).

### 2026-08-07 · D2 · `feature/d2-backend-base`
**Qué:** Creado el proyecto base de `/backend` (issue #9, PR #10): Maven, Java 21, Spring Boot 3.4.1,
estructura vacía de Arquitectura Limpia. `./mvnw verify` → BUILD SUCCESS local y en CI. El comando de
C0 (`docker compose config -q && ls backend frontend`) ya pasa completo.
**Sigue:** Avisar a D5 (Yordy) para que verifique C0 con su comando y la marque abierta en
`registro-de-bloqueos.md` §1 — no la abre D2, el titular de esa compuerta es D5.

### 2026-08-07 · D2 · `docs/d2-diseno-dominio-sprint0`
**Qué:** Diseño adelantado del dominio de M3/M6 (`docs/ingenieria/modelo-de-dominio.md`) mientras C0
sigue cerrada. Corregida la duplicación de `SuscribirseService` entre D1 y D2 (era de D1 por M4).
**Sigue:** Resolver quién crea el esqueleto de `/backend` en Sprint 0 para poder abrir C0.

### 2026-08-07 · D4 · `feature/d4-sprint3-bitacora`
**Qué:** M8 (Bitácora - UI) maquetada. Componente `PaginaBitacora` con formato de línea de tiempo y componentes `InsigniaEstado`. Cumple RF026 y RF027 visualmente usando datos mock.
**Sigue:** Esperar que D1 publique la API en C2 para integrar `GET /api/bitacora` real.

### 2026-08-07 · D4 · `feature/d4-sprint3-panel-veedor`
**Qué:** M5 (Panel Veedor UI) y M7 (Dashboard Recharts) maquetados. Componente `PaginaVeedor` con auth simulada y `PaginaEstadisticas` con gráficos (RF023, RF024). Agregado enlace en Encabezado. Todo usando datos mock.
**Sigue:** Crear PR a `develop` y esperar C2 para integrar APIs.

### 2026-08-07 · D4 · `feature/d4-sprint2-reportar`
**Qué:** M1 completado: MapaCartagena (Leaflet + GeoJSON 213 barrios de D5), ListaSectores (RF004), InsigniaEstado, EtiquetaFrescura, useFrescura, tipos-dominio. PR #12 abierto a develop.
**Sigue:** Que Carlos (D2) apruebe PR #12. Cuando C2 abra, reemplazar SECTORES_MOCK con TanStack Query → GET /api/sectores.

### 2026-08-07 · D4 · `feature/d4-sprint5-pwa-tests`
**Qué:** Configurada PWA (`vite-plugin-pwa`) para soporte offline y cacheo de `barrios-cartagena.geojson`. Configurado Vitest + React Testing Library y agregada la primera prueba (`InsigniaEstado.test.tsx`). PR pendiente.
**Sigue:** Conseguir iconos PWA (192 y 512) para completar el manifiesto y crear PR a `develop`.

### 2026-08-07 · D4 · `feature/d4-sprint3-panel-veedor`
**Qué:** Esqueleto de `/frontend` creado: React 19 + Vite + TypeScript + Tailwind CSS v4. Tokens de `DESIGN.md` como custom properties CSS (paleta, temas claro/oscuro, tipografía, estado del servicio). `useTheme` hook + `SelectorTema` + `Encabezado` + rutas placeholder para M1, M2, M7, M8. `BL-002` registrado (D4 bloqueado por C0). Dev server en `localhost:5173`.
**Sigue:** Fusionar PR a `develop` con al menos 1 revisor, y esperar que D5 (Yordy) cierre BL-001 para que C0 quede abierta.

### 2026-08-07 · D5 · `feature/d5-sprint0-infraestructura`
**Qué:** Creada `develop`, `.env.example`, `docker-compose.yml` base (Mongo+Redis+Mailhog) y workflows
de GitHub Actions (backend-ci, frontend-ci, secret-scan). Abierto PR #1 hacia `develop`. Registrado
BL-001: sin permiso `admin` en el repo remoto, no se pudo configurar branch protection.
**Sigue:** Que alguien con revisión apruebe/fusione el PR #1, y que Carlos (dueño del repo) configure
branch protection o le dé admin a Yordy para cerrar BL-001. C0 sigue cerrada: falta que existan
`/backend` y `/frontend` (sin dueño explícito de esa tarea en Sprint 0 — a discutir en planning).

### 2026-08-07 · Todos · `main`
**Qué:** Auditoría completa de la documentación. Se unificó `equipo/` dentro de `docs/equipo/`, se
crearon `docs/gestion/`, `docs/anexos/` e `docs/informe-metodologico/`, se estableció el sistema de
registro (bitácora, bugs, implementaciones) y el protocolo de contexto. Ver `ADR-008`.
**Sigue:** Cada integrante lee `docs/gestion/protocolo-de-contexto.md` antes de su primera sesión.

### 2026-08-06 · Todos · `main`
**Qué:** Auditoría de fuentes de datos con peticiones reales. Se corrigió el supuesto falso sobre el
`robots.txt` de Acuacar y se encontró su API REST (307 boletines). `ADR-004`, `ADR-005`.
**Sigue:** Reintentar GDELT, RCN, Caracol y W Radio con throttling (ver auditoría §8).

---

<!--
Plantilla — copiar, rellenar, pegar ARRIBA de la entrada más reciente del sprint en curso.

### AAAA-MM-DD · D<N> · `rama`
**Qué:** <resultado en pasado, máx. 2 líneas, con referencias ADR/BUG/RF>
**Sigue:** <siguiente paso concreto, una línea>

Rotación: al superar 30 entradas, las más viejas pasan a
docs/gestion/historico/bitacora-sprint-<N>.md. Lo hace quien cierra el sprint.
-->
