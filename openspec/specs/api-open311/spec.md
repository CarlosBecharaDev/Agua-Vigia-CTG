# API abierta Open311

## Purpose

Exponer los datos cívicos del proyecto bajo un estándar internacional, para que otra plataforma
pueda consumirlos sin acuerdo previo. Publica el estado agregado por sector, nunca el reporte
individual de un vecino: la interoperabilidad no puede costar la privacidad de quien reporta.
Cubre M12 (RF039).

## Requirements

### Requirement: Exposición Open311 del estado agregado

El sistema SHALL exponer los reportes confirmados y los cortes oficiales mediante una API que
cumpla el estándar Open311.

Lo publicado SHALL ser el estado agregado por sector, no cada reporte ciudadano individual
(ADR-026).

#### Scenario: Consumo por un tercero

- **WHEN** un tercero consulta `GET /api/v2/requests.json`
- **THEN** obtiene, en el formato del estándar, el estado agregado por sector y los cortes
  oficiales

#### Scenario: Ningún dato de quien reporta

- **WHEN** se inspecciona cualquier respuesta de la API Open311
- **THEN** no aparece la huella de dispositivo ni ningún dato que permita identificar a un
  reportante
