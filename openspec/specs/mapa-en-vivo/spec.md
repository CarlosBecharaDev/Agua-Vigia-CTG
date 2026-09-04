# Mapa en vivo

## Purpose

Responder la única pregunta con la que la gente entra a AguaVigía —«¿tengo agua o no, y hasta
cuándo?»— en menos de cinco segundos, sin leer, sin registrarse y sin hacer scroll. Publica el
estado actual de cada sector de Cartagena sobre un mapa, con una alternativa textual equivalente
para quien no puede ver el mapa. Cubre M1 (RF001–RF004).

## Requirements

### Requirement: Estado de todos los sectores en el mapa

El sistema SHALL mostrar un mapa de Cartagena con todos los sectores coloreados según su estado
actual: con servicio, sin servicio, presión baja o corte programado. Un sector sin dato verificado
SHALL publicarse con estado nulo, nunca como «con servicio» (ADR-014).

El color SHALL ir siempre acompañado de forma o texto: nunca es el único portador del mensaje
(RNF016).

#### Scenario: Sector con corte confirmado

- **WHEN** un sector tiene un corte confirmado vigente
- **THEN** `GET /api/sectores` lo devuelve con estado `SIN_SERVICIO`
- **AND** el mapa lo pinta en rojo y lo acompaña de su etiqueta textual

#### Scenario: Sector del que no se sabe nada

- **WHEN** ninguna fuente verificada ha reportado el estado de un sector
- **THEN** su estado es `null`, no `CON_SERVICIO`
- **AND** la interfaz lo presenta como «sin dato», distinguible de un sector operando normal

### Requirement: Detalle de un sector

El sistema SHALL permitir consultar el detalle de un sector —estado, último cambio e histórico de
cortes— al seleccionarlo.

#### Scenario: Consulta del detalle

- **WHEN** el usuario selecciona un sector en el mapa o en la lista
- **THEN** `GET /api/sectores/{id}` devuelve su estado, la marca de tiempo del último cambio y su
  histórico de cortes

#### Scenario: Sector inexistente

- **WHEN** se consulta un id de sector que no existe
- **THEN** la API responde 404 con un cuerpo en formato RFC 7807

### Requirement: Frescura visible del dato

El sistema SHALL mostrar, junto a cada sector, cuánto tiempo hace que se actualizó su información.
Un mapa congelado que presenta datos viejos como actuales es peor que un mapa que admite que no
sabe.

#### Scenario: Fuente muda por horas

- **WHEN** la última actualización de un sector supera el umbral de frescura
- **THEN** la interfaz lo marca como degradado en vez de presentar el dato como vigente

### Requirement: Alternativa textual accesible al mapa

El sistema SHALL ofrecer una lista textual de sectores con su estado como alternativa equivalente
al mapa. Un mapa sin lista es inaccesible para lector de pantalla (RNF012–RNF016).

#### Scenario: Navegación solo con teclado

- **WHEN** una persona recorre la página únicamente con el teclado
- **THEN** puede alcanzar la lista de sectores y leer el estado de cada uno, con foco visible en
  todo momento

### Requirement: Actualización del mapa sin recargar

El sistema SHALL emitir los cambios de estado de sector por un flujo de eventos servidor-cliente,
para que el mapa se actualice sin que el usuario recargue la página.

#### Scenario: Cambio de estado mientras el mapa está abierto

- **WHEN** un sector cambia de estado y hay un cliente suscrito a `GET /api/sectores/stream`
- **THEN** el cliente recibe el evento con el nuevo estado
- **AND** el mapa se repinta sin recarga

### Requirement: Primera respuesta útil bajo tres segundos en 3G

El sistema SHALL mostrar el estado de todos los sectores en menos de 3 segundos sobre conexión 3G
simulada (RNF001). El mapa SHALL cargar primero el estado y después la geometría detallada.

#### Scenario: Medición con throttling 3G

- **WHEN** se audita la página principal con throttling 3G
- **THEN** el estado de los sectores es visible antes de los 3 segundos
