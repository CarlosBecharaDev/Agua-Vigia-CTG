# Registro de bugs

> Todo defecto encontrado se registra aquí **en el momento en que se encuentra**, aunque se arregle
> cinco minutos después. Un bug que se arregla sin registrar es un bug que el equipo no aprendió.
>
> **Para agregar una entrada: usa la skill `registrar-bug`.**

---

## Por qué se registra incluso lo que ya se arregló

Tres razones concretas, no burocráticas:

1. **El informe final (Capítulo IV) necesita datos, no impresiones.** "Se detectaron 23 defectos, 19
   en pruebas automatizadas antes de llegar a `develop`" es un resultado medible. "Hubo algunos
   errores" no es nada.
2. **Los bugs se repiten.** El mismo error de zona horaria aparece tres veces si nadie lo escribió la
   primera.
3. **La causa raíz suele ser un requisito mal escrito.** Un bug que se rastrea hasta un `RF` ambiguo
   corrige el requisito, no solo el código.

---

## Tabla de estado

| ID | Fecha | Sev | Módulo | Título | Estado | Responsable |
|---|---|---|---|---|---|---|
| BUG-001 | 2026-08-07 | S2 | CI | Los workflows de CI se disparaban a sí mismos y fallaban | Cerrado | D2 |
| BUG-002 | 2026-08-07 | S3 | CI | Frontend CI fallaba al asumir un script `test` que el esqueleto no tiene | Cerrado | D2 |
| BUG-003 | 2026-08-08 | S2 | — (infraestructura) | `docker compose config -q` fallaba en un clon limpio por depender de un `.env` que nunca se versiona | Cerrado | D5 |
| BUG-004 | 2026-08-08 | S2 | M5 | `PaginaVeedor.tsx` compara el acceso contra la contraseña `'1234'` escrita en el código fuente | Cerrado | D5 |
| BUG-005 | 2026-08-08 | S3 | — (proceso) | Los PRs se siguen fusionando sin revisor, y el patrón empeora en vez de mejorar | Abierto | Equipo |
| BUG-006 | 2026-08-08 | S2 | M5 | La rama `vista-previa-total` vuelve a comparar contra `'1234'` y borra la prueba que cerró `BUG-004` | Abierto | D4 |
| BUG-007 | 2026-08-08 | S2 | — (pruebas) | Testcontainers no encuentra Docker: Engine 29 exige API ≥ 1.40 y docker-java negocia 1.32 | Cerrado | D3 |
| BUG-008 | 2026-08-08 | S2 | M1 | El mapa pinta como "con servicio" los 211 sectores de los que no tiene dato | Abierto | D4 |
| BUG-009 | 2026-08-08 | S2 | — (infraestructura) | `RedisTemplate<String,String>` es ambiguo entre el bean propio y `stringRedisTemplate` de Spring | Cerrado | D3 |
| BUG-010 | 2026-08-08 | S2 | M5 | `JwtProvider.validarYObtenerSujeto` habría podido tumbar con 500 cualquier ruta pública si `JWT_SECRET` no estaba configurado | Cerrado | D3 |
| BUG-011 | 2026-08-08 | S2 | M1/M5 | `ManejadorGlobalDeErrores` devolvía 500 en vez de 400/404 para validación de `@Valid` y rutas sin handler; solo aparecía al fusionar los PR #56 y #58 juntos | Cerrado | Equipo (fusión) |
| BUG-012 | 2026-08-08 | S2 | M1/M2/M5 | `RateLimitConfig` (`WebMvcConfigurer`) tumbaba cualquier `@WebMvcTest` del proyecto que no mockeara `RedisTemplate`; solo aparecía al fusionar el PR #60 sobre #56/#58 | Cerrado | Equipo (fusión) |

**Severidad:** `S1` bloquea el uso o publica dato falso · `S2` funcionalidad rota con rodeo posible ·
`S3` molesto pero no impide · `S4` cosmético
**Estado:** `Abierto` · `En curso` · `Cerrado` · `No se corrige` (con motivo)

---

## Bugs abiertos — detalle

### BUG-012 — `RateLimitConfig` tumbaba cualquier `@WebMvcTest` del proyecto, solo al combinar tres PRs

- **Fecha:** 2026-08-08 · **Severidad:** S2 · **Módulo:** M1/M2/M5 (transversal, infraestructura) ·
  **Responsable:** Equipo (encontrado y corregido resolviendo el merge del PR #60)
- **Estado:** Cerrado — corregido antes de fusionar, ninguno de los PRs lo tenía por separado

**Síntoma:** al combinar el PR #60 (rate limiting, `RateLimitConfig implements WebMvcConfigurer`)
con `develop` (que ya traía los PR #56 y #58), `./mvnw clean verify` pasó de 0 a 12 pruebas
fallidas: `SectorControllerTest` (4, error de contexto — `UnsatisfiedDependencyException`),
`VeedorAuthControllerTest` (6) y el propio `RateLimitConfigTest` (2, `esperado 200, recibido 401`).

**Reproducción:** consistente, solo con los tres PRs presentes a la vez.

1. `@WebMvcTest` no solo escanea controladores: también autodetecta cualquier bean que implemente
   `WebMvcConfigurer`, aunque no esté en la lista de `@Import` del test. `RateLimitConfig` implementa
   esa interfaz, así que **cualquier** `@WebMvcTest` del proyecto —no solo los relacionados con rate
   limiting— pasó a instanciarlo, y su constructor exige un `RedisTemplate` calificado
   (`@Qualifier("redisTemplate")`). `SectorControllerTest` y `VeedorAuthControllerTest` no tenían
   ese bean disponible en su slice: el contexto de Spring fallaba al arrancar.
2. `RateLimitConfigTest` (el propio test del PR #60) tampoco importaba `SecurityConfig` — mismo
   patrón que `BUG-011`: sin él, Spring Security por defecto exige autenticación en todas las rutas
   de ese slice, y sus dos pruebas contra `/protegida` y `/sin-proteger` recibían 401 en vez de 200.

**Esperado:** que los slices de prueba existentes sigan pasando sin cambios al fusionar
infraestructura nueva que no tocan directamente.

**Causa raíz:** ninguno de los tres PRs pudo haberlo visto solo. El PR #56 y el #58 escribieron sus
pruebas antes de que `RateLimitConfig` existiera. El PR #60 escribió las suyas contra una rama sin
`SectorControllerTest` ni `VeedorAuthControllerTest`. El defecto solo existe en la intersección de
los tres — es responsabilidad de quien resuelve el merge, igual que `BUG-011`.

**Corrección:**
- `SectorControllerTest.java` y `VeedorAuthControllerTest.java` — `@MockitoBean(name = "redisTemplate")`
  para satisfacer el `@Qualifier` de `RateLimitConfig`. Nombrar el campo igual que el bean no bastó:
  hubo que fijar `name` explícitamente en `@MockitoBean`.
- `RateLimitConfigTest.java` — `@Import(SecurityConfig.class)` y `@MockitoBean JwtProvider`, igual
  que ya hacía `VeedorAuthControllerTest`.

Verificado: `./mvnw clean verify` → 75 pruebas, 0 fallos, ArchUnit incluido.

---

### BUG-011 — `ManejadorGlobalDeErrores` devolvía 500 donde correspondía 400/404, solo al combinar dos PRs

- **Fecha:** 2026-08-08 · **Severidad:** S2 · **Módulo:** M1/M5 (transversal, capa `api/error`) ·
  **Responsable:** Equipo (encontrado y corregido resolviendo el merge del PR #58)
- **Estado:** Cerrado — corregido antes de fusionar, ninguno de los dos PRs lo tenía por separado

**Síntoma:** al combinar el PR #56 (`ManejadorGlobalDeErrores`, `SectorControllerTest`) con el PR #58
(JWT, `spring-boot-starter-security`), `./mvnw clean verify` pasó de 0 a 6 pruebas fallidas:
`SectorControllerTest` (4, todas `esperado 200/404, recibido 401`) y `VeedorAuthControllerTest` (2,
`esperado 400/404, recibido 500`).

**Reproducción:** consistente, solo con ambos PRs presentes a la vez.

1. `ManejadorGlobalDeErrores` tiene `@ExceptionHandler(Exception.class)` como catch-all. No
   distinguía `MethodArgumentNotValidException` (debía ser 400) ni `NoResourceFoundException` (debía
   ser 404) de un error interno real, así que las devolvía como 500 genérico. El PR #56 nunca lo
   notó porque `SectorController` no tenía ningún `@Valid` en el cuerpo; el PR #58 sí lo introdujo
   (`CredencialVeedor`), pero en su propia rama —sin `ManejadorGlobalDeErrores`, que es del PR #56—
   Spring maneja esas excepciones con su comportamiento por defecto (400/404), así que su prueba
   pasaba igual, por una razón distinta a la que el código final necesitaba.
2. `SectorControllerTest` (`@WebMvcTest`) no importaba `SecurityConfig`. Sin `spring-boot-starter-
   security` en el classpath (el estado del PR #56 solo) eso no importaba nada — no había Security
   que autoconfigurar. En cuanto el PR #58 agrega esa dependencia al `pom.xml` del proyecto,
   cualquier *slice* de prueba sin una `SecurityFilterChain` explícita cae en la autoconfiguración
   por defecto de Spring Security ("todo requiere autenticación"), y las 4 pruebas de un controlador
   público empezaron a recibir 401.

**Esperado:** que `GET /api/sectores` sin token siga público (RF019: solo `/api/veedor/**` protegido)
y que un `@Valid` rechazado devuelva 400, no 500.

**Causa raíz:** ninguno de los dos autores podía haberlo visto solo. El PR #56 escribió el manejador
de errores antes de que existiera ningún endpoint con `@Valid`. El PR #58 escribió su propia prueba
contra una rama que todavía no tenía `ManejadorGlobalDeErrores` ni `SectorControllerTest`. El defecto
solo existe en la intersección de ambos — es responsabilidad de quien resuelve el merge, no de
ninguno de los dos PRs por separado.

**Corrección:**
- `ManejadorGlobalDeErrores.java` — nuevos `@ExceptionHandler` para `MethodArgumentNotValidException`
  (400, con el detalle de los campos) y `NoResourceFoundException` (404), antes del catch-all.
- `SectorControllerTest.java` — `@Import(SecurityConfig.class)` y `@MockitoBean JwtProvider`, igual
  que ya hacía `VeedorAuthControllerTest`.

Verificado: `./mvnw clean verify` → 52 pruebas, 0 fallos, ArchUnit incluido.

---

### BUG-010 — Un `JWT_SECRET` sin configurar habría podido tumbar con 500 cualquier ruta pública

- **Fecha:** 2026-08-08 · **Severidad:** S2 · **Módulo:** M5 · **Responsable:** D3
- **Estado:** Cerrado — corregido antes de comitear, capturado escribiendo la prueba

**Síntoma (en el diseño original, nunca llegó a `develop`):** `JwtAuthenticationFilter` llama a
`JwtProvider.validarYObtenerSujeto(token)` en **toda** petición que traiga un header `Authorization`,
sin importar si la ruta exige autenticación o no (RF019: el resto de la plataforma es público). La
primera versión de ese método solo capturaba `JwtException` e `IllegalArgumentException`; la
validación del secreto (`clave()`) lanza `IllegalStateException` cuando `JWT_SECRET` no está
configurado, y esa excepción no estaba cubierta.

**Reproducción:** con `JWT_SECRET` vacío (el valor por defecto de `.env.example`, sin configurar
todavía), cualquier petición a una ruta pública —incluida `GET /api/sectores`— con un header
`Authorization: Bearer cualquier-cosa` habría propagado `IllegalStateException` sin capturar,
devolviendo un 500 en una ruta que ni siquiera exige token.

**Esperado:** que un `JWT_SECRET` sin configurar afecte solo al login del veedor (`503` explícito,
ya cubierto por `VeedorAuthController`), nunca a rutas públicas.

**Causa raíz:** al escribir `validarYObtenerSujeto` no se distinguió entre "token inválido" (debe
devolver vacío) y "el servidor no puede validar nada porque está mal configurado" (debía devolver
vacío también, pero se decidió tratarlo como una excepción de configuración sin pensar en quién
llama al método).

**Corrección:** `JwtProvider.java` — se agregó `IllegalStateException` a la captura de
`validarYObtenerSujeto`. Cubierto por `JwtProviderTest.validarNoDebeLanzarAunqueElSecretoEsteMalConfigurado`
y verificado en vivo: con `JWT_SECRET` configurado, `GET /api/veedor/lo-que-sea` sin token → 401;
con token válido → 404 (pasó el filtro, no hay handler todavía) — nunca 500.

---

### BUG-009 — `RedisTemplate<String,String>` es ambiguo entre el bean propio y `stringRedisTemplate` de Spring

- **Fecha:** 2026-08-08 · **Severidad:** S2 · **Módulo:** — (infraestructura) · **Responsable:** D3
- **Estado:** Cerrado — corregido en el mismo PR que lo encontró

**Síntoma:** al inyectar `RedisTemplate<String, String>` por tipo en `RedisContadorReportesAdapter`,
Spring falla al arrancar el contexto de prueba con
`NoUniqueBeanDefinitionException: ... expected single matching bean but found 2: redisTemplate,stringRedisTemplate`.

**Reproducción:** consistente. `RedisConfig.java` (Sprint 0) define un bean `redisTemplate` de tipo
`RedisTemplate<String, String>`. La autoconfiguración de Spring Boot registra además
`stringRedisTemplate` — de tipo `StringRedisTemplate`, que **extiende** `RedisTemplate<String, String>`
y por eso también encaja en cualquier inyección por ese tipo. La autoconfiguración de este segundo
bean no está condicionada a que falte el primero, así que los dos siempre coexisten.

**Esperado:** que inyectar el `RedisTemplate<String, String>` de `RedisConfig` sea inequívoco.

**Causa raíz:** ningún código había consumido ese bean por tipo hasta este PR — `RedisConfig` existía
desde el Sprint 0/1 como andamiaje, sin consumidor que expusiera la ambigüedad. Le iba a pasar al
primer `@Autowired RedisTemplate<String,String>` que alguien del equipo escribiera, en cualquier capa.

**Corrección:** `RedisContadorReportesAdapter` — parámetro de constructor calificado con
`@Qualifier("redisTemplate")`. Cubierto por la propia suite de integración de
`RedisContadorReportesAdapterTest`: si el contexto no puede resolver el bean, las 6 pruebas fallan al
arrancar (ya lo hicieron, en el diagnóstico de este bug).

---

### BUG-008 — El mapa pinta como "con servicio" los sectores de los que no tiene ningún dato

- **Fecha:** 2026-08-08 · **Severidad:** S2 · **Módulo:** M1 · **Responsable:** D4
- **Estado:** Abierto — encontrado por D3 al construir el contrato de `GET /api/sectores`

**Síntoma:** `frontend/src/components/MapaCartagena.tsx:92` hace
`const estado: EstadoServicio = sector?.estado ?? 'CON_SERVICIO'`. Todo barrio sin dato se dibuja con
el color de servicio normal. Con los datos reales esto no es un caso raro: **son 211 de 211 los
sectores sin estado registrado** hasta que M3 (consenso) empiece a escribirlos en el Sprint 2.

**Reproducción:** consistente. Con el backend sirviendo datos reales, `GET /api/sectores` devuelve
`"estado": null` en los 211 sectores; el mapa los muestra todos en verde.

```
curl -s http://localhost:8080/api/sectores | grep -c '"estado":null'   → 211
```

**Esperado:** que un sector sin dato se distinga visualmente de uno verificado con servicio. La
plataforma no debe afirmar lo que no ha verificado — es el acuerdo del 2026-08-06 en `MEMORY.md`
("falsos positivos son peores que falsos negativos") y la razón de `ADR-014`. Un vecino que ve su
barrio en verde y no tiene agua deja de creerle a la plataforma, que es su único activo.

**Causa raíz:** el frontend se construyó contra `SECTORES_MOCK`, donde todos los sectores traían
estado. El `?? 'CON_SERVICIO'` era un relleno razonable para un dato que en los mocks nunca faltaba;
con datos reales se vuelve una afirmación falsa. Es el costo de `DT-001`/`DT-002` que el propio
registro de desbloqueos anticipaba.

**Corrección:** pendiente. Es de D4: `MapaCartagena.tsx:92` (color neutro para nulo) e
`InsigniaEstado` (que hoy no acepta nulo y rompería en `colores.etiqueta`). El contrato ya declara
`estado` como anulable, así que el cliente generado obligará a tratar el caso.

---

### BUG-007 — Las pruebas con Testcontainers no encuentran Docker aunque Docker esté corriendo

- **Fecha:** 2026-08-08 · **Severidad:** S2 · **Módulo:** — (infraestructura de pruebas) · **Responsable:** D3
- **Estado:** Cerrado — corregido en el mismo PR que lo encontró

**Síntoma:** `./mvnw verify` falla con
`IllegalState Could not find a valid Docker environment. Please see logs and check configuration`,
con Docker Desktop 4.82 corriendo y `docker ps` funcionando sin problema. El mensaje no menciona el
motivo real, que es una versión de API incompatible.

**Reproducción:** consistente, en toda ejecución. Diagnóstico contra el socket real:

```
docker version  →  ApiVersion 1.55, MinAPIVersion 1.40
GET //./pipe/docker_engine /v1.44/info  →  200
GET //./pipe/docker_engine /v1.32/info  →  400   (cuerpo idéntico al del error de Testcontainers)
```

**Esperado:** que las pruebas de integración del adaptador Mongo corran, porque son parte de la
definición de terminado de D3 (`D3-backend-infraestructura.md` §3).

**Causa raíz:** Docker Engine 29 subió su `MinAPIVersion` a 1.40 y dejó de aceptar versiones
anteriores. docker-java, dentro de Testcontainers 1.21.3 (**la última publicada** — no hay versión a
la que actualizar), sigue negociando 1.32 y recibe 400. No es un problema de esta máquina: le va a
pasar a todo el equipo en cuanto actualice Docker Desktop.

Descartado por comprobación: no es el sandbox (falla igual fuera de él), no es el pipe (ambos
responden 200 desde otros clientes), no es filtrado del daemon (Node obtiene 200), y las variables
`DOCKER_HOST` y `DOCKER_API_VERSION` no lo corrigen — esa ruta de configuración las ignora.

**Corrección:** `backend/pom.xml` — propiedad `docker.api.version` (1.41, la ventana más ancha:
soportada desde Docker 20.10 y por encima del mínimo de 29) inyectada al JVM de pruebas como la
propiedad `api.version` que docker-java sí lee, vía `maven-surefire-plugin`. Verificado:
`./mvnw clean verify` sin banderas ni variables de entorno → **34 pruebas, 0 fallos**, incluidas las
7 de `SectorMongoAdapterTest` contra un contenedor `mongo:7.0` real. Se quita cuando Testcontainers
publique una versión que negocie sola.

---

### BUG-006 — La rama `vista-previa-total` vuelve a pedir la contraseña `'1234'` y borra la prueba que lo impedía

- **Fecha:** 2026-08-08 · **Severidad:** S2 · **Módulo:** M5 · **Responsable:** D4
- **Estado:** Abierto — **no está en `develop`**; se dispara solo si la rama se fusiona sin poner al día

**Síntoma:** en `origin/vista-previa-total`, `frontend/src/pages/PaginaVeedor.tsx:16` vuelve a
contener `if (contraseña === '1234')` y el texto *"Código de acceso temporal (MOCK: usa 1234)"* en la
línea 33 — exactamente el defecto que cerró `BUG-004`. En la misma rama,
`frontend/src/pages/PaginaVeedor.test.tsx` aparece **borrado**, que es la prueba escrita para impedir
esta regresión.

**Reproducción:** consistente, 2 de 2 ejecuciones.

```
git show origin/develop:frontend/src/pages/PaginaVeedor.tsx | grep -c 1234          → 0
git show origin/vista-previa-total:frontend/src/pages/PaginaVeedor.tsx | grep -c 1234 → 2
git diff --name-status origin/develop origin/vista-previa-total -- frontend/src/pages/PaginaVeedor.test.tsx → D
```

**Esperado:** `develop` no vuelve a contener una credencial comparable escrita en el código, y
`PaginaVeedor.test.tsx` sigue existiendo y en verde. `BUG-004` quedó cerrado con esa prueba como
condición de cierre.

**Causa raíz:** la rama se creó antes del PR #30 (el que corrigió `BUG-004`) y nunca se sincronizó con
`develop`. Al fusionarla, su versión antigua del archivo pisa la corregida y arrastra consigo el
borrado del test. No es un cambio deliberado de D4: es divergencia por una rama larga sin rebase.

**Corrección:** pendiente. Condición de entrada del PR de M5 (paso 4 del plan de integración):
`git rebase origin/develop` sobre la rama, conservar `PaginaVeedor.test.tsx` y correr `npm test` en
verde antes de abrir el PR. Sin eso, el PR no se fusiona.

---

### BUG-005 — Los PRs se fusionan sin revisor, y el patrón empeora

**Síntoma:** la auditoría del 2026-08-08 (sesión de D3) encontró 18 de 32 PRs fusionados sin revisor
registrado, ya un incumplimiento de la política de `ADR-010`. El mismo día, después de dejarlo escrito
en `sprint-0.md`, los PRs #40, #41 y #42 se fusionaron igual sin revisor: los tres, fusionados por
Carlos (D2) en un lapso de 30 segundos (07:37:03–07:37:33 UTC), con `reviews: []` y `comments: []`
verificado con `gh pr view --json reviews,comments`. Esto es relevante en particular para el PR #42
(propuesta de `ADR-012`), cuyo propio texto pedía explícitamente aprobación por comentario antes de
fusionarse — la fusión no la sustituye, y el ADR se mantiene en estado *Propuesta* por esa razón.
**Verificado el 2026-08-08:** el patrón se repitió una cuarta vez — el PR
[#45](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/45), que es justamente el que registra
este bug y propone `ADR-013`, se fusionó también con `reviews: []` (`gh pr view 45 --json reviews`),
fusionado por Carlos (D2). Por la misma razón que el PR #42, `ADR-013` sigue en estado *Propuesta*: su
condición de ratificación no se cumplió con la fusión.
**Verificado el 2026-08-08, quinta ocurrencia:** el PR
[#57](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/57) (adaptador Redis de
`ContadorReportesPort`, D3) se fusionó también con `reviews: []`. Diferencia con las cuatro anteriores:
antes de fusionar, Carlos (D2) le pidió explícitamente al agente que revisara el código y resolviera
los conflictos con `develop` — el agente hizo una revisión real (arquitectura, tests, casos de borde,
`./mvnw clean verify` en verde) y la reportó en el chat antes de fusionar, en vez de fusionar a ciegas.
Sigue sin ser un segundo humano revisando, que es lo que pide la política — pero ya no es fusionar sin
ninguna revisión.
**Verificado el 2026-08-08, sexta ocurrencia:** el PR
[#58](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/58) (infraestructura JWT del panel del
veedor, D3) se fusionó también con `reviews: []`, misma diferencia que la quinta ocurrencia: el agente
revisó el código antes de fusionar. Esta vez la revisión sí encontró algo que un merge automático
habría dejado pasar — `BUG-011`, un error 500 que solo existía en la combinación de este PR con los
PR #56 y #57 ya fusionados, no en ninguno de los tres por separado. Es evidencia de que el segundo par
de ojos, aunque no sea humano, está encontrando defectos reales de integración — pero no reemplaza la
razón original por la que la política pide un revisor: que alguien del equipo, no solo quien fusiona,
entienda y respalde el cambio.
**Verificado el 2026-08-08, séptima ocurrencia:** el PR
[#59](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/59) (normalización, prefiltro y dedup
del pipeline de ingesta M9, D3) se fusionó también con `reviews: []`. Sin bug de integración esta vez
— el merge fue limpio salvo conflictos de texto — pero el patrón de fondo no cambió: cuatro PRs
seguidos (#56, #57, #58, #59) de la misma sesión, todos fusionados sin que un segundo humano del
equipo los viera.
**Verificado el 2026-08-08, octava ocurrencia:** el PR
[#60](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/60) (rate limiting HTTP genérico, D3,
último de cinco PRs de la misma sesión) se fusionó también con `reviews: []`. Igual que en la sexta
ocurrencia, la revisión del agente encontró algo real antes de fusionar: `BUG-012`, un fallo de
integración que solo existía en la combinación de este PR con los tres anteriores ya fusionados
(#56, #58, #59), no en ninguno por separado. Cinco PRs, ocho ocurrencias del mismo patrón en una
sola sesión — el hábito de fondo sigue sin corregirse, aunque la revisión automatizada haya estado
atrapando los defectos de integración que ese hábito habría dejado pasar sin que nadie se enterara.
**Reproducción:** cualquier PR abierto en este repositorio puede fusionarse sin que nadie deje un
comentario o *review* — no hay protección de rama configurada (`ADR-010`, decisión deliberada: es
política, no candado técnico).
**Esperado:** `docs/gestion/README.md` §"Definición de terminado" exige *"entró por Pull Request con
al menos 1 revisor"* para cualquier entregable.
**Causa raíz:** la política es solo documentada, no técnica (`ADR-010`), y hoy no hay ningún hábito ni
recordatorio que la haga cumplir en la práctica — cada quien fusiona su propio trabajo o el de otro sin
pausar a pedir o dejar una revisión.
**Corrección:** *pendiente.* No es un bug de código: es un hábito de equipo. Posible acción concreta
para la retrospectiva del Sprint 0: acordar que nadie fusiona su propio PR sin al menos un comentario
de otro integrante, y que el Scrum Master del sprint lo verifique antes de cerrar el sprint.

---

### BUG-004 — `PaginaVeedor.tsx` compara el acceso contra una contraseña escrita en el código *(cerrado)*

**Síntoma:** `frontend/src/pages/PaginaVeedor.tsx` comparaba la "autenticación" contra la cadena
literal `'1234'` escrita en el código, con un placeholder "MOCK: usa 1234". Fusionado a `develop`
con el PR #20.
**Causa raíz:** al maquetar el panel con datos mock (Sprint 3, C2 todavía cerrada), el gate de acceso
se modeló como un formulario de contraseña real en vez de un simulador explícito.
**Corrección:** se quitó el campo de contraseña y su comparación; el acceso mock ahora es un botón
"Simular ingreso de veedor" sin credencial comparable en el código —
`frontend/src/pages/PaginaVeedor.tsx`. Cerrado por D5 con autorización del equipo, no por D4, por ser
un fix simple con solución ya aceptada en el PR #20.
**Prueba que impide la regresión:** `frontend/src/pages/PaginaVeedor.test.tsx` — verifica que no exista
ningún `input[type="password"]` ni `textbox`, y que el botón de simulación lleve al panel de moderación.

---

## Nota sobre BUG-001 y BUG-002

Ambos se encontraron y se corrigieron durante la revisión de los PRs #1 y #5, y **se registraron
tarde**, en la auditoría del 2026-08-07. Se dejan escritos porque son exactamente lo que la regla 2 de
`README.md` pide capturar: defectos reales, atrapados por la revisión por pares antes de llegar a
`develop`. Son los dos primeros datos del Capítulo IV.

**Causa raíz común:** ambos workflows se escribieron asumiendo un repositorio que todavía no existía
—uno con `backend/`, `frontend/` y un script `test`—. La lección es del proceso, no de quien los
escribió: la configuración de CI se valida contra el estado **actual** del repositorio, no contra el
que tendrá en el Sprint 2.

**Corrección:** `0cb3b06` (quitar el propio archivo del filtro `paths`) y `f9c19c2` (detectar el
script `test` antes de invocarlo).
**Prueba que impide la regresión:** ninguna automatizada. Es una limitación conocida — no hay forma
barata de probar un workflow sin ejecutarlo. Mitigación: el paso de tests de `frontend-ci.yml` ya es
tolerante a su ausencia, y `backend-ci.yml` correrá por primera vez cuando D2 suba `/backend`, lo que
lo pone bajo prueba real ese mismo día.

---

## Nota sobre BUG-003

**Síntoma:** el comando exacto de la compuerta C0 (`docker compose config -q`) fallaba con
`env file .../.env not found` en cualquier clon recién hecho del repositorio, antes de que la persona
creara su `.env` a partir de `.env.example`. Contradice el objetivo explícito del Sprint 0
(`docs/gestion/sprint-0.md`): "que cualquiera de los cinco pueda clonar el repositorio, levantar el
entorno con un comando".

**Cómo se encontró:** D5 instaló el cliente de Docker (no estaba disponible antes en su máquina) para
poder correr el comando **literal** de la compuerta en vez de verificar solo la mitad (`ls backend
frontend`). Al correrlo por primera vez, falló.

**Causa raíz:** el servicio `mongo` de `docker-compose.yml` declaraba `env_file: .env` como referencia
obligatoria. El resto del archivo ya usaba valores por defecto (`${VAR:-default}`); ese único campo no.

**Corrección:** `docker-compose.yml` — `env_file: .env` cambiado a la sintaxis de Compose Specification
que lo marca opcional: `env_file: [{path: .env, required: false}]`. Verificado con el comando exacto de
la compuerta, exit code 0, con y sin `.env` presente.
**Prueba que impide la regresión:** ninguna automatizada todavía — pendiente agregar
`docker compose config -q` sobre un checkout limpio como paso de CI. Anotado, no bloqueante.

---

## Regla especial: bugs que publican información falsa

Un defecto que haga que la plataforma muestre un corte que no existe, o un Índice de Cumplimiento
equivocado, es **siempre S1**, sin discusión y sin importar cuán raro sea el caso.

El único activo de este proyecto es la credibilidad. Un mapa que se ve lento es un problema; un mapa
que miente es el final del proyecto. Ver `ADR-006` y `MEMORY.md`.

---

<!--
Plantilla de bug abierto — copiar a la sección "Bugs abiertos — detalle".

### BUG-NNN — <título en una línea, describe el síntoma, no la causa supuesta>

- **Fecha:** AAAA-MM-DD · **Severidad:** S<N> · **Módulo:** M<N> · **Responsable:** D<N>
- **Estado:** Abierto

**Síntoma:** qué se observó. Hechos, no interpretación.
**Reproducción:** pasos exactos. Si no se puede reproducir, dilo — es parte del reporte.
**Esperado:** qué debería pasar, y por qué (cita el RF si aplica).
**Causa raíz:** se llena al diagnosticar. Si el origen es un requisito ambiguo, corrige también el requisito.
**Corrección:** qué se cambió + `archivo:línea` + prueba que lo cubre. Sin prueba, el bug vuelve.

Siguiente número disponible: BUG-009
-->
