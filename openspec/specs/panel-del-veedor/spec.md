# Panel del veedor

## Purpose

Dar a quien vigila el servicio las tres acciones que sostienen el resto del producto: registrar un
corte oficial con lo que el operador prometió, cerrarlo con la hora real en que volvió el agua, y
moderar los reportes ciudadanos que aún nadie ha revisado. Sin el corte prometido y el corte real
no hay Índice de Cumplimiento. Cubre M5 (RF016–RF019).

## Requirements

### Requirement: Registro de un corte oficial

El sistema SHALL permitir a un usuario autenticado registrar un corte oficial con sus sectores
afectados, hora de inicio, fin prometido y causa.

`CorteAgua` SHALL validar en su construcción la coherencia entre estado y ventana de tiempo: un
corte cuyo fin es anterior a su inicio no puede existir (ADR-024).

#### Scenario: Corte válido

- **WHEN** un veedor autenticado envía `POST /api/veedor/cortes` con sectores, inicio, fin
  prometido y causa
- **THEN** el corte queda registrado
- **AND** se anota el evento «corte anunciado» en la bitácora pública

#### Scenario: Ventana de tiempo incoherente

- **WHEN** el fin prometido es anterior al inicio
- **THEN** la construcción del corte falla y la API responde 400 en formato RFC 7807

### Requirement: Cierre de un corte con la hora real

El sistema SHALL permitir cerrar un corte registrando la hora real de restablecimiento. Ese dato es
el insumo del Índice de Cumplimiento.

#### Scenario: Cierre de un corte abierto

- **WHEN** un veedor envía `PATCH /api/veedor/cortes/{id}/cierre` con la hora real
- **THEN** el corte queda cerrado con esa hora
- **AND** su desviación prometido/real pasa a estar disponible

#### Scenario: Cierre de un corte inexistente

- **WHEN** se intenta cerrar un id de corte que no existe
- **THEN** la API responde 404 en formato RFC 7807, no 500

### Requirement: Moderación de reportes ciudadanos

El sistema SHALL permitir aprobar o descartar los reportes ciudadanos pendientes de moderación.
«Dudoso» SHALL significar «todo reporte sin moderar», no el resultado de una heurística de fraude
(ADR-023).

#### Scenario: Cola de pendientes

- **WHEN** un veedor consulta `GET /api/veedor/reportes/pendientes`
- **THEN** recibe los reportes aún sin moderar, paginados

#### Scenario: Reporte aprobado

- **WHEN** el veedor llama a `PATCH /api/veedor/reportes/{id}/aprobar`
- **THEN** el reporte pasa a aprobado y cuenta para el consenso

### Requirement: El panel exige autenticación, el resto es público

El acceso al panel SHALL requerir un token JWT con expiración máxima de 8 horas; el resto de la
plataforma SHALL ser público (RF019, RNF011).

La regla por defecto de la cadena de seguridad SHALL ser pública, y solo `/api/veedor/**` —salvo el
inicio de sesión— SHALL exigir autenticación, para que un endpoint público nuevo no dependa de que
alguien recuerde declararlo.

#### Scenario: Petición sin token al panel

- **WHEN** se llama a cualquier ruta bajo `/api/veedor/` sin token, salvo `POST /api/veedor/sesion`
- **THEN** la API responde 401

#### Scenario: Token expirado

- **WHEN** se presenta un token emitido hace más de 8 horas
- **THEN** la API responde 401 y la sesión no se renueva sola

#### Scenario: Fuerza bruta contra el inicio de sesión

- **WHEN** una misma IP falla el inicio de sesión más de 5 veces en 5 minutos
- **THEN** las peticiones siguientes se rechazan con 429 durante lo que resta de la ventana
