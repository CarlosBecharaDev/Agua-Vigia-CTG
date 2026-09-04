# Bitácora pública

## Purpose

Sostener el valor probatorio del proyecto: un registro cronológico de solo anexado, público y sin
autenticación, donde queda cada corte anunciado, cada confirmación ciudadana y cada
restablecimiento. Si un evento pudiera editarse, la bitácora no probaría nada. Cubre M8
(RF026–RF028).

## Requirements

### Requirement: Registro de solo anexado de todo evento relevante

El sistema SHALL registrar en la bitácora cada evento relevante: corte anunciado, confirmado por
ciudadanos y restablecido.

#### Scenario: Corte anunciado

- **WHEN** un veedor registra un corte oficial
- **THEN** la bitácora suma un evento «corte anunciado» con su marca de tiempo y su sector

#### Scenario: Estado cambiado por consenso

- **WHEN** el consenso automático cambia el estado de un sector
- **THEN** la bitácora suma el evento correspondiente

### Requirement: Consulta pública sin autenticación

La bitácora SHALL ser consultable públicamente, sin autenticación.

#### Scenario: Lectura anónima

- **WHEN** cualquiera consulta `GET /api/bitacora` sin token
- **THEN** obtiene los eventos, paginados y en orden cronológico

### Requirement: Inmutabilidad de los eventos

Ningún evento de la bitácora SHALL poder editarse ni eliminarse una vez registrado. No existe
operación de escritura sobre un evento ya publicado.

#### Scenario: No hay forma de modificar un evento

- **WHEN** se busca una operación de actualización o borrado sobre un evento de bitácora
- **THEN** no existe en la API ni en el puerto de salida del dominio
