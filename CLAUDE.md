# AguaVigía CTG — Instrucciones del proyecto

> Este archivo lo lee el agente automáticamente al abrir el proyecto. Es la fuente de verdad sobre
> **cómo se trabaja aquí**. Si algo de este archivo contradice una suposición, gana este archivo.

---

## Qué es este proyecto

Plataforma web ciudadana de monitoreo y trazabilidad del servicio de acueducto en **Cartagena de
Indias, Colombia**. Cruza los avisos oficiales de Acuacar con reportes ciudadanos georreferenciados y
publica un **Índice de Cumplimiento** que compara la duración prometida de cada corte con la real.

**Proyecto de aula** — Fundación Universitaria Tecnológico Comfenalco, Tecnología en Desarrollo de
Software. Equipo de 5 personas, 6 meses, metodología Scrum.

**El problema que resuelve no es hidráulico, es informativo.** No reparamos tuberías; cerramos el
vacío de información que multiplica el daño. Toda decisión de alcance se juzga contra eso.

---

## Estado actual

**Fase: DOCUMENTACIÓN.** No se escribe código de la aplicación hasta que el equipo lo autorice
explícitamente. Si una tarea parece requerir código de producción, confirma antes de escribirlo.

Lo que sí se puede hacer ahora: documentos, diagramas, especificaciones, plantillas, configuración
del repositorio.

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Spring Boot 3.4 · Java 21 · Maven |
| Base de datos | MongoDB (documentos + geoespacial `2dsphere`) |
| Caché / tiempo real | Redis (caché, rate limiting, ventana de consenso, pub/sub) |
| Frontend | React 19 · Vite · TypeScript · Tailwind |
| Mapa | Leaflet / react-leaflet |
| Gráficas | Recharts |
| Estado servidor | TanStack Query |
| IA | Anthropic Java SDK (`com.anthropic:anthropic-java`), modelo `claude-opus-5` |
| Contenedores | Docker multi-etapa + docker compose |
| CI | GitHub Actions |

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

---

## Ética de datos — no negociable

Esto no es una preferencia de estilo; es la coherencia del proyecto.

1. **Se respeta `robots.txt` siempre**, incluso cuando técnicamente podríamos evadirlo. Varios medios
   (El Universal, El Tiempo, El Heraldo, Blu Radio) bloquean explícitamente a `anthropic-ai`,
   `Claude-Web` y `GPTBot`. **No se scrapean, no se disfraza el `User-Agent`, no se discute.**
   Exigirle transparencia a Acuacar y colarse por la puerta trasera de otro medio sería incoherente.
2. **No se scrapea Facebook, Instagram ni X.** Viola sus términos. La vía legítima es Meta Content
   Library con acceso académico. Si no se aprueba, la capa de reportes ciudadanos lo reemplaza.
3. **El colector se identifica siempre**: `User-Agent` con nombre del proyecto y correo de contacto.
4. **Nada llega al mapa público sin verificación.** La IA extrae, pero si no puede citar la frase
   exacta del boletín que respalda su extracción, no se publica. Un corte inventado destruiría la
   credibilidad del proyecto entero.

---

## Fuentes de datos verificadas

| Fuente | Endpoint | Estado |
|---|---|---|
| Acuacar (oficial) | `GET https://www.acuacar.com/wp-json/wp/v2/posts` | ✅ HTTP 200, 307 boletines JSON |
| Acuacar RSS | `https://www.acuacar.com/feed/` | ✅ Funcional |
| Google News RSS | `https://news.google.com/rss/search?q=...&hl=es-419&gl=CO` | ✅ 100 ítems/consulta |
| Zona Cero | `https://zonacero.com/rss.xml` | ✅ Funcional |

Detalle completo, incluidas las fuentes descartadas y por qué:
`docs/ingenieria/auditoria-fuentes-de-datos.md`.

**Antes de afirmar que una fuente está bloqueada o disponible, verifícalo con una petición real.**
Este proyecto ya tuvo un error por asumir el contenido de un `robots.txt` sin leerlo.

---

## Dónde está cada cosa

```
/                          CLAUDE.md · DESIGN.md · MEMORY.md · .mcp.json
.claude/                   skills/ · agents/ · settings.json
docs/
├── brief.md               Qué es el producto y para quién
├── product-requirements.md Requisitos funcionales y no funcionales
├── design-decisions.md    Bitácora de decisiones (ADR)
├── equipo/                Roles, tareas y especificaciones por desarrollador
├── ingenieria/            Pipeline de datos, auditoría de fuentes, arquitectura
├── informe-metodologico/  Los 4 capítulos del entregable académico
├── anexos/                Los 6 anexos exigidos por el programa
└── gestion/               Scrum: planning, review, retrospectiva por sprint
backend/                   (pendiente) Spring Boot
frontend/                  (pendiente) React + Vite
```

---

## Formato académico obligatorio

El entregable principal sigue la plantilla del Tecnológico Comfenalco:
**4 capítulos + 6 anexos + referencias APA 7**. La estructura exacta está en
`docs/informe-metodologico/`. No inventes secciones ni las renombres — el docente evalúa contra
esa plantilla.

Enfoque investigativo declarado: **proyectiva, mixta**, validada con **Alfa de Cronbach ≥ 0.75**.

---

## Cómo colaborar conmigo (el equipo, contigo el agente)

- **No repitas contexto**: si algo se decidió, está en `docs/design-decisions.md`. Léelo antes de
  proponer una alternativa que ya se descartó.
- **Al terminar algo relevante**, registra la decisión en `docs/design-decisions.md` y, si cambia el
  entendimiento del producto, en `MEMORY.md`.
- **No generes código de producción en fase de documentación** sin confirmarlo.
- **Verifica antes de afirmar.** Si dices que un endpoint funciona, pruébalo.
- Si detectas que un documento contradice a otro, **dilo en vez de elegir en silencio**.
