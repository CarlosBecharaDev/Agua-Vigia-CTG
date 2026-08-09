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
| BUG-006 | 2026-08-08 | S2 | M5 | La rama `vista-previa-total` vuelve a comparar contra `'1234'` y borra la prueba que cerró `BUG-004` | Cerrado | D4 |
| BUG-007 | 2026-08-08 | S2 | — (pruebas) | Testcontainers no encuentra Docker: Engine 29 exige API ≥ 1.40 y docker-java negocia 1.32 | Cerrado | D3 |
| BUG-008 | 2026-08-08 | S2 | M1 | El mapa pinta como "con servicio" los 211 sectores de los que no tiene dato | Cerrado | D4 |
| BUG-009 | 2026-08-08 | S2 | — (infraestructura) | `RedisTemplate<String,String>` es ambiguo entre el bean propio y `stringRedisTemplate` de Spring | Cerrado | D3 |
| BUG-010 | 2026-08-08 | S2 | M5 | `JwtProvider.validarYObtenerSujeto` habría podido tumbar con 500 cualquier ruta pública si `JWT_SECRET` no estaba configurado | Cerrado | D3 |
| BUG-011 | 2026-08-08 | S2 | M1/M5 | `ManejadorGlobalDeErrores` devolvía 500 en vez de 400/404 para validación de `@Valid` y rutas sin handler; solo aparecía al fusionar los PR #56 y #58 juntos | Cerrado | Equipo (fusión) |
| BUG-012 | 2026-08-08 | S2 | M1/M2/M5 | `RateLimitConfig` (`WebMvcConfigurer`) tumbaba cualquier `@WebMvcTest` del proyecto que no mockeara `RedisTemplate`; solo aparecía al fusionar el PR #60 sobre #56/#58 | Cerrado | Equipo (fusión) |
| BUG-013 | 2026-08-08 | S3 | — (proceso) | `BL-004` se usó para dos bloqueos distintos en `registro-de-bloqueos.md` (el de D2 y el de los colectores del PR #59); también la tabla de compuertas §1 seguía mostrando C2 en 🟡 después de que el PR #56 la abriera | Cerrado | Equipo (documentación) |
| BUG-014 | 2026-08-08 | S3 | — (sala de control) | `dashboard-template.html` no tiene `<!DOCTYPE html>` ni `<meta charset="UTF-8">` — el navegador adivina la codificación y la adivina mal, mostrando "AguaVigÃ­a" en vez de "AguaVigía" en todo el panel | Cerrado | Equipo (sala de control) |
| BUG-015 | 2026-08-08 | S2 | — (sala de control) | `generar-dashboard.mjs` inyectaba `JSON.stringify(datos)` sin escapar dentro de un `<script>`; un título de PR/issue/bug con `</script>` literal rompería la página o ejecutaría contenido inyectado | Cerrado | Equipo (sala de control) |
| BUG-016 | 2026-08-08 | S4 | M7 | Las líneas rojas de la gráfica interactiva SVG en el HTML exportado se cortaban a la mitad cuando tenían demasiados picos debido a la restricción nativa de `stroke-dasharray`. | Cerrado | D4 |
| BUG-017 | 2026-08-09 | S1 | M2 | `FormularioReporte.tsx` muestra "¡Reporte recibido!" aunque el envío a la API falle | Cerrado | D4 |
| BUG-018 | 2026-08-09 | S2 | M1 | `BUG-008` no quedó corregido del todo: el estilo inicial de la capa GeoJSON en `MapaCartagena.tsx` sigue pintando "con servicio" por defecto | Cerrado | D4 |
| BUG-019 | 2026-08-09 | S2 | M1 | Sectores sin dato (`estado: null`) se cuentan como "con problema" en el badge del mapa y en los reportes falsos de `ListaSectores` | Cerrado | D4 |
| BUG-020 | 2026-08-09 | S2 | M1/M9 | El cruce de nombres entre boletines de Acuacar y sectores reales no normaliza texto ni usa límites de palabra — pierde o duplica barrios con nombres compuestos | Cerrado | D4 |
| BUG-021 | 2026-08-09 | S2 | — (bot WhatsApp) | El bot de resumen diario interpola títulos de PRs/bugs sin escapar `*`/`_` — un título real del propio repo puede corromper el formato del mensaje | Cerrado | Equipo (bot WhatsApp) |
| BUG-022 | 2026-08-09 | S2 | — (bot WhatsApp) | El bot de WhatsApp llama `process.exit(1)` ante cualquier evento `close`, incluso con un envío todavía pendiente | Cerrado | Equipo (bot WhatsApp) |
| BUG-023 | 2026-08-09 | S2 | — (sala de control) | El cron de `dashboard.yml` nunca va a ejecutarse: GitHub solo lee triggers `schedule` desde la rama por defecto (`main`), que no tiene workflows | Cerrado | Equipo (sala de control) |
| BUG-024 | 2026-08-09 | S2 | M2 | La preselección de sector por URL (`/reportar?sector=X`) y el respaldo sin API de `PaginaReportar` se rompieron al quitar `SECTORES_MOCK` | Cerrado | D4 |
| BUG-025 | 2026-08-09 | S2 | M7 | El botón "Instalar App" lanza una excepción no capturada si el usuario descarta el diálogo nativo y vuelve a hacer clic | Cerrado | D4 |
| BUG-026 | 2026-08-09 | S2 | M1 | El mapa deja de reaccionar a datos nuevos al hacer clic en un sector después del primer render (dependencias del efecto recortadas en `MapaCartagena.tsx`) | Cerrado | D4 |
| BUG-027 | 2026-08-09 | S2 | M1/M8 | La clasificación del estado de un boletín de Acuacar difiere entre la Bitácora y el Mapa/Estadísticas para el mismo texto | Cerrado | D4 |
| BUG-028 | 2026-08-09 | S3 | M2 | La detección de barrio por GPS compara solo contra el primer vértice del polígono, no es un point-in-polygon real | Cerrado | D4 |
| BUG-029 | 2026-08-09 | S4 | — (sala de control / M7) | Detalles menores encontrados en la misma revisión: layout de `.narrativa` en 3-4 columnas en vez de 2, campo `urgente` muerto en bugs, y falta cleanup del listener `appinstalled` en `BotonInstalarPWA.tsx` | Cerrado | Equipo / D4 |
| BUG-030 | 2026-08-08 | S3 | — (proceso) | El comando de la compuerta C0 solo validaba el YAML: la máquina de D5 no tenía ningún motor de contenedores instalado | Cerrado | D5 |
| BUG-031 | 2026-08-09 | S2 | — (sala de control) | `leerDetalleSprint` asumía siempre 5 columnas en la tabla de Compromisos; `sprint-1.md` (recién abierto, en planificación pura) tiene solo 4 sin columna Estado, y `generar-dashboard.mjs` tumbaba con `TypeError: Cannot read properties of undefined (reading 'startsWith')` | Cerrado | Equipo (sala de control) |
| BUG-032 | 2026-08-09 | S2 | M2 | `RegistrarReporteService` (PR #84, ya en `develop`) no implementa RF006 pese a que su propio javadoc dice que sí está cubierto | Cerrado | D5 (Yordy), en capa de D2 |
| BUG-033 | 2026-08-08 | S1 | M1 | `ListaSectores.tsx` mostraba un número de "reportes ciudadanos" por sector completamente inventado (`sector.id * 4 + 7`), siempre visible, no solo en modo demo | Cerrado | D5 (Yordy), en capa de D4 |
| BUG-034 | 2026-08-09 | S2 | M1 | La SPA llamaba a `localhost:8080` y el navegador bloqueaba sectores por CORS | Cerrado | D4 |
| BUG-035 | 2026-08-09 | S1 | M1 | Al tocar un polígono ausente del backend, el mapa afirmaba falsamente que tenía servicio | Cerrado | D4 |
| BUG-036 | 2026-08-09 | S1 | M2/M5/M7/M8 | Pantallas sin endpoint se presentaban como operativas con datos y confirmaciones simuladas | Cerrado | D4 |
| BUG-037 | 2026-08-09 | S2 | M1 | En 360×800 y 390×844 el mapa empezaba debajo del primer viewport | Cerrado | D4 |
| BUG-038 | 2026-08-09 | S3 | M1 | Una URL inexistente mostraba solo el encabezado sin mensaje ni salida | Cerrado | D4 |
| BUG-039 | 2026-08-09 | S2 | — (CI/integración) | CI del PR #105 fallaba en "Verificar cliente OpenAPI": `schema.ts` desactualizado tras avanzar `develop` con `/api/reportes` | Cerrado | Equipo (fusión) |
| BUG-040 | 2026-08-09 | S3 | M7 | `index.css` redeclara los tokens de color del tema (`--color-acento` y compañía) en un segundo bloque `:root`/`:root[data-theme]` posterior — editar el primer bloque no cambia nada visualmente | Cerrado — duplicación eliminada, no solo resincronizada | D5 (Yordy) |
| BUG-041 | 2026-08-09 | S2 | M4 | `ConfirmarSuscripcionService` (ya en `develop`) nunca revisa el vencimiento del token, aunque `confirmar-suscripcion.html` le promete al vecino que el enlace vence en `{{horasVigencia}}` horas; tampoco había índice único sobre `tokenConfirmacion` en Mongo | Cerrado | D1/D5 (`ConfirmarSuscripcionService` original de D5; hallazgo del PR #110 de Rafael, D1) |

**Severidad:** `S1` bloquea el uso o publica dato falso · `S2` funcionalidad rota con rodeo posible ·
`S3` molesto pero no impide · `S4` cosmético
**Estado:** `Abierto` · `En curso` · `Cerrado` · `No se corrige` (con motivo)

---

## Bugs abiertos — detalle

> **Nota de origen — BUG-017 a BUG-029:** encontrados el 2026-08-09 en una revisión de código de
> los PRs #62–#69 (todos fusionados sin revisor, `BUG-005`), a pedido de Sebastián (D3) mientras
> `application/` seguía bloqueada por `BL-004`. Son archivos de D4 y del equipo (sala de control,
> bot de WhatsApp) — se registran sin corregirse, por frontera de propiedad
> (`secuencia-de-trabajo.md` §5).

### BUG-018 — `BUG-008` no quedó corregido del todo

- **Fecha:** 2026-08-09 · **Severidad:** S2 · **Módulo:** M1 · **Responsable:** D4
- **Estado:** Cerrado — corregido en PR #87

**Síntoma:** `BUG-008` (el mapa pinta "con servicio" los sectores sin dato) figura `Cerrado` en este
mismo registro desde el PR #67. Pero `frontend/src/components/MapaCartagena.tsx:149` —el `style`
inicial de la capa GeoJSON, no el efecto `setStyle` que sí se corrigió— todavía hace
`sector?.estado ?? 'CON_SERVICIO'`.

**Reproducción:** si la capa GeoJSON se (re)crea antes de que `setStyle` corra —por ejemplo si el
fetch local del GeoJSON resuelve después de que `sectores` ya se actualizó, o si `capaRef.current`
se remonta—, todo barrio sin dato se pinta verde brillante como si tuviera servicio verificado.

**Esperado:** ningún camino de renderizado debe usar `CON_SERVICIO` como valor por defecto para un
`estado` nulo (`ADR-014` del backend fija esta misma regla del lado del contrato).

**Causa raíz:** el PR #67 corrigió el efecto que recolorea la capa después de cargar, pero no el
callback `style` que la capa usa en su creación — dos caminos que pintan el mismo dato, uno corregido
y el otro no.

**Corrección:** Implementada en PR #87; el estilo inicial de la capa usa ahora el estado visual "sin datos".

---

### BUG-019 — Sectores sin dato se cuentan como "con problema"

- **Fecha:** 2026-08-09 · **Severidad:** S2 · **Módulo:** M1 · **Responsable:** D4
- **Estado:** Cerrado — corregido en PR #87

**Síntoma:** `PaginaMapa.tsx:135` cuenta "🔥 N barrios reportan problemas" con
`s.estado !== 'CON_SERVICIO'`, lo que también cuenta `estado === null` como problema. Por separado,
`ListaSectores.tsx:68` (`obtenerReportesMock`) no tiene rama para `estado === null` y le asigna la
misma fórmula de reportes falsos que a un sector sin servicio.

**Reproducción:** con el backend real, la mayoría de los 211 sectores tienen `estado: null` hasta que
el consenso (M3) empiece a escribir estados. El badge de "problemas" sale inflado por sectores sin
ningún dato, y `ListaSectores` les inventa una cifra de "N reportes ciudadanos".

**Esperado:** un sector sin dato se presenta como "sin datos", no como un problema activo — es la
misma regla que `ADR-014` fija en el backend, ahora violada en dos lugares del frontend.

**Causa raíz:** el frontend se construyó contra mocks donde todo sector tenía estado; al conectar la
API real, ningún camino nuevo distingue "sin dato" de "con problema".

**Corrección:** Implementada en PR #87; los estados nulos ya no cuentan como problemas ni muestran reportes inventados.

---

### BUG-020 — El cruce de nombres Acuacar↔sector no normaliza texto

- **Fecha:** 2026-08-09 · **Severidad:** S2 · **Módulo:** M1/M9 · **Responsable:** D4
- **Estado:** Cerrado — corregido en PR #87

**Síntoma:** `useDatosEnVivo.ts:105` (`combinarSectoresConAcuacar`) une el nombre de barrio derivado
de Acuacar con el sector real vía `Map.get(sector.nombre)` exacto, sin la normalización que
`MapaCartagena.tsx` sí usa para el cruce GeoJSON↔Sector. Por separado, `acuacar.ts:105`
(`extraerBarriosDeTexto`) hace coincidencia por subcadena simple, y su lista `BARRIOS_CONOCIDOS`
contiene tanto `'NUEVO CHILE'` como `'CHILE'`.

**Reproducción:** el GeoJSON real tiene `'PABLO VI - I'` y `'PABLO VI - II'`, pero
`BARRIOS_CONOCIDOS` solo tiene `'PABLO VI'` — un boletín sobre ese barrio nunca cruza con ningún
sector real y el corte reportado se pierde en silencio. Un boletín sobre "Nuevo Chile" marca dos
barrios (`NUEVO CHILE` y `CHILE`) por la coincidencia de subcadena, duplicando el conteo en las
estadísticas.

**Esperado:** el mismo criterio de normalización (sin acentos, mayúsculas, límites de palabra) en
todos los cruces de nombre de barrio del proyecto.

**Causa raíz:** dos implementaciones distintas del mismo tipo de cruce, escritas por separado sin
compartir la utilidad de normalización que ya existe en `MapaCartagena.tsx`.

**Corrección:** Implementada en PR #87 con normalización y coincidencia segura entre Acuacar, sectores y GeoJSON.

---

### BUG-021 — El bot de WhatsApp no escapa símbolos de formato en texto interpolado

- **Fecha:** 2026-08-09 · **Severidad:** S2 · **Módulo:** — (bot WhatsApp) · **Responsable:** Equipo (bot WhatsApp)
- **Estado:** Cerrado

**Síntoma:** `bot-whatsapp/mensaje.mjs:26` interpola títulos reales de PRs/bugs en texto con formato
WhatsApp (`*negrita*`, `_cursiva_`) sin escapar. Es el mismo tipo de defecto que `BUG-015` (JSON sin
escapar en un `<script>`), aplicado a otro formato de salida.

**Reproducción:** el propio historial del repo ya tiene títulos con un solo `*` o `_` suelto (p. ej.
`"fix: forzar diffs de texto en *.mjs"`). Si un PR así está abierto cuando corre el resumen diario,
el símbolo sin pareja deja todo el resto del mensaje —líneas no relacionadas incluidas— en negrita o
cursiva.

**Esperado:** el texto de terceros (títulos de PR/issue/bug) nunca debe poder alterar el formato del
mensaje completo.

**Causa raíz:** el formateador de WhatsApp se agregó sin la misma disciplina de escape que
`generar-dashboard.mjs` ya aplica para HTML tras `BUG-015`.

**Corrección:** `bot-whatsapp/mensaje.mjs` agrega `neutralizarFormato()`: sustituye `*`, `_`, `~` y
` en cualquier texto de terceros (título de bug, título de PR, responsable) por sus variantes de
ancho completo (`＊＿～｀`) — visualmente casi idénticas, pero el parser de formato de WhatsApp no las
reconoce. El texto que el propio bot controla (encabezados, etiquetas) sigue usando `*`/`_` reales.
Prueba: `node -e` interpolando un título con `*asterisco*` y `_guion_bajo_` de prueba — confirmado que
salen con las variantes de ancho completo en el mensaje generado, sin romper el formato del resto.

---

### BUG-022 — El bot de WhatsApp mata el proceso con cualquier evento `close`

- **Fecha:** 2026-08-09 · **Severidad:** S2 · **Módulo:** — (bot WhatsApp) · **Responsable:** Equipo (bot WhatsApp)
- **Estado:** Cerrado

**Síntoma:** `bot-whatsapp/enviar.mjs:50` — el listener de `connection.update` trata todo evento
`close` como fatal y llama `process.exit(1)` sin condición, sin verificar si el envío del mensaje
(`await sock.sendMessage(...)`, línea ~35-48) sigue pendiente.

**Reproducción:** si Baileys emite un `close` (corte de red transitorio, reinicio benigno) mientras
el envío async sigue en curso, el proceso muere antes de confirmar si el mensaje salió — el resumen
diario puede perderse en silencio o reportarse mal.

**Esperado:** distinguir un cierre fatal de uno recuperable, y no matar el proceso con un envío
pendiente.

**Causa raíz:** manejo de eventos de conexión simplificado al mínimo, sin considerar la carrera entre
el `close` y el `await` del envío.

**Corrección:** `enviar.mjs` y `vincular.mjs` agregan una bandera `terminado` que se pone en `true`
justo antes de que el propio script llame `sock.end()` tras completar su trabajo (con éxito o con
error) — el `close` que eso mismo dispara ya no se trata como fatal. Solo un `close` que llega
**antes** de que el script decida terminar por su cuenta (`!terminado`) sigue tratándose como un
corte real y termina el proceso en 1.

---

### BUG-023 — El cron de la sala de control nunca va a ejecutarse

- **Fecha:** 2026-08-09 · **Severidad:** S2 · **Módulo:** — (sala de control) · **Responsable:** Equipo (sala de control)
- **Estado:** Cerrado — 2026-08-09, cierre del Sprint 0 hacia `main` (PR #111)

**Síntoma:** el PR #62 agregó un trigger `schedule` a `.github/workflows/dashboard.yml` en `develop`
para refrescar la sala de control cada hora. GitHub solo evalúa triggers `schedule` usando el
contenido del workflow **en la rama por defecto del repositorio** — y `main` no tiene ningún archivo
de workflow (`git ls-tree origin/main -- .github/workflows` → vacío).

**Reproducción:** verificado contra el repositorio real, no es especulación:
```
gh repo view --json defaultBranchRef   → main
git ls-tree origin/main -- .github/workflows   → (vacío)
```
Mientras `develop` no se fusione a `main` (algo que solo pasa al cerrar un sprint, según
`CLAUDE.md`), el cron simplemente no corre.

**Esperado:** que la sala de control se refresque cada hora, tal como el PR #62 dice lograr.

**Causa raíz:** comportamiento de GitHub Actions poco conocido — los triggers `schedule` no siguen la
misma regla que `push`/`workflow_dispatch` (que sí usan la rama que los disparó).

**Corrección:** el Sprint 0 ya había cerrado formalmente (Review + Planning, `BL-004` cerrado) pero
nunca se había hecho la fusión `develop` → `main` que le corresponde a ese cierre según `CLAUDE.md`.
Se abrió y fusionó el PR [#111](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/111)
(`develop` → `main`, con conflicto resuelto en `MEMORY.md`) y se etiquetó `main` como `sprint-0`.
Verificado: `gh workflow list` ahora reporta `Sala de control` como `active` (antes no aparecía, al no
existir en la rama por defecto). El cron corre por primera vez en la próxima hora en punto.

---

### BUG-024 — Preselección de sector y respaldo sin API rotos en `PaginaReportar`

- **Fecha:** 2026-08-09 · **Severidad:** S2 · **Módulo:** M2 · **Responsable:** D4
- **Estado:** Cerrado — corregido en PR #87

**Síntoma:** dos regresiones del PR #68 al quitar `SECTORES_MOCK`:
1. `FormularioReporte.tsx:16` — `sectorId` se inicializa desde `sectorPreseleccionado` solo dentro de
   un `useState` perezoso; si el prop llega después del primer render (ruta directa
   `/reportar?sector=X`, antes de que el `useEffect` de `PaginaReportar` lea la URL), el valor nunca
   se sincroniza y la preselección falla en silencio.
2. `PaginaReportar.tsx:23` — a diferencia de `PaginaVeedor.tsx` y `useDatosEnVivo.ts`, la llamada a
   `obtenerSectores()` no tiene respaldo: si falla, `sectores` queda `[]` para siempre y el formulario
   pierde los nombres de barrio que antes sí tenía offline vía el mock.

**Esperado:** la preselección por URL debe funcionar sin importar el orden de montaje, y un fallo de
red no debe dejar el formulario sin ningún nombre de sector.

**Causa raíz:** tres implementaciones independientes y divergentes de "traer sectores + respaldo"
quedaron en el mismo PR (`PaginaReportar` sin respaldo, `PaginaVeedor` con mock local,
`useDatosEnVivo` con su propio mock) — nadie las unificó en un solo hook compartido.

**Corrección:** Implementada en PR #87; la preselección se sincroniza y el formulario conserva el respaldo de sectores.

---

### BUG-025 — El botón "Instalar App" revienta si se reintenta tras descartar el diálogo

- **Fecha:** 2026-08-09 · **Severidad:** S2 · **Módulo:** M7 · **Responsable:** D4
- **Estado:** Cerrado — corregido en PR #87

**Síntoma:** `BotonInstalarPWA.tsx:42` solo limpia el evento `BeforeInstallPromptEvent` capturado
cuando el resultado es `'accepted'`. Si el usuario descarta el diálogo (`'dismissed'`), el evento ya
consumido queda igual y el botón sigue visible.

**Reproducción:** clic en "Instalar App" → descartar el diálogo nativo → clic otra vez. El segundo
`eventoInstalacion.prompt()` se llama sobre un evento cuyo `.prompt()` ya se invocó una vez, lo que
el spec del navegador lanza como excepción (`InvalidStateError`); sin `try/catch`, queda sin capturar
y rompe el botón en silencio por el resto de la sesión.

**Esperado:** descartar el diálogo debe permitir reintentar, o el botón debe ocultarse/deshabilitarse
tras el primer intento.

**Causa raíz:** el manejo del resultado del prompt solo contempló el camino de éxito.

**Corrección:** Implementada en PR #87; el evento se libera después de cualquier resultado y los errores quedan capturados.

---

### BUG-026 — El mapa deja de reaccionar al hacer clic en un sector tras el primer render

- **Fecha:** 2026-08-09 · **Severidad:** S2 · **Módulo:** M1 · **Responsable:** D4
- **Estado:** Cerrado — corregido en PR #87

**Síntoma:** el `useEffect` que construye la capa GeoJSON en `MapaCartagena.tsx:194` recortó sus
dependencias de `[sectores, onSectorSeleccionado]` a solo `[onSectorSeleccionado]` (un `useCallback`
estable) — ahora corre una sola vez al montar. El *closure* del `onEachFeature` del clic captura el
objeto `Sector` de ese momento y nunca vuelve a leer datos frescos.

**Reproducción:** `useDatosEnVivo` carga primero `SECTORES_MOCK` y luego lo reemplaza con los
sectores reales. El color de los polígonos sí se actualiza (otro efecto sí re-lee datos frescos),
pero al hacer clic en cualquier polígono se sigue entregando el objeto mock original — el panel de
detalle y el botón "Reportar problema" operan sobre datos permanentemente viejos.

**Esperado:** el clic en un sector debe reflejar siempre el dato más reciente disponible.

**Causa raíz:** el recorte de dependencias probablemente buscaba evitar reconstruir la capa en cada
actualización de datos, pero rompió la lectura fresca dentro del handler de clic.

**Corrección:** Implementada en PR #87 usando el índice actualizado dentro del manejador de clic.

---

### BUG-027 — La Bitácora y el Mapa clasifican el mismo boletín de forma distinta

- **Fecha:** 2026-08-09 · **Severidad:** S2 · **Módulo:** M1/M8 · **Responsable:** D4
- **Estado:** Cerrado — corregido en PR #87

**Síntoma:** `PaginaBitacora.tsx` (`estadoDeBoletin`) y `acuacar.ts` (`determinarEstadoBarrios`)
clasifican el mismo texto de boletín en `SIN_SERVICIO`/`CORTE_PROGRAMADO`/`CON_SERVICIO`, pero
difieren en el valor por defecto (`acuacar.ts` cae a `CORTE_PROGRAMADO`, `PaginaBitacora.tsx` cae a
`CON_SERVICIO`) y solo `acuacar.ts` normaliza acentos antes de comparar.

**Reproducción:** un boletín cuyo título no coincide con ninguna palabra clave reconocida se muestra
como "Corte programado" (azul) en Mapa/Estadísticas y como "Con servicio" (verde) en la Bitácora —
para el mismo evento.

**Esperado:** un mismo boletín debe verse igual en cualquier pantalla — es la base de la confianza que
el proyecto vende (`brief.md`).

**Causa raíz:** dos implementaciones independientes de la misma clasificación, sin compartir lógica.

**Corrección:** Implementada en PR #87 al compartir la clasificación de boletines de Acuacar.

---

### BUG-028 — Detección de barrio por GPS no es un point-in-polygon real

- **Fecha:** 2026-08-09 · **Severidad:** S3 · **Módulo:** M2 · **Responsable:** D4
- **Estado:** Cerrado — corregido en PR #87

**Síntoma:** `FormularioReporte.tsx:45` compara la coordenada del usuario contra **el primer vértice**
de cada polígono (`geometry.coordinates[0][0]`) por distancia euclidiana, no contra un
point-in-polygon ni el centroide real.

**Reproducción:** un vecino cerca de un límite entre barrios, o dentro de un polígono grande/irregular
cuyo primer vértice queda lejos de su posición real, puede quedar asignado al barrio equivocado.

**Esperado:** la detección automática de barrio debe usar la geometría completa del polígono, no un
solo vértice arbitrario.

**Causa raíz:** simplificación de la comparación geoespacial sin usar una librería de point-in-polygon.

**Corrección:** Implementada en PR #87 con soporte para Polygon y MultiPolygon GeoJSON.

---

### BUG-029 — Detalles menores encontrados en la misma revisión

- **Fecha:** 2026-08-09 · **Severidad:** S4 · **Módulo:** — (sala de control / M7) · **Responsable:** Equipo / D4
- **Estado:** Cerrado — ítems 1, 2, 4 y 5 corregidos aquí mismo (sala de control); ítem 3 lo cerró
  José Daniel (D4) por su cuenta en el commit `51746ba` ("resolver BUG-017 a BUG-027")

Cinco hallazgos de bajo impacto, agrupados para no saturar el registro con entradas de una línea:

1. **`scripts/dashboard-template.html:380`** — `.narrativa` usa `column-width: 34ch` sin
   `column-count`, así que en el ancho máximo del sitio (1360px) el navegador arma 3-4 columnas en
   vez de las 2 que el PR describe.
2. **`scripts/dashboard-template.html:950`** — el campo `urgente` en bugs queda muerto: el ternario de
   renderizado siempre resuelve a `critica` primero para cualquier bug grave, así que `urgente` nunca
   se lee para esos casos.
3. **`BotonInstalarPWA.tsx:24`** — el listener de `'appinstalled'` no se remueve en el cleanup del
   efecto (a diferencia de `'beforeinstallprompt'`, unas líneas arriba) — fuga de listeners si el
   componente se remonta.
4. **`scripts/dashboard-template.html:988`** — el mensaje de "sin recomendaciones" queda como único
   hijo de una grilla de 2 columnas sin `grid-column: 1/-1`, así que ocupa solo la mitad izquierda en
   vez de todo el ancho cuando la lista está vacía.
5. **`scripts/dashboard-template.html:348`** — `.rec-item` duplica casi al pie de la letra las reglas
   de `.card` en vez de reusarla (que sí se reusa para las tarjetas de "Equipo") — un futuro ajuste al
   token visual de `.card` no se reflejaría en las tarjetas de recomendaciones.

**Corrección (ítems 1, 2, 4, 5 — sala de control):**
1. `.narrativa` agrega `column-count: 2` junto a `column-width: 34ch`, así el navegador nunca arma más
   de 2 columnas sin importar el ancho disponible.
2. Se quitó el campo `urgente: grave` (redundante) del `push` de bugs graves en "Necesita atención" —
   queda solo `critica: grave`, que es el que el ternario de renderizado realmente lee para ese caso.
   `urgente` sigue en uso, sin cambios, para las decisiones (ADR) pendientes.
4. El mensaje de "sin recomendaciones" ahora lleva `style="grid-column:1/-1"` inline, así ocupa el
   ancho completo de la grilla en vez de quedar en la primera celda.
5. `.rec-item` ya no duplica las reglas de `.card` — el HTML generado ahora lleva `class="card rec-item"`
   y se quitaron de `.rec-item` las propiedades que `.card` ya cubre (fondo, borde, radio, sombra,
   padding, `overflow-wrap`).

**Ítem 3 (`BotonInstalarPWA.tsx`) — cerrado por José Daniel (D4), verificado el 2026-08-09:**
`BotonInstalarPWA.tsx` ya tiene `window.removeEventListener('appinstalled', marcarComoInstalada)` en
el cleanup del efecto, junto al `addEventListener` correspondiente — commit `51746ba`.

---

### BUG-015 — Inyección de JSON sin escapar dentro de un `<script>` en la sala de control

- **Fecha:** 2026-08-08 · **Severidad:** S2 · **Módulo:** — (sala de control, `scripts/`) ·
  **Responsable:** Equipo (encontrado al auditar el panel a pedido de Carlos)
- **Estado:** Cerrado — corregido en el acto

**Síntoma:** `generar-dashboard.mjs` construye la página con
`plantilla.replace(marcador, JSON.stringify(datos))`, e inyecta ese texto directo dentro de
`var DATA = /*__DASHBOARD_DATA__*/{};` en un `<script>`. `JSON.stringify` no escapa la secuencia
`</script>` dentro de cadenas de texto.

**Reproducción:**
```
node -e "console.log(JSON.stringify({t:'</script><script>alert(1)</script>'}))"
→ {"t":"</script><script>alert(1)</script>"}
```
`datos` incluye títulos reales de PRs e issues de GitHub (`obtenerPRs`, `obtenerIssuesAbiertos`) y
texto libre de `docs/gestion/*.md` (bugs, ADRs, recomendaciones) — todo escrito por personas, sin
control de formato. Un título o descripción que citara un `<script>` (plausible en un proyecto que
documenta bugs de frontend) habría cerrado el `<script>` de datos a la mitad, rompiendo el resto de
la página, o — en el peor caso — ejecutado contenido inyectado en el navegador de quien la viera.

**Esperado:** que el contenido de `datos` nunca pueda alterar la estructura HTML de la página que lo
muestra, sin importar qué texto contenga.

**Causa raíz:** `JSON.stringify` solo garantiza JSON válido, no que el resultado sea seguro para
incrustar dentro de HTML/`<script>` — es un error conocido y común de la técnica de "inyectar JSON en
un script inline", no específico de este proyecto.

**Corrección:** `generar-dashboard.mjs` — se escapa `<` a `<` en el JSON ya serializado antes de
incrustarlo (`JSON.stringify(datos).replace(/</g, "\\u003c")`), que es indistinguible para
`JSON.parse`/el intérprete de JS pero ya no puede cerrar ninguna etiqueta. Verificado: la sala de
control se regeneró y renderiza igual, sin errores de consola.

---

### BUG-014 — La sala de control mostraba los acentos rotos ("AguaVigÃ­a") en todo el panel

- **Fecha:** 2026-08-08 · **Severidad:** S3 · **Módulo:** — (sala de control, `scripts/`) ·
  **Responsable:** Equipo (encontrado al auditar el panel a pedido de Carlos)
- **Estado:** Cerrado — corregido en el acto

**Síntoma:** todo el texto con tildes, eñes o rayas largas se veía como mojibake —
`AguaVigÃ­a CTG`, `CÃ³mo va el equipo`, `instantÃ¡nea`, `quiÃ©n`, `â€"` en vez de `AguaVigía CTG`,
`Cómo va el equipo`, `instantánea`, `quién`, `—`.

**Reproducción:** consistente, en cualquier navegador — capturado al abrir `dist-dashboard/index.html`
servido localmente.

**Esperado:** que el texto en español se muestre tal cual está escrito en el archivo (que sí está en
UTF-8 — verificado con `readFileSync(..., "utf8")` en el generador).

**Causa raíz:** `scripts/dashboard-template.html` no tenía `<!DOCTYPE html>`, `<html>`, `<head>` ni
`<meta charset="UTF-8">` — empezaba directo en `<title>`. Sin una declaración de codificación
explícita, el navegador tiene que adivinarla, y para un archivo mayormente ASCII con secuencias UTF-8
esparcidas (tildes, eñes), el resultado típico es interpretarlo como Windows-1252/ISO-8859-1: cada
carácter UTF-8 de 2 bytes se muestra como dos caracteres Latin-1 distintos.

**Corrección:** se envolvió la plantilla en un documento HTML5 válido —
`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" ...></head><body>
...</body></html>` — sin tocar el contenido ni el marcador de datos. Verificado: la sala de control
se regeneró y el texto se ve correcto en todas las pestañas (Resumen, Compuertas, Equipo, Progreso,
Sprints, Actividad, Decisiones, Ideas, Recomendaciones).

---

### BUG-013 — Numeración duplicada de `BL-004` y tabla de compuertas desactualizada

- **Fecha:** 2026-08-08 · **Severidad:** S3 · **Módulo:** — (proceso, documentación de gestión) ·
  **Responsable:** Equipo (encontrado y corregido al preparar el cierre del Sprint 0)
- **Estado:** Cerrado — corregido en el acto

**Síntoma:** `registro-de-bloqueos.md` tenía dos entradas `### BL-004` distintas — el bloqueo de D2
(Sprint 0 sin cerrar) y el de los colectores del pipeline M9 (PR #59). Además, la tabla de compuertas
§1 seguía marcando **C2** como 🟡 Parcial, aunque el PR #56 ya la había abierto y el propio comando de
verificación (`git show develop:backend/openapi.yaml`) lo confirmaba.

**Causa raíz:** el PR #59 registró su bloqueo como `BL-004` sin revisar que ese número ya estaba en
uso — mismo patrón que las colisiones de `ADR`/`BUG` de sesiones anteriores, esta vez en bloqueos. La
tabla de compuertas quedó desactualizada porque quien fusionó el PR #56 no la marcó en el mismo PR,
como pide la regla de la propia tabla ("quien abre una compuerta la marca aquí").

**Corrección:** el bloqueo de los colectores se renumeró a `BL-006` (siguiente número libre), con nota
de la colisión. Se actualizaron las referencias cruzadas en `bitacora-sesiones.md` y
`registro-de-implementaciones.md`. La tabla de compuertas se corrigió a `🟢 Abierta — PR #56 fusionado`.

---

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
- **Estado:** Cerrado — corregido el 2026-08-08 conectando M1 a C2 real y gestionando estado null.

**Síntoma:** `frontend/src/components/MapaCartagena.tsx:92` hace
`const estado: EstadoServicio = sector?.estado ?? 'CON_SERVICIO'`. Todo barrio sin dato se dibuja con
el color de servicio normal. Con los datos reales esto no es un caso raro: **son 211 de 211 los
sectores sin estado registrado** hasta que M3 (consenso) empiece a escribirlos en el Sprint 2.

**Reproducción:** consistente. Con el backend sirviendo datos reales, `GET /api/sectores` devuelve
`"estado": null` en los 211 sectores; el mapa los muestra todos en verde.

**Corrección:** Se modificó `tipos-dominio.ts` para aceptar `estado` null, se introdujo `COLOR_SIN_DATOS` y el mapa y la lista de sectores ahora presentan los sectores sin datos usando un color neutral. Además, `useDatosEnVivo.ts` consume directamente la lista real.

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
**Verificado el 2026-08-08, novena ocurrencia:** el PR
[#61](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/61) (configuración de caché sobre
Redis, D3) se fusionó también con `reviews: []` — el sexto y último de los PRs de esta sesión
(corrección sobre la nota de la octava ocurrencia, que contó cinco: en realidad fueron seis, #56 a
#61). Esta vez no apareció ningún bug de integración nuevo: `CacheConfig` no implementa
`WebMvcConfigurer`, así que no repitió el patrón de `BUG-011`/`BUG-012`. Seis PRs, nueve ocurrencias
de `BUG-005` en una sola sesión de trabajo — la corrección pendiente sigue siendo la misma: un hábito
de equipo, no algo que la revisión del agente pueda sustituir de forma permanente.
**Verificado el 2026-08-09, décima ocurrencia:** el PR
[#97](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/97) (Sala de control: qué falta, quién
está atrasado y por qué) se fusionó también con `reviews: []`. Fusión con autonomía de IA acordada
explícitamente con el usuario para actuar como revisor/release manager: la decisión de no esperar un
segundo humano fue deliberada, no un descuido — pero la revisión humana de respaldo que exige esta
misma sección sigue pendiente y queda anotada en el propio PR.
**Verificado el 2026-08-09, undécima ocurrencia:** el PR
[#105](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/105) (estabilización de la integración
frontend-backend, hardening de estados) se fusionó también con `reviews: []` y sin issue enlazado
(`closingIssuesReferences: []`), fusionado por Yordy (D5) mientras `develop` avanzaba en paralelo con
varios PRs y commits de estilo — la sesión incluyó tres fusiones sucesivas de `develop` dentro de la
misma rama para resolver conflictos de color, y terminó fusionándose sin que quedara registrada una
revisión de un segundo integrante. Dejó además una recurrencia de `BUG-040` (ver esa entrada) que una
revisión humana adicional probablemente habría detectado antes de fusionar.
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

## Nota sobre BUG-030

**Síntoma:** el comando literal de C0 (`docker compose config -q && ls backend frontend`) pasaba en
verde en la máquina de D5 sin haber levantado nunca un contenedor real, porque solo tenía instalado el
**cliente** de Docker (Homebrew), sin ningún motor (ni Docker Desktop, ni colima, ni podman).
`docker compose config -q` únicamente valida sintaxis YAML; no habla con un daemon. Documentado como
salvedad al cerrar el Sprint 0 (PR #73, `sprint-0.md` nota 1), con la corrección prometida como primera
acción del Sprint 1.

**Cómo se encontró:** al reverificar C0 de verdad para el Sprint 1, `./mvnw clean verify` daba 60
pruebas en verde y 6 errores de Testcontainers (`CacheConfigTest`, `RateLimitConfigTest`,
`DeduplicadorRecienteTest`, `SectorMongoAdapterTest`, `RedisContadorReportesAdapterTest`,
`RateLimitingInterceptorTest`), todos `Could not find a valid Docker environment`.

**Causa raíz:** ausencia de motor de contenedores en la máquina de D5. Una vez instalado, aparecieron
dos causas raíz adicionales, específicas de Colima en macOS: (1) Testcontainers no lee el contexto
`colima` de Docker por defecto — necesita `DOCKER_HOST` explícito; (2) el contenedor Ryuk (el reaper de
Testcontainers) intenta bind-montar el socket de Docker usando la ruta **tal como se ve desde macOS**
(`~/.colima/default/docker.sock`), pero el daemon real corre dentro de la VM de Colima, donde esa ruta
no existe — falla con `mkdir ... operation not supported`.

**Corrección:** `brew install colima && colima start`, más dos variables de entorno exportadas antes de
correr Maven o Docker Compose: `DOCKER_HOST=unix://$HOME/.colima/default/docker.sock` (para que el
cliente Docker y Testcontainers encuentren el daemon) y `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock`
(la ruta del socket *dentro* de la VM, para que Ryuk monte el archivo correcto). Con ambas, `docker
compose up -d` levanta los 5 servicios reales y `./mvnw clean verify` corre las 79 pruebas —incluyendo
Testcontainers— en verde. El comando de la compuerta C0 se actualizó en
`docs/equipo/secuencia-de-trabajo.md` §2 y `docs/gestion/registro-de-bloqueos.md` §2 para que ya no se
pueda declarar en verde sin un motor real corriendo.
**Prueba que impide la regresión:** ninguna automatizada — es una condición de la máquina local, no del
código. Mitigación: el comando de C0 ahora exige `docker compose up -d --wait`, que falla explícitamente
si no hay daemon, en vez de degradarse en silencio a validar solo YAML.

---

### BUG-041 — El token de confirmación de suscripción nunca vencía, pese a que el correo lo promete

- **Fecha:** 2026-08-09 · **Severidad:** S2 · **Módulo:** M4 · **Responsable:** D1/D5
- **Estado:** Cerrado

**Síntoma:** `confirmar-suscripcion.html:89` le dice al vecino *"El enlace vence en {{horasVigencia}}
horas"* (`MailNotificacionAdapter` rellena esa variable con `aguavigia.suscripcion.horas-vigencia-token`,
48 por defecto). Pero `ConfirmarSuscripcionService`, ya fusionado a `develop`, nunca comparaba la fecha
de creación de la suscripción contra ese plazo: un enlace de confirmación seguía funcionando
indefinidamente. Tampoco había índice único sobre `tokenConfirmacion` en `SuscripcionDocumento`
— cada búsqueda por token escaneaba toda la colección, sin garantía de unicidad a nivel de base de datos.

**Cómo se encontró:** el PR #110 (Rafael Sarmiento, D1, titular real de M4) implementó de forma
independiente `ConfirmarSuscripcionService`/`CancelarSuscripcionService` — sin saber que Yordy (D5) ya
había escrito y fusionado una versión propia a `develop` directamente en la capa de D1, como parte del
mismo patrón de avance cruzado autorizado en sesiones anteriores. Las dos versiones chocan en un
conflicto *add/add* en git: mismos archivos, implementaciones distintas. Comparando ambas surgió que
la versión de Yordy en `develop` no aplicaba el vencimiento — el propio Javadoc del controlador en
`develop` documenta la omisión como decisión consciente ("el token es de un solo enlace, no de un solo
uso"), pero no contempla que el correo sí promete una fecha límite.

**Esperado:** que el sistema cumpla lo que el propio correo le afirma al vecino — coherente con
`ADR-006` ("no afirmar lo que no se puede sostener").

**Causa raíz:** dos personas implementaron el mismo requisito (RF013/RF015) sin coordinarse, con
lecturas distintas del alcance. Ninguna de las dos es "la equivocada" en el diseño general — pero la
promesa concreta del correo (una fecha de vencimiento) sí quedó sin cumplir en la versión que llegó a
`develop`.

**Corrección:** no se fusionó el PR #110 completo (ya redundante con lo que hay en `develop`). Se portó
el chequeo de vencimiento y el índice único de Mongo al código ya existente:
`ConfirmarSuscripcionService` ahora recibe `RelojPort` y `horas-vigencia-token`, y rechaza con 400 un
token vencido; `SuscripcionDocumento.tokenConfirmacion` lleva `@Indexed(unique = true)`.
`ConfirmarSuscripcionServiceTest` suma los casos de token vencido y de token válido justo antes de
vencer. El PR #110 se cerró dando crédito a Rafael por el hallazgo, sin fusionar su código duplicado.
Verificado: `./mvnw clean verify` → 152 pruebas, 0 fallos, ArchUnit incluido.

**Pendiente de decisión del equipo, no resuelto aquí:** si confirmar un token ya `CONFIRMADA` debe
seguir siendo idempotente (como quedó en `develop`) o debe rechazarse como "de un solo uso" (como
proponía el PR #110) — es una decisión de producto de D1, no algo que este bug decida por su cuenta.

---

### BUG-031 — `leerDetalleSprint` tumbaba el generador con una tabla de Compromisos sin columna Estado

- **Fecha:** 2026-08-09 · **Severidad:** S2 · **Módulo:** — (sala de control) · **Responsable:** Equipo (sala de control)
- **Estado:** Cerrado

**Síntoma:** `node scripts/generar-dashboard.mjs` fallaba con `TypeError: Cannot read properties of
undefined (reading 'startsWith')` en `scripts/lib/datos-proyecto.mjs:190`.

**Reproducción:** consistente, en cuanto existió `docs/gestion/sprint-1.md`. Su tabla de "Compromisos"
tiene 4 columnas (`Resp. | RF/RNF | Entregable | Depende de`), sin la quinta columna `Estado` que sí
tiene `sprint-0.md` — correcto para un sprint en planificación pura, donde todavía no hay nada que
reportar como hecho o parcial.

**Esperado:** que el generador soporte una tabla de Compromisos sin columna `Estado`, tratando cada
fila como `pendiente` por defecto.

**Causa raíz:** `leerDetalleSprint` desestructuraba un quinto elemento (`estadoRaw`) de un arreglo que,
en una tabla de 4 columnas, solo tiene 4 posiciones — `estadoRaw` llegaba `undefined` y el `.startsWith`
sobre `undefined` tumbaba todo el script.

**Corrección:** `scripts/lib/datos-proyecto.mjs` — `estadoRaw` ahora se lee como `cols[4] || ""` en vez
de por desestructuración posicional; una cadena vacía cae naturalmente en la rama `"pendiente"` del
mismo ternario que ya existía, sin necesitar una rama especial.
**Prueba:** `node scripts/generar-dashboard.mjs` corre limpio con `sprint-0.md` (5 columnas) y
`sprint-1.md` (4 columnas) presentes a la vez.

---

## Nota sobre BUG-032

**Síntoma, reproducción y causa raíz:** ver el hallazgo completo — encontrado por otra sesión
(identidad `Jordy-Lv`) mientras revisaba el PR #84 recién fusionado: `RegistrarReporteService` traía
un comentario de clase que decía que RF006 (límite de reportes por dispositivo) estaba cubierto por
el rate limiting HTTP genérico, y no era cierto en ninguna de sus dos partes — ni `ContadorReportesPort`
deduplica por huella (a propósito, es para el consenso), ni `RateLimitingInterceptor` usa huella
(usa IP, `ADR-018`, decisión deliberada para un problema distinto), ni siquiera ese interceptor tenía
una regla activa para `/api/reportes`.

**Corrección:** `RegistrarReporteService.java` — antes de guardar, cuenta los reportes recientes del
mismo sector vía `ReporteCiudadanoRepository.listarRecientesPorSector` filtrados por
`HuellaDispositivo`, y rechaza con `LimiteReportesExcedidoException` (nueva, `domain/`) si iguala o
supera un límite configurable (`aguavigia.reportes.limite-por-dispositivo`, default 3, ventana
`aguavigia.reportes.ventana-limite-minutos`, default 30). `ManejadorGlobalDeErrores` la traduce a
`429 Too Many Requests` en RFC 7807. No se tocó `ContadorReportesPort` ni `RateLimitingInterceptor`
— siguen haciendo exactamente lo que ya hacían bien.
**Prueba que impide la regresión:** `RegistrarReporteServiceTest` —
`debeRechazarElReporteCuandoElDispositivoAlcanzaElLimite` y
`noDebeContarReportesDeOtroDispositivoParaElLimite`. 103/103 pruebas del backend en verde
(`./mvnw clean verify`, Testcontainers real).

---

## Nota sobre BUG-033

**Síntoma:** `ListaSectores.tsx` (alternativa textual accesible al mapa, RF004) mostraba junto al
nombre de cada sector un badge *"N reportes ciudadanos"*, con `N` calculado por
`obtenerReportesMock(sector)` — una fórmula (`sector.id * 4 + 7` para la mayoría de estados) sin
relación con ningún dato real. A diferencia de `SECTORES_MOCK`/`MOCK_EVENTOS` (`DT-001`–`DT-005`,
que solo aparecían si la API fallaba), este badge se mostraba **siempre**, con datos reales o no.

**Cómo se encontró:** al revisar todo el árbol de componentes que consume `Sector[]` mientras se
retiraban `SECTORES_MOCK`/`MOCK_EVENTOS` (Sprint 1), apareció esta segunda fuente de datos inventados
que ninguna de las cinco `DT` mencionaba.

**Causa raíz:** dato de diseño (placeholder visual) que nunca se conectó a una fuente real ni se
marcó como pendiente — no existe todavía un endpoint que exponga el conteo de reportes por sector
(eso sería `EvaluarConsensoUseCase`, RF009-RF011, sin implementar).

**Por qué es S1:** `CLAUDE.md`, ética de datos punto 4, y la regla especial de este documento — un
número de reportes inventado en la lista pública, sin distinguirlo del real, es el "corte inventado"
que la regla prohíbe sin excepción.

**Corrección:** se retiró `obtenerReportesMock` y el badge que lo consumía. No se reemplaza por una
llamada a un endpoint que no existe — "sin dato" es preferible a inventarlo (`ADR-014`). Se repone
cuando exista una fuente real de conteo de reportes por sector.
**Prueba que impide la regresión:** ninguna automatizada nueva — es ausencia de código. Mitigación:
`npm run build` y `npm test` (12/12 en verde) verifican que no queda ninguna referencia a
`obtenerReportesMock` en el árbol compilado.

---

### BUG-039 — CI del PR #105 fallaba en "Verificar cliente OpenAPI"

- **Fecha:** 2026-08-09 · **Severidad:** S2 · **Módulo:** — (CI/integración) · **Responsable:** Equipo (fusión)
- **Estado:** Cerrado — corregido en el acto

**Síntoma:** el job `Lint, tests y build` del PR #105 (`codex/frontend-hardening`) fallaba en el paso
`npm run api:check`, con `git diff --exit-code -- src/api/generated/schema.ts` detectando drift:
`openapi-typescript` regeneraba el cliente y agregaba `/api/reportes` y `CoordenadaDTO`, que el
`schema.ts` comiteado no tenía.

**Reproducción:** `develop` avanzó con el PR #104 (`feat(D3): POST /api/reportes`, commit `e42a8ec`)
**después** del último merge de esta rama con `develop` (commit `df59f7c`). GitHub Actions ejecuta el
`pull_request` trigger sobre el merge automático entre el head del PR y el `develop` **actual**, así
que `backend/openapi.yaml` en CI ya traía el endpoint nuevo aunque la rama del PR, en su propio
`HEAD`, todavía no.

**Esperado:** que `schema.ts` refleje siempre el contrato vigente de `backend/openapi.yaml` en la rama
que se va a fusionar.

**Causa raíz:** divergencia por rama larga sin sincronizar — mismo patrón que `BUG-006`/`BUG-011`/
`BUG-012`: el defecto solo existe en la intersección de dos ramas que avanzaron en paralelo, no en
ninguna de las dos por separado.

**Corrección:** se fusionó `origin/develop` en `codex/frontend-hardening` (merge limpio, sin
conflictos — los componentes que esta rama había retirado deliberadamente, como
`FormularioReporte.tsx`, no fueron tocados por `develop`) y se regeneró `schema.ts` con
`npm run api:sync`. Verificado: `npm run lint`, `npm run test -- --run` (23/23), `npm run build` y
`npm run api:check` en verde localmente; `./mvnw -o clean compile` del backend también en verde tras
el merge. Confirmado en CI real tras el push: los 3 checks del PR #105 pasan
(run [31298506722](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/actions/runs/31298506722)).

---

### BUG-040 — Tokens de color del tema duplicados en `index.css`: el primer bloque es letra muerta

- **Fecha:** 2026-08-09 · **Severidad:** S3 · **Módulo:** M7 · **Responsable:** D5 (Yordy)
- **Estado:** Cerrado — la segunda vez, se eliminó la duplicación en vez de resincronizarla

**Síntoma:** `frontend/src/index.css` declara `--color-acento` y el resto de tokens de tema dos veces:
una vez cerca del inicio del archivo (`:root`, `:root[data-theme="dark"]`,
`@media (prefers-color-scheme: dark)`) y otra vez, con los mismos valores, bajo el comentario
`REDISEÑO AGUAVIGÍA — experiencia cívica, cálida y responsive` (antes de esta corrección, ~línea 640).
Por especificidad y orden de cascada CSS, el segundo bloque siempre gana: editar el primero no cambia
nada en pantalla.

**Reproducción:** al resolver el conflicto de merge de `frontend/src/index.css` entre esta rama y
`develop` (commit `8933c04`, "restaurar color de acento turquesa azulado preferido"), actualizar solo
el primer bloque de tokens seguía dejando `#0A6C78` (petróleo) en el CSS compilado —
`dist/assets/index-*.css` no mostraba ningún `#087f8c` hasta corregir también el segundo bloque.

**Esperado:** un único lugar declara cada token de color; nadie debería poder editar un color del
tema sin que el cambio se vea.

**Causa raíz:** el segundo bloque (`REDISEÑO AGUAVIGÍA`) no existe en `develop` — es propio de esta
rama, probablemente una sección añadida en un rediseño posterior que re-declaró los mismos custom
properties en vez de reutilizar el primer bloque.

**Corrección:** se sincronizaron los tres sub-bloques del `REDISEÑO AGUAVIGÍA`
(`:root`, `:root[data-theme="dark"]`, `@media (prefers-color-scheme: dark)`) con la misma paleta
turquesa del bloque de arriba. Verificado: `dist/assets/index-*.css` contiene `#087f8c`/`#54c6ca` y
cero ocurrencias de `#0A6C78`/`#45BFCB` tras `npm run build`. **Pendiente para el equipo:** unificar
ambos bloques en uno solo (eliminar la duplicación) — no se hizo aquí para no ampliar el alcance del
merge del PR #105.

**Reincidencia (verificada en `develop`, post-merge del PR #105):** los commits `527fe5c` ("ajustar
fondo del modo oscuro a un azul caribeño profundo") y `0528389` ("arreglar selectores manuales de
tema para la paleta caribeña") actualizaron el bloque de arriba pero no el bloque `REDISEÑO
AGUAVIGÍA`, que sigue ganando por orden de cascada. Confirmado con `grep`/lectura directa de
`frontend/src/index.css` en `develop`: el modo oscuro (sistema y manual) renderiza
`--color-fondo: #071f26` / `--color-superficie: #102f36` (paleta vieja, bloque `REDISEÑO`) en vez de
`#002436` / `#063b52` (paleta "caribeña" nueva, bloque de arriba). El modo claro sí quedó consistente
entre ambos bloques. Se detectaron dos inconsistencias más de la misma familia mientras se diagnosticaba
esta: `--glass-r/g/b` duplicado en el bloque `REDISEÑO` (`16,47,54`) contra el bloque canónico dedicado
de glassmorphism (`28,28,30`), y `--color-marino` con un valor distinto en cada bloque para modo oscuro
manual (`#061b22` vs `#001824`) — ambos solo se manifestaban con el interruptor manual de tema, no con
la preferencia del sistema.

**Corrección definitiva (PR de seguimiento, rama `fix/unificar-tokens-color-index-css`):** se eliminó
la duplicación en la raíz, no se volvió a resincronizar. El bloque `REDISEÑO AGUAVIGÍA` ya no declara
ningún token de color de tema (`--color-acento*`, `--color-tinta*`, `--color-linea`,
`--color-superficie`, `--color-fondo`, `--color-marino`, `--color-estado-*`) ni `--glass-r/g/b` —
esos viven ahora en un único lugar cada uno. Lo único que conserva el bloque `REDISEÑO` es lo que le
es propio y no se duplica en ningún otro sitio: `--color-coral`/`--color-coral-oscuro`, tipografía,
radios y sombras. Verificado: `dist/assets/index-*.css` tiene exactamente un valor por token de color
en cada uno de los 4 contextos (claro/oscuro × sistema/manual) —
`grep -c` sobre el CSS compilado confirma 2 ocurrencias por color (una por regla de especificidad
`:root`/`:root[data-theme]`, cero por duplicación) en vez de las 2+2 con valores distintos de antes.
`npm run lint`, `npm run test -- --run` (23/23), `npm run build` y `npm run api:check` en verde.
**Nota para el equipo:** si se vuelve a necesitar una sección de "rediseño" con sus propios tokens,
que reutilice los del bloque de arriba (`var(--color-acento)`, etc.) en vez de redeclararlos — este
bug ya reincidió una vez por hacerlo así.

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

Siguiente número disponible: BUG-041
-->
