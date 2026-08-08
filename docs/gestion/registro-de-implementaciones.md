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
| — | infra | Dockerfile multi-etapa del backend (Spring Boot), activado como servicio en `docker-compose.yml` | D5 | [#27](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/27) | `docker compose build backend` |
| — | infra | Dockerfile multi-etapa del frontend (React Vite → Nginx), cobertura de código JaCoCo integrada al Backend CI, perfiles de Spring (`dev`/`docker`/`prod`) y endpoint `/actuator/health` expuesto | D5 | [#33](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/33) | 3 checks en verde en CI: Backend CI (compilar, ArchUnit, tests), Frontend CI (lint, tests, build) y Escaneo de secretos (gitleaks) |

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
