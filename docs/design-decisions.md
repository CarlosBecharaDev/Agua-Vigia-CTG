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
- **Estado:** Aceptada
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
- **Estado:** 🟡 **Propuesta — pendiente de aprobación de Carlos (D2), José Daniel (D4) y Yordy (D1/D5) en el propio Pull Request.** No se activa con este registro.
  **Verificado el 2026-08-08:** el PR [#42](https://github.com/CarlosBecharaDev/Agua-Vigia-CTG/pull/42) que incorporó este ADR **se fusionó sin ningún revisor** (`gh pr view 42 --json reviews` → `reviews: []`). La condición de aprobación no se cumplió, así que el ADR sigue en *Propuesta*: hasta que los tres se pronuncien, rige la frontera de propiedad estricta con desbloqueo temporal caso por caso.
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
- **Estado:** 🟡 **Propuesta — pendiente de ratificación de Carlos (D2) y José Daniel (D4).** Hasta que
  la ratifiquen, `roles-y-tareas.md` no se modifica y M7 sigue figurando como de D5.
- **Propone:** Yordy Pardo Pajaro (D5, titular actual de M7)

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

## ADR-018 — Rate limiting HTTP genérico, opt-in por configuración, clave por IP

- **Fecha:** 2026-08-08
- **Estado:** Aceptada
- **Decide:** Backend – Infraestructura (D3)

### Nota de numeración

Este PR usa `ADR-018` porque `ADR-014`–`017` ya están reservados por los PR #56, #58 y #59 (sin
fusionar). Avisar si el orden de fusión cambia y hace falta renumerar.

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

<!--
Siguiente número disponible: ADR-019
Para agregar: usa la skill `registrar-decision`.
Recuerda: append-only. Las entradas viejas solo cambian de estado, no de contenido.
-->
