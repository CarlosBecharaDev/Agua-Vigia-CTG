# Capítulo I — El problema

> ESTRUCTURA SIN VALIDAR CONTRA LA PLANTILLA OFICIAL
>
> Este capítulo se redactó contra el índice reconstruido en `README.md` de este directorio. La
> plantilla institucional del Tecnológico Comfenalco no está aún validada (tarea pendiente de D1,
> `ADR-021`); títulos y numeración pueden diferir. Las fuentes citadas en cada sección son los
> documentos del repositorio — transformar y citar, no inventar.

---

## 1. Planteamiento del problema

Cartagena de Indias vive desde 2023 fallas recurrentes de continuidad en el acueducto operado por
Acuacar, en concesión con Veolia vigente hasta 2034 (`docs/brief.md`). Entre mayo y julio de 2026 los
racionamientos sectorizados afectaron hasta al **15 % de la población**, y la planta El Bosque — que
abastece cerca del **90 %** del agua potable de la ciudad — redujo su capacidad por proliferación de
algas (`MEMORY.md` § Contexto del problema; `docs/brief.md`).

Frente a ello existen dos crisis que se confunden (`docs/brief.md`):

- **La falla técnica**: la infraestructura no entrega agua. La resuelve el operador con inversión en
  obra y no está en el alcance del proyecto.
- **La falla de información:** el vecino no sabe qué está pasando. Es un vacío de información que
  multiplica el daño — quien no sabe si hay agua no sabe si comprar botellones, abrir su negocio o
  esperar.

En junio de 2026 el **Tribunal Administrativo de Bolívar** dictó medidas cautelares ordenando al
operador *socializar previamente* cada interrupción, con tiempos exactos y condiciones
(`MEMORY.md` § Contexto del problema). Que un juez deba ordenar lo que una empresa de
servicios públicos debería hacer por defecto confirma que la falta de aviso no era percepción
ciudadana, sino un incumplimiento verificable. Es el hecho que fundamenta el proyecto
(`docs/brief.md` § "Por qué existe").

Los avisos oficiales se dispersan entre la web del operador, la prensa y grupos de WhatsApp sin
estructura ni histórico consultable. No existe un punto donde el vecino vea el estado real de su
sector, cruce el aviso oficial con lo que realmente está ocurriendo y consulte después cuánto duró de
verdad cada corte respecto de lo prometido (`docs/brief.md` § Qué lo hace
distinto).

## 2. Formulación del problema

¿Cómo puede la ciudadanía de Cartagena obtener información **oportuna, verificable y trazable** sobre
las interrupciones del acueducto, cuando los avisos oficiales se dispersan y no existe una medición
pública de cuánto se cumplió de lo anunciado?

## 3. Justificación

Las razones que sustentan el proyecto son de tres tipos:

**Social.** Quien no sabe si habrá agua toma decisiones a ciegas: comprar botellones, suspender su
local, perder reservas. La medida cautelar del Tribunal Administrativo de Bolívar (junio 2026) muestra
que el operador no socializaba las interrupciones con el detalle exigible y que un juez tuvo que
ordenarlo (`MEMORY.md`). Cerrar ese vacío de información multiplica el daño del corte
(`CLAUDE.md` § Qué es este proyecto).

**Técnico-académica.** El proyecto aplica Arquitectura Limpia (domain/application/infrastructure/api)
verificada con ArchUnit en la build (`docs/design-decisions.md`, ADR-001 y ADR-002), usa objetos
de valor que validan al construir (`CLAUDE.md` § Arquitectura) y aplica un enfoque de investigación
**proyectivo y mixto**, validado con Alfa de Cronbach ≥ 0.75 (`CLAUDE.md` § Formato académico). El
proyecto demuestra además una postura ética de datos: respeta los bloqueos de `robots.txt` y exige
cita textual verificable a toda extracción de IA antes de publicarla (`ADR-004`, `ADR-005`, `ADR-006`).

**Informativa (diferencial).** El **Índice de Cumplimiento** compara la duración prometida de cada
corte con la real; nadie más registra ambos datos simultáneamente ni publica esa brecha
(`docs/brief.md` § Qué lo hace distinto).

## 4. Objetivo general

**Desarrollar una plataforma web ciudadana de monitoreo y trazabilidad del acueducto de Cartagena de
Indias que cruce los avisos oficiales con los reportes de la vecindad y publique el Índice de
Cumplimiento del operador** (`CLAUDE.md` § Qué es este proyecto).

## 5. Objetivos específicos

Se adoptan los cuatro objetivos específicos de la trazabilidad de requisitos del repositorio
(`docs/product-requirements.md` § 4):

1. **Analizar los requisitos mediante elicitación** (instrumentos de los Anexos 1–3 y 4).
2. **Diseñar una arquitectura limpia y un modelo geoespacial** que soporte el estado por sector.
3. **Implementar la plataforma con Spring Boot, MongoDB, Redis y React aplicando SOLID**.
4. **Validar el funcionamiento y la aceptación** con pruebas, métricas del clasificador, un Índice de
   Cumplimiento y los instrumentos de percepción de los Anexos.

## 6. Alcance

La plataforma interviene sobre la **información**, no sobre la infraestructura (`docs/brief.md`
§ Qué NO es). Cubre los nueve módulos M1–M9 (mapa en vivo, reporte ciudadano sin registro, consenso
automático, alertas por correo con doble opt-in, panel del veedor, Índice de Cumplimiento,
estadísticas, bitácora pública inmutable e ingesta de boletines con IA) y los requisitos funcionales y
no funcionales registrados en `docs/product-requirements.md` (36 funcionales, 20 no funcionales;
`CLAUDE.md` § Dónde está cada cosa).

## 7. Limitaciones

- **No repara el suministro**: ninguna funcionalidad interviene sobre la infraestructura hidráulica
  (`docs/brief.md` § Qué no es).
- **No es una red social** ni sustituye la línea de atención del operador ni es canal de emergencias
  (del propio brief).
- **No recolecta datos personales**: reportar no requiere cuenta; suscribirse solo pide un correo
  con baja en un clic (por Ley 1581/2012).
- **No scrapea redes sociales ni medios que lo prohíban** (`CLAUDE.md` § Ética de datos).
- La ingesta de cortes verifica con la limitación de que **nada llega al mapa público sin verificar**:
  solo lo que el modelo pueda citar textualmente (ADR-006).

---

## 8. Referencias del capítulo

Fuentes internas del repositorio que sustentan las afirmaciones anteriores:

- `docs/brief.md` — problema, porqué, personas, diferencial e índices de éxito.
- `MEMORY.md` — contexto del problema (15 %, planta El Bosque, fallo del 2026).
- `docs/product-requirements.md` — requisitos funcionales/no funcionales y trazabilidad.
- `docs/design-decisions.md` — ADR-001, ADR-002, ADR-004, ADR-005, ADR-006.
- `CLAUDE.md` — alcance, arquitectura, ética de datos y formato académico.

> Las referencias externas (normas, jurisprudencia, artículos) en formato APA-7 se consolidarán en
> `referencias.md` una vez validada la plantilla; ninguna cita externa se añadirá sin verificar.