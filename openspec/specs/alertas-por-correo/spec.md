# Alertas por correo

## Purpose

Avisar al vecino en su correo cuando su sector cambie de estado, sin pedirle más que la dirección.
El doble opt-in y la baja en un clic no son cortesía: son la Ley 1581 de 2012 sobre datos
personales. Cubre M4 (RF012–RF015).

## Requirements

### Requirement: Suscripción con solo un correo

El sistema SHALL permitir suscribirse a uno o más sectores indicando únicamente un correo
electrónico.

#### Scenario: Alta de suscripción

- **WHEN** alguien envía `POST /api/suscripciones` con su correo y uno o más sectores
- **THEN** la suscripción queda creada en estado pendiente de confirmación
- **AND** no se envía ninguna alerta todavía

### Requirement: Doble opt-in antes de cualquier alerta

El sistema SHALL confirmar la suscripción mediante doble opt-in antes de enviar cualquier alerta.

#### Scenario: Suscripción sin confirmar

- **WHEN** el sector de una suscripción pendiente cambia de estado
- **THEN** no se le envía ninguna alerta a ese correo

#### Scenario: Confirmación desde el enlace del correo

- **WHEN** el suscriptor abre el enlace de `GET /api/suscripciones/confirmar` con su token
- **THEN** la suscripción pasa a confirmada
- **AND** la respuesta es HTML o JSON según la cabecera `Accept`, sin rutas separadas (ADR-030)

### Requirement: Notificación al cambiar el estado del sector

El sistema SHALL notificar al suscriptor confirmado cuando su sector cambie de estado: corte
anunciado, confirmado o restablecido.

#### Scenario: Corte confirmado en un sector suscrito

- **WHEN** un sector con suscriptores confirmados pasa a `SIN_SERVICIO`
- **THEN** cada suscriptor confirmado recibe un correo con el cambio

#### Scenario: Fallo del servidor de correo

- **WHEN** el envío del correo falla
- **THEN** el cambio de estado del sector se publica igual y el fallo no propaga al flujo principal

### Requirement: Baja en un clic sin credenciales

Todo correo SHALL incluir un enlace de baja que funcione en un solo clic, sin pedir credenciales.
Al darse de baja, el correo SHALL eliminarse (RNF009).

#### Scenario: Baja desde el enlace

- **WHEN** el suscriptor abre el enlace de `GET /api/suscripciones/cancelar` con su token
- **THEN** la suscripción se cancela sin pedirle contraseña ni datos adicionales
- **AND** su correo deja de estar almacenado
