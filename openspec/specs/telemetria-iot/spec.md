# Telemetría IoT pasiva

## Purpose

Dejar que un sensor de presión casero —un ESP32 en la casa de un vecino— reporte solo, sin que
nadie tenga que abrir la aplicación. Un sensor no es un ciudadano: se autentica con su propia
clave y tiene su propio cupo, porque reporta cada pocos minutos por diseño. Cubre M13 (RF040).

## Requirements

### Requirement: Endpoint autenticado para sensores de presión

El sistema SHALL exponer un endpoint para recibir reportes automáticos de caída de presión desde
sensores IoT residenciales, autenticado con una clave propia del sensor.

#### Scenario: Sensor con clave válida

- **WHEN** un sensor envía `POST /api/iot/presion` con su cabecera `X-IoT-Key` válida
- **THEN** el reporte se registra y cuenta para el consenso del sector

#### Scenario: Sensor sin clave o con clave inválida

- **WHEN** la petición llega sin `X-IoT-Key` o con una clave que no corresponde
- **THEN** la API la rechaza y no registra nada

### Requirement: Cupo propio del sensor, separado del ciudadano

El cupo de reportes de un sensor SHALL ser independiente del cupo por dispositivo ciudadano, y
SHALL existir: una clave filtrada o un sensor mal configurado no puede inundar el consenso.

#### Scenario: Sensor que reporta cada pocos minutos

- **WHEN** un sensor reporta con su cadencia normal
- **THEN** no se autobloquea contra el cupo ciudadano

#### Scenario: Sensor desbocado

- **WHEN** un sensor supera su propio cupo dentro de la ventana
- **THEN** sus reportes siguientes se rechazan hasta que la ventana se libere
