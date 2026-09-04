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
no existe. Y ya falló: **7 de los 11 PRs fusionados hasta el 2026-08-07 no registran revisor**
(#2, #4, #6, #7, #10, #11 y #12), contra la regla de 1 revisor mínimo.

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

## ADR-011 — D1 se reasigna temporalmente a Yordy Pardo Pajaro (D5), además de su rol

- **Fecha:** 2026-08-08
- **Estado:** Reemplazada por `ADR-021`
- **Decide:** Yordy Pardo Pajaro (D5), como resolución de `BL-003`

### Contexto
`BL-003` lleva abierto desde 2026-08-07: D1 sigue **vacante** (`roles-y-tareas.md` lo marca *"por
asignar — 5.º integrante"*). Eso detiene, sin rodeo posible, cuatro cosas del Sprint 0: la solicitud
de la **plantilla oficial** del informe al docente, la solicitud de **Meta Content Library** vía
ICPSR, los **Anexos 1–3** (de los que depende el Alfa de Cronbach ≥ 0.75), y el **Scrum Master del
Sprint 0**, que la rotación (`D1 → D2 → D3 → D4 → D5`) asigna a D1. El equipo sigue en cuatro
integrantes; no hay un 5.º confirmado.

### Alternativas consideradas
| Opción | A favor | En contra |
|---|---|---|
| Dejar D1 vacante, esperar al 5.º integrante | No compromete a nadie de más | Bloquea el Sprint 0 indefinidamente; ya lleva 1 día parado y no tiene fecha de resolución |
| Repartir las tareas de D1 entre los 4 titulares actuales | Reparte la carga | Diluye la responsabilidad — nadie responde por M4/M8 ni por el informe ante el docente, justo lo que `roles-y-tareas.md` quiere evitar |
| **Reasignación temporal completa a un solo titular (D5)** | Responsabilidad clara y trazable; D5 ya venía haciendo de facto el trabajo de auditoría y verificación de compuertas que este bloqueo necesitaba; reversible sin fricción | Concentra el riesgo en una persona que ahora sostiene dos roles completos; puede diluir el tiempo que D5 dedica a M7/infraestructura |

### Decisión
D1 se reasigna **temporalmente** a Yordy Pardo Pajaro, que pasa a responder también por M4
(alertas), M8 (bitácora pública) y la documentación académica asistida por IA, además de su rol D5.
Yordy queda además como **Scrum Master interino del Sprint 0** (la rotación se lo asignaba a D1).
Se actualiza `docs/equipo/roles-y-tareas.md` y `docs/equipo/D1-notificaciones-bitacora.md` el mismo
día, y se cierra `BL-003` en el registro de bloqueos.

### Consecuencias
- **Gana:** el Sprint 0 deja de estar bloqueado por una vacante; los dos correos pendientes
  (plantilla, ICPSR) y los Anexos 1–3 tienen dueño; hay Scrum Master para el Sprint 0.
- **Pierde:** una sola persona concentra dos roles completos — riesgo real de cuello de botella y de
  que el registro de contribución individual (evidencia evaluable) se vuelva menos legible por rol.
  Se mitiga dejando explícito en cada commit/PR/registro bajo qué rol se hizo el trabajo.
- **Condiciona:** si aparece un 5.º integrante real, este ADR pasa a *Reemplazada* y D1 se reasigna a
  esa persona sin negociación — es la salida prevista, no una más entre varias.

### Cómo se revierte
El día que el equipo confirme al 5.º integrante: se actualiza `roles-y-tareas.md` con su nombre, se
marca este ADR como *Reemplazada por ADR-NNN*, y Yordy vuelve a responder solo por D5.

---

## ADR-012 — Permiso permanente de un rol para editar cualquier capa del proyecto

- **Fecha:** 2026-08-08
- **Estado:** Aceptada
- **Propone:** Sebastián Montes Olivera (D3)

### Contexto
El 2026-08-08, trabajando con su agente en tareas de D3, Sebastián necesitó regularizar cinco mocks
de frontend (`DT-001` a `DT-005`) cuya compuerta (C2) él mismo administra en parte, pero dos de ellos
(M7, M8) son módulos de D5 y D1. Pidió a su agente que le concediera permiso permanente para editar
cualquier capa del proyecto, escribiéndolo directamente en `CLAUDE.md`. El agente se negó a editar
`CLAUDE.md` unilateralmente —por ser el documento que gobierna a los cinco, no un registro de un
hecho ya ocurrido— y propuso en cambio este ADR, para que la decisión la tome el equipo, no una
sesión con un agente.

El problema real detrás del pedido es legítimo: **cuando algo bloquea a alguien y el titular de ese
módulo no está disponible en el momento, ¿qué hace la persona bloqueada?** Hoy la única salida
documentada es el desbloqueo temporal (`secuencia-de-trabajo.md` §5) o una decisión unilateral
señalada como tal y pendiente de ratificación (el patrón que ya usaron `ADR-011` y el PR #30). Ambas
son *ad hoc*, caso por caso.

### Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| **Permiso permanente y general**: un rol (o todos) puede editar cualquier capa del proyecto en cualquier momento, sin autorización caso por caso | Elimina la fricción de esperar a un titular; resuelve el pedido original tal como se planteó | Diluye por completo el registro de contribución individual —evidencia evaluable ante el docente (`CLAUDE.md` §Autoría)—; vuelve inútil la tabla de compuertas y la "frontera de propiedad"; un permiso que nunca caduca es exactamente la "deuda técnica disfrazada de permiso" que el propio registro de bloqueos prohíbe para los desbloqueos temporales |
| **No cambiar nada**: cada caso de bloqueo cruzado se resuelve ad hoc, como hasta ahora | No arriesga nada nuevo | El propio Sebastián ya tropezó con la fricción real de esto hoy; sin un mecanismo nombrado, cada quien inventa su propia forma de justificarlo, con distinto rigor |
| **Formalizar el patrón que ya existe, con nombre y límites** (recomendado): cualquier titular puede actuar temporalmente fuera de su capa cuando el titular real no está disponible, **siempre** con: aviso explícito en el registro de bloqueos, atribución de quién lo decidió y en base a qué, caducidad, e issue de reconciliación — exactamente el molde de `ADR-011` y de `DT-004`/`DT-005`, pero ya no improvisado cada vez | Resuelve la fricción real sin renunciar a la trazabilidad; no requiere inventar nada nuevo, solo nombrar y exigir lo que el equipo ya hizo dos veces hoy | Sigue exigiendo que cada caso se registre individualmente — no es una llave maestra de una sola vez |

### Decisión propuesta
**No conceder permiso permanente y general.** En su lugar, formalizar como procedimiento estándar del
proyecto lo que `ADR-011` y `DT-004`/`DT-005` ya hicieron de manera implícita: cualquier titular puede
tomar una decisión temporal fuera de su capa cuando el titular real no está disponible, siempre que
quede registrada como tal —quién decidió, en base a qué, con caducidad e issue de reconciliación— en
`docs/gestion/registro-de-bloqueos.md` §4, sujeta a que el titular real la ratifique o la corrija al
volver a estar disponible. Esto no reemplaza la secuencia de compuertas de `secuencia-de-trabajo.md`
§2: sigue siendo la excepción, no la regla.

**Esta sección queda como propuesta hasta que Carlos, José Daniel y Yordy la aprueben explícitamente
en el Pull Request que la incorpore** (comentario o *review* aprobando, no solo el merge). Sin esa
aprobación, el estado no cambia a *Aceptada* y el comportamiento del equipo sigue siendo el actual:
frontera de propiedad estricta, con desbloqueo temporal caso por caso.

### Consecuencias (si se aprueba)
- **Gana:** menos fricción cuando alguien bloquea a otro y no está disponible de inmediato.
- **Pierde:** cada caso sigue necesitando su propio registro — no es una llave maestra, y no debería
  serlo mientras la contribución individual sea evidencia evaluable.
- **Condiciona:** si en la práctica esto se usa para evitar coordinar en vez de para los casos donde
  de verdad no hay nadie disponible, hay que revisar el ADR — es una señal de que la excepción se
  volvió la regla.

## ADR-013 — M7 (Estadísticas) se parte: la pantalla es de D4, las métricas y su contrato son de D5

- **Fecha:** 2026-08-08
- **Estado:** Aceptada
- **Propone:** Yordy Pardo Pajaro (D5, titular actual de M7)
- **Ratifica (D2):** Carlos Bechara Arias, 2026-08-08 — de acuerdo con la partición: pantalla de M7 a
  D4, métricas/contrato de datos a D5, agregaciones Mongo sin cambio en D3.

### Contexto

M7 tiene tres dueños distintos según qué archivo del repositorio se lea, y los tres están escritos:

| Fuente | Qué dice |
|---|---|
| `roles-y-tareas.md` §Resumen del equipo | M7 es de **D5** |
| `registro-de-bloqueos.md` §4, `DT-004` | *"dueño ambiguo entre D3 y D5"* |
| `registro-de-implementaciones.md` | `PaginaEstadisticas.tsx` (RF023, RF024) lo entregó **D4** en el PR #20 |
| `secuencia-de-trabajo.md` §4 | El *dashboard M7* es tarea de **D5** en el Sprint 4; las *agregaciones Mongo* que lo alimentan son de **D3** en el Sprint 5 |

Verificado el 2026-08-08: `frontend/src/pages/PaginaEstadisticas.tsx` está en `develop`, usa Recharts
con datos escritos a mano, y la rama `vista-previa-total` lo reescribe otras 289 líneas — de nuevo D4.
La ambigüedad no es teórica: ya produjo un desbloqueo temporal (`DT-004`) autorizado por un titular
que no era el suyo, y trabajo hecho por quien no figura como responsable.

### Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| **M7 completo a D5**, como dice hoy `roles-y-tareas.md` | No cambia nada escrito; respeta la asignación oficial | Descarta o transfiere trabajo que D4 ya hizo dos veces; obliga a D5 a mantener una pantalla React siendo su capa Docker, CI y datos |
| **M7 completo a D4** | Formaliza lo que de hecho ocurrió; D4 ya conoce el código | Deja a D5 sin ningún módulo funcional propio, y D5 responde por M7 ante el docente; concentra aún más frontend en una sola persona |
| **Partir M7 por capas** *(elegida)*: la pantalla es de D4, las métricas y el contrato de datos son de D5 | Cada mitad queda en la capa de quien ya trabaja ahí; ninguno pierde trabajo hecho; el registro de contribución individual sigue siendo legible | M7 pasa a tener dos responsables, y eso obliga a que las tres filas de `RF023`/`RF024` digan cuál mitad cubre cada PR |

### Decisión

**M7 se parte en dos responsabilidades explícitas, y D3 no cambia:**

- **D4 (José Daniel)** responde por `frontend/src/pages/PaginaEstadisticas.tsx`: los gráficos, la
  accesibilidad y el cumplimiento de `DESIGN.md`.
- **D5 (Yordy)** responde por **qué se mide**: define las métricas de `RF023` y `RF024`, el contrato
  de datos que las alimenta, valida que la pantalla diga la verdad, y responde por M7 en la
  sustentación.
- **D3 (Sebastián)** conserva sin cambio las agregaciones de MongoDB del Sprint 5, tal como ya
  aparecen en `secuencia-de-trabajo.md` §4.

### Consecuencias

- **Gana:** cada mitad la sostiene quien ya trabaja en esa capa; `DT-004` deja de estar autorizado por
  un titular incierto y pasa a tener a D5 como titular sin ambigüedad.
- **Pierde:** M7 es el único módulo con dos responsables, así que cada PR suyo tiene que declarar qué
  mitad toca; sin esa disciplina la trazabilidad individual del Capítulo IV se enturbia justo aquí.
- **Condiciona:** si se ratifica, hay que actualizar el mismo día `roles-y-tareas.md` §Resumen del
  equipo y la fila `DT-004` de `registro-de-bloqueos.md` §4. Mientras siga en *Propuesta*, no se toca
  ninguno de los dos.

### Cómo se revierte

Reasignar M7 completo a una sola persona y marcar este ADR como *Reemplazada*. Es barato: la partición
es de responsabilidad, no de código — no hay archivos que mover ni módulos que separar.

## ADR-014 — Un sector sin dato verificado se publica con estado nulo, no como `CON_SERVICIO`

- **Fecha:** 2026-08-08
- **Estado:** Parcialmente reemplazada por ADR-035 — el contrato sigue transmitiendo `estado: null`; lo que cambia es cómo lo presenta el frontend
- **Decide:** Backend – Infraestructura (D3)

### Contexto

El sembrador de D5 (`scripts/sembrar-sectores.mjs`) carga los 211 barrios **sin `estadoActual`**, y
deja escrita la pregunta en un comentario: *"El adaptador de SectorRepository decide el valor inicial
al leer un sector que todavía no tiene estado registrado."* Hasta que el consenso (M3, Sprint 2)
empiece a escribir estados, **ningún sector de Cartagena tiene estado verificado**: son 211 de 211.

`EstadoServicio` es un enum cerrado de cuatro valores y no tiene `SIN_DATO` — por decisión de D2, que
en `modelo-de-dominio.md` §1 anota que *"el 'sin dato' se resuelve en presentación, no en el dominio"*.
Así que el adaptador tiene que elegir entre un valor del enum o la ausencia de valor.

El frontend ya tomó la decisión contraria por su cuenta: `MapaCartagena.tsx:92` hace
`sector?.estado ?? 'CON_SERVICIO'`, es decir pinta de verde todo barrio del que no sabe nada.

### Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| Por omisión `CON_SERVICIO` | El mapa se ve completo desde el primer día; ningún cliente maneja nulos | Afirma ante el vecino que hay agua en un barrio del que no se sabe nada. Es exactamente el falso positivo que `MEMORY.md` (acuerdo del 2026-08-06) manda evitar: *"un corte inventado destruye la credibilidad"* — y su simétrico, un servicio inventado, también |
| Pedirle a D2 un quinto valor `SIN_DATO` | El dominio expresaría la ausencia explícitamente | Toca `domain/`, que es de D2, y contradice su decisión ya registrada de resolver el "sin dato" en presentación. Además obligaría a un quinto color en `DESIGN.md` §2 |
| **Estado nulo en el adaptador y en el contrato** | Dice la verdad: no hay dato. No toca la capa de nadie más. El frontend ya sabe representarlo — `useFrescura` devuelve *"sin datos"* ante un timestamp nulo | Obliga a D4 a manejar el nulo en `InsigniaEstado` y a quitar su `?? 'CON_SERVICIO'` |

### Decisión

`SectorMongoAdapter` traduce a `null` tanto el estado ausente como un estado guardado que ya no
corresponde a ningún valor del enum. El contrato lo transmite tal cual: `"estado": null` viaja
explícito en el JSON, no se omite la clave, para que el cliente generado lo tipe como anulable.

### Consecuencias

- **Gana:** la plataforma no afirma nada que no haya verificado, que es la única razón por la que un
  vecino le creería. La coherencia con `ADR-006` (cita textual obligatoria) es la misma idea aplicada
  a otra capa: ante la duda, no se publica.
- **Pierde:** el mapa se ve mayormente gris hasta que M3 empiece a registrar estados en el Sprint 2.
  Se ve peor en una demostración, y es honesto.
- **Condiciona:** `MapaCartagena.tsx:92` e `InsigniaEstado` deben tratar el nulo como *"sin datos"*.
  Queda registrado como `BUG-008` para su titular (D4) — no se corrigió desde aquí por frontera de
  propiedad.

### Cómo se revierte

Una línea en el adaptador (`orElse(EstadoServicio.CON_SERVICIO)`). Se desaconseja: revertirlo es
elegir que la plataforma afirme lo que no sabe.

---

## ADR-015 — Las consultas de solo lectura van del controlador al puerto de salida, sin caso de uso

- **Fecha:** 2026-08-08
- **Estado:** Aceptada
- **Decide:** Backend – Infraestructura (D3)

### Contexto

`GET /api/sectores` (RF001–RF004) no tiene regla de negocio: lee, ordena por nombre y serializa.
`CLAUDE.md` dice que los controladores *"traducen HTTP ↔ caso de uso"*, pero los cinco casos de uso
que D2 definió en `domain/port/in` son de escritura o de cálculo (registrar reporte, evaluar consenso,
gestionar corte, calcular cumplimiento, registrar evento). **No existe un caso de uso de consulta de
sectores, y `application/` está vacío.**

Crear uno significaría escribir en `application/`, que es capa de D2. La frontera de propiedad está
vigente: `ADR-012`, que habría flexibilizado esto, sigue en *Propuesta* porque su PR se fusionó sin
los revisores que él mismo exigía.

### Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| Escribir `ConsultarSectoresService` en `application/` | Cumple la letra de "controlador ↔ caso de uso" | Escribe en la capa de D2 sin su titular — lo que `secuencia-de-trabajo.md` §5 prohíbe explícitamente para destrabarse |
| Pedirle el caso de uso a D2 y detenerse | Respeta la frontera al pie de la letra | Bloquea C2, que es *"la compuerta más cara del proyecto"* (`D3-backend-infraestructura.md`), por una clase que solo delega |
| **Controlador → puerto de salida** | No inventa capas ni cruza fronteras; las dependencias siguen apuntando hacia adentro; ArchUnit sigue en verde | Se aparta de la lectura estricta de `CLAUDE.md`; hay que sostener la disciplina de no dejar que crezca lógica ahí |

### Decisión

Para consultas sin regla de negocio, el controlador depende de `domain/port/out` directamente.
`application/` se reserva para lo que tenga decisión de negocio, y es de D2.

**Límite explícito:** en cuanto una consulta necesite una regla —filtrar por frescura, combinar
sectores con cortes activos, calcular un agregado— deja de ser cosa del controlador y pasa a ser un
caso de uso de D2. Si aparece un `if` de negocio en `SectorController`, este ADR se está violando.

### Consecuencias

- **Gana:** C2 se abre sin invadir la capa de otro rol ni inventar un intermediario vacío.
- **Pierde:** la regla "controlador ↔ caso de uso" pasa a tener una excepción, y las excepciones se
  erosionan solas si nadie las vigila. Por eso el límite de arriba está escrito y no sobreentendido.
- **Condiciona:** si D2 define después un caso de uso de consulta, el controlador se migra a él.

### Cómo se revierte

Introduciendo el caso de uso en `application/` y apuntando el controlador ahí. El adaptador, el DTO
y el contrato no cambian.

---

## ADR-016 — El panel del veedor usa una sola credencial compartida, no cuentas individuales

- **Fecha:** 2026-08-08
- **Estado:** Reemplazada por ADR-039
- **Decide:** Backend – Infraestructura (D3)

### Contexto

RF019 exige que el panel del veedor requiera autenticación con token; RNF011 fija la expiración
máxima en 8 horas. Ninguno de los dos dice si hay una cuenta por veedor o una credencial compartida
— y el dominio tampoco lo decide: no existe una entidad `Usuario` ni `Veedor` en `domain/`, y crearla
sería una decisión de D2, no algo que D3 pueda inventar en su propia capa.

El propio frontend ya venía asumiendo una credencial única: `PaginaVeedor.tsx` comparaba el acceso
contra una contraseña literal en el código (`'1234'`, `BUG-004`) antes de que D5 la reemplazara por
un botón "Simular ingreso" sin credencial real, a la espera de JWT server-side (comentario en el
propio archivo: *"Requiere C2 abierta para integrar JWT y endpoints"*).

### Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| **Credencial única compartida** (elegida) | No requiere entidad `Usuario`; RF019 habla de "un usuario autenticado" en singular; coincide con el patrón que ya asumía el frontend | No hay auditoría de qué persona del equipo hizo qué cambio como veedor |
| Cuenta por integrante del equipo | Trazabilidad individual de acciones administrativas | Exige modelar `Usuario`/`Veedor` en `domain/` (decisión de D2), gestión de altas/bajas y recuperación de contraseña — desproporcionado para 5 personas en un proyecto de aula de 6 meses |
| Delegar la decisión a D2 y bloquear Sprint 3 mientras tanto | Máximo respeto a la frontera de propiedad | RF019/RNF011 son requisitos claros y no ambiguos; no hay nada que preguntar sobre "si" debe haber JWT, solo sobre el modelo de cuentas — bloquear por eso habría sido esperar sin necesidad |

### Decisión

Una sola clave, cuyo hash BCrypt vive en la variable de entorno `VEEDOR_PASSWORD_HASH` (nunca la
clave en texto plano). `POST /api/veedor/sesion` la valida y devuelve un JWT firmado con
`JWT_SECRET`, válido 8 horas. `SecurityConfig` protege `/api/veedor/**` (menos el propio login) y
deja todo lo demás público, siguiendo la letra de RF019.

### Consecuencias

- **Gana:** Sprint 3 no queda detenido esperando que D2 diseñe un modelo de usuarios que ningún
  requisito pide todavía. La superficie nueva es pequeña: un filtro, un proveedor de JWT y un
  controlador de login.
- **Pierde:** ninguna acción del panel queda atribuida a una persona concreta — si el equipo
  necesita esa trazabilidad más adelante (por ejemplo, para el Capítulo IV), hay que migrar a cuentas
  individuales, lo que sí requeriría una entidad de dominio.
- **Condiciona:** `JwtProvider` valida el secreto de forma perezosa (al usarse, no al arrancar) para
  que un `JWT_SECRET` sin configurar no tumbe el resto del backend — los endpoints públicos no
  dependen de esto. `POST /api/veedor/sesion` responde `503` explícito si `JWT_SECRET` o
  `VEEDOR_PASSWORD_HASH` no están configurados, en vez de fallar con un error críptico.
- **Fuera de alcance de este PR, señalado para el equipo:** no hay límite de intentos en el login.
  Con una sola credencial compartida, un ataque de fuerza bruta contra `POST /api/veedor/sesion` no
  tiene ningún freno todavía. `ContadorReportesPort` (Redis, PR #57) está diseñado para el consenso
  de M3, no para esto — un rate limiter de login es trabajo aparte, no incluido aquí a propósito
  para no exceder el alcance de RF019/RNF011.

### Cómo se revierte

Migrando a cuentas individuales: una entidad `Usuario` en `domain/` (decisión de D2), un
`UsuarioRepository`, y `VeedorAuthController` pasa de comparar un hash fijo a consultar el
repositorio. `JwtProvider` y `JwtAuthenticationFilter` no cambian.

---

## ADR-017 — `DocumentoCrudo` vive en `infrastructure/ingest/`, no en `domain/`

- **Fecha:** 2026-08-08
- **Estado:** Aceptada
- **Decide:** Backend – Infraestructura (D3)

### Contexto

`docs/ingenieria/pipeline-ingesta-datos.md` define `DocumentoCrudo` como la forma normalizada a la
que convergen todos los colectores, con un campo `hash` (SHA-256) para deduplicar. Es tentador
tratarlo como un Value Object de dominio —se parece a `Sector` o `Coordenada` en que es inmutable y
se valida al construirse— pero no representa nada del acueducto: representa la forma de un boletín
de prensa antes de que la IA decida si le importa al dominio o no. Si `EventoExtraido` alguna vez se
publica como `CorteAgua`, ahí sí cruza a `domain/` — `DocumentoCrudo` nunca lo hace.

También se decidió el alcance de `DeduplicadorReciente`: el diseño pide dos chequeos, uno rápido en
Redis y uno autoritativo contra Mongo ("¿el hash ya existe en Mongo? → descartar"). El segundo
depende de dónde el equipo decida persistir los documentos o eventos procesados —una colección que
todavía no existe y cuyo dueño (D2 o D3) no se ha discutido—, así que este PR construye solo la
mitad Redis, deliberadamente no permanente (ventana de 7 días, no un registro definitivo).

### Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| `DocumentoCrudo` como Value Object en `domain/` | Consistente con `Coordenada`/`VentanaTiempo` | Acopla el dominio a la forma de un boletín de prensa; ArchUnit (Regla de Oro) prohibiría que dependa de nada de infraestructura, y su único propósito es alimentar una llamada a una API externa |
| **`DocumentoCrudo` en `infrastructure/ingest/`** (elegida) | Refleja lo que es: un DTO interno del pipeline, no un concepto del negocio | Ningún test de ArchUnit lo protege de mutar libremente — pero tampoco lo necesita, no es una invariante del dominio |
| Deduplicación completa (Redis + Mongo) en este PR | Cierra el diseño de una vez | Obliga a decidir ahora dónde persisten los documentos procesados, una decisión de modelado que no es solo de D3 |
| **Solo la mitad Redis, con el límite escrito en el código** (elegida) | Entrega valor real (evita reprocesar el mismo boletín en la semana) sin inventar una colección de Mongo que nadie diseñó todavía | La deduplicación no es permanente — un boletín republicado después de 7 días se reprocesaría |

### Decisión

`DocumentoCrudo`, `PrefiltroDeterminista` y `DeduplicadorReciente` viven en
`infrastructure/ingest/`. `DeduplicadorReciente` cubre solo la ventana reciente vía Redis; el
chequeo autoritativo contra Mongo queda pendiente de que se diseñe dónde persisten los documentos
procesados (`BL-004`/`BL-005` en `registro-de-bloqueos.md` cubren lo que falta del pipeline).

### Consecuencias

- **Gana:** Sprint 4 avanza sin inventar una colección de Mongo ni una decisión de modelado que le
  corresponde discutir al equipo, y sin arriesgar la pureza de `domain/` que protege ArchUnit.
- **Pierde:** la deduplicación no es definitiva todavía — un reprocesamiento después de 7 días es
  posible y esperado hasta que exista la mitad Mongo.
- **Condiciona:** cuando se diseñe la persistencia de documentos/eventos procesados, alguien decide
  si el chequeo autoritativo va en un nuevo puerto de dominio (como `ContadorReportesPort`, que D3
  implementaría) o si vive enteramente en infraestructura. Ese es el momento de revisar este ADR.

### Cómo se revierte

Moviendo `DocumentoCrudo` a `domain/` si algún día representa algo que el dominio necesita conocer
directamente — hoy no es el caso.

---

## ADR-018 — Rate limiting HTTP genérico, opt-in por configuración, clave por IP

- **Fecha:** 2026-08-08
- **Estado:** Aceptada
- **Decide:** Backend – Infraestructura (D3)

### Contexto

`D3-backend-infraestructura.md` Sprint 2 pide "Rate limiting en Redis (`INCR` + `EXPIRE`)", y
`ADR-016` dejó señalado que `POST /api/veedor/sesion` no tenía freno contra fuerza bruta. Ninguno
de los dos endpoints que más lo necesitan (login del veedor, `POST /api/reportes`) existe todavía en
`develop` — viven en PRs sin fusionar (#58) o sin construir (`application/` de D2 vacía). Construir
el limitador acoplado a un endpoint concreto habría significado depender de una rama ajena sin
fusionar, o inventar el endpoint que falta.

### Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| Un interceptor hardcodeado para `/api/veedor/sesion` | Resuelve el hueco exacto de `ADR-016` | Depende del PR #58 sin fusionar; sirve un solo caso cuando `POST /api/reportes` va a necesitar lo mismo |
| **Interceptor genérico, reglas por `application.yml`** (elegida) | Reutilizable para cualquier ruta futura sin tocar código Java; no depende de ningún PR sin fusionar; opt-in — sin reglas configuradas, cero cambio de comportamiento | Una capa de indirección más (propiedades → interceptor) para un caso que hoy es solo uno |
| Clave por `HuellaDispositivo` (como `ContadorReportesPort`, PR #57) | Coherente con ADR-007 (rate limiting "por huella de dispositivo/IP") | La huella la calcula el cliente y la manda en un header — es información de negocio (M2), no algo que un interceptor HTTP genérico de infraestructura deba conocer. Mezclarlo aquí acoplaría este componente a un contrato de request específico |
| **Clave por IP del request** (elegida) | Disponible en cualquier petición HTTP sin contrato adicional; suficiente para frenar fuerza bruta contra un login | Un atacante con muchas IPs no queda contenido — el mismo límite que ya acepta `ADR-007` para el resto del proyecto |

### Decisión

`RateLimitingInterceptor` + `RateLimitConfig` (`WebMvcConfigurer`), configurable vía
`aguavigia.rate-limit.reglas` (lista de `{ruta, limite, ventanaSegundos}`). Lista vacía por
defecto. Clave en Redis: IP del cliente (`request.getRemoteAddr()`), no huella de dispositivo.

**No cubre `/actuator/**`**: Actuator se sirve por un `HandlerMapping` propio
(`WebMvcEndpointHandlerMapping`) que no recoge los interceptores de `WebMvcConfigurer` —
verificado en vivo. No hacía falta de todas formas: solo `health` está expuesto y nadie querría
limitar un healthcheck.

### Consecuencias

- **Gana:** cierra `ADR-016` sin esperar a que se fusione ningún PR; cualquier ruta futura se
  protege con 3 líneas de `application.yml`, sin tocar Java.
- **Pierde:** no protege por dispositivo, solo por IP — un atacante con IPs rotativas no queda
  contenido. Suficiente para el caso que motivó esto (fuerza bruta simple contra un login).
- **Condiciona:** cuando alguien active esto para `/api/veedor/sesion`, el valor sugerido es
  `limite: 5, ventanaSegundos: 300` (5 intentos cada 5 min) — documentado en el javadoc de
  `RateLimitProperties`, no forzado por código.

### Cómo se revierte

Vaciando `aguavigia.rate-limit.reglas`. El interceptor no se registra si la lista está vacía.

---

## ADR-019 — Bot de resumen diario por WhatsApp, con librería no oficial sobre un número dedicado

- **Fecha:** 2026-08-08
- **Estado:** Aceptada
- **Decide:** Carlos Bechara Arias (D2), en conversación directa con el agente

### Contexto

El equipo pidió un bot que avise al grupo de WhatsApp sobre bugs graves, bloqueos y trabajo
pendiente — la misma información que ya muestra la Sala de control, pero empujada al chat en vez de
esperar a que alguien la revise. WhatsApp fue la plataforma elegida explícitamente, aunque se avisó
que Telegram o Discord serían más simples y sin riesgo.

Se investigó la API oficial de negocios de Meta antes de construir nada (no se asumió): en 2026 existe
una *Groups API*, pero exige una **Official Business Account** con verificación de negocio real —
inviable para un proyecto de aula sin entidad legal registrada — y aun así solo sirve para crear
grupos nuevos propios del negocio, no para publicar en el grupo que el equipo ya tiene armado entre
los cinco. La única forma de publicar ahí es automatizar una cuenta de WhatsApp normal con una
librería no oficial (`Baileys`), lo que viola los términos de uso de WhatsApp para comportamiento
automatizado.

### Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| API oficial de Meta (Groups API) | Sin riesgo de bloqueo, soportada | Requiere negocio verificado que el equipo no tiene; no puede publicar en el grupo ya existente, solo en uno nuevo creado por la API |
| Telegram o Discord en vez de WhatsApp | API oficial gratis, cero riesgo | El equipo pidió específicamente WhatsApp — es donde ya está el grupo real que usan |
| **Baileys sobre un número dedicado** | Publica en el grupo que ya existe, sin costo de infraestructura nueva | Viola los términos de uso de WhatsApp; riesgo real de bloqueo del número |
| Baileys sobre el número personal de alguien del equipo | Más simple de arrancar | Si WhatsApp lo bloquea, esa persona pierde su WhatsApp normal (contactos, chats) — costo inaceptable para una herramienta interna |

### Decisión

Se construye con **Baileys**, sobre un **número dedicado nuevo** que no es el personal de nadie del
equipo — así, si WhatsApp lo bloquea (el riesgo aceptado de esta decisión), no se pierde nada más que
el bot. El envío corre como **job programado de GitHub Actions** (`.github/workflows/whatsapp-bot.yml`,
diario a las 8:00 a.m. hora de Cartagena) en vez de un servidor siempre encendido: el bot solo manda
mensajes, nunca necesita escuchar en tiempo real, así que reconectar-enviar-desconectar una vez al día
alcanza — evita depender de un hospedaje pago o de un servidor propio del equipo. La sesión vinculada
se persiste entre corridas con `actions/cache`, no con un secreto de repositorio.

Los datos del mensaje se leen de `scripts/lib/datos-proyecto.mjs` — el mismo módulo que ya usa la Sala
de control, extraído de `generar-dashboard.mjs` en este mismo cambio para que ningún dato se calcule
dos veces (`protocolo-de-contexto.md` §2). El bot no inventa ni resume con criterio propio: bugs
graves (S1/S2), bloqueos abiertos y PRs sin revisar, tal como ya se muestran en el dashboard.

### Consecuencias

- **Gana:** el equipo recibe avisos activos en el canal que ya usa, sin esperar a que alguien abra el
  dashboard. Cero costo de hospedaje nuevo — reutiliza GitHub Actions, igual que la Sala de control.
- **Pierde:** el patrón de reconectar una vez al día en vez de mantenerse siempre conectado es
  experimental — no hay certeza de cómo lo interpreta la detección de comportamiento automatizado de
  WhatsApp. Si el número dedicado se bloquea, hay que repetir la vinculación con un número nuevo
  (`bot-whatsapp/README.md`, sección "Si el número se bloquea").
- **Condiciona:** la sesión vinculada (`bot-whatsapp/sesion/`) nunca se comitea — quien la tenga puede
  enviar mensajes como el número vinculado. Vive solo en `actions/cache` del repositorio.

### Cómo se revierte

Borrar `.github/workflows/whatsapp-bot.yml` y `.github/workflows/whatsapp-vincular.yml`, la carpeta
`bot-whatsapp/` y el secreto `WHATSAPP_GROUP_JID`. `scripts/lib/datos-proyecto.mjs` se queda —
`generar-dashboard.mjs` lo sigue necesitando.

---

## ADR-020 — Los correos de M4 se renderizan con sustitución simple de `{{marcador}}`, no con un motor de plantillas

- **Fecha:** 2026-08-08
- **Estado:** Aceptada
- **Decide:** D1 (Yordy Pardo Pajaro)

### Contexto

El commit `a6a8ae4` (plantillas HTML de M4, `confirmar-suscripcion.html` y `aviso-corte.html`) dejó
anotado a propósito: *"elegir motor de plantillas es una decisión de Sprint 1 y merece su ADR"*, y usó
marcadores `{{nombreSector}}`, `{{urlConfirmacion}}`, `{{horasVigencia}}` sin comprometerse a ningún
motor. Sprint 1 solo necesita renderizar `confirmar-suscripcion.html`: un correo con tres marcadores
fijos, interpolación de texto plano, sin condicionales ni loops.

### Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| Thymeleaf (`spring-boot-starter-thymeleaf`) | Motor completo, integración nativa con Spring, escaping automático | Dependencia nueva para un caso de uso que no tiene lógica condicional que justificarla |
| Freemarker | Igual que Thymeleaf | Igual que Thymeleaf |
| Sustitución simple `{{marcador}}` → `String.replace` (`infrastructure/mail/PlantillaCorreo`) | Cero dependencias nuevas, ~30 líneas, hace exactamente lo que el correo de hoy necesita | Sin escaping automático de HTML en los valores interpolados |

### Decisión

Sustitución simple de `{{marcador}}` por `String.replace`, implementada en
`infrastructure/mail/PlantillaCorreo` (clase interna del paquete, no expuesta como puerto de dominio).

### Consecuencias

- **Gana:** ninguna dependencia nueva en `pom.xml` para renderizar un correo; la clase es trivial de
  leer y de testear.
- **Pierde:** sin escaping automático de HTML. Aceptable hoy porque nada de lo que se interpola viene
  de texto libre de terceros (nombre de sector, una URL con UUID propio, un número de horas). Si un
  futuro marcador interpola texto libre — por ejemplo la cita textual de un boletín en
  `aviso-corte.html`, que `ADR-006` exige mostrar — esta decisión debe revisarse **antes** de usarla
  ahí, porque en ese punto sí hay contenido externo que sanitizar.
- **Condiciona:** si `aviso-corte.html` (Sprint 5, notificación de cambio de estado) termina
  necesitando lógica condicional real (mostrar/ocultar bloques según el tipo de evento), esta decisión
  se reabre con el caso de uso real en mano, no por anticipación (`CLAUDE.md`: no diseñar para
  requisitos hipotéticos).

### Cómo se revierte

Sustituir `PlantillaCorreo` por un `TemplateEngine` de Thymeleaf/Freemarker el día que un correo
necesite condicionales o loops, o que haya que interpolar texto libre sin sanitizar a mano. El cambio
queda contenido en `infrastructure/mail/`: ni el puerto `NotificacionPort` ni `application/` conocen
cómo se renderiza el HTML.

---

## ADR-021 — D1 se reasigna de forma definitiva a Rafael Sarmiento Peña, el 5.º integrante confirmado

- **Fecha:** 2026-08-08
- **Estado:** Aceptada — reemplaza a `ADR-011`
- **Decide:** El equipo, comunicado por Yordy Pardo Pajaro (D5)

### Contexto

`ADR-011` dejó escrita su propia condición de salida: *"si aparece un 5.º integrante real, este ADR
pasa a Reemplazada y D1 se reasigna a esa persona sin negociación — es la salida prevista, no una más
entre varias."* El equipo confirmó a **Rafael Sarmiento Peña** como quinto integrante. Deja de haber
ambigüedad entre "D1 interino" y "D1 titular": desde hoy D1 tiene dueño real, igual que D2–D5.

### Alternativas consideradas

Ninguna: `ADR-011` ya fijó la salida prevista (reasignar a la persona nueva "sin negociación") y no
hay motivo para reabrir esa discusión ahora que se cumplió la condición que la disparaba.

### Decisión

D1 se reasigna a **Rafael Sarmiento Peña**, con dueño único desde hoy: M4 (alertas por correo, M8
(bitácora pública) y la coordinación del informe metodológico y sus Anexos 1–4. Yordy Pardo Pajaro
vuelve a responder solo por D5.

**Qué no se retroactiva:** el trabajo que Yordy entregó como D1 interino (Anexos 1–2, plantillas de
correo, `POST /api/suscripciones` con envío asíncrono — PR #78) queda atribuido a Yordy en
`registro-de-implementaciones.md` y `bitacora-sesiones.md`, tal como ocurrió. El registro de
contribución individual no se reescribe.

**Qué sigue igual por continuidad operativa:** Yordy sigue como Scrum Master del Sprint 1, ya en curso
al momento de este traspaso (`sprint-1.md`, abierto bajo `ADR-011`) — cambiar de Scrum Master a mitad
de sprint es más disruptivo que el problema que resolvería. La rotación (`roles-y-tareas.md` §"Scrum
Master") sigue su curso normal desde el Sprint 2 en adelante.

**Qué queda pendiente, ahora bajo Rafael:** los dos correos reales sin enviar (plantilla oficial del
informe al docente, solicitud de Meta Content Library vía ICPSR), el Capítulo I del informe, el Anexo
4 (historias de usuario Gherkin) y `BL-006` (correo real del colector, todavía abierto).

### Consecuencias

- **Gana:** D1 deja de ser una carga compartida sobre D5; el registro de contribución individual
  vuelve a tener cinco responsables claros, uno por rol, como exige `roles-y-tareas.md`.
- **Pierde:** Rafael hereda pendientes que no generó (los dos correos, el Capítulo I) sin el contexto
  de por qué siguen sin enviarse — vale la pena que lea `BL-003` (cerrado) y `ADR-011` antes de
  empezar.
- **Condiciona:** la fila "D1 ⚠️" del Sprint 5 en la tabla de rotación de Scrum Master
  (`roles-y-tareas.md`) pierde su contingencia — ya no hace falta un interino porque D1 tiene titular
  real; se corrige a `D1` sin advertencia.

### Cómo se revierte

No aplica en el sentido de "deshacer": es la incorporación real de un integrante, no un experimento.
Si Rafael dejara el proyecto, se repetiría el mecanismo de `ADR-011` (reasignación temporal a quien el
equipo decida) hasta que haya un reemplazo real.

---

## ADR-022 — El Índice de Cumplimiento agrega por suma de duraciones, no por promedio de porcentajes

- **Fecha:** 2026-08-09
- **Estado:** Aceptada
- **Decide:** D3 (Sebastián), en capa de D2 — permiso de Jordy (D5) para todo el backend

### Contexto

`CalcularCumplimientoUseCase` (`domain/port/in/`) y su salida `IndiceCumplimiento` (`domain/`) ya
existían desde el Sprint 1, con las firmas `porCorte(CorteId)`, `porSector(SectorId)` y `global()`,
pero sin implementación ni decisión sobre cómo agregar el cumplimiento de varios cortes. `DESIGN.md`
§6 exige que el índice se muestre "como comparación explícita, prometido vs. real, no como puntaje
aislado", con el ejemplo `Prometieron 2 horas · Fueron 8`.

### Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| Promediar el `porcentajeCumplimiento` de cada corte por separado | Cada corte pesa igual sin importar su duración | Un corte de 10 minutos y uno de 10 horas pesarían lo mismo — distorsiona el índice hacia cortes cortos, que son fáciles de cumplir |
| **Sumar duraciones prometidas y reales de todos los cortes cerrados, calcular el porcentaje sobre los totales** (elegida) | Coincide directamente con el ejemplo de `DESIGN.md` — una comparación de tiempo total, no un promedio de porcentajes; un corte largo que incumple pesa más que uno corto que cumple, que es la lectura correcta para la ciudadanía | Un solo corte muy largo puede dominar el índice de un sector con pocos cortes |

### Decisión

Por corte: `duracionPrometida = finPrometido - inicio`, `duracionReal = finReal - inicio`,
`desviacion = duracionReal - duracionPrometida`, `porcentajeCumplimiento = min(100%,
duracionPrometida / duracionReal * 100)` — capado en 100% cuando el corte termina antes o a tiempo.
Para `porSector` y `global`, se suman las duraciones de todos los cortes **cerrados** del conjunto
(RF020: "por cada corte cerrado") y el porcentaje se calcula sobre esos totales, no sobre el
promedio de porcentajes individuales.

Si no hay cortes cerrados para el sector o la ciudad, el servicio lanza `IllegalArgumentException`
en vez de devolver un índice con duración cero — mismo criterio que `ADR-014` (no fabricar un dato
que parezca real cuando no hay verificación). Mapea a 400 vía `ManejadorGlobalDeErrores` existente,
sin manejador nuevo.

Se agregó `CorteAguaRepository.listarTodos()` (puerto de salida, no existía), necesario para
`global()`. Implementado en `CorteAguaMongoAdapter` con `MongoRepository.findAll()`, gratis en
Spring Data.

### Consecuencias

- **Gana:** el índice agregado refleja el tiempo real que la ciudadanía estuvo sin servicio, no un
  promedio abstracto que un corte corto y cumplido podría inflar.
- **Pierde:** un sector con pocos cortes es sensible a que uno solo sea muy largo — el índice puede
  parecer peor de lo que "la mayoría de las veces" sugeriría. Es una lectura deliberada: un corte de
  8 horas cuando se prometieron 2 le pesa más a un vecino que tres cortes de 10 minutos cumplidos.
- **Condiciona:** cualquier futura UI de M6 debe mostrar la comparación de duraciones totales, no
  solo el porcentaje — es lo que hace legible la fórmula elegida.

### Cómo se revierte

Cambiar la agregación a promedio de porcentajes es un cambio de fórmula localizado en
`CalcularCumplimientoService.indiceDe()` — no afecta el puerto ni `IndiceCumplimiento`, que ya
expresan ambas duraciones por separado.

---

## ADR-023 — "Dudoso" en RF018 es "todo reporte sin moderar", no una heurística de fraude

- **Fecha:** 2026-08-09
- **Estado:** Aceptada
- **Decide:** D3 (Sebastián), permiso de Jordy (D5) para todo el backend

### Contexto

RF018 pide "moderar (aprobar o descartar) reportes ciudadanos marcados como dudosos" y `HU018`
(`anexo-4-historias-de-usuario.md`) da el Gherkin: *"Dado que un reporte ciudadano está marcado
como dudoso, cuando el veedor lo aprueba o lo descarta..."* — pero **en ningún documento del
proyecto existe una definición de qué hace que un reporte sea "dudoso"**. Ni `product-requirements.md`,
ni `ADR-007` (que decide el control triple: rate limiting + consenso + moderación posterior, pero no
el criterio de selección), ni `docs/ingenieria/` proponen una heurística. A diferencia de M7
(`ADR-013`), donde la ambigüedad de responsable llevó a asignar explícitamente "qué se mide" a D5,
aquí nadie tiene asignada la pregunta "qué hace dudoso a un reporte" — es un vacío de especificación,
no una responsabilidad repartida.

### Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| Inventar una heurística de fraude (p. ej. reportes que contradicen el consenso vigente, ráfagas desde una misma huella) | Se acerca más a la intención literal de "dudoso" | Es una decisión de producto (qué patrón cuenta como sospechoso), no un detalle de implementación — inventarla solo yo viola la misma regla que impide rodear un bloqueo con un insumo inventado (`secuencia-de-trabajo.md` §5) |
| **Todo reporte nace `PENDIENTE` y es candidato a moderación hasta que el veedor decida** (elegida) | No inventa ningún criterio no especificado; el veedor —que sí tiene criterio humano— ve la cola completa y decide; cumple la letra del Gherkin sin fabricar un algoritmo no pedido | El panel puede llenarse de reportes que nadie consideraría "dudosos" en el sentido coloquial; si el equipo define después una heurística de preselección, hay que revisar esta decisión |

### Decisión

`ReporteCiudadano` gana un campo `EstadoModeracion` (`PENDIENTE` · `APROBADO` · `DESCARTADO`),
`PENDIENTE` por defecto al crearse. El veedor consulta la cola de pendientes y decide sobre
cualquiera. Aprobar o descartar es idempotente (se puede repetir o cambiar de decisión sin error) —
mismo criterio que `Suscripcion.confirmar()`.

**Alcance deliberadamente acotado:** descartar un reporte lo saca de la cola de pendientes y lo deja
visible con su decisión, pero **no** recalcula retroactivamente el consenso (M3) ni cambia el conteo
de RF006 (límite de reportes por dispositivo) — ninguna de las dos cosas está pedida por el Gherkin,
y hacerlo bien (¿un sector cambia de estado si el reporte que lo sostenía se descarta?) es una
decisión de producto propia, no una consecuencia obvia de "moderar". Queda como recomendación para
que el equipo la valide si la necesita.

### Consecuencias

- **Gana:** RF018 (`Debería`, no `Debe`) queda funcional sin fabricar un criterio de fraude que
  nadie pidió ni especificó.
- **Pierde:** un reporte "dudoso" en el sentido literal (contradice el consenso, viene de una huella
  con historial de descartes) no se distingue de uno normal en la cola — el veedor ve todo, sin
  preselección.
- **Condiciona:** si el equipo decide después que sí quiere una heurística de preselección, se agrega
  como un filtro sobre la cola existente (`ReporteCiudadanoRepository.listarPendientes()`), sin tocar
  el mecanismo de aprobar/descartar.

### Cómo se revierte

Agregar una heurística de preselección es aditivo: un método de filtrado nuevo sobre la cola de
pendientes, sin cambiar `EstadoModeracion` ni el flujo de aprobar/descartar ya construido.

---

## ADR-024 — `CorteAgua` valida coherencia estado/ventana en `build()` en vez de eliminar el campo `estado`

- **Fecha:** 2026-08-09
- **Estado:** Aceptada
- **Decide:** D2 (Carlos Bechara Arias)

### Contexto

Auditoría de dominio (`BUG-044`) encontró que `CorteAgua.Builder.build()` no validaba que
`estado == RESTABLECIDO` correspondiera con `ventana.finReal() != null` — se podía construir un
corte incoherente. En producción nadie lee `corte.estado()` para decidir si un corte está cerrado:
`CalcularCumplimientoService` (M6) y el resto del código usan exclusivamente
`ventana.estaCerrada()` (verificado leyendo los tres archivos que consultan cierre). El campo
`estado` es, en la práctica, redundante frente a la ventana.

### Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| (a) Validar coherencia en `Builder.build()` | Defensa en profundidad: protege también la reconstrucción desde Mongo (`CorteAguaMongoAdapter.aDominio()`), no solo el flujo de negocio | El único caller de riesgo real es la reconstrucción desde Mongo: si algún día hay un documento corrupto, la *lectura* falla, no solo la escritura |
| (b) Eliminar el campo `estado`, derivar todo de `ventana.estaCerrada()` | Elimina la redundancia de raíz, imposible que diverjan | `estado` ya se persiste en `CorteAguaDocumento.estado` y se expone en la API (`CorteApiMapper`, `CorteRespuesta.estado`) — es un cambio de contrato de datos, fuera de alcance de una corrección de bug |
| (c) No validar en el dominio, confiar en que `CorteAgua.cerrar(Instant)` sea el único productor de `RESTABLECIDO` | Cambio mínimo | No protege la reconstrucción desde Mongo ni ningún caller futuro que no pase por `cerrar()` |

### Decisión

Se valida la coherencia en `Builder.build()` (opción a), comparando `ventana.estaCerrada()` contra
`estado == EstadoCorte.RESTABLECIDO` y lanzando `IllegalStateException` si no coinciden. En paralelo,
se centralizó la transición de cierre en `CorteAgua.cerrar(Instant finReal)` (agregado de dominio),
así que el único flujo de negocio real ya no puede producir la inconsistencia — la validación en
`build()` queda como red de seguridad para los demás caminos (tests, reconstrucción Mongo, futuros
callers).

### Consecuencias

- **Gana:** ningún camino de construcción (negocio, tests, persistencia) puede producir un
  `CorteAgua` con `estado`/`ventana` contradictorios.
- **Cuesta:** `CorteAguaMongoAdapter.aDominio()` ahora falla rápido (`IllegalStateException`, con el
  id del documento) si lee un dato corrupto, en vez de servirlo en silencio — una lectura (`GET`,
  listados, cálculo de cumplimiento) se rompería visiblemente en vez de mostrar un dato incoherente.
  Se acepta ese costo: es coherente con la ética de datos del proyecto (`CLAUDE.md`, "nada llega al
  mapa público sin verificación") y el riesgo es bajo — no hay datos de producción migrados de un
  modelo anterior en este punto del proyecto (Sprint 2-4).
- **Deja pendiente:** el campo `estado` sigue siendo redundante con la ventana; la opción (b)
  (eliminarlo) queda descartada por ahora, no evaluada de nuevo salvo que cambie el contrato de la
  API o de persistencia.

### Cómo se revierte

Quitar el `if` de coherencia en `Builder.build()` y el `try/catch` de `CorteAguaMongoAdapter.aDominio()`.
Si en el futuro se prefiere la opción (b), requiere además tocar `CorteAguaDocumento`,
`CorteApiMapper`/`CorteRespuesta` y sus tests — cambio de contrato, no solo de invariante.

---

## ADR-025 — Descartar funcionalidades de Inteligencia Artificial (M9) para cumplir plazos

- **Fecha:** 2026-08-10
- **Estado:** Aceptada
- **Decide:** Equipo completo

### Contexto
El Módulo 9 (Ingesta automática con IA) requería usar el SDK de Anthropic para estructurar avisos no estructurados de la prensa local y Acuacar. Sin embargo, para poder destrabar el Módulo 9 en su funcionalidad base (ingesta por heurísticas), se eliminó la dependencia de Anthropic (PR #137) ya que bloqueaba el despliegue y desarrollo por falta de API keys o limitaciones de integración.
Como consecuencia, los requisitos específicos de IA (RF032, RF033, RF034, RF035, RF036, y RNF019) quedaron huérfanos y sin posibilidad de implementación, lo cual representa un riesgo de evaluación académica si se mantienen en el alcance.

### Decisión
Se declaran **oficialmente fuera de alcance (Descartados)** los requisitos RF032 a RF036 y el RNF019. El Módulo 9 (Ingesta) continuará funcionando mediante el `HeuristicaExtractor` (heurísticas deterministas y expresiones regulares) que ya está en `main`, sin modelos de IA.

### Consecuencias
- **Gana:** El alcance del proyecto se ajusta a la realidad del código; el informe metodológico reflejará esto como una decisión técnica sustentable en vez de un fallo de incumplimiento.
- **Pierde:** Se sacrifica la clasificación semántica avanzada; los falsos positivos/negativos del extractor basado en heurísticas no tendrán la confianza estructurada de la IA.

---

## ADR-026 — Open311 expone el estado agregado por sector, no cada reporte ciudadano

- **Fecha:** 2026-08-11
- **Estado:** Aceptada
- **Decide:** D3 (backend)

### Contexto
RF039 pide "exponer los reportes bajo el estándar Open311". La lectura literal es un
`service_request` por reporte ciudadano, que es lo que hace la mayoría de implementaciones de
GeoReport v2: cada uno con su `lat`/`long`, su `requested_datetime` y su descripción.

El problema es que un reporte de AguaVigía trae la coordenada que el vecino autorizó a compartir
(RF007), y esa coordenada es su casa. Publicar la serie completa en un endpoint abierto y sin
autenticación permitiría a cualquiera reconstruir quién reportó desde dónde y a qué hora —
exactamente el tipo de inferencia que RNF008 ("sin datos personales identificables del reportante")
existe para impedir. Que cada dato suelto sea anónimo no hace anónimo al conjunto.

### Alternativas consideradas
1. **Un `service_request` por reporte, con coordenada.** Máxima fidelidad al estándar y máximo
   riesgo: es publicar un mapa de domicilios de gente que reportó sin registrarse.
2. **Un `service_request` por reporte, con la coordenada redondeada.** Mitiga, no resuelve: con
   suficientes reportes en el tiempo, la casa se vuelve a distinguir.
3. **Un `service_request` por sector afectado.** Menos granular, sin riesgo de reidentificación.

### Decisión
Se expone un `service_request` por **sector** cuyo estado no es `CON_SERVICIO`, con `address` = el
nombre del barrio. Los campos `lat`/`long` viajan ausentes, cosa que el estándar admite cuando hay
`address`: la unidad geográfica de esta API es el barrio, no un punto.

Se completan los campos que sí se pueden llenar con honestidad y que un consumidor estándar
necesita: `service_code`, `description`, `requested_datetime` y `updated_datetime`.

### Consecuencias
- **Gana:** RF039 queda cumplido y justificado en vez de incumplido, y RNF008 se sostiene también
  para el dato publicado, no solo para el almacenado.
- **Pierde:** Un consumidor que espere granularidad de reporte individual recibe granularidad de
  barrio. Para la pregunta que la plataforma responde —"¿hay agua en este barrio?"— es la unidad
  correcta de todas formas.

### Cómo se revierte
Cambiar la fuente del controlador de `SectorRepository` a `ReporteCiudadanoRepository`. Exigiría
antes una decisión explícita sobre reidentificación y, muy probablemente, dejar de publicar la
coordenada igual.

---

## ADR-027 — Modelo de privacidad y retención de la evidencia fotográfica (M10)

- **Fecha:** 2026-08-11
- **Estado:** Aceptada
- **Decide:** D3 (backend)

### Contexto
M10 permite adjuntar una foto a un reporte. Esa foto se sirve en `/fotos/<uuid>.jpg` sin
autenticación, y hasta ahora ni el modelo de acceso ni el periodo de retención estaban escritos en
ninguna parte, mientras RNF008 y RNF009 figuraban cumplidos en la matriz.

Una foto de un tanque vacío o de una tubería rota no es un dato personal, pero puede contener una
fachada, una placa o una persona. Y a diferencia del reporte —tres campos y un timestamp—, el
binario es el dato más pesado y el de mayor riesgo si el servidor se ve comprometido.

### Alternativas consideradas
1. **Autenticar la descarga.** No hay cuentas de ciudadano en el sistema (ADR-007): habría que
   inventar una sesión solo para ver una foto que el propio autor subió para que se viera.
2. **URLs firmadas con expiración.** Requiere que el frontend renueve la firma; el proyecto no
   tiene la infraestructura de claves ni el despliegue lo justifica.
3. **URL con identificador no adivinable + retención acotada.**

### Decisión
- El nombre del archivo es un **UUID v4** generado por el servidor, nunca el nombre que mandó el
  cliente. No hay listado de directorio ni índice: sin la URL exacta no se llega a la foto.
- Se sirve con `X-Content-Type-Options: nosniff` y solo se aceptan `image/jpeg`, `image/png` y
  `image/webp` por lista blanca de `Content-Type`.
- La retención es configurable (`aguavigia.mantenimiento.retencion-evidencia`) y viene
  **deshabilitada por defecto**, para no borrar datos en la máquina de quien solo levanta el
  proyecto. En el perfil `prod` se activa con **365 días**.
- `PurgaEvidenciaAntiguaJob` borra únicamente el binario y limpia `fotoUrl`. El reporte (sector,
  tipo, timestamp, moderación, confirmaciones) se conserva indefinidamente porque sustenta RF024 y
  el Índice de Cumplimiento.

### Consecuencias
- **Gana:** RNF008/RNF009 tienen un modelo escrito y verificable en vez de un supuesto. El dato de
  mayor riesgo vence solo; el de valor histórico no.
- **Pierde:** Una URL filtrada sigue siendo pública mientras la foto exista. Es un riesgo aceptado
  y acotado por la retención.

### Cómo se revierte
Subir `dias-retencion` o poner `habilitada: false` en `prod`. Volver a un modelo autenticado exigiría
antes resolver la identidad del ciudadano, que ADR-007 dejó fuera a propósito.

---

## ADR-028 — La ingesta automatizada propone; publicar es decisión del veedor

- **Fecha:** 2026-08-11
- **Estado:** Parcialmente reemplazada por ADR-034 — sigue rigiendo para las fuentes de prensa; ya no para los boletines de Acuacar
- **Decide:** D3 (backend)

### Contexto
Tras ADR-025, M9 quedó con `HeuristicaExtractor`: expresiones regulares sobre boletines y notas de
prensa. Su Javadoc decía que la confianza baja (0.6) "obliga a que los resultados pasen a moderación
manual (M5)", pero eso no era cierto en el código: `PipelineOrquestador` ignoraba el número y
llamaba a `SectorRepository.guardar()` directamente. Los campos `confianza`, `camposInferidos` y
`citaTextual` de `EventoExtraido` no los leía nadie.

En consecuencia, una expresión regular podía cambiar el estado público de un barrio y disparar
correo a sus suscriptores, notificación push y actualización del mapa en vivo, sin que ninguna
persona lo revisara. Una plataforma que existe para desmentir información poco confiable no puede
publicar así.

### Alternativas consideradas
1. **Publicar automáticamente por encima de un umbral de confianza.** El extractor emite un valor
   constante de 0.6: el umbral no distinguiría nada.
2. **Apagar M9.** Cumple con no desinformar y deja RF029/RF030 sin valor real.
3. **Cola de revisión, como la de reportes ciudadanos (RF018).**

### Decisión
La ingesta registra una `PropuestaIngesta` en estado `PENDIENTE`. El mapa no cambia hasta que un
veedor la aprueba desde `/api/veedor/ingesta/propuestas`. Aprobar aplica el estado al sector y anexa
el evento a la bitácora (RF026); descartar archiva la propuesta sin borrarla, para que la cola sea
auditable.

Cada propuesta guarda la `citaTextual` literal del documento y la `confianza`, que dejan de ser
código muerto: son lo que el veedor lee para decidir. Es la misma exigencia de ADR-006 (cita
verificable en toda extracción), que no se cayó con el descarte de la IA.

### Consecuencias
- **Gana:** Ningún dato entra al mapa sin que una persona lo sostenga. El patrón es el mismo que ya
  existía para moderar reportes ciudadanos, así que no hay un concepto nuevo que aprender.
- **Pierde:** M9 deja de ser tiempo real. Un corte detectado a las 3 a.m. espera a que alguien
  revise. Para el caso de uso —comparar lo prometido con lo cumplido— la exactitud importa más que
  los minutos.

### Cómo se revierte
Hacer que `RegistrarPropuestaIngestaService` cree la propuesta ya aprobada e invoque a
`RevisarPropuestaIngestaService.aprobar`. Exigiría antes un extractor cuya confianza signifique algo.

---

## ADR-029 — Adoptar un shell operativo inspirado en Adminator sin convertir la experiencia en un dashboard genérico

- **Fecha:** 2026-08-09
- **Estado:** Aceptada por solicitud explícita del usuario
- **Decide:** José Daniel Zambrano (D4)

### Contexto

La barra horizontal anterior desaprovechaba el ancho disponible, comprimía el mapa y no establecía
una jerarquía clara entre navegación y contenido. El usuario pidió explorar como referencia el shell
de Adminator, conservando intacta la funcionalidad y pudiendo volver al estado anterior.

`DESIGN.md` §9 prohíbe que AguaVigía se convierta en un dashboard corporativo de KPIs decorativos.
La referencia se toma solo para patrones de composición: sidebar, topbar contextual, tarjetas
contenidas, sistema de tokens y drawer móvil; no se incorporan su código, dependencias ni módulos.

### Decisión

La SPA usa un shell común con sidebar fija en escritorio, drawer accesible en móvil, topbar por ruta
y un área de contenido que prioriza el mapa. Los componentes, rutas, llamadas API, formularios,
estados y manejadores existentes permanecen sin cambios de comportamiento.

### Consecuencias

- **Gana:** mejor uso del viewport, navegación consistente y jerarquía visual profesional.
- **Mantiene:** identidad turquesa de AguaVigía y protagonismo de la pregunta ciudadana, sin KPIs
  decorativos ni semántica cromática nueva.
- **Cuesta:** el shell agrega CSS responsive y un estado local para abrir/cerrar el drawer móvil.

### Cómo se revierte

Restaurar el contenido de `frontend_checkpoint_2026-08-09_antes_adminator.zip`, creado antes de la
primera modificación de este rediseño. El archivo conserva `src`, `public` y la configuración completa
del frontend en ese punto.

---

## ADR-030 — Los enlaces de `/api/suscripciones/confirmar` y `/cancelar` responden HTML o JSON según el `Accept`, no dos rutas separadas

- **Fecha:** 2026-08-12
- **Estado:** Aceptada
- **Decide:** sesión de integración frontend/backend

### Contexto
`MailNotificacionAdapter` manda el enlace de confirmación y el de baja apuntando directo al backend
(`{urlBasePublica}/api/suscripciones/confirmar?token=...`), no al frontend. Un vecino que hacía clic
desde su cliente de correo veía JSON crudo en pantalla en vez de una confirmación legible — el
endpoint solo sabía responder `application/json`.

### Alternativas consideradas
1. **El backend redirige (302) a una URL del frontend**, que muestra la página. Exige coordinar dos
   despliegues (backend y frontend) para una sola respuesta y agrega una ruta nueva al frontend solo
   para esto.
2. **Dejarlo así, sin resolver**, documentado como pendiente.
3. **El mismo endpoint decide el formato según el `Accept` de quien pide.** El enlace del correo no
   cambia.

### Decisión
`SuscripcionController.confirmar`/`cancelar` inspeccionan el header `Accept`: si contiene
`text/html` (como manda cualquier navegador al abrir un enlace), responden una página HTML mínima de
éxito o error, con el mismo texto tanto en modo claro como oscuro. Si no —ausente, `application/json`,
o cualquier cliente de API que no pida HTML explícitamente— responden el JSON de siempre, sin cambios
de contrato para nadie que ya lo consumiera así.

Se descartó registrar dos `@GetMapping` distintos sobre la misma ruta diferenciados solo por
`produces`: sin un `Accept` explícito (el caso de `MockMvc` por defecto, o de `curl` a pelo), Spring
no puede desempatar entre ambos y lanza `IllegalStateException: Ambiguous handler methods` — se
verificó rompiendo los tests existentes de `SuscripcionControllerTest` antes de corregirlo. Un único
método con la decisión hecha a mano evita la ambigüedad por completo.

### Consecuencias
- **Gana:** el enlace del correo funciona igual de bien abierto desde un navegador que desde un
  cliente de API, sin tocar `MailNotificacionAdapter` ni el contrato JSON existente.
- **Pierde:** la página HTML vive como una plantilla `String.formatted()` dentro del controlador, no
  como un archivo de plantilla reusable (`PlantillaCorreo` es de paquete privado en
  `infrastructure.mail` y no se expone a `api`). Aceptable por ahora: son dos variantes (éxito/error)
  para dos endpoints, no una plantilla que vaya a crecer.

### Cómo se revierte
Quitar la rama `prefiereHtml(accept)` de ambos métodos y volver a devolver siempre
`ResponseEntity<SuscripcionRespuesta>`. El enlace del correo seguiría funcionando igual de mal que
antes de este ADR.

---

## ADR-031 — Allowlist de gitleaks acotado a `docs/ingenieria/entorno-local.md`, no borrar la clave del documento

- **Fecha:** 2026-08-12
- **Estado:** Aceptada
- **Decide:** sesión de auditoría y optimización del proyecto

### Contexto
El job "Escaneo de secretos" (`gitleaks`) empezó a fallar en `ad7d660` — el mismo commit que creó
`docs/ingenieria/entorno-local.md` con la clave de equipo `JWT_SECRET=jHZczr...` en texto plano,
descrita ahí mismo como "clave de equipo lista para copiar" para no repetir la fricción que "quedó
sin resolver durante varias sesiones seguidas". Verificado con `gh run view --log-failed`: gitleaks
detecta exactamente esa línea (`generic-api-key`, línea 42) y no hay `.gitleaks.toml` en el repo, así
que corre con la regla por defecto sin ninguna excepción.

No es un secreto de producción: `ValidacionDeSecretosProd` aborta el arranque del perfil `prod` si
`JWT_SECRET`/`VEEDOR_PASSWORD_HASH` faltan, y exige que sean propias de ese entorno — la clave del
documento solo sirve para `docker compose up` local (`docker-compose.yml`, no `.prod.yml`).

### Alternativas consideradas
| Opción | A favor | En contra |
|---|---|---|
| Dejar el CI en rojo | Cero cambios | Entrena a ignorar el gate; un hallazgo real futuro pasaría desapercibido en medio del ruido |
| Borrar la clave del documento, cada quien genera la suya | El scanner no tiene nada que marcar | Revive el problema que el propio `entorno-local.md` fue escrito para cerrar |
| `.gitleaks.toml` con allowlist acotado por ruta a ese único archivo | CI vuelve a verde de forma honesta (hallazgo evaluado, no ignorado); cualquier otro archivo del repo se sigue escaneando igual | Si algún día se pega un secreto real distinto en ese mismo archivo, no se detectaría |

### Decisión
Crear `.gitleaks.toml` en la raíz con `extend.useDefault = true` y un `[allowlist]` cuyo `paths`
excluye solo `docs/ingenieria/entorno-local.md`, con una descripción que explica por qué. La clave del
documento no se toca.

### Consecuencias
- **Gana:** el job "Escaneo de secretos" vuelve a estar en verde sin ocultar el motivo — el propio
  archivo de configuración documenta la excepción.
- **Pierde:** ese archivo específico queda fuera del radar de gitleaks por completo. Riesgo aceptado
  porque tiene un propósito único y declarado (credenciales de *desarrollo local*, nunca de
  producción) y quien lo edite es responsable de no meter ahí algo que sí importe.

### Cómo se revierte
Borrar `.gitleaks.toml` (o solo la entrada de `allowlist`) y rotar la clave de equipo del documento —
ambos pasos juntos, porque borrar solo el allowlist sin rotar la clave deja el mismo secreto expuesto
sin la excepción que lo explica.

---

---

## ADR-032 — La confianza de la extracción se gradúa; el veedor sigue decidiendo

- **Fecha:** 2026-08-22
- **Estado:** Parcialmente reemplazada por ADR-034 — la graduación de confianza sigue vigente; que el veedor decida ya no aplica a Acuacar
- **Decide:** D3

### Contexto

`ADR-028` descartó publicar automáticamente por encima de un umbral de confianza, con un argumento
concreto y correcto en su momento:

> El extractor emite un valor constante de 0.6: el umbral no distinguiría nada.

Al corregir la extracción (`BUG-057` a `BUG-060`) esa premisa dejó de ser cierta. El extractor ahora
sí distingue evidencias muy distintas entre sí: un boletín con enumeración explícita de barrios y
ventana horaria declarada no se parece en nada a una mención suelta en prosa, y hasta ahora ambos
salían con el mismo 0.6.

Medido sobre 37 boletines reales de Acuacar (mayo–agosto 2026), los tres niveles se separan de forma
limpia: el 100% de los boletines con enumeración identifica al menos un barrio del catálogo oficial,
mientras que las menciones en prosa producen sobre todo nombres genéricos que el catálogo descarta.

### Decisión

La confianza pasa a tener tres niveles, según la evidencia que el extractor encontró de verdad:

| Valor | Evidencia |
|---|---|
| `0.85` | Enumeración explícita de barrios **y** ventana horaria declarada |
| `0.75` | Enumeración explícita, sin horario |
| `0.45` | Mención en prosa, sin lista |

**No se cambia la política de publicación.** Nada se publica solo: toda propuesta sigue naciendo
`PENDIENTE` y el mapa solo se mueve cuando un veedor aprueba, exactamente como decidió `ADR-028`.
Lo que cambia es que el número sirve para **ordenar la cola** por lo que más se sostiene, y que
`citaTextual` ahora cita el tramo que nombra los barrios y el horario en vez de la frase de resumen,
que era una cita literal pero inútil para contrastar.

### Consecuencias

- **Gana:** el veedor revisa primero lo mejor respaldado y lee una cita que de verdad le permite
  decidir. Si el equipo quisiera más adelante reabrir la publicación automática, ahora existe la
  señal que `ADR-028` echaba en falta.
- **Pierde:** los tres valores son un juicio calibrado sobre 37 boletines, no una probabilidad
  medida. No deben leerse como tal ni exponerse al público como si lo fueran.
- **Queda pendiente:** validar los umbrales contra el conjunto dorado de 100 boletines etiquetados a
  mano (`pipeline-ingesta-datos.md` §4), que sigue sin construirse.

---

## ADR-033 — El estado de un barrio evoluciona con la ventana que la fuente prometió

- **Fecha:** 2026-08-22
- **Estado:** Aceptada
- **Decide:** D3

### Contexto

Un boletín dice «suspensión mañana viernes 21 de agosto, entre las 9:00 a.m. y las 6:00 p.m.». Con la
ingesta corregida ese dato ya se lee y se guarda, pero nadie volvía a mirarlo: una propuesta aprobada
dejaba el barrio en un estado fijo. Un corte anunciado para mañana se quedaba en `CORTE_PROGRAMADO`
indefinidamente, y el barrio aparecía «con corte programado» semanas después de que el agua volviera.

### Alternativas consideradas

1. **Que el veedor cierre cada corte a mano.** Es lo que ya ocurre con los cortes oficiales, pero
   aplicado a la ingesta multiplica el trabajo manual por cada barrio de cada boletín — 17 en un solo
   aviso — y el estado queda mal mientras nadie entra.
2. **Estimar la duración cuando el boletín no la declara.** Descartada: es exactamente el dato
   inventado que `ADR-006` prohíbe y que ya se eliminó del extractor.
3. **Aplicar solo la ventana que la fuente declaró explícitamente.**

### Decisión

`ActualizarEstadosPorVentanaService` barre cada minuto las propuestas **ya aprobadas** que traen
ventana declarada y pone cada sector en el estado que le corresponde en ese instante:

```
antes del inicio → CORTE_PROGRAMADO
dentro           → SIN_SERVICIO (o el estado propuesto)
después del fin  → CON_SERVICIO
```

Tres restricciones que hacen que esto no contradiga `ADR-028`:

- Solo actúa sobre propuestas **que un veedor ya aprobó**. No publica nada nuevo: mueve en el tiempo
  algo que una persona ya validó.
- **Sin ventana declarada, el sector no se toca.** No se estima ni el inicio ni el fin.
- Solo escribe cuando el estado cambia de verdad, para no disparar correo, push y SSE en cada barrido.

### Consecuencias

- **Gana:** el mapa deja de envejecer solo. El ciclo «se anuncia → ocurre → termina» se refleja sin
  intervención, que es lo que un vecino espera de un mapa «en vivo».
- **Pierde:** si Acuacar promete una ventana y no la cumple, el mapa dirá que el servicio volvió
  cuando no volvió. Es un riesgo real y es precisamente lo que el Índice de Cumplimiento (RF020–RF022)
  existe para medir; la corrección vendrá de los reportes ciudadanos, no de la ingesta.
- El barrido queda acotado a un día después del fin prometido, para no recorrer el histórico entero.

## ADR-034 — Los boletines de Acuacar se publican solos; la revisión del veedor queda para la prensa y los reportes ciudadanos

- **Fecha:** 2026-08-29
- **Estado:** Aceptada
- **Decide:** Product owner, con implementación de D3

### Contexto
`ADR-028` mandó toda detección a una cola de revisión. Medido en local el 2026-08-29 con la base de
producción de desarrollo: **17 propuestas PENDIENTE, 0 cortes, 0 eventos de bitácora, 211 barrios sin
estado**. El mapa llevaba semanas vacío no por falta de datos sino porque nadie vaciaba la cola, y el
único camino para hacerlo (`/veedor`) respondía `503` por dos variables sin configurar. El costo real
de la cola no fue prudencia: fue que la plataforma no publicó nada.

El argumento de `ADR-028` era que *"una expresión regular sobre una nota de prensa"* no puede mover el
mapa sola. Ese argumento es correcto y sigue en pie **para la prensa**. Pero no describe a Acuacar:
las 17 propuestas venían de la API oficial del operador, con `citaTextual` que enumera los barrios y
la ventana horaria, `urlOriginal` verificable y confianza 0.85 —el nivel más alto que `ADR-032`
reserva para boletines con enumeración explícita—. Acuacar no es una fuente *sobre* el corte: es
quien lo ejecuta y lo anuncia.

En paralelo, los 211 barrios en gris (`COLOR_SIN_DATOS`) hacían ver el mapa averiado. La petición
inicial fue pintarlos de verde por descarte —"si nadie reporta, es que tiene agua"—, que es publicar
un *todo despejado* que nadie verificó y choca de frente con la regla 4 de ética de datos.

### Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| Mantener `ADR-028` intacta | Ninguna publicación sin humano | Demostrado: el mapa se queda vacío. La cola no se vacía sola |
| Publicar todo automático (Acuacar + prensa) | Mapa siempre lleno | Reintroduce exactamente el riesgo que `ADR-028` cerró: una regex sobre prensa moviendo el mapa |
| **Publicar solo lo oficial** | Acuacar es el operador, con cita y URL; la prensa sigue revisada | Un error del propio boletín se publica sin filtro |
| Sin datos → verde pleno | Mapa uniforme y vivo | Afirma servicio en 211 barrios sin verificar. Un barrio sin agua donde nadie reportó saldría "con agua" |
| **Sin datos → verde pálido, "Sin reportes de falla"** | Mapa vivo sin afirmar lo que no se sabe | Un tercer verde que hay que saber leer; el color por sí solo puede leerse como "todo bien" |

### Decisión
Lo que viene de Acuacar (`PropuestaIngesta.esDeFuenteOficial()`) se publica en el acto, delegando en
el mismo `RevisarPropuestaIngestaUseCase` que usa el panel. Lo que viene de prensa (RSS) y los
reportes ciudadanos siguen esperando al veedor. Los barrios sin dato pasan de gris a verde pálido
`#9FD8AB` con la etiqueta **"Sin reportes de falla"** — que describe el dato, no lo que se supone de él.

### Consecuencias
- El mapa se llena solo con lo oficial: las 17 propuestas represadas se publicaron y dejaron 17
  eventos de bitácora y 17 barrios en `CON_SERVICIO`.
- **El veedor deja de ser cuello de botella y pasa a ser moderador de lo ciudadano**, que es donde su
  criterio aporta: el reporte anónimo es lo que nadie más puede validar.
- Se acepta un riesgo nuevo y real: **si Acuacar publica un boletín equivocado, ese error llega al
  mapa sin filtro humano** y dispara correo, push y SSE. Se mitiga con la trazabilidad —cada estado
  publicado conserva `citaTextual` y `urlOriginal`— pero no se elimina.
- Publicar automático reusa el caso de uso del veedor a propósito: el camino automático y el manual
  no pueden divergir, y la guarda de estado repetido y el evento de bitácora valen para ambos.
- El verde pálido depende de que la leyenda se lea. `DESIGN.md` §2 ya exige que el color nunca vaya
  solo, y `InsigniaEstado` siempre muestra la etiqueta; si esa regla se rompe, este verde miente.

### Cómo se revierte
Quitar la rama `esDeFuenteOficial()` de `RegistrarPropuestaIngestaService` devuelve todo a la cola:
es un `if`, y las propuestas siguen naciendo `PENDIENTE`. Lo ya publicado **no** se revierte solo —
la bitácora es de solo anexado (`RF028`) y los eventos emitidos quedan. Volver atrás exige además
restaurar `ADR-028` y `ADR-032` a *Aceptada*. El color es un cambio de una constante.

## ADR-035 — Sin corte anunciado ni reporte vigente, el barrio se muestra con servicio

- **Fecha:** 2026-08-30
- **Estado:** Aceptada
- **Decide:** Product owner, con implementación de D4

### Contexto
`ADR-014` decidió lo contrario y su argumento era correcto **en su momento**: el 2026-08-08 no
existía la ingesta, ningún proceso miraba a Acuacar, y los 211 barrios estaban sin estado por
ausencia de sistema. En ese mundo, pintar de verde era afirmar sobre un vacío, y `BUG-061` (S1) se
cerró quitando justamente el `sector?.estado ?? 'CON_SERVICIO'` del mapa.

El supuesto cambió. Desde `ADR-034` el colector revisa la API de Acuacar cada 10 minutos sobre una
ventana de 7 días y **publica sin intervención**. La ausencia de aviso dejó de ser "no tenemos
sistema" y pasó a ser una señal que se mantiene sola. Verificado el 2026-08-30 sobre los 40
boletines más recientes: 7 hablan de suspensión del servicio, y no solo de mantenimiento programado
—incluyen trabajo reactivo como *"repara fuga en tubería"* y *"avanza en la reparación de la
conducción"*—, así que Acuacar no publica únicamente lo planificado.

Hay además un segundo canal correctivo que `ADR-014` no tenía: el reporte ciudadano moderado por el
veedor, que puede sacar a un barrio del verde sin esperar a que Acuacar diga nada.

### Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| Mantener `ADR-014` (gris "sin datos") | No afirma nada sin verificar | 194 de 211 barrios en gris permanente: el mapa se lee como app rota, no como app prudente |
| Verde pálido distinto, "Sin reportes de falla" | Mapa vivo sin igualar lo sabido con lo supuesto | Obliga al lector a distinguir dos verdes; y si la premisa es que Acuacar cubre los cortes, la distinción no describe nada real |
| **Verde de `CON_SERVICIO`, sin marca de tiempo** | Coincide con el modelo real: el barrio tiene agua salvo aviso del operador o reporte ciudadano | Un corte que Acuacar aún no publicó y que nadie reportó se ve verde |

### Decisión
`COLOR_SIN_DATOS` pasa a los valores y la etiqueta de `CON_SERVICIO`. **No se fabrica
`actualizadoEn`**: el backend sigue mandando `estado: null` y `actualizadoEn: null`, así que
`useFrescura` sigue diciendo *"sin datos"*. El resaltado del mapa trata el nulo como `CON_SERVICIO`
(`MapaCartagena.tsx`, `estadoEfectivo`) para que filtrar por *Con servicio* no atenúe justo a los
barrios que esta regla considera con agua.

### Consecuencias
- **Gana:** el mapa comunica el estado real de la ciudad en vez de un gris que nadie sabía leer.
- **Pierde y hay que decirlo:** **un corte que Acuacar no haya publicado todavía y que ningún
  ciudadano haya reportado se muestra verde.** Es el riesgo que `ADR-014` quiso evitar y no
  desaparece; se acota con la ingesta cada 10 minutos y con el reporte ciudadano, no se elimina.
- **El contrato no cambia:** `estado` sigue siendo anulable y el backend sigue sin inventar nada.
  Esto es una decisión de presentación, y por eso `ADR-014` queda *parcialmente* reemplazada.
- **`BUG-061` sigue cerrado y su corrección intacta:** su defecto real era `actualizadoEn: new
  Date()`, que afirmaba una verificación inexistente. Eso no vuelve.
- **Límite conocido:** un barrio del GeoJSON ausente del catálogo del backend no lo vigila la
  ingesta, así que ahí el verde no estaría respaldado. Hoy no ocurre —verificado el 2026-08-30: 211
  en el GeoJSON, 211 en el catálogo, 0 de diferencia— y el mapa además lo dibujaría al 15% de opacidad.
  Si esa cifra deja de ser 0, esta decisión debe revisarse.

### Cómo se revierte
Devolver `COLOR_SIN_DATOS` a un color y etiqueta propios y quitar `estadoEfectivo` de
`calcularEstiloFeature`. Son dos cambios de presentación y ningún dato guardado cambia, porque
ninguno se fabricó.

## ADR-036 — La ingesta crea el corte pero nunca su hora real de restablecimiento

- **Fecha:** 2026-08-31
- **Estado:** Aceptada
- **Decide:** Product owner, con implementación de D3

### Contexto
Las estadísticas (M7) y el Índice de Cumplimiento (M6) agregan sobre la colección `cortes`, que la
ingesta nunca alimentaba: solo la llenaba el veedor a mano. Con 1.106 propuestas aprobadas y 0
cortes, `sectoresMasAfectados` y `cortesPorDiaDeSemana` salían vacíos aunque hubiera datos de sobra.

Al crear el corte aparece la tentación evidente: el boletín trae `inicioDeclarado` y `finPrometido`,
así que rellenar `finReal = finPrometido` deja las tres métricas completas de inmediato.

**Eso sería una mentira, y de la peor clase para este proyecto.** El Índice de Cumplimiento existe
para comparar lo prometido con lo real; igualarlos por defecto da **100% de cumplimiento
permanente**, que es exactamente la afirmación que la plataforma existe para poder contrastar.

### Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| No crear cortes desde la ingesta | Nada que discutir | Las estadísticas se quedan vacías con 1.106 propuestas disponibles |
| Crear el corte con `finReal = finPrometido` | Las tres métricas se llenan solas | Cumplimiento del 100% inventado. Destruye la tesis del proyecto |
| **Crear el corte sin `finReal`** | Se puebla lo que sí se sabe; lo que no se sabe se queda vacío y se nota | `duracionPromedioHoras` y el Índice siguen sin datos hasta que alguien confirme la hora real |

### Decisión
Al aprobar una propuesta con ventana declarada se crea un `CorteAgua` con `OrigenCorte.INGESTA_IA`
y estado `ANUNCIADO`. **`finReal` se deja nulo.** El corte queda abierto hasta que el consenso
ciudadano o el veedor confirmen cuándo volvió el agua.

El id del corte se deriva del boletín y su ventana, no de un UUID nuevo: un boletín nombra muchos
barrios y genera una propuesta por cada uno, y sin esa clave la estadística se inflaba con un corte
por barrio en vez de uno por evento.

### Consecuencias
- `sectoresMasAfectados` y `cortesPorDiaDeSemana` se pueblan con datos reales.
- **`duracionPromedioHoras` y `/api/cumplimiento` siguen vacíos, y es correcto que lo estén.** El
  endpoint responde *"No hay cortes cerrados todavía"* porque de verdad no los hay.
- La interfaz debe decir "Sin datos" y nunca un número: ver `BUG-063`, que es justo lo que pasó.
- Queda cubierto por `RevisarPropuestaIngestaServiceTest.debeRegistrarElCorteDelBoletinCuandoDeclaraVentana`,
  que falla si alguien rellena `finReal` desde la ingesta.

### Cómo se revierte
Quitar la llamada a `registrarCorteDelBoletin`. Los cortes ya creados no se borran solos; habría que
eliminar los de origen `INGESTA_IA` a mano.

## ADR-037 — «Sectores más afectados» cuenta menciones en avisos, no cortes con duración medida

- **Fecha:** 2026-08-31
- **Estado:** Aceptada
- **Decide:** Product owner, con implementación de D3

### Contexto
Un `CorteAgua` exige ventana completa (inicio + fin prometido). Medido sobre los 100 boletines más
recientes de Acuacar el 30/08/2026: **18 anuncian suspensión del servicio, los 18 traen la fecha,
pero solo 5 declaran el rango horario**. Es decir, ~5% de los boletines pueden generar un corte.

Contra la colección `cortes`, el top de sectores se calculaba sobre 3 registros: no representaba la
ciudad ni de lejos, y desde luego no los cinco años de historia que el equipo quería mostrar.

### Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| Dejarlo contra `cortes` | El número significa "cortes con duración medida" | Se calcula sobre 3 registros; el ranking no dice nada |
| Inventar la ventana que falta | Habría muchos más cortes | Dato fabricado; contamina además el Índice de Cumplimiento |
| **Contar propuestas aprobadas** | 1.106 menciones desde 2020: cubre los cinco años | Cambia lo que el número significa, y hay que decirlo donde se muestre |

### Decisión
`EstadisticasMongoAdapter.calcularGlobales` agrega `propuestas_ingesta` con `estadoRevision:
APROBADA` en vez de `cortes`. El número pasa a ser **«veces que el barrio apareció en un aviso de
corte»**, no «cortes con duración medida».

### Consecuencias
- El ranking cubre cinco años y sí representa a la ciudad.
- **Cambia el significado de la cifra**, así que el rótulo donde se muestre tiene que decirlo. Hoy
  la sección dice "Cortes cerrados registrados por barrio", que ya no describe lo que cuenta —
  queda pendiente corregir ese texto.
- Una propuesta sin aprobar no cuenta: nadie ha confirmado que ese aviso sea real.
- La otra cifra —cortes con duración medida— sigue viviendo en el Índice de Cumplimiento, que sigue
  exigiendo ventana real (`ADR-036`).

### Cómo se revierte
Volver a agregar sobre `CorteAguaDocumento` y restaurar el `unwind` por `sectoresAfectados`.

## ADR-038 — Las portadas de Acuacar se sirven por proxy propio, no enlazadas directo

- **Fecha:** 2026-08-31
- **Estado:** Aceptada
- **Decide:** D4, verificado contra el sitio real

### Contexto
Las tarjetas de la bitácora muestran la portada del boletín. Enlazarla directo a
`acuacar.com/wp-content/uploads/…` no funciona: **el sitio bloquea el hotlinking**. Verificado el
31/08/2026 sobre la misma imagen — responde `200 image/jpeg` sin cabecera `Referer` y **`403` con un
`Referer` de otro dominio**. Por eso todas las pruebas con `curl` pasaban y el navegador fallaba
siempre, y por eso costó tanto encontrarlo.

Aparte, `_embed=wp:featuredmedia` **no devuelve nada si `_fields` recorta `_links`**: WordPress
construye `_embedded` a partir de los enlaces del recurso. Sin `_links` el boletín llega sin imagen
y sin ningún error que lo delate.

### Decisión
El colector captura la URL de la portada al ingerir (tamaño `medium`, no el original de varios MB) y
viaja con el evento hasta la API. El navegador la pide por `/acuacar-media/`, que `nginx.conf` y
`vite.config.ts` proxean sin mandar `Referer`.

El bloque de nginx usa `location ^~` a propósito: más abajo hay un `location ~* \.(jpg|png|…)$` para
los assets propios, y en nginx las expresiones regulares ganan sobre los prefijos — sin `^~` la
portada caía en ese bloque, se buscaba en el disco local y devolvía 404.

### Consecuencias
- **Gana:** la portada funciona para cualquier evento, también los de 2020. La alternativa —que el
  navegador pidiera los boletines recientes y cruzara por URL— solo cubría los últimos 100.
- **Pierde:** el proxy queda acotado a `/wp-content/uploads/`. Abrirlo a todo el dominio lo
  convertiría en un proxy abierto hacia acuacar.com.
- Se respeta la ética de datos: el proxy se identifica con el `User-Agent` del proyecto y no
  disfraza nada; lo único que omite es el `Referer`.

### Cómo se revierte
Volver a apuntar `src` a la URL de acuacar.com y borrar los dos bloques de proxy. La portada dejará
de verse, que es el estado del que se venía.


## ADR-039 — El panel del veedor usa cuentas individuales con rol y ajustes de permisos por persona

- **Fecha:** 2026-08-31
- **Estado:** Aceptada
- **Decide:** Equipo (petición del titular del producto), sobre backend y frontend
- **Reemplaza a:** `ADR-016`

### Contexto

`ADR-016` eligió una credencial compartida y dejó escrito su propio costo: *"ninguna acción del panel
queda atribuida a una persona concreta"*, y señaló que migrar a cuentas individuales exigiría una
entidad de dominio. También dejó abierto que `POST /api/veedor/sesion` no tenía freno contra fuerza
bruta; `ADR-018` cerró la mitad de ese hueco con un límite por IP, que no ve el ataque repartido
entre muchas direcciones contra un mismo correo.

El equipo pide ahora lo que aquella ADR aplazó: que cada persona se registre con su correo, y que un
administrador decida desde el panel quién entra y qué puede hacer. `RF019` solo exige *"autenticación
con token"* y `RNF011` fija la expiración en 8 horas — ninguno de los dos dice nada sobre el modelo de
cuentas, así que esto es requisito nuevo (`RF042`–`RF046`), no una reinterpretación.

Verificado en local el 2026-08-31 sobre el stack de `docker compose`: el flujo completo —siembra del
primer administrador, alta de TOTP con un código calculado fuera del sistema, registro abierto,
verificación por correo, aprobación con permisos recortados, suspensión y revocación— funciona de
punta a punta.

### Alternativas consideradas

| Opción | A favor | En contra |
|---|---|---|
| Seguir con la credencial compartida (`ADR-016`) | Cero trabajo | No atribuye ninguna acción a nadie; una filtración obliga a rotar la clave de las cinco personas a la vez |
| Solo invitación del administrador | Superficie mínima; nadie llega sin que alguien lo llame | No es lo que el equipo pidió, y obliga a un administrador disponible para cada alta |
| Solo auto-registro sin aprobación | El alta no depende de nadie | Registro abierto = panel de moderación abierto. Inaceptable |
| **Auto-registro + invitación, ambos con aprobación o rol asignado** (elegida) | Cubre las dos formas de entrar; en ninguna se concede acceso sin decisión humana | Dos flujos de alta y dos tipos de token que mantener |
| Roles fijos sin ajustes | Imposible dejar a alguien mal configurado | No permite el caso real de "veedor que no cierra cortes" |
| **Roles como paquete de permisos + ajustes por persona** (elegida) | El día a día es elegir un rol; el caso raro se resuelve sin inventar un rol nuevo | Para saber qué puede hacer alguien hay que resolver rol + excepciones, no basta con leer el rol |

### Decisión

Entidad `Usuario` en `domain/`, con `EstadoCuenta` (verificación → aprobación → activa, más invitada,
suspendida y rechazada), `RolVeedor` (`ADMIN`, `VEEDOR`, `OBSERVADOR`) y `PermisosEfectivos`
(rol + concedidos − revocados). **La autorización se comprueba siempre contra un `Permiso` concreto**
vía `@PreAuthorize`, nunca contra el rol: añadir un rol no obliga a repasar cada endpoint.

`VEEDOR_PASSWORD_HASH` deja de ser una credencial compartida y pasa a ser la semilla del primer
administrador (`SembradorAdminInicial`, junto con `ADMIN_INICIAL_CORREO`); en cuanto existe alguna
cuenta, deja de usarse.

Cinco medidas sostienen la parte de seguridad, y cada una cubre un agujero distinto:

1. **Enumeración.** Registro, login y "olvidé mi clave" responden igual exista o no la cuenta. El
   login además gasta el mismo tiempo (`CifradorClavePort.gastarTiempoEquivalente`), porque con
   mensajes idénticos y tiempos distintos el cronómetro sigue delatando qué correos existen.
2. **Fuerza bruta por cuenta.** Bloqueo tras 5 fallos en 15 minutos (`ControlIntentosPort`, Redis),
   complementario al límite por IP de `ADR-018`. La clave es el correo, también cuando no existe.
3. **Revocación inmediata.** El token lleva los permisos dentro para no leer Mongo en cada petición;
   a cambio, suspender, rechazar, cambiar permisos —también al ampliarlos— o cerrar sesión escribe un
   instante de corte en Redis, y el filtro rechaza todo token anterior. Sin esa pareja de medidas,
   meter los permisos en el token sería un error.
4. **Segundo factor obligatorio para `ADMIN`** (TOTP, RFC 6238, implementado sin dependencia nueva).
   Un administrador sin TOTP entra con una sesión de alcance `ALTA_SEGUNDO_FACTOR` que solo abre el
   alta: negarle la entrada lo dejaría fuera para siempre, y darle sesión completa haría que
   "obligatorio" no significara nada.
5. **Guardas de integridad.** Nadie se administra a sí mismo, y no se puede suspender ni despromover
   al último `ADMIN` activo — eso deja el sistema sin nadie capaz de otorgar permisos, y no se
   arregla desde la aplicación.

Todo cambio de acceso queda en una bitácora de auditoría de solo anexado (`auditoria_cuentas`), que
es exactamente la carencia que `ADR-016` se reprochó.

### Consecuencias

- **Gana:** cada acción del panel queda atribuida a una persona con nombre y correo — evidencia
  directa para el Capítulo IV. Una filtración afecta a una cuenta, no a las cinco. Un `OBSERVADOR`
  puede acompañar la moderación sin poder ejecutarla.
- **Pierde:** la superficie crece mucho. Diez casos de uso nuevos, tres colecciones de Mongo, dos
  claves de Redis, dos plantillas de correo y cinco pantallas. Es la parte del sistema con más
  código por requisito.
- **Pierde:** el reparto de fallo abierto/cerrado es deliberadamente asimétrico y hay que recordarlo.
  Con Redis caído, el bloqueo por intentos falla **abierto** (la cuenta sigue protegida por su clave)
  pero la revocación falla **cerrado** (el panel deja de aceptar sesiones). Las dos decisiones están
  justificadas en el javadoc de su adaptador; leer una y suponer la otra lleva a conclusiones falsas.
- **Pierde:** un token emitido dentro del mismo segundo en que se revocó sobrevive, porque el `iat`
  de un JWT tiene precisión de segundo. Redondear hacia arriba mataría el token que la propia persona
  acaba de obtener al volver a entrar. El margen es de un segundo y está documentado en el filtro.
- **Condiciona:** los permisos viajan dentro del token, así que **cualquier** cambio de permisos debe
  revocar sesiones. Quien añada una vía nueva para cambiarlos y olvide la revocación deja a esa
  persona operando con los permisos viejos hasta 8 horas.
- **Condiciona:** `CONFIGURAR_SEGUNDO_FACTOR` no se puede revocar. `PermisosEfectivos` lo rechaza al
  construir, porque es la única puerta que dejaría a un `ADMIN` sin forma de entrar.
- **Condiciona:** los enlaces de los correos apuntan al frontend (`APP_URL_PUBLICA`), no a la API. Si
  esa variable apunta al backend, los correos llevan a respuestas JSON.

### Cómo se revierte

No se revierte a `ADR-016` sin perder las cuentas ya creadas. Lo que sí se puede desactivar por
partes: dejar `ADMIN_INICIAL_CORREO` vacío desactiva la siembra; bajar el rol del único `ADMIN` a
`VEEDOR` desactiva de hecho la gestión de cuentas; y quitar `exigeSegundoFactor()` de `RolVeedor`
apaga el TOTP obligatorio sin tocar nada más. Volver a una clave compartida exigiría reponer el
`VeedorAuthController` anterior y aceptar que la auditoría deje de atribuir acciones.

<!--
Siguiente número disponible: ADR-040
Para agregar: usa la skill `registrar-decision`.
Recuerda: append-only. Las entradas viejas solo cambian de estado, no de contenido.
-->
