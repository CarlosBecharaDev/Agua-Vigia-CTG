# AguaVigía CTG — Instrucciones del proyecto

> Este archivo lo lee el agente automáticamente al abrir el proyecto. Es la fuente de verdad sobre
> **cómo se trabaja aquí**. Si algo de este archivo contradice una suposición, gana este archivo.

---

## Qué es este proyecto

Plataforma web ciudadana de monitoreo y trazabilidad del acueducto en **Cartagena de Indias,
Colombia**. Cruza los avisos oficiales de Acuacar con reportes ciudadanos georreferenciados y publica
un **Índice de Cumplimiento** que compara la duración prometida de cada corte con la real.
**Proyecto de aula** — Tecnológico Comfenalco, 5 personas, 6 meses, Scrum. Detalle en `docs/brief.md`.

**El problema que resuelve no es hidráulico, es informativo.** No reparamos tuberías; cerramos el
vacío de información que multiplica el daño. Toda decisión de alcance se juzga contra eso.

---

## Estado actual

**Sprint 0 · Fase: ANDAMIAJE.** Se permite estructura de proyecto, configuración, infraestructura,
tokens visuales y rutas vacías. Se prohíbe la funcionalidad: **si el código implementa un `RF`, no va
en el Sprint 0** (`ADR-009`). Ante un caso de frontera, pregunta antes de escribirlo.

**7 sprints: Sprint 0 (preparación) + Sprints 1–6. Un sprint no cierra por calendario: cierra cuando
su entregable se demuestra funcionando.** Los 7 entregables, en `docs/gestion/README.md`.

---

## Stack

**Backend** Spring Boot 3.4 · Java 21 · Maven · MongoDB (documentos + geoespacial `2dsphere`) ·
Redis (caché, rate limiting, ventana de consenso, pub/sub) · Anthropic Java SDK, modelo `claude-opus-5`
**Frontend** React 19 · Vite · TypeScript · Tailwind · Leaflet/react-leaflet · Recharts · TanStack Query
**Infraestructura** Docker multi-etapa + docker compose · GitHub Actions

**Backend y frontend son proyectos separados** dentro del mismo repositorio (`/backend`, `/frontend`).

---

## Arquitectura — reglas no negociables

Arquitectura Limpia (puertos y adaptadores). Las dependencias apuntan **siempre hacia adentro**.

```
com.aguavigia.ctg
├── domain/          ← Java puro. CERO imports de framework.
├── application/     ← Casos de uso. Depende solo de domain/port/out.
├── infrastructure/  ← Toda la tecnología: Mongo, Redis, correo, JWT, HTTP saliente.
└── api/             ← Controladores REST, DTOs, mappers.
```

### Regla de oro

**Si `domain/` importa algo que empiece por `org.springframework` o `com.mongodb`, la arquitectura
está rota.** No es criterio de nadie: hay un test de ArchUnit que lo verifica y la build falla.
Al proponer código, verifica mentalmente esta regla antes de escribir el import.

### Otras reglas estructurales

- Los controladores **no** contienen lógica de negocio. Traducen HTTP ↔ caso de uso y nada más.
- Nunca exponer entidades de dominio en la API. Siempre DTOs, mapeados con MapStruct.
- Un caso de uso = una clase = una acción. Si un servicio hace dos cosas, son dos servicios.
- Objetos de valor (`Coordenada`, `VentanaTiempo`, `EstadoServicio`): `record` que valida al construir.
- Errores de API en formato RFC 7807, centralizados en un `@RestControllerAdvice`.

---

## Convenciones de código

- **Idioma**: lo del dominio en **español** (`CorteAgua`, `calcularCumplimiento`); términos técnicos
  universales en inglés (`Repository`, `Controller`, `Adapter`). No mezclar en un mismo identificador.
- **Inyección de dependencias por constructor**, nunca `@Autowired` en campos.
- **Sin Lombok en `domain/`** — el dominio es Java puro y explícito. Lombok sí en `infrastructure/`.
- **Comentarios**: por defecto ninguno. Solo cuando el *porqué* no es obvio (una restricción oculta,
  un workaround con motivo). Nunca comentarios que expliquen *qué* hace el código.
- **Tests**: nombre descriptivo en español — `debeRechazarCorteConFinAnteriorAlInicio()`.

---

## Convenciones de Git

- Ramas: `main` ← `develop` ← `feature/*`, `fix/*`. `develop` se fusiona a `main` **al cerrar cada
  sprint**, por PR y con etiqueta `sprint-N`. Fuera de eso, `main` no se toca.
- Commits en formato **Conventional Commits**: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.
  Mensaje en español, imperativo: `feat: agregar cálculo del índice de cumplimiento`. Fecha del
  proyecto = **hora local de Cartagena (UTC-5)**, no UTC.
- Todo cambio entra por Pull Request con al menos **1 revisor**, enlazando su issue y su historia de
  usuario. **Es política, no un candado técnico**: no hay branch protection en GitHub (`ADR-010`).

### Autoría — regla no negociable

**El agente nunca figura como colaborador del repositorio**: ni un trailer `Co-Authored-By`, ni una
firma *"Generated with Claude Code"*, ni como autor o revisor de un PR, issue o comentario. Refuerzo
mecánico: `includeCoAuthoredBy: false` en `.claude/settings.json`; si aun así ves un trailer de
coautoría en un mensaje que vas a escribir, quítalo.

**Por qué:** la autoría es de las cinco personas, que responden por el proyecto ante el docente. La IA
es una herramienta y se documenta como tal en el Capítulo III. Firmar los commits enturbiaría el
registro de contribución individual, que es evidencia evaluable. Esto **no** oculta el uso de IA:
está declarado en la documentación académica y en el rol de D1.

---

## Ética de datos — no negociable

Es la coherencia del proyecto, no una preferencia de estilo. Detalle en `ADR-005` y `ADR-006`.

1. **Se respeta `robots.txt` siempre**, aunque pudiéramos evadirlo: **no se disfraza el
   `User-Agent`, no se discute.** Qué medio bloquea a qué agente: `MEMORY.md`.
2. **No se scrapea Facebook, Instagram ni X.** Vía legítima y su estado: `MEMORY.md` § Restricciones.
3. **El colector se identifica siempre**: `User-Agent` con nombre del proyecto y correo de contacto.
4. **Nada llega al mapa público sin verificación.** Si la IA no puede citar la frase exacta del
   boletín que respalda su extracción, no se publica. Un corte inventado destruiría la credibilidad.

---

## Fuentes de datos

En uso y verificadas: **Acuacar** (API REST de WordPress + RSS), **Google News RSS** y **Zona Cero
RSS**. Las 18 evaluadas, con veredicto: `docs/ingenieria/auditoria-fuentes-de-datos.md`. **Antes de
afirmar que una fuente está bloqueada o disponible, verifícalo con una petición real** (skill
`verificar-fuente`): aquí ya costó caro asumir un `robots.txt` sin leerlo.

---

## Dónde está cada cosa

```
/                       CLAUDE.md · DESIGN.md · MEMORY.md · README.md · .mcp.json
.claude/                skills/ · agents/ · settings.json
docs/                   brief.md · product-requirements.md (36 RF, 20 RNF) · design-decisions.md (ADR)
docs/equipo/            Titulares D1–D5, tareas por sprint y secuencia de trabajo
docs/ingenieria/        Pipeline de datos, auditoría de fuentes, matriz de trazabilidad
docs/gestion/           Scrum, bitácora, bugs, implementaciones, bloqueos y compuertas
docs/informe-metodologico/ · docs/anexos/   Los 4 capítulos y los 6 anexos académicos
frontend/               React 19 + Vite — esqueleto de Sprint 0 · backend/ lo crea D2 (Sprint 0)
```

---

## Formato académico obligatorio

Plantilla del Tecnológico Comfenalco: **4 capítulos + 6 anexos + referencias APA 7**. No inventes
secciones ni las renombres — el docente evalúa contra esa plantilla.

⚠️ **La plantilla oficial aún no está en el repositorio**: el índice de
`docs/informe-metodologico/README.md` es una reconstrucción y validarla es tarea bloqueante de D1.

Enfoque investigativo: **proyectiva, mixta**, validada con **Alfa de Cronbach ≥ 0.75**.

---

## Secuencia de trabajo — obligatoria

Orden: **D5 → D2 → D3 y D1 → D4 → D5 (QA)**. Entre etapas hay **compuertas**: un artefacto
verificable que separa a quien lo produce de quien lo consume. Compuertas, titulares y protocolo en
`docs/equipo/secuencia-de-trabajo.md` §2 y §5; estado vivo en `docs/gestion/registro-de-bloqueos.md`.

**Antes de la primera línea de cualquier tarea:**

1. **Verifica con su comando** la compuerta de la que depende esa tarea. No de memoria, y no
   confiando en la tabla de estado: la tabla se desactualiza, el repositorio no.
2. Abierta → avanzas. **Cerrada → te detienes**: registras el bloqueo (skill `registrar-bloqueo`),
   **lo avisas en el chat** con el formato de la skill y ofreces el trabajo alterno que no la cruza.
3. **Nunca rodees un bloqueo** inventando el insumo que falta (tipos escritos a mano, DTOs
   "provisionales", simulaciones que nadie retira) ni escribiendo en la capa de otro rol. Única
   excepción: desbloqueo temporal autorizado por el titular, con caducidad y registro.
4. Si la tarea es de **otro rol**, no la ejecutas: lo dices. Si no sabes de qué depende, preguntas.
   Al **abrir** una compuerta, la verificas, la marcas y la anuncias igual.

---

## Qué se registra siempre — regla del proyecto

No es opcional: es parte de la definición de terminado y el insumo del Capítulo IV.

| Ocurre | Se registra en | Con la skill |
|---|---|---|
| Se fusiona un PR a `develop` | `docs/gestion/registro-de-implementaciones.md` | `registrar-implementacion` |
| Se encuentra un bug (aunque se arregle en el acto) | `docs/gestion/registro-de-bugs.md` | `registrar-bug` |
| Termina una sesión de trabajo con IA | `docs/gestion/bitacora-sesiones.md` | `cerrar-sesion` |
| Se elige entre alternativas técnicas | `docs/design-decisions.md` | `registrar-decision` |
| Se verifica una fuente de datos | `docs/ingenieria/auditoria-fuentes-de-datos.md` | `verificar-fuente` |
| Una tarea no puede avanzar por falta del insumo de otro rol | `docs/gestion/registro-de-bloqueos.md` **+ aviso en el chat** | `registrar-bloqueo` |
| Cambia el estado de un sprint, una compuerta o un bloqueo | **el tablero HTML de estado del equipo**, en el mismo PR | — *(lo sube D2 — ruta por confirmar)* |

**El tablero HTML es obligatorio para los agentes.** Es lo que los cinco miran para saber cómo van sin
abrir el repositorio; si el código cambia y el tablero no, el tablero miente y deja de servir.

---

## Cómo colaborar conmigo (el equipo, contigo el agente)

- **Antes de tu primera sesión, lee `docs/gestion/protocolo-de-contexto.md`**: dónde vive cada dato y
  el presupuesto de líneas de los archivos permanentes. Cada línea que agregues aquí la pagan las
  cinco personas del equipo, en cada una de sus sesiones.
- **Un dato vive en un solo archivo.** Si lo encuentras duplicado, es un defecto: detalle en uno,
  puntero en el otro.
- **No repitas contexto**: lo decidido está en `docs/design-decisions.md`. Léelo antes de proponer una
  alternativa ya descartada.
- **No generes código de producción en fase de documentación** sin confirmarlo.
- **Verifica antes de afirmar.** Si dices que un endpoint funciona, pruébalo.
- Si un documento contradice a otro, **dilo en vez de elegir en silencio**.
