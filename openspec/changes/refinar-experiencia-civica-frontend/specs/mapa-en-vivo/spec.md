## MODIFIED Requirements

### Requirement: Estado de todos los sectores en el mapa

El sistema SHALL mostrar un mapa de Cartagena con todos los sectores coloreados según su estado actual: con servicio, sin servicio, presión baja o corte programado. Un sector que la API reconoce y para el que el monitoreo continuo no encuentra corte anunciado ni reporte vigente SHALL publicarse como `CON_SERVICIO` (ADR-035); una geometría local que no tenga correspondencia en la API SHALL presentarse como «sin dato», nunca como «con servicio» (ADR-014).

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
