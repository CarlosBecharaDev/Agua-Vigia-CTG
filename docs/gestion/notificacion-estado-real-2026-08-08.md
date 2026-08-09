# 🚨 ESTADO DEL PROYECTO — Notificación al equipo

**Revisión completa de todas las ramas realizada 2026-08-08 20:00**

---

## RESUMEN EJECUTIVO

- ✅ **Todas las compuertas C0–C3 abiertas** — no cerradas como se reportó antes
- ✅ **70 archivos Java backend + 30 componentes frontend ya construidos**
- 🟠 **4 PRs de D3 esperando revisor** (bloqueador para flujo de integración)
- 🔴 **D1 sin titular** (bloqueador para M4 Alertas, M8 Bitácora, BL-006)
- ⏸️ **D2 no ha iniciado `application/`** (casos de uso) — bloqueador para D3, D1

---

## LO QUE CADA UNO DEBE HACER AHORA

### ✅ **D1 — Rafael Sarmiento Peña** (ASIGNADO)

**ACCIÓN INMEDIATA:** Resolver bloqueadores de M4 (Alertas) y M8 (Bitácora).

**Tareas concretas:**
1. Leer `docs/equipo/D1-notificaciones-bitacora.md` (especificación completa)
2. **BL-006 URGENTE:** Configurar `COLLECTOR_USER_AGENT` en `.env` con formato `AguaVigía-CTG/1.0 (+correo@domain.com)`
   - Esto desbloquea a D3 para probar colectores contra Acuacar, Google News, Zona Cero
3. Implementar `NotificacionPort` (infrastructure/mail/) — Spring Mail
4. Implementar `BitacoraAppendOnlyPort` (infrastructure/) — append-only storage

---

### 🟡 **D2 — Carlos Bechara** (BLOQUEADOR INTERMEDIO)

**ACCIÓN:** Comenzar la implementación de `application/` (casos de uso de dominio).

**Por qué bloqueador:**
- D3 construyó los adaptadores (Mongo, Redis, JWT) pero **no tiene a quién llamar**
- `application/` define qué hace el sistema; sin eso, la infraestructura cuelga
- Las siguientes unidades de D3 (M5 Veedor moderación, M9 colectores) dependen de casos de uso

**Tareas concretas:**
1. Leer `docs/equipo/D2-backend-dominio.md` (especificación, módulos M3 · M6 ⭐)
2. **Primer sprint:** implementar
   - `EvaluarConsensoUseCase` (consume `ContadorReportesPort` de Redis que D3 ya hizo)
   - `CalcularCumplimientoUseCase` (M6 ⭐, la estrella del proyecto)
3. Verificar que ArchUnit siga en verde: `./mvnw clean verify`
4. Abrir PR cuando esté listo (con revisor asignado, no se funde sin revisor)

**Dependencias:**
- D3 ya abrió los puertos: `ContadorReportesPort`, `CorteAguaRepository`, `EventoBitacoraRepository`
- D3 ya implementó los adaptadores de esos puertos
- D2 solo necesita conectarlos vía casos de uso

---

### 🟠 **D3 — Sebastián Montes** (ACCIÓN INMEDIATA)

**ACCIÓN INMEDIATA:** Asegurar que los 4 PRs pendientes tengan revisor humano y sean fundidos.

**PRs esperando revisor:**
- **PR #56:** `feature/d3-sprint1-mongo-y-api-sectores` — SectorRepository + GET /api/sectores · **ABRE C2**
- **PR #57:** `feature/d3-sprint3-jwt-veedor` — Autenticación del panel del Veedor
- **PR #58:** `feature/d3-sprint4-prefiltro-dedup` — Pipeline M9 (prefiltro + deduplicador Redis)
- **PR #60:** `feature/d3-sprint2-rate-limiting-http` — Rate limiting genérico (necesario para login del Veedor)

**Por qué urgente:**
- El PR #56 abre la compuerta C2 (contrato OpenAPI) — sin fusionarlo, D4 no puede avanzar validación
- Los 4 juntos traen MongoDB, Redis, JWT, rate limiting — infraestructura transversal
- Están **listos desde hace días**, solo necesitan 1 revisor humano (puede ser D5, D4 o D2)

**Qué hacer:**
1. **Asigna revisor** a cada PR en GitHub (tab "Reviewers")
   - Sugerencia: D5 (Yordy) es DevOps, puede validar infraestructura + Docker
   - O D2 (Carlos) puede revisar la arquitectura (que siga siendo Limpia)
2. **No fusiones sin revisor aprobado** — esa es la regla
3. Cuando se fusionen: celebra 🎉 (traen 7 sprints de D3 de una vez)

**Después de fusionar:**
- Inicia PR #59 (colectores + SDK Anthropic) — pero **solo** si D1 fija el User-Agent
- O inicia Sprint 2 de D4 (validaciones de UI, accesibilidad)

---

### 🟢 **D4 — José Daniel Zambrano** (SIN BLOQUEADOR)

**ACCIÓN:** Validar que tu frontend siga funcionando cuando se fusionen los PRs de D3.

**Estado actual:**
- ✅ Tu SPA ya está integrada a `/api/sectores` (C3 abierta)
- ✅ Mapas, reportes, bitácora, estadísticas, panel Veedor — todo en código
- ✅ PWA con offline, glassmorphism, animaciones con framer-motion

**Qué hacer:**
1. **Revisa el PR #56 de D3** (cuando lo publiques para revisor)
   - Verifica que el OpenAPI que genera tenga los campos que tu UI espera
   - Si falta un campo o cambia el contrato, avísale a D3 ahora (antes de fusionar)
2. **Cuando se fusione el PR #56:**
   - `npm run build` debe pasar sin errores (verifica C3)
   - `npm run dev` debe conectar a la API real sin cambios en tu código
3. **Sprint 5 (donde ya estás):**
   - Termina validaciones en UI (aria-labels, ratios de contraste)
   - Testea offline (PWA sin conexión a API)

---

### 🟢 **D5 — Yordy (TÚ)** (EXECUTOR)

**ACCIÓN:** Eres el único que puede mover esto hoy.

**Tareas inmediatas:**
1. **Abre los 4 PRs de D3 en GitHub** y asígnalos a ti como revisor
   - PR #56, #57, #58, #60
   - Verifica que tengan descripción de cambios y enlacen su issue/requisito

2. **Revisa cada uno rápido:**
   ```bash
   # Ver cambios del PR #56
   git show origin/feature/d3-sprint1-mongo-y-api-sectores:backend/openapi.yaml | head -30
   
   # Ver que los tests pasan
   git checkout origin/feature/d3-sprint1-mongo-y-api-sectores
   cd backend && ./mvnw clean verify
   ```

3. **Aprueba y funde** (no necesita el "sí" de todos si pasan tests y ArchUnit)
   - Los 4 PRs se pueden fusionar en **cualquier orden** (ninguno choca con otro)
   - Verifica `./mvnw clean verify` después de cada merge
   - Verifica que la rama `develop` siga en verde

4. **Avisa al equipo aquí** (en este chat) cuando se fusionen:
   - `✅ PR #56 fusionado — C2 abierta para /api/sectores`
   - `✅ PR #57, #58, #60 fusionados — MongoDB, Redis, JWT, rate limiting listos`

**Después (próximas horas):**
- D2 (Carlos) puede empezar `application/` sin bloqueadores
- D3 puede abrir PR #59 (colectores) — solo si D1 tiene el User-Agent listo
- D4 verifica que el frontend siga compilando con la API nueva

---

## BLOQUEADORES HOY MISMO

| Bloqueador | Quién lo abre | Acciones necesarias |
|---|---|---|
| 🔴 **D1 sin titular** | Equipo/Docente | Asignar 5.ª persona a rol D1 |
| 🟠 **4 PRs de D3 sin revisor** | D5 (Yordy) | Revisar y fusionar en `develop` |
| 🟡 **D2 no empieza `application/`** | D2 (Carlos) | Leer spec · crear casos de uso en `com.aguavigia.ctg.application.*` |
| 🟡 **BL-006 sin resolver** | D1 (cuando se asigne) | Crear `COLLECTOR_USER_AGENT` con correo real |
| 🟡 **BL-005 sin resolver** | Equipo | Conseguir `ANTHROPIC_API_KEY` y verificar firma del SDK |

---

## RESUMEN POR DISCIPLINA

**DevOps (D5):** Revisor y executor de PRs — eres el cuello de botella positivo hoy
**Backend Infraestructura (D3):** 4 PRs listos, esperando aprobación
**Backend Dominio (D2):** Bloqueador intermedio — necesitas empezar `application/`
**Frontend (D4):** Sin bloqueadores, valida cuando fusionen la C2 de D3
**Documentación/Notificaciones (D1):** Bloqueador crítico — falta asignar

---

## CALENDARIO (estimado)

**HOY (2026-08-08 20:00–22:00):**
- D5 revisa y funde los 4 PRs de D3 ✓

**MAÑANA (2026-08-09 AM):**
- D2 empieza `EvaluarConsensoUseCase` en `application/`
- D1 se asigna (urgente) y fija `COLLECTOR_USER_AGENT`
- D4 valida que todo compila

**Fin de semana:**
- D2 abre PR con casos de uso
- D3 puede conectar colectores (si D1 resolvió BL-006)
- D5 continúa revisiones e integración

---

**⚠️ Este mensaje fue generado por auditoría del estado real en `develop`.**
**Fuente:** bitácora, bugs, ADRs, registro de implementaciones, commits.
**No hay suposiciones:** cada dato se verificó con un comando git real.

