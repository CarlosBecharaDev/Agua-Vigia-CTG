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

**Sprint 0 · Fase: DOCUMENTACIÓN.** No se escribe código de la aplicación hasta que el equipo lo
autorice explícitamente. Si una tarea parece requerir código de producción, confirma antes de
escribirlo.

Lo que sí se puede hacer ahora: documentos, diagramas, especificaciones, plantillas, configuración
del repositorio.

**7 sprints de ~4 semanas: Sprint 0 (preparación) + Sprints 1–6 (construcción).** Calendario y
ceremonias en `docs/gestion/README.md`.

---

## Stack

**Backend** Spring Boot 3.4 · Java 21 · Maven · MongoDB (documentos + geoespacial `2dsphere`) ·
Redis (caché, rate limiting, ventana de consenso, pub/sub) · Anthropic Java SDK
(`com.anthropic:anthropic-java`, modelo `claude-opus-5`)
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
- Los objetos de valor (`Coordenada`, `VentanaTiempo`, `EstadoServicio`) son `record` inmutables que
  validan en el constructor.
- Errores de API en formato RFC 7807, centralizados en un `@RestControllerAdvice`.

---

## Convenciones de código

- **Idioma**: nombres de clases, paquetes y métodos en **español** cuando son del dominio
  (`CorteAgua`, `ReporteCiudadano`, `calcularCumplimiento`). Términos técnicos universales en inglés
  (`Repository`, `Controller`, `Adapter`). No mezclar dentro de un mismo identificador.
- **Inyección de dependencias por constructor**, nunca `@Autowired` en campos.
- **Sin Lombok en `domain/`** — el dominio es Java puro y explícito. Lombok sí en `infrastructure/`.
- **Comentarios**: por defecto ninguno. Solo cuando el *porqué* no es obvio (una restricción oculta,
  un workaround con motivo). Nunca comentarios que expliquen *qué* hace el código.
- **Tests**: nombre descriptivo en español —
  `debeRechazarCorteConFinAnteriorAlInicio()`.

---

## Convenciones de Git

- Ramas: `main` ← `develop` ← `feature/*`, `fix/*`. **Nadie hace push directo a `main`.**
- Commits en formato **Conventional Commits**: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.
  Mensaje en español, imperativo: `feat: agregar cálculo del índice de cumplimiento`.
- Todo cambio entra por Pull Request con al menos **1 revisor**.
- Cada PR enlaza el issue y la historia de usuario que implementa.

### Autoría — regla no negociable

**El agente nunca figura como colaborador del repositorio**: ni un trailer `Co-Authored-By`, ni una
firma *"Generated with Claude Code"*, ni como autor o revisor de un PR, issue o comentario. En
commits, PRs y todo lo demás. Refuerzo mecánico: `includeCoAuthoredBy: false` en
`.claude/settings.json`; si aun así ves un trailer de coautoría en un mensaje que vas a escribir,
quítalo.

**Por qué:** la autoría es de las cinco personas, que responden por el proyecto ante el docente. La IA
es una herramienta y se documenta como tal en el Capítulo III — no como integrante. Firmar los commits
enturbiaría el registro de contribución individual, que es evidencia evaluable. Esto **no** oculta el
uso de IA: está declarado en la documentación académica y en el rol de D1.

---

## Ética de datos — no negociable

Es la coherencia del proyecto, no una preferencia de estilo. Detalle en `ADR-005` y `ADR-006`.

1. **Se respeta `robots.txt` siempre**, aunque técnicamente pudiéramos evadirlo. El Universal, El
   Tiempo, El Heraldo y Blu Radio bloquean a `anthropic-ai` / `Claude-Web` / `GPTBot`: **no se
   scrapean, no se disfraza el `User-Agent`, no se discute.** Exigirle transparencia a Acuacar y
   colarse por la puerta trasera de otro medio sería incoherente.
2. **No se scrapea Facebook, Instagram ni X.** Vía legítima: Meta Content Library con acceso
   académico; si no se aprueba, la capa de reportes ciudadanos la reemplaza.
3. **El colector se identifica siempre**: `User-Agent` con nombre del proyecto y correo de contacto.
4. **Nada llega al mapa público sin verificación.** Si la IA no puede citar la frase exacta del
   boletín que respalda su extracción, no se publica. Un corte inventado destruiría la credibilidad
   del proyecto entero.

---

## Fuentes de datos

En uso y verificadas: **Acuacar** (API REST de WordPress + RSS), **Google News RSS** y **Zona Cero
RSS**. Las 18 evaluadas, con veredicto y motivo de descarte: `docs/ingenieria/auditoria-fuentes-de-datos.md`.

**Antes de afirmar que una fuente está bloqueada o disponible, verifícalo con una petición real**
(skill `verificar-fuente`). Este proyecto ya tuvo un error por asumir el contenido de un `robots.txt`
sin leerlo.

---

## Dónde está cada cosa

```
/                          CLAUDE.md · DESIGN.md · MEMORY.md · README.md · .mcp.json
.claude/                   skills/ · agents/ · settings.json
docs/
├── brief.md                Qué es el producto y para quién
├── product-requirements.md 36 RF y 20 RNF con id, prioridad y origen
├── design-decisions.md     Bitácora de decisiones (ADR)
├── equipo/                 Roles, tareas y especificación por desarrollador (D1–D5)
├── ingenieria/             Pipeline de datos, auditoría de fuentes, matriz de trazabilidad
├── gestion/                Scrum, bitácora de sesiones, bugs, implementaciones
├── informe-metodologico/   Los 4 capítulos del entregable académico
├── anexos/                 Los 6 anexos exigidos por el programa
└── index.html              Presentación del proyecto
backend/                   (pendiente) Spring Boot
frontend/                  (pendiente) React + Vite
```

---

## Formato académico obligatorio

Plantilla del Tecnológico Comfenalco: **4 capítulos + 6 anexos + referencias APA 7**. No inventes
secciones ni las renombres — el docente evalúa contra esa plantilla.

⚠️ **La plantilla oficial aún no está en el repositorio**; el índice de
`docs/informe-metodologico/README.md` es una reconstrucción marcada como tal, y validarla es tarea
bloqueante de D1 en el Sprint 0.

Enfoque investigativo: **proyectiva, mixta**, validada con **Alfa de Cronbach ≥ 0.75**.

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

---

## Cómo colaborar conmigo (el equipo, contigo el agente)

- **Antes de tu primera sesión, lee `docs/gestion/protocolo-de-contexto.md`**: dónde vive cada dato,
  el presupuesto de líneas de los archivos permanentes y cómo no desperdiciar contexto. Cinco personas
  comparten este repositorio; cada línea que agregues aquí la pagan las cinco, en cada sesión.
- **Un dato vive en un solo archivo.** Si lo encuentras duplicado, es un defecto: detalle en uno,
  puntero en el otro.
- **No repitas contexto**: lo decidido está en `docs/design-decisions.md`. Léelo antes de proponer una
  alternativa ya descartada.
- **No generes código de producción en fase de documentación** sin confirmarlo.
- **Verifica antes de afirmar.** Si dices que un endpoint funciona, pruébalo.
- Si un documento contradice a otro, **dilo en vez de elegir en silencio**.
