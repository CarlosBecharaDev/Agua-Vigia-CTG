# Sprint 1 — Mapa base y dominio core

**Abierto:** 2026-08-08 · **Cerrado:** 2026-08-09 — el mapa consume `GET /api/sectores` real, sin
un solo dato de demostración en el código (`DT-001`–`DT-005` cerradas, verificado contra el código,
no contra el registro) · **Scrum Master del sprint:** Yordy Pardo Pajaro (D5) — siguió por
continuidad operativa aunque D1 pasó a Rafael Sarmiento Peña a mitad de sprint (`ADR-021`)

> **Este sprint abre con la mayor parte de su alcance ya entregada.** No es un error de planificación:
> es la consecuencia de que el Sprint 0 tardara tres días en cerrar formalmente mientras el equipo
> seguía trabajando. La hoja de ruta (`../equipo/secuencia-de-trabajo.md` §4) asignaba cinco frentes
> al Sprint 1 y cuatro ya están en `develop`. El planning honesto no es fingir que empiezan hoy, sino
> **decir qué queda y qué hay que limpiar**.

---

## 1. Objetivo del sprint

**Que un vecino de Cartagena abra el mapa y vea el estado real de su sector, servido por la API y sin
un solo dato de demostración en el camino.**

Hoy el mapa ya consume la API real y, cuando algo falla, cae a datos simulados **avisándolo en
pantalla**: `PaginaMapa.tsx:55-66` muestra "Sin conexión · Simulación" o "Acuacar inactivo ·
Simulación", y `PaginaBitacora.tsx:153-183` hace lo propio en rojo. Esa señalización es correcta y
respeta la ética de datos del proyecto (`CLAUDE.md`, punto 4): el mapa no afirma como verificado lo
que no lo es.

Lo que queda es retirar los datos simulados en sí. `DT-001`–`DT-005` **caducan al cerrar este
sprint** (`registro-de-bloqueos.md` §4), y ya no hay motivo para conservarlos: C2 y C3 están
abiertas. Un modo demo que sobrevive a la compuerta que lo justificaba deja de ser un andamio y pasa
a ser código muerto que alguien confundirá con producción.

---

## 2. Compromisos

| Resp. | RF/RNF | Entregable | Depende de |
|---|---|---|---|
| D1 (Yordy) | RF012–RF014 | ✅ Entregado — `POST /api/suscripciones` con DTOs y envío de correo asíncrono (`@Async` + `JavaMailSender`) contra Mailhog, probado extremo a extremo contra Mailhog real | C1 ✅ · plantillas HTML ya listas, sin fusionar · [PR #78](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/78) |
| D1 (Rafael) | — | Capítulo I del informe ✅ (PR #82) · **Capítulo II (marco referencial) ✅ — PR con `docs/capitulo-2-informe`** · validación de la plantilla oficial de Comfenalco | — *(no depende de nadie; heredado de Yordy como D1 interino, `ADR-021`)* |
| D4 | RF001–RF004 | ✅ Entregado — datos de demostración retirados de `useDatosEnVivo.ts`, `PaginaVeedor.tsx` y `PaginaBitacora.tsx` (commits, [PR #85](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/85)); `BUG-033` (S1, `ListaSectores.tsx`) encontrado y cerrado por D5 (Yordy) en capa de D4, decisión explícita | C2 ✅ · C3 ✅ |
| D2 | RF005–RF007 | ✅ Entregado — `RegistrarReporteService` en `application/`, primer caso de uso real del proyecto. Escrito y fusionado por D5 (Yordy) directo, por decisión explícita — no pasó por revisión de Carlos. `BUG-032` (RF006 no cubierto pese al comentario) encontrado por otra sesión y cerrado en el mismo frente | C1 ✅ · Review del Sprint 0 ✅ · [PR #84](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/84) |
| D5 (Yordy) | RNF | ✅ Entregado — motor de contenedores instalado, **C0 reverificada levantando el entorno de verdad**, comando de verificación corregido (`docker compose up -d --wait && ./mvnw clean verify`) | — *(no depende de nadie)* · [PR #74](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/74) |
| D3 | RF029–RF031, RF036 | ✅ Entregado, más allá de lo comprometido — `AcuacarApiCollector` y `RssCollector` (M9), desbloqueados por el cierre de `BL-006`. La capa de IA (RF032–RF035) sigue bloqueada por `BL-005` | `BL-006` ✅ cerrado · [PR #98](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/98) |

La columna **Depende de** es la importante: es donde se ven los bloqueos antes de que ocurran.
Cadena de dependencias y compuertas: [`../equipo/secuencia-de-trabajo.md`](../equipo/secuencia-de-trabajo.md) §1 y §2.

### Ya entregado antes de abrir el sprint

| Frente | Quién | Dónde | Estado |
|---|---|---|---|
| Script de siembra del GeoJSON en Mongo | D5 | PR #13 | ✅ 211 sectores |
| Entidades, VOs, puertos y ArchUnit | D2 | PR #21 | ✅ Abre C1 |
| Adaptador Mongo, `GET /api/sectores`, OpenAPI | D3 | PR #56 | ✅ Abre C2 |
| Mapa Leaflet y lista accesible, integrados contra la API real | D4 | PRs #12, #67 | ✅ Abre C3 |

**Cuatro de los cinco frentes del sprint ya están cerrados.** Lo que queda es la parte de D1 (nunca
empezada, porque el rol estuvo vacante hasta el 2026-08-08) y la limpieza de los datos simulados.

---

## 3. Bloqueos del sprint — resumen

| ID | Compuerta | Quién quedó detenido | Días | Cómo se resolvió |
|---|---|---|---|---|
| BL-004 | — | D2 | 3 | Cerrado 2026-08-08 con el Review del Sprint 0 (`sprint-0.md` §4) |
| BL-005 | — | D3 | — | Abierto — falta `ANTHROPIC_API_KEY` |
| BL-006 | — | D3 | 0 | Cerrado 2026-08-08 — D1 confirmó el correo `rafasarmiento777@gmail.com` en `.env.example` |

---

## 4. Review — qué se demostró funcionando

| RF/RNF | Qué se demostró | ¿Aceptado? |
|---|---|---|
| RF001–RF004 | Mapa y lista accesible consumiendo `GET /api/sectores` real; `SECTORES_MOCK`/`MOCK_EVENTOS` retirados de todo el árbol de frontend, verificado leyendo el código, no el registro | ✅ |
| RF012, RF013 (parcial) | `POST /api/suscripciones` → 201 → correo de doble opt-in recibido en Mailhog real, con asunto, sector y token correctos. Confirmación del token (`GET /api/suscripciones/confirmar`) y baja en 1 clic (RF015) no se hicieron — quedan para Sprint 2, tal como estaba planeado | 🟡 Parcial |
| RF005–RF008 (parcial) | `RegistrarReporteService` real en `application/`, con RF006 funcionando (límite de reportes por dispositivo, `429` vía `LimiteReportesExcedidoException`). Sin `POST /api/reportes`: la API queda cerrada a propósito hasta Sprint 2 (`registro-de-bloqueos.md` §1, alcance de C2) | 🟡 Parcial |
| RF029–RF031, RF036 | `AcuacarApiCollector` y `RssCollector` reales (M9), sobre la deduplicación y el prefiltro que ya existían. RF032–RF035 (clasificación con IA) siguen bloqueados por `BL-005` | ✅ |
| RNF010, RNF011, RNF017, RNF018, RNF020 | Verificados contra el código: `gitleaks` activo en CI, JWT expira a las 8h exactas, cobertura `domain/` 74,3% y `application/` 100% (≥70% exigido), `ArchUnit` falla la build ante una violación real, `docker compose up -d --wait` levanta los 5 servicios y pasa el build completo con Testcontainers | ✅ |

**Comprometido:** 6 frentes (uno por rol) · **Entregado:** 6/6, dos con alcance reducido a propósito
(M2 y M4 completos solo hasta donde `registro-de-bloqueos.md` autorizaba avanzar sin cruzar C2/Sprint 2)
· **Arrastrado al Sprint 2:** `POST /api/reportes`, confirmación de suscripción + baja en 1 clic,
`EvaluarConsensoUseCase` (M3), capa de IA de M9 (bloqueada por `BL-005`, sigue sin resolverse).

---

## 5. Métricas del sprint

| Métrica | Valor |
|---|---|
| Requisitos entregados / comprometidos | 6/6 frentes comprometidos entregados; 10/36 RF funcionales de punta a punta (28%, `registro-de-implementaciones.md` § Estado de cobertura) |
| PRs fusionados | 25 durante el sprint (#74–#99, uno cerrado sin fusionar por choque con trabajo paralelo) |
| PRs fusionados **sin revisor registrado** | 74 de 89 acumulados — **83%** *(al abrir: 47 de 61 — 77%. El patrón empeoró 6 puntos en el sprint, `BUG-005` sigue abierto)* |
| Bugs abiertos / cerrados | 11 abiertos / 21 cerrados (33 registrados en total, `BUG-034` es el siguiente número) |
| Cobertura `domain/` + `application/` | `domain/` 74,3% · `application/` 100% — ambas superan el 70% que exige `RNF017` *(al abrir: `application/` solo tenía `package-info.java`, 0%)* |
| Build en verde al cierre | ✅ Sí — backend 110/110 pruebas (Testcontainers real, Colima), ArchUnit incluido · frontend `npm run build` y `npm test` (12/12) en verde |

---

## 6. Retrospectiva

**Qué funcionó**

1. Desbloquear directo un frente atrasado de otro rol, con autorización explícita y nota de autoría
   en cada PR, evitó que `application/` y el retiro de mocks se quedaran esperando — dos casos de uso
   reales y RF006 real salieron el mismo día en que se identificó el atraso.
2. Verificar contra el código en vez de contra el registro encontró trabajo ya hecho que la
   documentación no reflejaba (`DT-002`/`DT-004` ya resueltos sin actualizar la tabla) y trabajo
   declarado que no existía (el javadoc de `RegistrarReporteService` decía que RF006 estaba cubierto;
   no lo estaba).
3. Testcontainers real (Colima, `BUG-030`) hizo que el build local coincidiera con el de CI —
   ninguna sorpresa al fusionar en todo el sprint.

**Qué no funcionó**

1. Varios agentes trabajando en el mismo repositorio sin coordinarse entre sí produjeron trabajo
   duplicado real: el retiro de mocks del frontend se hizo dos veces (PR #85 y el PR #86, cerrado sin
   fusionar por el choque) y casi colisionó la numeración de `BUG-032`.
2. El patrón de fusionar sin revisor **empeoró** en vez de mejorar (77% → 83%) pese a estar señalado
   como `BUG-005` desde el Sprint 0 — señalarlo no alcanza si no cuesta nada ignorarlo.
3. La tabla "Estado de cobertura de requisitos" llevaba dos sprints en 0% sin que nadie la llenara:
   un dato que existía en el código pero no en el registro no contaba como avance para nadie que
   mirara la Sala de control.

**Acciones para el próximo sprint**

| Acción | Resp. | Para cuándo |
|---|---|---|
| Revisar issues/PRs recientes del rol antes de tomar una tarea que no es propia, para evitar trabajo duplicado entre agentes/personas | Quien tome la tarea | Desde ya, Sprint 2 |
| Actualizar "Estado de cobertura de requisitos" en cada review de sprint, no solo cuando alguien se acuerda | Scrum Master del sprint | Cada cierre de sprint |
| Decidir un mecanismo real contra `BUG-005` (bloqueo de merge sin revisor, rotación obligatoria, o aceptar el riesgo por escrito) — señalarlo ya no es información nueva | Equipo completo | Planning del Sprint 2 |
