# Bitácora de decisiones (ADR)

> Registro cronológico y **append-only** de las decisiones de diseño y arquitectura.
> Las entradas no se editan salvo para cambiar su estado a *Reemplazada*.
>
> Existe para que nadie —humano o agente— vuelva a proponer un camino que ya se exploró y se
> descartó. **Léelo antes de proponer alternativas.**
>
> Para agregar una entrada: usa la skill `registrar-decision`.

---

## ADR-001 — Adoptar Arquitectura Limpia con puertos y adaptadores

- **Fecha:** 2026-08-06
- **Estado:** Aceptada
- **Decide:** Equipo completo

### Contexto
El proyecto anterior del equipo (ODYXS) usó MVC monolítico con Thymeleaf y MySQL: los controladores
contenían lógica de negocio, no había capa de DTOs y las entidades JPA viajaban directo a la vista.
Funcionó, pero no era demostrable como diseño ni testeable por capas. Este proyecto debe evidenciar
SOLID y patrones ante un docente.

### Alternativas consideradas
| Opción | A favor | En contra |
|---|---|---|
| MVC en capas (como ODYXS) | Familiar, rápido de arrancar | No evidencia SOLID; dominio acoplado al framework |
| Arquitectura Limpia | Dominio testeable sin framework; SOLID demostrable con el dedo | Más carpetas, curva de aprendizaje |
| Microservicios | Escalable | Sobreingeniería absoluta para 5 personas y 6 meses |

### Decisión
Arquitectura Limpia con cuatro capas (`domain`, `application`, `infrastructure`, `api`) y
dependencias apuntando hacia adentro.

### Consecuencias
- **Gana:** el dominio se testea sin levantar Spring; cada principio SOLID tiene un lugar concreto
  que señalar en la sustentación.
- **Pierde:** más ceremonia — un caso de uso simple toca 4 archivos en vez de 1.
- **Condiciona:** obliga a mantener DTOs y mappers; sin ellos la capa `api` se contamina.

### Cómo se revierte
No se revierte parcialmente. Volver a MVC implicaría reescribir `application/` e `infrastructure/`.

---

## ADR-002 — Verificar la regla de capas con ArchUnit en la build

- **Fecha:** 2026-08-06
- **Estado:** Aceptada
- **Decide:** Backend – Dominio

### Contexto
Una regla de arquitectura que depende de que la gente la recuerde se rompe en el primer sprint con
presión de entrega. Especialmente con 5 personas de niveles distintos tocando el mismo backend.

### Alternativas consideradas
| Opción | A favor | En contra |
|---|---|---|
| Confiar en la revisión de PR | Cero configuración | Depende del revisor; se cuela lo que se cuela |
| Documentar la regla y ya | Rápido | Nadie relee la documentación bajo presión |
| Test automático con ArchUnit | La build falla, no se puede ignorar | Una dependencia más |

### Decisión
Test de ArchUnit que falla la build si `domain/` importa framework o si `application/` importa
`infrastructure`.

### Consecuencias
- **Gana:** la regla deja de ser un acuerdo y pasa a ser una restricción del sistema. Además es
  evidencia objetiva y demostrable en la sustentación.
- **Pierde:** puede frustrar a quien no entienda por qué falla su build — hay que explicarlo bien.

### Cómo se revierte
Borrar el test. Trivial, pero se perdería la garantía.

---

## ADR-003 — MongoDB para persistencia y Redis para estado efímero

- **Fecha:** 2026-08-06
- **Estado:** Aceptada
- **Decide:** Backend – Infraestructura

### Contexto
Los cortes son documentos de estructura variable (lista de sectores afectados, historial embebido,
campos que solo existen cuando el corte cerró). Además el producto necesita responder "¿a qué sector
pertenece esta coordenada?" y contar reportes recientes por sector en ventanas de tiempo.

### Alternativas consideradas
| Opción | A favor | En contra |
|---|---|---|
| Solo MySQL/PostgreSQL | Familiar; PostGIS es potente | Esquema rígido para documentos variables; el equipo no conoce PostGIS |
| Solo MongoDB | Documentos flexibles; geoespacial nativo | No sirve para rate limiting ni ventanas deslizantes |
| MongoDB + Redis | Cada motor hace lo que hace bien | Dos tecnologías que aprender y operar |

### Decisión
MongoDB para persistencia (con índices `2dsphere` sobre GeoJSON) y Redis para caché, rate limiting,
ventana deslizante de consenso y pub/sub.

### Consecuencias
- **Gana:** consultas geoespaciales sin librerías extra; el rate limiting sin login se vuelve trivial.
- **Pierde:** dos motores que levantar y monitorear; sin transacciones ACID entre ambos.
- **Condiciona:** Redis es efímero por diseño — nada crítico puede vivir solo ahí.

### Cómo se revierte
Reemplazable por adaptadores alternativos gracias a ADR-001; el dominio no cambia.

---

## ADR-004 — Consumir la API REST de Acuacar en vez de scrapear HTML

- **Fecha:** 2026-08-06
- **Estado:** Aceptada · **Reemplaza el supuesto erróneo del plan inicial**
- **Decide:** Backend – Infraestructura

### Contexto
El plan inicial afirmaba que el `robots.txt` de Acuacar **prohibía el acceso automatizado**, y sobre
ese supuesto se construyó una "decisión ética de no scrapear" con carga manual asistida.

**El supuesto era falso y nunca se verificó.** El archivo real solo contiene `Disallow: /wp-admin/`.

Al verificarlo apareció algo mejor: `acuacar.com` es WordPress con la **API REST habilitada**.
Verificado en producción el 2026-08-06:

- `GET /wp-json/wp/v2/posts` → **HTTP 200**, JSON, **307 boletines**, paginado
- Soporta `?after=`, `?modified_after=`, `?_fields=`
- `/feed/` y `/sitemap_index.xml` también responden 200

### Alternativas consideradas
| Opción | A favor | En contra |
|---|---|---|
| Carga manual por el veedor | Cero riesgo técnico | No escala; depende de que alguien esté pendiente |
| Scraping de HTML | Funciona sin API | Frágil ante cualquier rediseño |
| **API REST oficial** | Estructurada, estable, paginada, permitida | Depende de que no la deshabiliten |

### Decisión
Consumir la API REST de WordPress como fuente primaria (capa L1), con el RSS como respaldo.

### Consecuencias
- **Gana:** fuente estructurada y estable; se elimina el scraping frágil; permite reprocesar los 307
  boletines históricos para el Índice de Cumplimiento.
- **Pierde:** si Acuacar deshabilita `/wp-json/`, hay que caer al RSS.
- **Lección conservada:** verificar antes de afirmar. Va en las conclusiones del informe final.

### Cómo se revierte
Cayendo al RSS o al sitemap. El resto del pipeline no cambia (ADR-001).

---

## ADR-005 — Respetar los bloqueos de `robots.txt` a agentes de IA aunque sean evadibles

- **Fecha:** 2026-08-06
- **Estado:** Aceptada
- **Decide:** Equipo completo

### Contexto
Al auditar cada medio se encontró que **El Universal, El Tiempo, El Heraldo y Blu Radio** incluyen
reglas `Disallow: /` dirigidas por nombre a `anthropic-ai`, `Claude-Web`, `ClaudeBot`, `GPTBot` y
`CCBot`. El Universal es el diario local más relevante para Cartagena.

**Técnicamente, un colector propio con `User-Agent` `AguaVigiaCTG/0.1` no cae bajo esos nombres y
pasaría sin ser detectado.** No hay consecuencia técnica por hacerlo.

### Alternativas consideradas
| Opción | A favor | En contra |
|---|---|---|
| Usar `User-Agent` propio y acceder igual | Recupera la mejor fuente local; nadie se enteraría | Evade una restricción declarada; incoherente con la tesis del proyecto |
| Pedir permiso al medio | Legítimo | Sin canal claro; tiempos incompatibles con el proyecto |
| **Respetar el bloqueo y cubrir vía agregador** | Coherente; sin riesgo reputacional | Se pierde el acceso directo a la mejor fuente local |

### Decisión
Se respeta el bloqueo sin excepción. No se disfraza el `User-Agent`. La cobertura de esos medios se
recibe indirectamente vía Google News RSS, que es un producto de agregación al que el propio medio
decide alimentar.

Además, esos dominios se agregan a la lista `deny` de `.claude/settings.json`, para que la regla deje
de depender de que alguien la recuerde.

### Consecuencias
- **Gana:** coherencia total con la tesis del proyecto. Es difícil exigirle transparencia a un
  operador de servicios públicos mientras se entra por la puerta trasera de un periódico. Además es
  material de sustentación fuerte: un principio ético sostenido sin consecuencia técnica que lo obligue.
- **Pierde:** acceso directo a El Universal, la cobertura local más relevante.

### Cómo se revierte
Solo si el medio cambia su `robots.txt` o concede permiso explícito por escrito.

---

## ADR-006 — Exigir cita textual verificable a toda extracción de IA

- **Fecha:** 2026-08-06
- **Estado:** Aceptada
- **Decide:** Backend – Infraestructura + Scrum Master

### Contexto
La capa de IA extrae sectores, fechas y horas de texto libre. Un modelo puede alucinar un corte que
no existe. En una plataforma cuyo único activo es la credibilidad, publicar un corte falso sería peor
que no publicar nada.

### Alternativas consideradas
| Opción | A favor | En contra |
|---|---|---|
| Confiar en la salida del modelo | Simple | Riesgo de publicar información inventada |
| Revisión humana de todo | Máxima seguridad | Anula el propósito de automatizar |
| **Cita textual obligatoria + umbrales** | Verificable por código; automatiza lo seguro | Algunas extracciones válidas se rechazan |

### Decisión
Todo evento extraído incluye `citaTextual`: el fragmento exacto del documento que sustenta la
extracción. Si `documento.texto().contains(citaTextual)` es falso, **la extracción se rechaza
automáticamente**. Además: confianza ≥ 0.85 publica; 0.5–0.85 va a revisión humana; < 0.5 se archiva.

### Consecuencias
- **Gana:** la anti-alucinación deja de ser una promesa y pasa a ser una comprobación de código.
- **Pierde:** se rechazan extracciones correctas cuya cita fue parafraseada. Sesgo deliberado hacia
  la precisión sobre la exhaustividad — un corte omitido lo reporta la comunidad (capa L4); uno
  inventado destruye el proyecto.

### Cómo se revierte
Bajando el umbral o quitando la verificación. No recomendado sin sustituir por otro control.

---

## ADR-007 — Reportes ciudadanos sin registro, con rate limiting como control

- **Fecha:** 2026-08-06
- **Estado:** Aceptada
- **Decide:** Equipo completo

### Contexto
El usuario principal es un vecino sin agua, en el celular, con datos limitados y con prisa. Cualquier
fricción de registro lo pierde. Pero sin identidad, el sistema queda expuesto a reportes masivos
falsos que podrían pintar la ciudad de rojo.

### Alternativas consideradas
| Opción | A favor | En contra |
|---|---|---|
| Registro obligatorio | Trazabilidad total; anti-abuso robusto | Se pierde al usuario principal |
| Sin control alguno | Máxima facilidad | Vulnerable a manipulación trivial |
| **Sin registro + rate limit + consenso** | Fricción cero y abuso contenido | Un atacante decidido con muchas IP podría manipular |

### Decisión
Reportar no requiere cuenta. El control es triple: rate limiting por huella de dispositivo/IP en
Redis, consenso de N reportes independientes antes de cambiar un estado, y moderación posterior del
veedor.

### Consecuencias
- **Gana:** fricción cero para el usuario principal; menos datos personales que proteger (RNF008).
- **Pierde:** no hay trazabilidad individual del reportante; un ataque coordinado sigue siendo posible.
- **Condiciona:** el consenso (M3) deja de ser una funcionalidad y pasa a ser un control de seguridad.

### Cómo se revierte
Agregando autenticación opcional para reportes "verificados" sin quitar la vía anónima.

---

## ADR-008 — Registrar implementaciones, bugs y sesiones en el repositorio, no en la conversación

- **Fecha:** 2026-08-07
- **Estado:** Aceptada
- **Decide:** Equipo completo

### Contexto
Cinco personas trabajan el mismo repositorio, cada una con su propia sesión de agente de IA. Nada de
lo que ocurre en una conversación sobrevive a su cierre: ni el bug que se encontró y se arregló, ni
el motivo por el que un endpoint quedó como quedó, ni en qué punto quedó el trabajo.

Dos consecuencias concretas, no hipotéticas:

1. **El Capítulo IV del informe exige resultados medibles** (defectos encontrados, requisitos
   cubiertos, cobertura). Reconstruir eso en el Sprint 6, seis meses después, es imposible: se
   termina inventando.
2. **El contexto de IA tiene un costo real.** Sin un lugar acordado donde vive cada dato, cada sesión
   vuelve a explicar el proyecto, y cada archivo permanente crece hasta que leerlo cuesta más que el
   trabajo mismo.

La auditoría de documentación del 2026-08-07 encontró además el síntoma: la misma información
duplicada en dos carpetas `equipo/`, tres carpetas declaradas en `CLAUDE.md` que no existían, y
referencias a archivos nunca creados.

### Alternativas consideradas
| Opción | A favor | En contra |
|---|---|---|
| Confiar en el historial de Git y en los PRs | Cero esfuerzo adicional | Un commit dice *qué* cambió, no *por qué* ni qué falló antes; no hay causa raíz ni siguiente paso |
| Llevarlo todo en GitHub Issues/Projects | Herramienta hecha para eso; buena para tareas | El agente no lo lee sin conectar el MCP; se pierde al cerrar el tablero; no sirve como fuente del informe |
| Documento único de bitácora | Simple | Crece sin control y mezcla cosas de naturaleza distinta; nadie lo lee a los dos meses |
| **Tres registros separados + protocolo de contexto y rotación** | Cada registro tiene formato, dueño y límite; el agente puede llenarlos con skills | Disciplina diaria; si nadie registra, queda peor que no tenerlo |

### Decisión
Tres registros en `docs/gestion/`, cada uno con su skill que lo llena:
`registro-de-implementaciones.md` (`registrar-implementacion`), `registro-de-bugs.md`
(`registrar-bug`) y `bitacora-sesiones.md` (`cerrar-sesion`).

Los gobierna `docs/gestion/protocolo-de-contexto.md`, que fija tres cosas: **una información vive en
un solo archivo**, los archivos permanentes tienen **presupuesto de líneas** (`CLAUDE.md` ≤ 200,
`MEMORY.md` ≤ 150, `DESIGN.md` ≤ 200), y los registros **rotan** al superar su límite.

Registrar pasa a ser parte de la definición de terminado.

### Consecuencias
- **Gana:** el Capítulo IV se construye desde datos reales acumulados, no desde la memoria; una
  sesión nueva arranca en tres líneas; los bugs dejan de repetirse porque quedan con causa raíz y
  prueba; las cinco sesiones paralelas del equipo comparten los mismos hechos.
- **Pierde:** disciplina diaria. Un registro que se llena a medias es peor que no tenerlo, porque da
  falsa sensación de trazabilidad. Las skills existen justamente para bajar ese costo.
- **Condiciona:** obliga a rotar los registros al cerrar cada sprint; es tarea del Scrum Master del
  sprint (`docs/equipo/roles-y-tareas.md`).

### Cómo se revierte
Se dejan de usar las skills y los archivos quedan como histórico. No se borran: lo ya registrado
sigue siendo evidencia válida para el informe.

---

## ADR-009 — El Sprint 0 admite esqueletos e infraestructura, no funcionalidad

- **Fecha:** 2026-08-07
- **Estado:** Aceptada
- **Decide:** Equipo completo

### Contexto
El acuerdo del 2026-08-06 (`MEMORY.md`) dice que **no se escribe código de la aplicación** hasta
autorización explícita del equipo. Al día siguiente se fusionaron el PR #1 (Docker Compose, CI),
el PR #2 (GeoJSON) y el PR #5 (proyecto `/frontend` con React 19, Vite, TypeScript, Tailwind,
componentes y rutas). Nadie objetó, y con razón: sin eso el Sprint 0 no puede cerrar.

Pero el acuerdo quedó escrito como una prohibición absoluta, así que el repositorio pasó a
contradecirse solo. Tres archivos afirmaban que el código no había iniciado mientras el código ya
estaba fusionado. Un agente que lee `CLAUDE.md` literalmente se detiene ante una tarea legítima; uno
que lo ignora pierde la regla entera.

### Alternativas consideradas
| Opción | A favor | En contra |
|---|---|---|
| Mantener la prohibición literal y revertir `/frontend` | Coherente con el acuerdo | Destruye trabajo válido y deja el Sprint 0 sin poder cerrar; C0 exige que `/frontend` exista |
| Quitar la restricción: código libre desde ya | Sin fricción | Se pierde lo que la regla protegía: que nadie implemente un RF antes de que el requisito y el dominio estén cerrados |
| Autorización caso por caso en el chat | Flexible | No queda escrita; el siguiente agente no la encuentra y vuelve a preguntar |
| **Distinguir esqueleto de funcionalidad, con un criterio verificable** | Conserva la protección real y desbloquea el Sprint 0; el criterio se puede aplicar sin discutir | Hay que juzgar los casos de frontera |

### Decisión
En el Sprint 0 se permite **andamiaje**: estructura de proyecto, configuración, tokens visuales,
rutas vacías, infraestructura y CI. Se prohíbe la **funcionalidad**.

**Criterio que los separa, en una pregunta:** *¿este código implementa un `RF` de
`docs/product-requirements.md`?* Si la respuesta es sí, no va en el Sprint 0. Si es no, sí va.

Ejemplos resueltos con el criterio: una ruta `/mapa` que muestra un marcador de posición **sí**; esa
misma ruta pintando sectores desde la API **no** (RF001). Los tokens de `DESIGN.md` **sí**; el
cálculo del Índice de Cumplimiento **no** (RF021).

La restricción de fondo no cambia y sigue siendo la importante: **no se implementa un RF antes de que
su dominio esté modelado y su compuerta abierta.**

### Consecuencias
- **Gana:** el Sprint 0 puede cerrar; `CLAUDE.md` deja de contradecir al repositorio; el criterio se
  aplica solo, sin pedir permiso en cada tarea.
- **Pierde:** los casos de frontera necesitan juicio. Ante la duda, se pregunta al equipo.
- **Condiciona:** el andamiaje del Sprint 0 se registra en `registro-de-implementaciones.md` con
  `RF = —`, para que la cobertura de requisitos siga contando 0/36 mientras no haya funcionalidad.

### Cómo se revierte
Volviendo a la prohibición absoluta. Lo ya fusionado no se revierte: es andamiaje necesario.

---

## ADR-010 — La protección de ramas es política documentada, no control técnico

- **Fecha:** 2026-08-07
- **Estado:** Aceptada
- **Decide:** Equipo completo (cierre de BL-001)

### Contexto
`CLAUDE.md` afirma que *"nadie hace push directo a `main`"* y `D5-devops-qa.md` encarga a D5
*"garantizar la protección de ramas"*. Al intentarlo, D5 descubrió que no tenía rol `admin` en el
repositorio remoto y registró **BL-001**. El bloqueo se cerró dándole `admin`, pero el equipo acordó
no configurar branch protection técnica en GitHub.

El problema no es la decisión, es lo que quedó escrito: dos documentos siguen prometiendo una red que
no existe. Y ya falló: **4 de los 8 PRs del Sprint 0 se fusionaron sin revisor** (#2, #4, #6 y #7),
contra la regla de 1 revisor mínimo.

### Alternativas consideradas
| Opción | A favor | En contra |
|---|---|---|
| Configurar branch protection en GitHub | Se cumple sola, sin depender de nadie | En repositorios privados de plan gratuito las reglas son limitadas; puede estorbar en una demo o una corrección urgente |
| **Política documentada, sin bloqueo técnico** | Cero fricción; el equipo aprende a sostener el acuerdo | Depende de disciplina, y la disciplina ya falló en la mitad de los PRs del Sprint 0 |
| Ninguna regla | Honesto | Deja el proyecto sin revisión por pares, que es criterio evaluable |

### Decisión
La regla **"todo entra por PR con al menos 1 revisor, nadie hace push directo a `main` ni a
`develop`"** se mantiene como **política del equipo**, sin refuerzo técnico. Se documenta como tal en
`CLAUDE.md` para que nadie confíe en una protección inexistente.

**Control compensatorio:** el Scrum Master del sprint revisa en el review los PRs fusionados sin
revisor y los anota en la retrospectiva. Un PR sin revisor no es un delito, pero sí un dato del
Capítulo IV.

### Consecuencias
- **Gana:** el repositorio deja de prometer lo que no cumple; la regla se sostiene por acuerdo, y el
  incumplimiento queda medido en vez de invisible.
- **Pierde:** nada impide un push directo. Es un riesgo aceptado conscientemente.
- **Condiciona:** si se vuelve a incumplir de forma sistemática, se activa branch protection y esta
  decisión pasa a *Reemplazada*.

### Cómo se revierte
Activando las reglas de protección en GitHub. D5 ya tiene el rol `admin` necesario.

---

<!--
Siguiente número disponible: ADR-011
Para agregar: usa la skill `registrar-decision`.
Recuerda: append-only. Las entradas viejas solo cambian de estado, no de contenido.
-->
