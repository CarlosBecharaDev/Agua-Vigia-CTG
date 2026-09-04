# Estadísticas

## Purpose

Dar al veedor y al periodista la evidencia acumulada que un mapa en vivo no puede dar: qué sectores
sufren más, cuánto duran los cortes, con qué frecuencia ocurren y cómo evoluciona el cumplimiento.
Es el insumo de la denuncia informada, no un tablero decorativo. Cubre M7 (RF023–RF025).

## Requirements

### Requirement: Sectores más afectados, duración y frecuencia

El sistema SHALL mostrar los sectores más afectados, la duración promedio de los cortes y su
frecuencia mensual.

#### Scenario: Consulta de estadísticas

- **WHEN** se consulta `GET /api/estadisticas`
- **THEN** la respuesta incluye el ranking de sectores afectados, la duración promedio y la
  frecuencia mensual de cortes

#### Scenario: Base de datos sin cortes

- **WHEN** todavía no hay cortes cerrados
- **THEN** cada métrica se presenta como «sin dato», con su estado vacío explicado, y no como cero

### Requirement: Coherencia entre los totales presentados

Las cifras que la interfaz presenta juntas SHALL provenir del mismo conjunto de cortes. Un total
calculado sobre un universo distinto al de su desglose es un dato falso aunque cada mitad sea
correcta.

#### Scenario: Total y desglose

- **WHEN** la interfaz muestra un total junto a su reparto por día de la semana
- **THEN** el total es la suma de ese reparto, no un conteo de otro conjunto

### Requirement: Exportación en formato abierto

El sistema SHALL permitir exportar las estadísticas en CSV, para uso periodístico y académico.

#### Scenario: Descarga del CSV

- **WHEN** se consulta `GET /api/estadisticas/exportar.csv`
- **THEN** se descarga un CSV con las mismas cifras que muestra la pantalla
