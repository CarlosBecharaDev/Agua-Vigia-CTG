# Alertas push

## Purpose

Ofrecer al vecino que su aviso llegue por mensajería instantánea en vez del correo. La cadena
evento → caso de uso → puerto está construida y probada; el adaptador que llama al proveedor real
sigue pendiente porque exige credenciales de WhatsApp Business o Telegram que el proyecto no tiene.
Cubre M14 (RF041).

## Requirements

### Requirement: Notificación de cambio de estado por un puerto de mensajería

El sistema SHALL disparar una notificación push hacia un puerto de salida cuando un sector cambie
de estado, de forma que cambiar de proveedor no toque el dominio ni el caso de uso.

#### Scenario: Cambio de estado con suscriptores push

- **WHEN** un sector con suscriptores push cambia de estado
- **THEN** el caso de uso invoca el puerto de notificación push con el sector y el mensaje

### Requirement: El adaptador real está pendiente y se declara como tal

Mientras no existan credenciales del proveedor, la implementación del puerto SHALL registrar el
envío en el log y SHALL NOT simular un envío exitoso ante el usuario. El estado pendiente de esta
capacidad se declara en la documentación en vez de disimularse.

#### Scenario: Entorno sin credenciales del proveedor

- **WHEN** se dispara una alerta push y no hay proveedor configurado
- **THEN** queda registrada en el log
- **AND** la interfaz no le promete al vecino un mensaje que no va a llegar
