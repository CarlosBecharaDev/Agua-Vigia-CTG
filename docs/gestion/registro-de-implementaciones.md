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

⚠️ **El PR #12 introdujo datos simulados sin desbloqueo temporal registrado.** `SECTORES_MOCK`
sustituye a `GET /api/sectores`, que no existe porque C2 está cerrada. La regla del proyecto
(`secuencia-de-trabajo.md` §5) permite exactamente esto, pero **solo** con autorización escrita del
titular de la compuerta, caducidad e issue de reconciliación. Registrado como pendiente de regularizar
en `registro-de-bloqueos.md` §4. No cuenta como RF001/RF004 implementados hasta que consuma la API
real; la tabla de cobertura sigue en 0%.

**El PR #21 lleva `andamio`, no `func`:** define contratos (interfaces `port/in`) y entidades, pero
ningún caso de uso está implementado todavía — eso es Sprint 2 en `docs/equipo/D2-backend-dominio.md`.
La cobertura de requisitos sigue en 0% hasta que exista una implementación real detrás de un `port/in`.

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
| RF023, RF024 | andamio | M7: `PaginaEstadisticas` — gráficos de Índice de Cumplimiento y sectores afectados (ECharts), botón de exportación | D4 | [#20](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/20) | `tsc --noEmit` en verde · ⚠️ mock regularizado (`DT-004`, autorizado por D5 según confirma D3) |
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
