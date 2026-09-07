## MODIFIED Requirements

### Requirement: Estado de todos los sectores en el mapa

El sistema SHALL mostrar un mapa de Cartagena con todos los sectores coloreados según su estado actual: con servicio, sin servicio, presión baja o corte programado. Un sector que la API reconoce y para el que el monitoreo continuo no encuentra corte anunciado ni reporte vigente SHALL publicarse como `CON_SERVICIO` (ADR-035); una geometría local que no tenga correspondencia en la API o un estado con más de 30 días SHALL presentarse como «sin datos recientes», nunca como «con servicio» (ADR-014).

El color SHALL ir siempre acompañado de forma o texto: nunca es el único portador del mensaje (RNF016).

#### Scenario: Sector con corte confirmado

- **WHEN** un sector tiene un corte confirmado vigente
- **THEN** `GET /api/sectores` lo devuelve con estado `SIN_SERVICIO`
- **AND** el mapa lo pinta en rojo y lo acompaña de su etiqueta textual

#### Scenario: Sector monitoreado sin alertas vigentes

- **WHEN** el sector existe en la API y el monitoreo no encuentra un corte anunciado ni un reporte vigente
- **THEN** la API lo devuelve con estado `CON_SERVICIO`
- **AND** la interfaz lo presenta como «con servicio» conforme al ADR-035

#### Scenario: Sector del que no se sabe nada

- **WHEN** un barrio existe en la geometría local pero no corresponde a ningún sector devuelto por la API
- **THEN** la interfaz lo presenta como «sin dato», distinguible de un sector operando normal

#### Scenario: Estado publicado hace más de 30 días

- **WHEN** la API devuelve un estado cuya marca de actualización supera los 30 días
- **THEN** la interfaz conserva el barrio consultable pero neutraliza su estado
- **AND** no lo cuenta ni presenta como una condición actual

### Requirement: Primera respuesta útil bajo tres segundos en 3G

El sistema SHALL mostrar el estado de todos los sectores en menos de 3 segundos sobre conexión 3G simulada (RNF001). El mapa SHALL cargar primero el estado y después la geometría detallada, y ningún splash, presentación de marca ni animación decorativa SHALL bloquear o cubrir esa primera respuesta útil.

#### Scenario: Medición con throttling 3G

- **WHEN** se audita la página principal con throttling 3G
- **THEN** el estado de los sectores es visible antes de los 3 segundos
- **AND** no existe una pantalla de introducción que impida consultarlo

## ADDED Requirements

### Requirement: Degradación honesta ante dependencias no disponibles

El sistema SHALL distinguir entre un conteo real igual a cero y la imposibilidad de consultar la fuente. La pérdida de la API, del flujo SSE o del proveedor de teselas SHALL comunicarse sin fabricar estados, ocultar la última actualización conocida ni impedir el uso de las alternativas todavía disponibles.

#### Scenario: API no disponible sin datos previos

- **WHEN** la consulta inicial de sectores falla y no existe una respuesta anterior válida
- **THEN** la interfaz muestra que el estado no se pudo consultar y ofrece reintentar
- **AND** no muestra contadores por estado con valor cero

#### Scenario: SSE interrumpido con datos previos

- **WHEN** el flujo en vivo se interrumpe después de recibir una respuesta válida
- **THEN** la interfaz conserva el último estado conocido con su marca de tiempo
- **AND** informa que está intentando recuperar la actualización en vivo

#### Scenario: Proveedor de mapa base no disponible

- **WHEN** fallan las teselas del proveedor externo
- **THEN** la geometría local, los colores de estado y la lista textual siguen disponibles
- **AND** la interfaz informa que el mapa base no pudo cargarse sin atribuir el fallo a los datos del servicio

### Requirement: Navegación continua alrededor del mapa

El mapa SHALL permitir continuar el desplazamiento vertical de la página sin capturar la rueda del ratón. En pantallas de hasta 768 px SHALL ocupar una altura acotada y la consulta textual de barrios SHALL aparecer en el flujo inmediatamente después del lienzo, no oculta detrás de un panel exclusivo de escritorio.

#### Scenario: Rueda sobre el mapa

- **WHEN** una persona desplaza la rueda mientras el puntero está sobre el mapa
- **THEN** la página continúa su desplazamiento vertical
- **AND** el nivel de zoom del mapa no cambia

#### Scenario: Consulta desde un teléfono

- **WHEN** la portada se abre en una pantalla de 360 px
- **THEN** el mapa tiene una altura acotada
- **AND** la búsqueda y la lista textual de barrios permanecen disponibles en el flujo de la página

### Requirement: Presentación sustentada por datos publicados

La primera vista, la bitácora, las estadísticas y los llamados ciudadanos SHALL mostrar únicamente eventos, estados y métricas recibidos de las APIs conectadas. No SHALL completar estados vacíos con boletines, radicados, telemetría, fotografías, rankings, firmas ni hallazgos de muestra.

#### Scenario: Fuentes sin resultados

- **WHEN** una consulta válida no devuelve eventos o estadísticas
- **THEN** la sección explica que no hay datos disponibles
- **AND** no muestra contenido de demostración como sustituto

#### Scenario: Geometría sin estado publicado

- **WHEN** un polígono no tiene un sector con estado en la respuesta de la API
- **THEN** el mapa usa la presentación neutral de «sin dato»
- **AND** no destaca por defecto ningún barrio ni le asigna un estado operativo

### Requirement: Catálogo cartográfico completo y relieve contextual

El sistema SHALL mantener consultables todos los nombres únicos de la cartografía local aunque la API de estado entregue una lista parcial. SHALL usar una capa de relieve geográfico real como contexto visual, con atribución visible, sin convertir el relieve en evidencia sobre el servicio de agua.

#### Scenario: Barrio ausente de la respuesta operativa

- **WHEN** un nombre existe en el GeoJSON local y no aparece en `GET /api/sectores`
- **THEN** la búsqueda permite localizarlo y seleccionarlo
- **AND** su ficha indica «sin datos recientes» y no permite enviar un identificador inventado a la API

#### Scenario: Capa de relieve no disponible

- **WHEN** falla el proveedor de relieve
- **THEN** el mapa conserva la geometría local, la capa base y la consulta textual
- **AND** no fabrica una textura o dato de elevación sustituto

### Requirement: Eventos recientes verificados por el backend

La ficha de un barrio SHALL mostrar únicamente eventos publicados por `/api/bitacora`, asociados por `sectorId` y con antigüedad máxima de 30 días. El navegador SHALL NOT consultar WordPress de Acuacar ni inferir estados a partir de texto por su cuenta.

#### Scenario: Boletín antiguo o sin asociación verificable

- **WHEN** un evento tiene más de 30 días o no corresponde al `sectorId` seleccionado
- **THEN** la ficha no lo presenta como aviso vigente de ese barrio
- **AND** comunica honestamente que no hay eventos recientes si no queda otro evento válido
