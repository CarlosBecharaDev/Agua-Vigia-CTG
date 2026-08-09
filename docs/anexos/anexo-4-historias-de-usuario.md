# Anexo 4 — Historias de usuario

> ⚠️ Numeración provisional — pendiente de validar contra la plantilla oficial del docente (ver
> [`docs/anexos/README.md`](./README.md)).

---

## Ficha técnica

| Campo | Detalle |
|---|---|
| Artefacto | Historias de usuario en formato Gherkin (`Dado` / `Cuando` / `Entonces`) |
| Trazabilidad | **Una historia por cada requisito funcional**, numeración pareja `RF0NN → HU0NN` (ver [`../ingenieria/matriz-trazabilidad.md`](../ingenieria/matriz-trazabilidad.md)) |
| Actor | Según `docs/product-requirements.md`: Vecino, Veedor, Ciudadanía, Periodista o Sistema |
| Estado de este documento | Completado con los 36 requisitos funcionales (RF001–RF036). Se actualiza si cambia un requisito, no aparte |

**Regla de trazabilidad:** una historia sin requisito, o un requisito sin historia, es un hueco que el
docente encuentra. Por eso este anexo y `matriz-trazabilidad.md` se actualizan juntos.

**Convención de escenarios:** el `Entonces` describe el comportamiento esperado según el requisito, no
una implementación particular. Donde el requisito es prohibitivo (RF028, RF034, RF036), el escenario
describe lo que **no** debe ocurrir y cómo el sistema lo garantiza.

---

## M1 — Mapa en vivo

### HU001 — Mapa con sectores coloreados por estado *(RF001)*

- **Como** vecino de Cartagena
- **Quiero** ver el mapa de la ciudad con cada sector coloreado según su estado
- **Para** ver de un vistazo si mi sector tiene servicio

```gherkin
Dado un mapa de Cartagena cargado con la información de los sectores
Cuando el vecino abre la plataforma en modo en línea
Entonces el mapa muestra todos los sectores de Cartagena
Y cada sector aparece coloreado según su estado actual (con servicio, sin servicio, presión baja, corte programado)
Y el estado no se comunica solo por color (_RNF016_)
```

### HU002 — Detalle de un sector *(RF002)*

- **Como** vecino
- **Quiero** seleccionar un sector y ver su detalle
- **Para** conocer su estado, el último cambio y su histórico de cortes

```gherkin
Dado que el mapa muestra los sectores de Cartagena
Cuando el vecino selecciona un sector
Entonces se muestra el detalle del sector
Y ese detalle incluye el estado actual, el último cambio y el histórico de cortes
```

### HU003 — Antigüedad de la información *(RF003)*

- **Como** vecino
- **Quiero** ver cuánto tiempo hace que se actualizó el estado de cada sector
- **Para** no confundir un registro viejo con uno reciente

```gherkin
Dado que el mapa muestra un sector con su estado
Cuando el vecino lo consulta
Entonces el sistema muestra, junto al sector, cuánto tiempo hace que se actualizó su información
```

### HU004 — Lista textual accesible *(RF004)*

- **Como** vecino que usa lector de pantalla o prefiere texto
- **Quiero** consultar los sectores y sus estados como lista textual
- **Para** usar la plataforma sin depender del mapa

```gherkin
Dado que el mapa de Cartagena está disponible
Cuando el vecino elige la lista textual o navega con el lector de pantalla
Entonces encuentra una lista accesible de todos los sectores con su estado actual
```

---

## M2 — Reporte ciudadano

### HU005 — Reporte sin registro ni cuenta *(RF005)*

- **Como** vecino
- **Quiero** reportar "no tengo agua", "presión baja" o "ya volvió el servicio" sin registrarme ni iniciar sesión
- **Para** reportar en el momento, sin barreras

```gherkin
Dado que el vecino abre la plataforma sin estar registrado ni autenticado
Cuando elige "no tengo agua", "presión baja" o "ya volvió el servicio"
Entonces su reporte se registra
Y el sistema no le pide en ningún momento registro, cuenta, ni datos personales identificables
```

### HU006 — Límite de reportes por dispositivo *(RF006)*

- **Como** el sistema
- **Quiero** limitar los reportes que puede enviar cada dispositivo en una ventana de tiempo
- **Para** contener el abuso sin pedir registro

```gherkin
Dado que un dispositivo ya envió la cantidad máxima de reportes permitida en la ventana de tiempo vigente
Cuando ese dispositivo vuelve a intentar un reporte
Entonces el sistema rechaza el reporte
Y muestra el motivo y el momento en que podrá volver a reportar
```

### HU007 — Coordenada e inferencia de sector *(RF007)*

- **Como** vecino
- **Quiero** autorizar mi ubicación al reportar
- **Para** que se registre la coordenada y se infiera el sector correcto

```gherkin
Dado que el vecino está reportando un incidente
Cuando autoriza que el sistema lea su ubicación
Entonces el sistema registra la coordenada del reporte
Y a partir de ella infiere el sector donde se encuentra el evento
```

### HU008 — Reporte en dos toques *(RF008)*

- **Como** vecino
- **Quiero** reportar en pocos pasos desde el mapa
- **Para** responder rápido mientras no tengo agua

```gherkin
Dado que el vecino está viendo el mapa
Cuando elige un punto en la zona del problema y lo confirma
Entonces el reporte se envía en no más de dos toques desde el mapa
```

---

## M3 — Consenso automático

### HU009 — Cambio de estado por consenso *(RF009)*

- **Como** el sistema
- **Quiero** cambiar el estado de un sector cuando N reportes coinciden dentro de una ventana
- **Para** cambiar el mapa solo con varias voces, no con la de una sola persona

```gherkin
Dado que hay reportes recientes guardados de un sector
Y la ventana de tiempo está configurada
Cuando llegan N reportes independientes que coinciden dentro de la misma ventana y el período
Entonces el sistema actualiza el estado del sector automáticamente
```

### HU010 — Estrategias de consenso intercambiables *(RF010)*

- **Como** el sistema
- **Quiero** conmutar entre estrategias de consenso
- **Para** usar hoy un umbral fijo y mañana un umbral proporcional a la población del sector

```gherkin
Dado que la estrategia de consenso está configurada como umbral fijo o proporcional a la población
Cuando el sistema evalúa un cambio de estado
Entonces aplica la estrategia de consenso activa
Y el cambio de estrategia no modifica el resto del flujo de consenso
```

### HU011 — Reportes que sustentaron el cambio *(RF011)*

- **Como** veedor
- **Quiero** que el sistema registre los reportes que sustentaron cada cambio de estado
- **Para** poder revisar la causa de cualquier cambio

```gherkin
Dado que un sector cambió de estado por consenso
Cuando el veedor consulta ese cambio
Entonces el sistema muestra qué reportes individuales sustentaron el cambio
```

---

## M4 — Alertas por correo

### HU012 — Suscripción a sectores solo con correo *(RF012)*

- **Como** vecino
- **Quiero** suscribirme a uno o varios sectores con solo mi correo
- **Para** recibir alertas sin registrarme

```gherkin
Dado que el vecino quiere recibir alertas de un sector
Cuando indica un correo electrónico y elige los sectores
Entonces el correo queda vinculado a esos sectores para recibir alertas
```

### HU013 — Doble opt-in *(RF013)*

- **Como** el sistema
- **Quiero** confirmar una suscripción antes de enviar cualquier alerta
- **Para** cumplir la Ley 1581/2012 y no enviar correos no verificados

```gherkin
Dado que alguien solicita la suscripción con un correo
Cuando el sistema envía el correo de confirmación con un vínculo
Y el dueño del correo confirma el enlace
Entonces la suscripción queda activa
Y no se envió ninguna alerta antes de esa confirmación
```

### HU014 — Notificación de cambio de estado *(RF014)*

- **Como** vecino suscrito
- **Quiero** que me avisen cuando mi sector cambia de estado
- **Para** enterarme aunque el boletín no llegue

```gherkin
Dado que el vecino tiene una suscripción activa a un sector
Cuando el estado de ese sector pasa a corte anunciado, corte confirmado o restablecimiento
Entonces el sistema envía una alerta por correo al suscriptor
```

### HU015 — Baja en un clic *(RF015)*

- **Como** vecino suscrito
- **Quiero** darme de baja de alertas con un enlace
- **Para** que las alertas cesen cuando no las quiero más, sin credenciales

```gherkin
Dado que un suscriptor desea dejar de recibir alertas
Y que el correo enviado incluye un enlace de baja
Cuando el suscriptor abre el enlace y lo confirma una vez (sin credenciales)
Entonces el sistema cancela la suscripción
Y deja de enviarle correos
```

---

## M5 — Panel del veedor

### HU016 — Registrar corte oficial *(RF016)*

- **Como** veedor autenticado
- **Quiero** registrar un corte oficial con sus sectores, inicio, fin prometido y causa
- **Para** que la comunidad tenga la versión oficial del corte

```gherkin
Dado que el veedor está autenticado en el panel
Cuando registra un corte oficial indicando sectores afectados, inicio, fin prometido y causa
Entonces el corte se almacena y su información se publica en el mapa
```

### HU017 — Cerrar corte con hora real *(RF017)*

- **Como** veedor autenticado
- **Quiero** cerrar los cortes registrando la hora real de restablecimiento
- **Para** que sirva de insumo al Índice de Cumplimiento

```gherkin
Dado que existe un corte oficial abierto
Cuando el veedor lo cierra registrando la hora real de restablecimiento
Entonces el corte queda cerrado y la hora real queda guardada en el historial
```

### HU018 — Moderar reportes dudosos *(RF018)*

- **Como** veedor autenticado
- **Quiero** aprobar o descartar reportes marcados como dudosos
- **Para** controlar la calidad de los datos que se ven en el mapa

```gherkin
Dado que un reporte ciudadano está marcado como dudoso
Cuando el veedor lo aprueba o lo descarta en el panel
Entonces el reporte queda con la decisión del veedor y afuera de la publicación si fue descartado
```

### HU019 — Panel protegido con token *(RF019)*

- **Como** el sistema
- **Quiero** restringir el acceso al panel del veedor a quien esté autenticado con un token
- **Para** que la moderación sea cosa de personas autorizadas y el resto siga público

```gherkin
Dado que una persona no está autenticada
Cuando intenta acceder al panel
Entonces el sistema la redirige a la autenticación o la rechaza
Y el resto de la plataforma permanece público
```

---

## M6 — Índice de Cumplimiento ⭐

### HU020 — Desviación prometido vs real *(RF020)*

- **Como** el sistema
- **Quiero** calcular la desviación entre duración prometida y real de cada corte cerrado
- **Para** medir de verdad el cumplimiento

```gherkin
Dado que un corte cerrado tiene hora prometida y hora real
Cuando el corte se cierra
Entonces el sistema calcula la duración prometida, la duración real y su desviación
```

### HU021 — Índice por sector y global *(RF021)*

- **Como** ciudadanía
- **Quiero** consultar un índice de cumplimiento por sector y uno global de la ciudad
- **Para** comparar la promesa contra la realidad

```gherkin
Dado que hay cortes cerrados con los datos necesarios para el cálculo
Cuando la ciudadanía consulta el índice
Entonces encuentra el índice por cada sector y un índice global de Cartagena
```

### HU022 — Presentación como comparación *(RF022)*

- **Como** ciudadanía
- **Quiero** ver lo prometido y lo real, no un puntaje aislado
- **Para** entender de verdad el nivel de cumplimiento

```gherkin
Dado que la ciudadanía consulta el Índice
Entonces el sistema presenta la desviación como comparación explícita entre prometido y real
Y no como un simple puntaje
```

---

## M7 — Estadísticas

### HU023 — Sectores más afectados, duración y frecuencia *(RF023)*

```gherkin
Dado que el sistema registra los cortes y su duración
Cuando un veedor o periodista consulta las estadísticas
Entonces el sistema muestra los sectores más afectados, la duración promedio de los cortes y su frecuencia mensual
```

### HU024 — Evolución del índice *(RF024)*

```gherkin
Dado que existe histórico del índice de cumplimiento
Cuando el usuario consulta la evolución
Entonces el sistema muestra cómo cambió el índice a lo largo del tiempo
```

### HU025 — Exportación CSV *(RF025)*

```gherkin
Dado que el usuario está mirando las estadísticas
Cuando solicita la descarga
Entonces el sistema exporta las estadísticas en formato CSV abierto
```

---

## M8 — Bitácora pública

### HU026 — Bitácora de solo anexado *(RF026)*

- **Como** el sistema
- **Quiero** registrar cada evento relevante (corte anunciado, confirmado, restablecido) en una bitácora
- **Para** que todo quede documentado de forma ordenada

```gherkin
Dado que ocurre un evento relevante (corte anunciado, confirmado, restablecido)
Entonces el sistema lo registra en la bitácora de solo anexado (append-only)
```

### HU027 — Bitácora pública *(RF027)*

```gherkin
Dado un ciudadano
Entonces puede consultar la bitácora sin registrarse ni autenticarse
```

### HU028 — Eventos inmutables *(RF028)*

```gherkin
Dado que un evento ya está en la bitácora
Cuando intentan editar o eliminar ese evento
Entonces el sistema impide la operación
Y el registro original permanece íntegro
```

---

## M9 — Ingesta automática con IA

### HU029 — Consumo periódico de la API oficial *(RF029)*

```gherkin
Dado que está configurada la API oficial del operador
Cuando el sistema ejecuta la ingesta programada
Entonces consume la API y detecta publicaciones nuevas o modificadas
```

### HU030 — Fuentes de prensa vía RSS *(RF030)*

```gherkin
Dado que el sistema tiene habilitada una fuente de prensa vía RSS de agregadores públicos verificados (robots.txt)
Entonces el sistema la consume en la ingesta de prensa
```

### HU031 — Descarte de duplicados *(RF031)*

```gherkin
Dado un documento normalizado que ya existe en el sistema
Cuando la ingesta encuentra el mismo contenido
Entonces el sistema descarta el duplicado y registra el descarte
```

### HU032 — Clasificación y extracción con IA *(RF032)*

```gherkin
Dado un documento crudo limpio y no duplicado
Cuando la capa de IA lo procesa
Entonces clasifica si habla de una interrupción del acueducto
Y si la clasificación es positiva, extrae sectores, fechas, horas y causa en formato estructurado
```

### HU033 — Confianza y cita textual *(RF033)*

```gherkin
Dado que la IA produce una extracción
Entonces el resultado incluye un puntaje de confianza y la cita textual del fragmento que la sustenta
```

### HU034 — Rechazo de citas no literales *(RF034)*

```gherkin
Dado que una extracción afirma una cita
Cuando esa cita no aparece literalmente en el documento
Entonces el sistema la rechaza automáticamente
```

### HU035 — Confianza intermedia a revisión humana *(RF035)*

```gherkin
Dado un resultado con confianza intermedia
Entonces el sistema lo envía a una cola de revisión humana en lugar de publicar
```

### HU036 — No acceder a fuentes que bloquean a la IA *(RF036)*

```gherkin
Dado que se quiere incorporar una fuente al pipeline
Antes de la ingesta se verifica el robots.txt de esa fuente
Y si la fuente bloquea los agentes de IA
Entonces el sistema NO la usa y la deja fuera de la ingesta
```

---

## Trazabilidad del artefacto

Rastreado a [`matriz-trazabilidad.md`](../ingenieria/matriz-trazabilidad.md), Nivel 2 (Requisitos
funcionales): **RF001–RF036 tienen su historia**. Los RNF se verifican con mediciones (Nivel 3), no
con historias de usuario.

**Revisión:** verificado que `docs/product-requirements.md` define los 36 `RF` y que este anexo los cubre
todos, uno a uno, sin historias huérfanas.