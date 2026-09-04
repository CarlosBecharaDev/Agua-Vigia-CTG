# Recomendaciones de la IA

> Observaciones que Claude registra al trabajar en este repositorio, cuando nota algo que se está
> haciendo mal o que podría hacerse mejor. No es un defecto (eso va a `registro-de-bugs.md`) ni una
> decisión ya tomada entre alternativas (eso va a `design-decisions.md`) — es una lectura que el
> equipo valida o descarta.
>
> **Para agregar una entrada: usa la skill `registrar-recomendacion`.**
> Aparecen en la Sala de control (sección **Recomendaciones**) en cada regeneración — no hace falta
> tocar el HTML a mano.

---

## Tabla de estado

| ID | Fecha | Título | Estado |
|---|---|---|---|
| REC-001 | 2026-08-08 | Formalizar quién es Rafael Sarmiento (`sarmientordev`) | Resuelta |
| REC-002 | 2026-08-08 | BUG-005 (PRs sin revisor) sigue abierto y el patrón no mejora | Pendiente |
| REC-003 | 2026-08-08 | C2 (contrato OpenAPI) es el cuello de botella real ahora mismo | Resuelta |
| REC-004 | 2026-08-08 | La cobertura de pruebas del frontend está muy por debajo de la del backend | En curso |
| REC-005 | 2026-08-08 | El ROSTER de `generar-dashboard.mjs` está escrito a mano, no se lee de ningún documento | Pendiente |
| REC-006 | 2026-08-09 | `RateLimitConfig` se cuela en cualquier `@WebMvcTest` aunque no se importe, y rompe pruebas en silencio al activar reglas reales | Pendiente |
| REC-007 | 2026-08-28 | Las ramas fusionadas se acumulan en GitHub porque falta activar el borrado automático | Pendiente |
| REC-008 | 2026-08-30 | El fuente de `index.css` está semi-minificado: el breakpoint móvil completo vive en una sola línea de 2.509 caracteres | Pendiente |
| REC-009 | 2026-08-30 | 25 reglas usan `transition: all`, que anima también propiedades de layout y dispara reflow en cada hover | Pendiente |
| REC-010 | 2026-08-31 | `CLAUDE.md` seguía declarando «Sprint 0 · ANDAMIAJE» sobre un backend terminado | Resuelta |
| REC-011 | 2026-09-04 | Los 15 endpoints de M15 (cuentas, permisos y segundo factor) no tienen prueba de contrato, y RNF022 la exige | Pendiente |
| REC-012 | 2026-09-04 | Las respuestas 401 y 403 de la cadena de seguridad no salen en RFC 7807, a diferencia del resto de la API | Pendiente |
| REC-013 | 2026-09-04 | El allowlist de gitleaks exceptúa un archivo entero, no un secreto concreto | Pendiente |
| REC-014 | 2026-09-04 | `sprint-2.md` lleva abierto desde el 2026-08-09 mientras el repositorio ya entregó M10–M15 | Pendiente |
| REC-015 | 2026-09-04 | Nada impide que `index.css` y `tipos-dominio.ts` vuelvan a discrepar en los colores de estado | Pendiente |

**Estado:** `Pendiente` (sin revisar) · `Validada` (el equipo está de acuerdo, puede pasar a
ADR/issue/tarea) · `Descartada` (el equipo no está de acuerdo — deja el motivo en el detalle) ·
`Resuelta` (ya se actuó sobre ella)

---

## Detalle

### REC-001 — Formalizar quién es Rafael Sarmiento (`sarmientordev`)

- **Fecha:** 2026-08-08 · **Estado:** Resuelta

Tiene acceso de escritura al repositorio pero no aparece en `docs/equipo/roles-y-tareas.md` ni tiene
un solo PR o commit todavía. Si es el 5.º integrante que se estaba esperando, formalícenlo (rol, ADR
de reasignación si corresponde) y agréguenlo al `ROSTER` de `scripts/generar-dashboard.mjs` — hoy ese
script lo excluye de todas las estadísticas del equipo por no estar en esa lista.

**Resuelta:** el 2026-08-08 se confirmó a Rafael como 5.º integrante y D1 quedó en su nombre
(`docs/design-decisions.md` — ADR-021, reemplaza a `ADR-011`; `roles-y-tareas.md`). Se agregó
`sarmientordev` al `ROSTER` de `scripts/lib/datos-proyecto.mjs`. Sigue pendiente que Rafael haga su
primer PR para que entre en las estadísticas reales. Misma tarea cerrada por PR #81, el resto del
traspaso (ADR, ficha D1, sprint-1.md, bloqueos) ya estaba fusionado en `develop` (commit `9cea8ee`).

### REC-002 — BUG-005 (PRs sin revisor) sigue abierto y el patrón no mejora

- **Fecha:** 2026-08-08 · **Estado:** Pendiente

`ADR-010` decidió conscientemente no usar branch protection técnica, y es una decisión razonable —
pero el propio registro de bugs admite que la disciplina no está sosteniendo la política sola. Antes
de escalar a protección técnica, algo más barato: una plantilla de PR con un checklist de "revisor
asignado" y que el Scrum Master del sprint lo audite en la retro, como ya dice `roles-y-tareas.md`
que debería hacer.

### REC-003 — C2 (contrato OpenAPI) es el cuello de botella real ahora mismo

- **Fecha:** 2026-08-08 · **Estado:** Resuelta — el 2026-08-08, al fusionar el PR #56

D4 ya construyó cuatro pantallas completas contra datos simulados (5 issues de reconciliación
abiertos: #34, #35, #36, #38, #39) y ese es trabajo real que se pierde si el contrato final no
coincide con la forma que asumieron los mocks. Vale la pena que D3 y D1 publiquen aunque sea un
`openapi.yaml` parcial pronto — no hace falta que esté completo para reducir el riesgo de que la UI
ya construida tenga que rehacerse.

**Resuelta:** el PR #56 publicó `backend/openapi.yaml` (`GET /api/sectores` y `/api/sectores/{id}`) y
abrió C2 formalmente. Los 5 issues de reconciliación siguen abiertos — falta que D4 conecte el
frontend al contrato real y los cierre — pero eso ya no es un bloqueo de C2, es trabajo normal de D4.

### REC-004 — La cobertura de pruebas del frontend está muy por debajo de la del backend

- **Fecha:** 2026-08-08 · **Estado:** En curso

El backend tiene 23 pruebas reales, incluido ArchUnit protegiendo la Regla de Oro. El frontend tiene
2 (`InsigniaEstado.test.tsx`, `PaginaVeedor.test.tsx`) contra 20 archivos de componentes. `RNF017`
pide ≥70% de cobertura — vale la pena empezar a cerrar esa brecha antes de que el Sprint 2 traiga más
superficie de UI todavía sin probar.

**Avance del 2026-09-01** — cifras verificadas corriendo las dos suites, no las de agosto: backend
**632** pruebas, frontend **81** (eran 63) en 17 archivos contra **50** componentes y páginas. La
brecha sigue abierta, así que la recomendación no se cierra; lo que se hizo fue cubrir primero la
superficie donde ya hubo bugs de *afirmar lo que no se sabe*, que es el principio del proyecto:

| Archivo nuevo | Qué invariante protege |
|---|---|
| `SeccionEstadisticas.test.tsx` (4) | `BUG-063` (S1): con la API sin cortes cerrados, las cinco métricas dicen «Sin datos» y no 100% ni ceros |
| `SeccionBitacora.test.tsx` (6) | Un evento que no habla del servicio se lista como «Informativo» y no como corte; el estado del evento manda sobre el deducido del tipo; `BUG-049` (portadas por el proxy `/acuacar-media/`); fecha real del boletín |
| `EditorPermisos.test.tsx` (8) | M15: no se ofrece revocar `CONFIGURAR_SEGUNDO_FACTOR`; concesiones y revocaciones se deducen bien del rol; cambiar de rol no arrastra ajustes previos |

También se agregó un stub de `ResizeObserver` a `src/setupTests.ts`, junto al de
`IntersectionObserver` que ya estaba: jsdom no implementa ninguno de los dos y el carrusel de la
Bitácora no se podía montar sin él.

**Lo siguiente, por tamaño y por riesgo:** `PanelVeedor.tsx` (620 líneas), `PaginaCuentas.tsx` (469)
y `PaginaMapa.tsx` (338) siguen sin una sola prueba. Para poder afirmar el ≥70% de `RNF017` con un
número y no con una impresión, hace falta además `@vitest/coverage-v8`, que hoy no es dependencia
del proyecto — decisión del equipo, no se agregó por cuenta propia.

### REC-005 — El ROSTER de `generar-dashboard.mjs` está escrito a mano, no se lee de ningún documento

- **Fecha:** 2026-08-08 · **Estado:** Pendiente

Es exactamente el mismo tipo de dato "vive en un solo lugar" que `protocolo-de-contexto.md` pide
evitar duplicar. Si el roster cambia (como en `REC-001`) y alguien actualiza `roles-y-tareas.md` sin
tocar el script, el dashboard queda mintiendo con toda confianza. Vale la pena, en algún momento,
mover ese mapeo a un archivo que ambos lean.

### REC-006 — `RateLimitConfig` se cuela en cualquier `@WebMvcTest` aunque no se importe, y rompe pruebas en silencio al activar reglas reales

- **Fecha:** 2026-08-09 · **Estado:** Pendiente

Al llenar `aguavigia.rate-limit.reglas` con las reglas de `/api/veedor/sesion` y `/api/reportes`
(`feature/d3-cache-sectores-y-rate-limit`), 9 pruebas en `ReporteControllerTest` y
`VeedorAuthControllerTest` empezaron a fallar con 500: `RateLimitConfig` implementa
`WebMvcConfigurer`, así que Spring lo instancia en cualquier slice `@WebMvcTest` aunque la clase no
lo importe, y con reglas vacías nadie lo había notado. Se resolvió con
`@TestPropertySource(properties = "aguavigia.rate-limit.reglas=")` en los dos slices afectados. Vale
la pena que el equipo decida si dejarlo anotado en el propio `RateLimitConfig.java` o como convención
de plantilla para nuevos `@WebMvcTest`, para que no vuelva a morder a la próxima persona que agregue
una regla.

### REC-007 — Las ramas fusionadas se acumulan en GitHub porque falta activar el borrado automático

- **Fecha:** 2026-08-28 · **Estado:** Pendiente

Al auditar `https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/branches` se encontraron 4 ramas
remotas y 11 locales completamente fusionadas a `main` (0 commits propios cada una), incluida
`fix/consenso-desempate-2` con un worktree local aparte (`ctg-fix-consenso`) que también quedó
huérfano. Ninguna traía trabajo pendiente, pero nadie las había borrado tras fusionar sus PRs. Vale la
pena activar **"Automatically delete head branches"** en Settings → General → Pull Requests del repo
para que esto no se repita cada pocos sprints.

### REC-008 — El fuente de `index.css` está semi-minificado: el breakpoint móvil completo vive en una sola línea de 2.509 caracteres

- **Fecha:** 2026-08-30 · **Estado:** Pendiente

`frontend/src/index.css` tiene 3.702 líneas y 147 KB, pero 29 de esas líneas concentran 32,5 KB: la
más larga son 4.680 caracteres (`index.css:202`) y **todo el breakpoint móvil está en
`index.css:214`, en una sola línea de 2.509 caracteres**. No es el CSS compilado, es el fuente que
se versiona. Eso hace que cualquier ajuste de responsividad sea ilegible en el diff de un PR —
tocar una regla móvil marca la línea entera como cambiada, así que el revisor no puede ver qué
cambió, que es justo lo que exige la política de 1 revisor por PR. Basta correr Prettier sobre el
archivo una vez; el riesgo es un diff enorme irrepetible, así que conviene hacerlo en un PR propio
que no mezcle ningún cambio de estilo.

### REC-009 — 25 reglas usan `transition: all`, que anima también propiedades de layout y dispara reflow en cada hover

- **Fecha:** 2026-08-30 · **Estado:** Pendiente

Hay 25 `transition: all` repartidas entre `ModalReporte.css`, `ModalSuscripcion.css`,
`PanelVeedor.css`, `SeccionBitacora.css`, `SeccionEstadisticas.css` y `GooeyNav.css` (por ejemplo
`PanelVeedor.css:87`). `all` no distingue: si la regla cambia `padding`, `width` o `border-width`,
el navegador recalcula layout y repinta en cada hover, en vez de quedarse en la GPU como haría con
`transform` y `opacity`. Se nota sobre todo en el móvil de gama baja, que es el dispositivo del
usuario objetivo de esta plataforma. La corrección no es mecánica —hay que mirar qué propiedad
cambia de verdad en cada regla y nombrarla— así que conviene repartirla por componente y no
intentarla de una sola pasada.

### REC-010 — `CLAUDE.md` sigue declarando "Sprint 0 · ANDAMIAJE, se prohíbe la funcionalidad" sobre un backend ya terminado

- **Fecha:** 2026-08-31 · **Estado:** Resuelta

`CLAUDE.md` §Estado actual dice *"Sprint 0 · Fase: ANDAMIAJE. Se permite estructura de proyecto,
configuración, infraestructura, tokens visuales y rutas vacías. Se prohíbe la funcionalidad: si el
código implementa un `RF`, no va en el Sprint 0"*. El repositorio contradice eso de forma frontal: el
`README` declara backend y bases de datos completos salvo RF041, con 601 pruebas en verde, y
`docs/gestion/registro-de-implementaciones.md` lista los PRs de M1 a M14 ya fusionados.

Importa porque ese archivo se declara a sí mismo fuente de verdad —*"Si algo de este archivo
contradice una suposición, gana este archivo"*— y lo lee el agente en cada sesión. Un agente que lo
obedezca al pie de la letra se negará a escribir la funcionalidad que el equipo le pida, o preguntará
por cada caso de frontera de una fase que terminó hace sprints. Se paga en cada sesión de las cinco
personas.

Basta actualizar §Estado actual al sprint real y a su entregable pendiente. Conviene que lo haga
quien lleva la gestión del sprint, no el agente: es el estado del proyecto, no un detalle técnico.

**Resuelta:** el 2026-09-04 se actualizó §Estado actual de `CLAUDE.md` al estado verificado —Sprint 0
y 1 cerrados, Sprint 2 abierto, M1–M15 construidos, `ADR-009` ya no aplica— con las cifras medidas en
esa sesión (563 pruebas de backend, 95 de frontend) y una advertencia explícita de que la gestión de
sprints va por detrás del código (ver `REC-014`).

---

### REC-011 — Los 15 endpoints de M15 no tienen prueba de contrato, y `RNF022` la exige

- **Fecha:** 2026-09-04 · **Estado:** Pendiente

`RNF022` dice que el panel debe autorizar cada acción contra un permiso concreto, y declara como
verificación *«ArchUnit + pruebas de contrato por endpoint»*. Esas pruebas no existen para
`AdminUsuariosController` (7 endpoints), `CuentaPublicaController` (5) y `SegundoFactorController`
(3): `backend/src/test/.../api/` no tiene un solo archivo que los nombre, y ninguna prueba de la
suite toca las rutas `/api/veedor/usuarios`, `/api/cuentas/*` ni `/api/veedor/segundo-factor/*`.

Los **casos de uso** sí están probados (`GestionDeCuentasDelPanelTest`, `AdministrarCuentaServiceTest`,
`AltaYRecuperacionDeCuentaTest`, `AutenticarUsuarioServiceTest`). Lo que falta es la capa web: nada
verifica que un `OBSERVADOR` reciba 403 al llamar a un endpoint de administración, ni que un token
de alcance restringido no pueda usarse fuera del alta del segundo factor. Justo la superficie donde
un permiso mal cableado no se nota hasta que alguien lo aprovecha.

Es además la parte más nueva del sistema (`ADR-039`) y la de mayor daño si falla: son los endpoints
que crean, aprueban y suspenden cuentas.

---

### REC-012 — Las respuestas 401 y 403 de la cadena de seguridad no salen en RFC 7807

- **Fecha:** 2026-09-04 · **Estado:** Pendiente

`CLAUDE.md` fija que los errores de API van en formato RFC 7807 centralizados en un
`@RestControllerAdvice`, y `ManejadorGlobalDeErrores` lo cumple para todo lo que pasa por un
controlador. Pero `SecurityConfig` resuelve sus dos casos con `response.sendError(...)`, que produce
la página de error del contenedor, no un `ProblemDetail`.

Son precisamente los dos casos más frecuentes que ve un cliente: entrar sin token y entrar sin
permiso. El frontend recibe ahí una forma distinta a la de cualquier otro error, y la única prueba
que los cubre (`debeRechazarUnaRutaDeVeedorSinTokenCon401`) comprueba el código de estado, no el
cuerpo, así que la divergencia no salta.

Se arregla escribiendo el `ProblemDetail` desde el `authenticationEntryPoint` y el
`accessDeniedHandler`, con su `type` propio, y afirmando el `content-type` en la prueba.

---

### REC-013 — El allowlist de gitleaks exceptúa un archivo entero, no un secreto concreto

- **Fecha:** 2026-09-04 · **Estado:** Pendiente

`ADR-031` decidió, con razón, no borrar la clave de desarrollo local de
`docs/ingenieria/entorno-local.md`. Pero el allowlist de `.gitleaks.toml` está escrito por **ruta**:

```toml
paths = ['''docs/ingenieria/entorno-local\.md''']
```

Eso apaga el escaneo para el archivo completo y para siempre. Cualquier secreto que alguien escriba
ahí en el futuro —incluido uno de producción, y ese archivo es justo donde alguien lo pegaría por
error— pasa el CI en verde y en silencio.

Acotarlo al secreto concreto en vez del archivo: `regexTarget` con el valor de la clave de
desarrollo, o `stopwords`, de forma que el archivo siga escaneándose para todo lo demás.

---

### REC-014 — `sprint-2.md` lleva abierto desde el 2026-08-09 mientras el repositorio ya entregó M10–M15

- **Fecha:** 2026-09-04 · **Estado:** Pendiente

`docs/gestion/sprint-2.md` («Reporte ciudadano y consenso») sigue sin fecha de cierre desde el
2026-08-09, casi un mes. En ese intervalo el repositorio entregó M10 a M15 —evidencia multimedia,
validación comunitaria, Open311, IoT, alertas push y el modelo completo de cuentas y permisos— y
registró de `ADR-025` a `ADR-042`.

No es un detalle de forma: la Sala de control se genera de estos archivos, así que lo que el equipo
mira no refleja lo que el equipo hizo. Y el Capítulo IV se alimenta de aquí. Cerrar el Sprint 2 con
su entregable demostrado y abrir los siguientes es trabajo de quien lleva la gestión, no del agente
— pero cuanto más se tarde, más caro es reconstruir qué pasó en cada uno.

---

### REC-015 — Nada impide que `index.css` y `tipos-dominio.ts` vuelvan a discrepar en los colores de estado

- **Fecha:** 2026-09-04 · **Estado:** Pendiente

`ADR-042` unificó los cuatro colores de estado, que estaban en seis sitios con cinco valores
distintos, y dejó dos fuentes que **deben** moverse juntas: `--color-estado-*` en `index.css` (pinta
la leyenda) y `COLOR_POR_ESTADO` en `tipos-dominio.ts` (pinta los polígonos del mapa). Está
documentado en `DESIGN.md` §2 y en el javadoc del propio `COLOR_POR_ESTADO`, pero **nada lo
verifica**: quien cambie uno y olvide el otro vuelve a partir el mapa de su leyenda, y la build sigue
en verde.

Una prueba corta lo cerraría: leer los cuatro valores de `index.css` y compararlos con
`COLOR_POR_ESTADO`, y de paso comprobar que cada uno alcanza 4.5:1 sobre la superficie de su tema
(`RNF012`). Hoy el contraste tampoco lo verifica nada — se midió a mano.

