# Plan de pruebas — borrador del Anexo 5

> **Titular:** D5 (Yordy Pardo Pajaro). **Estado: PLAN, no informe.** El Anexo 5 real
> ("Plan e informe de pruebas") es entregable de Sprint 5→6 (`docs/anexos/README.md`) y **su parte de
> resultados sale del registro, no de la memoria**: se construye desde `registro-de-bugs.md` y
> `registro-de-implementaciones.md` cuando existan. Escribir esa parte ahora sería inventar datos —
> exactamente lo que el Anexo 3 prohíbe para el Alfa de Cronbach, y la misma regla aplica aquí.
>
> Este documento es la **estrategia**, adelantada en Sprint 0 mientras no hay código de aplicación
> (mismo patrón que `modelo-de-dominio.md` de D2). Cuando exista el código y los primeros resultados,
> este archivo se traduce al Anexo 5 formal — con la numeración que confirme D1 tras validar la
> plantilla oficial (`docs/anexos/README.md` §⚠️).

---

## 1. Principio rector

**Ningún resultado se declara sin la prueba que lo sostiene.** Un "probado manualmente" no cuenta
(`docs/gestion/protocolo-de-contexto.md`, cultura del proyecto). Cada fila de la matriz de abajo tiene
un `RNF` verificable con métrica y umbral — no hay pruebas "porque sí".

---

## 2. Matriz de pruebas por tipo — trazada a `product-requirements.md`

| Tipo de prueba | RNF que verifica | Herramienta | Cuándo se ejecuta | Sprint en que se implementa |
|---|---|---|---|---|
| Unitarias `domain/` · `application/` | RNF017 (cobertura ≥ 70%) | JUnit 5 + JaCoCo | En cada PR, CI | 1 (base) → 5 (umbral exigido) |
| Arquitectura | RNF018 (falla si se viola una capa) | ArchUnit | En cada PR, CI | 1 |
| Integración backend ↔ datos | — (soporta RNF017) | Testcontainers (Mongo, Redis reales) | En cada PR, CI | 2 |
| Rendimiento del mapa | RNF001 (< 3 s en 3G simulada) | Lighthouse + throttling | Antes de cada release | 4 (ajustes 3G) |
| Rendimiento de escritura | RNF002 (confirmación < 1 s) | Prueba de carga (k6 o similar, por decidir) | Antes de cada release | 2 |
| Caché | RNF003 (TTL ≤ 60 s) | Inspección de cabeceras HTTP / Redis | Manual + smoke test en CI | 2 |
| Caos — caída de fuente externa | RNF004, RNF005, RNF006 | Apagar el colector en `docker compose`, observar cortacircuitos y cola muerta | Sprint 4, repetible | 4 |
| Salud de colectores | RNF007 | `GET /actuator/health` | Smoke test en CI | 4 |
| Datos personales | RNF008, RNF009 | Revisión de código + prueba de baja de suscripción | Manual, checklist de PR | 1 (M4), 5 (auditoría) |
| Secretos en el repo | RNF010 | `gitleaks` en CI (ya activo desde Sprint 0, `.github/workflows/secret-scan.yml`) | En cada push | 0 |
| Seguridad del panel admin | RNF011 (JWT ≤ 8 h) | Test de seguridad (expiración de token) | Sprint 3 | 3 |
| Accesibilidad | RNF012–RNF016 (contraste, teclado, táctil, responsive, no-solo-color) | `axe-core` + Lighthouse + prueba manual con teclado | Por página, antes de cada release | 1 → 5 (auditoría formal) |
| Precisión del clasificador IA | RNF019 (≥ 90% sobre conjunto dorado) | Prueba de regresión en CI contra `docs/anexos/` conjunto dorado etiquetado | Cada cambio al prompt/pipeline M9 | 4 (etiquetado) → 5 (CI) |
| Arranque en máquina limpia | RNF020 (`docker compose up`, un comando) | E2E de infraestructura | Antes de cada release | 0 (compose base) → 5 (documentado en manual técnico) |
| Flujo completo de usuario | RF001–RF028 (flujos principales) | Playwright E2E | Antes de cada release | 5 |

**Sin RNF asociado, no hay fila.** Si aparece una necesidad de prueba sin requisito que la respalde, se
corrige `product-requirements.md` primero (mismo criterio que usa `registrar-implementacion`).

---

## 3. Ambientes

| Ambiente | Para qué | Cómo se levanta |
|---|---|---|
| Local | Desarrollo y pruebas unitarias/integración | `./mvnw test`, `npm run test` |
| CI (GitHub Actions) | Puerta de calidad en cada PR — ver `.github/workflows/` | Automático en `push`/`pull_request` |
| Réplica local completa | E2E, caos, RNF020 | `docker compose up` (Sprint 1+, cuando existan los Dockerfiles de `/backend` y `/frontend`) |
| Staging desplegado | Validación final antes de la demo | Render/Railway + MongoDB Atlas + Upstash (Sprint 5) |

---

## 4. Datos de prueba

- **Conjunto dorado para M9 (ingesta con IA):** boletines reales de Acuacar etiquetados a mano
  (`origen: OFICIAL_ACUACAR`, ver `docs/ingenieria/pipeline-ingesta-datos.md`). Etiquetado es tarea de
  D1 en Sprint 4 (`docs/equipo/secuencia-de-trabajo.md` §4). RNF019 se mide contra este conjunto, no
  contra datos sintéticos.
- **Dataset histórico para la demo final:** boletines y reportes de mayo–julio 2026, tarea de D5 en
  Sprint 6.
- **Datos geoespaciales:** ya verificados y disponibles — `data/geoespacial/` (213 barrios, 184 con
  población real). Las pruebas de integración que necesiten sectores reales parten de ahí, no de
  fixtures inventados.

---

## 5. Definición de terminado para una prueba

Una prueba está **Hecha** cuando (alineado con `docs/gestion/README.md` § Definición de terminado):

1. Corre automáticamente en CI, no solo en la máquina de quien la escribió.
2. Falla de forma clara cuando el comportamiento que protege se rompe (se verifica rompiéndolo a
   propósito una vez, antes de dar la tarea por terminada).
3. Está referenciada por su nombre en `registro-de-implementaciones.md` (columna "Prueba"), no como
   "probado manualmente".

---

## 6. Lo que este documento NO es

- **No es el informe de resultados.** Cobertura real, bugs encontrados, resultados de E2E: eso se
  redacta en Sprint 5–6 desde los registros, con fecha y evidencia.
- **No fija herramientas que dependen de una decisión pendiente** (p. ej. la herramienta de prueba de
  carga para RNF002 — "k6 o similar" — la confirma D5 cuando exista `/backend` real contra qué probar).
- **No numera esto como "Anexo 5" todavía** — la numeración depende de que D1 valide la plantilla
  oficial (`docs/anexos/README.md` §⚠️, tarea bloqueante de Sprint 0).

## 7. Siguiente paso

Cuando exista `/backend` con al menos un caso de uso (Sprint 1-2): escribir los primeros tests
unitarios reales y verificar que la fila de JaCoCo/ArchUnit de la matriz corre en CI de verdad, no solo
en el papel.
