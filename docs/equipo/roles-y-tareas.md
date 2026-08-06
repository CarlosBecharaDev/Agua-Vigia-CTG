# Roles y tareas por desarrollador

> Quién hace qué, con qué entregables y en qué sprint. Cada persona es **dueña** de sus módulos:
> nadie más los toca sin avisar, y nadie más responde por ellos en la sustentación.
>
> Regla de equipo: **cada quien documenta lo que construye.** La documentación no es tarea de una
> sola persona; el Scrum Master coordina y consolida, no redacta lo de los demás.

---

## Resumen del equipo

| # | Rol | Módulos | Capas del código | Entregables académicos |
|---|---|---|---|---|
| **D1** | Scrum Master / Analista de Requisitos | — | — | Informe metodológico, Anexos 1–4, gestión Scrum |
| **D2** | Backend · Dominio y Aplicación | M3, M6 | `domain/`, `application/` | Diagrama de clases, patrones y SOLID |
| **D3** | Backend · Infraestructura e Integraciones | M2, M4, M5, **M9** | `infrastructure/`, `api/` | Anexo 6, diagramas de componentes |
| **D4** | Frontend | M1, M2, M5, M8 | `frontend/` | Prototipos, manual de usuario |
| **D5** | DevOps / QA / Datos geoespaciales | M7 + infraestructura | Docker, CI/CD, tests E2E | Plan de pruebas, manual técnico |

**Rotación:** el rol de Scrum Master rota cada dos sprints entre D1, D2 y D4 si el docente lo permite.
Se registra en las actas de retrospectiva.

---

## D1 — Scrum Master / Analista de Requisitos

**Es dueño de:** el proceso, el backlog y el entregable académico.
**No escribe código de producción.** Su producto es la documentación y la coordinación.

### Especificación del rol

- Facilita las ceremonias: planning, daily, review y retrospectiva de cada sprint.
- Mantiene el product backlog priorizado en GitHub Projects.
- Es el responsable único de que el informe cumpla la plantilla del Tecnológico Comfenalco.
- Gestiona la relación con actores externos (solicitud a Meta Content Library, contacto con líderes
  comunales para las entrevistas).
- **Bloquea la entrega** si un módulo llega sin su documentación.

### Tareas por sprint

| Sprint | Tareas |
|---|---|
| **0** | Configurar GitHub Projects como tablero Scrum · Redactar Anexo 1 (contextualización y rastreo conceptual, 5 conceptos con cita y paráfrasis) · Anexo 2 (observación de campo + 5W2H) · Anexo 3 (rastreo comercial) · Priorización MoSCoW del backlog · **Solicitar acceso a Meta Content Library vía ICPSR** |
| **1** | Capítulo I completo (descripción del problema, pregunta, árbol, justificación, objetivos) · Consolidar el SRS con D2 y D3 · Anexo 4 (historias de usuario con criterios Gherkin) · User Personas (3 perfiles) |
| **2** | Capítulo II (estado del arte en fichas, marcos teórico, conceptual, contextual y **legal**: Constitución art. 365–366, Ley 142/1994, Ley 1755/2015, Ley 1581/2012, Ley 1341/2009, fallo del Tribunal) · Casos de uso UML |
| **3** | Capítulo III (metodología: tipo proyectiva, enfoque mixto, diseño metodológico en tabla objetivo→actividades→resultados, población y muestra, cronograma) · **Diseñar la encuesta y el guion de entrevista** |
| **4** | Aplicar los instrumentos a la muestra (60–80 residentes + 3–5 entrevistas a líderes) · Coordinar el etiquetado del conjunto dorado con todo el equipo |
| **5** | Calcular el **Alfa de Cronbach** (meta ≥ 0.75) · Consolidar el informe de pruebas con D5 · Matriz de trazabilidad completa |
| **6** | Capítulo IV (resultados y conclusiones) · Referencias APA 7 · Presentación · Video demo · Acta de retrospectiva final |

### Definición de terminado para D1
Un documento está terminado cuando: cumple la estructura de la plantilla institucional, cita fuentes
verificables en APA 7, y otro integrante lo leyó y lo entendió sin explicación adicional.

---

## D2 — Backend · Dominio y Aplicación

**Es dueño de:** el corazón del sistema. Las reglas de negocio y los casos de uso.
**Módulos:** M3 (consenso automático) y M6 (Índice de Cumplimiento).

### Especificación del rol

- Escribe `domain/` y `application/`. **Java puro en `domain/`: cero framework.**
- Es el guardián de la regla de ArchUnit. Si alguien la rompe, él lo detecta en la revisión.
- Diseña los puertos (`port/in`, `port/out`) que D3 implementa.
- Responde en la sustentación por SOLID y los patrones de diseño.

### Tareas por sprint

| Sprint | Tareas |
|---|---|
| **1** | Modelar entidades: `Sector`, `CorteAgua`, `ReporteCiudadano`, `Suscripcion`, `EventoBitacora` · Objetos de valor como `record` con validación: `Coordenada`, `EstadoServicio`, `VentanaTiempo`, `IndiceCumplimiento` · Definir todos los puertos · **Escribir el test de ArchUnit** · Tests unitarios del dominio |
| **2** | `RegistrarReporteService` · `EvaluarConsensoService` con **dos estrategias intercambiables** (umbral fijo y proporcional — patrón Strategy) · Eventos de dominio (`SectorCambioEstadoEvent`) · Tests de las reglas de consenso |
| **3** | `GestionarCorteOficialService` · `SuscribirseService` con doble opt-in · Invariantes de `CorteAgua` con patrón Builder (no puede cerrarse antes de abrirse, ni prometer retorno anterior al inicio) |
| **4** | **`CalcularCumplimientoService`** — el módulo diferencial · `RegistrarEventoBitacoraService` con Factory Method · Specification para filtros combinables de estadísticas |
| **5** | Elevar cobertura de `domain/` y `application/` a **≥ 70%** · Refactorización guiada por los hallazgos de revisión |
| **6** | Documento de patrones aplicados y evidencia de SOLID (dónde se demuestra cada principio, con archivo y línea) · Diagrama de clases final |

### Definición de terminado para D2
Un caso de uso está terminado cuando: tiene test unitario que cubre el camino feliz y al menos un
caso de error, no importa nada de `infrastructure`, y el test de ArchUnit sigue pasando.

---

## D3 — Backend · Infraestructura e Integraciones

**Es dueño de:** todo lo que toca tecnología externa. La carga más pesada del proyecto.
**Módulos:** M2, M4, M5 y **M9 (pipeline de ingesta con IA)**.

### Especificación del rol

- Implementa los adaptadores de `infrastructure/` y los controladores de `api/`.
- Es dueño del **pipeline de ingesta**: colectores, deduplicación, prefiltro, capa de IA.
- Responde por la **ética de datos**: ninguna fuente entra sin pasar la skill `verificar-fuente`.
- Publica el contrato OpenAPI del que D4 genera su cliente tipado.

### Tareas por sprint

| Sprint | Tareas |
|---|---|
| **1** | Adaptador de MongoDB con índices `2dsphere` · Mappers con MapStruct · `GET /api/sectores` y `/api/sectores/{id}` · `@RestControllerAdvice` global con RFC 7807 · Configurar springdoc y publicar el OpenAPI |
| **2** | `POST /api/reportes` · **Rate limiting en Redis** (`INCR`+`EXPIRE`) · Ventana deslizante de consenso con `ZSET` · Caché del estado del mapa · Pub/Sub para SSE · Listeners de eventos de dominio |
| **3** | CRUD de cortes oficiales · **Seguridad JWT** del panel · Moderación de reportes · Spring Mail con plantillas · Envío asíncrono con cola de reintentos · Doble opt-in y baja en un clic |
| **4** | **Pipeline M9 completo**: `AcuacarApiCollector` · `RssCollector` · normalización a `DocumentoCrudo` con hash SHA-256 · deduplicación · prefiltro determinista · **capa de IA con salida estructurada y `citaTextual` verificable** · umbrales de confianza · cola de revisión · circuit breakers con Resilience4j · cola muerta · salud de colectores en Actuator |
| **5** | Agregaciones de MongoDB para estadísticas · Decorator de caché sobre el repositorio de estadísticas · Reproceso del histórico de 307 boletines con el prompt final |
| **6** | Anexo 6 (estructura de datos: modelo de documentos, índices, diagrama E-R) · Diagramas de componentes y de secuencia |

### Definición de terminado para D3
Un adaptador está terminado cuando: tiene test de integración con Testcontainers, maneja el fallo de
su dependencia externa sin tumbar el sistema, y no filtra tipos de infraestructura hacia arriba.

**Regla especial:** ninguna fuente de datos nueva se integra sin ejecutar antes la skill
`verificar-fuente` y registrar el resultado en la auditoría.

---

## D4 — Frontend

**Es dueño de:** todo lo que el ciudadano ve. La cara del proyecto.
**Módulos:** M1, M2, M5, M8.

### Especificación del rol

- Construye la SPA en React 19 + Vite + TypeScript.
- **Genera el cliente HTTP desde el OpenAPI de D3** — si D3 cambia un endpoint, el frontend deja de
  compilar antes de que alguien lo pruebe a mano.
- Responde por la accesibilidad (RNF012–RNF016) y por el cumplimiento de `DESIGN.md`.

### Tareas por sprint

| Sprint | Tareas |
|---|---|
| **0** | Esqueleto Vite + React + TS + Tailwind · Tokens de color de `DESIGN.md` como custom properties · **Los dos temas (claro y oscuro) desde el primer día** |
| **1** | Mapa con react-leaflet renderizando los sectores desde `GET /api/sectores` · Colores por estado · Detalle de sector · **Lista textual accesible como alternativa al mapa (RF004)** · Cliente tipado generado del OpenAPI |
| **2** | Formulario de reporte en **máximo dos toques** · Actualización en vivo vía SSE · Indicador de frescura del dato (RF003) · Estados de carga con esqueleto, vacío y error |
| **3** | Panel del veedor: alta de cortes, cierre con hora real, moderación · Flujo de suscripción con confirmación · Pantalla de baja en un clic |
| **4** | **Visualización del Índice de Cumplimiento como comparación** (prometido vs. real, no puntaje aislado) · Dashboard con Recharts · Línea de tiempo de la bitácora pública |
| **5** | Auditoría de accesibilidad con axe (contraste AA en ambos temas, teclado, foco visible, objetivos de 44px) · Responsive desde 360px · PWA · Optimización para 3G · Tests con Vitest + Testing Library |
| **6** | Manual de usuario con capturas · Pulido visual final |

### Definición de terminado para D4
Una pantalla está terminada cuando pasa el **checklist de `DESIGN.md` §10** completo: responde
"¿tengo agua?" en 5 segundos, funciona a 360px, ambos temas diseñados, color acompañado de forma,
contraste AA verificado, navegable por teclado, con estados de carga/vacío/error, y textos escritos
desde el lado del usuario.

---

## D5 — DevOps / QA / Datos geoespaciales

**Es dueño de:** que el proyecto arranque en cualquier máquina y que la calidad sea verificable.
**Módulo:** M7 + toda la infraestructura.

### Especificación del rol

- Docker, docker compose, CI/CD y despliegue.
- Datos geoespaciales: conseguir y cargar el GeoJSON de barrios de Cartagena.
- Pruebas end-to-end y métricas de calidad.
- **Es quien puede bloquear un merge** si la build o la cobertura fallan.

### Tareas por sprint

| Sprint | Tareas |
|---|---|
| **0** | Repositorio con `/backend`, `/frontend`, `/docs`, `.github/` · Ramas y protección de `main` · Plantillas de PR e issue · **`docker compose up` levantando Mongo + Redis + Mailhog** · GitHub Actions para ambos proyectos · `.env.example` |
| **1** | **Conseguir el GeoJSON de barrios de Cartagena** (Datos Abiertos Colombia / OpenStreetMap) · Script de carga de sectores · Validar geometrías · Dockerfile multi-etapa del backend |
| **2** | Testcontainers con Mongo y Redis reales · Cobertura con JaCoCo en CI · **Hacer que la build falle si ArchUnit falla** |
| **3** | Dockerfile multi-etapa del frontend (Vite → Nginx) · Perfiles `dev`/`docker`/`prod` · Escaneo de secretos en CI |
| **4** | Dashboards de estadísticas (M7) junto con D4 · Monitoreo con Actuator · **Prueba de caos: apagar una fuente externa y verificar que el resto sigue (RNF004)** |
| **5** | Pruebas E2E con Playwright cubriendo el recorrido completo de la demo · **Despliegue en Render/Railway + MongoDB Atlas + Upstash Redis con URL pública** · Prueba de regresión del clasificador en CI (RNF019) |
| **6** | Manual técnico · Plan e informe de pruebas consolidado · Datos históricos de mayo–julio 2026 cargados para la demo |

### Definición de terminado para D5
Algo está terminado cuando: funciona en una máquina limpia sin pasos manuales no documentados, y
está verificado en CI.

---

## Trabajo compartido — todo el equipo

| Actividad | Cuándo | Quiénes |
|---|---|---|
| Etiquetado del **conjunto dorado** (100 boletines etiquetados a mano) | Sprint 4 | Los 5. Es una tarde de trabajo y se convierte en anexo del informe. |
| Revisión de Pull Requests | Continuo | Mínimo 1 revisor por PR, nunca el mismo autor |
| Ceremonias Scrum | Cada sprint | Los 5 |
| Ensayo de la sustentación | Sprint 6 | Los 5, mínimo dos ensayos completos |

---

## Reglas de colaboración

1. **Contrato antes que implementación.** D3 publica el OpenAPI antes de que D4 construya contra él.
   Nadie inventa un endpoint que no esté en el contrato.
2. **Dueño único por módulo.** Si necesitas tocar el módulo de otro, se avisa y se revisa entre los dos.
3. **Nada se mergea a `develop` sin revisión.** Ni siquiera un cambio de una línea.
4. **Quien construye, documenta.** El Scrum Master consolida y da formato; no redacta lo ajeno.
5. **Si algo bloquea a otro, se dice en el daily**, no cuando ya pasó una semana.
6. **Una decisión relevante se registra** con la skill `registrar-decision`, o no existe.

---

## Riesgos por rol y cómo se mitigan

| Riesgo | Afecta a | Mitigación |
|---|---|---|
| D3 concentra demasiada carga (4 módulos, incluido el pipeline) | D3 | D2 apoya en el Sprint 4; el pipeline se prioriza sobre M7 si hay retraso |
| El GeoJSON de barrios no aparece o es de mala calidad | D5, bloquea a D2 y D4 | Plan B: polígonos aproximados dibujados a mano sobre las 15 localidades principales |
| Meta Content Library no se aprueba a tiempo | D1, D3 | Ya contemplado: la capa L4 (reportes ciudadanos) lo reemplaza sin cambiar el diseño |
| La muestra de 60–80 personas no se completa | D1 | Aplicar el instrumento en línea además de presencial; reducir a 40 con justificación metodológica |
| Alguien se atrasa y bloquea a otro | Todos | Los módulos son independientes por diseño; se puede reordenar el sprint sin rehacer |
