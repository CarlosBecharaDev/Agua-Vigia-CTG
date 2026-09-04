# Índice de Cumplimiento

## Purpose

Es la pieza que define el proyecto: comparar la duración que el operador prometió con la que el
corte realmente duró, y publicarlo. No es un puntaje de calidad ni una calificación; es la
diferencia entre lo dicho y lo hecho, presentada como comparación explícita. Cubre M6
(RF020–RF022).

## Requirements

### Requirement: Desviación entre duración prometida y real

El sistema SHALL calcular, por cada corte cerrado que tenga hora prometida, la desviación entre su
duración prometida y su duración real.

#### Scenario: Corte que duró más de lo prometido

- **WHEN** se consulta `GET /api/cumplimiento/cortes/{corteId}` de un corte cerrado que prometía
  2 horas y duró 8
- **THEN** la respuesta expone ambas duraciones y la desviación entre ellas

#### Scenario: Corte cerrado sin hora prometida

- **WHEN** un corte cerrado no tiene fin prometido
- **THEN** no aporta al índice, en vez de contarse como cumplido

### Requirement: Índice agregado por sector y global

El sistema SHALL publicar un índice agregado de cumplimiento por sector y uno global de la ciudad.

La agregación SHALL hacerse por suma de duraciones, no por promedio de porcentajes: promediar
porcentajes le daría a un corte de 20 minutos el mismo peso que a uno de 12 horas (ADR-022).

#### Scenario: Agregado de un sector

- **WHEN** se consulta `GET /api/cumplimiento/sectores/{sectorId}`
- **THEN** el índice devuelto resulta de sumar las duraciones prometidas y las reales de sus
  cortes cerrados, no de promediar sus porcentajes

#### Scenario: Todavía no hay nada medido

- **WHEN** no existe ningún corte cerrado con hora prometida
- **THEN** el sistema informa que no hay dato, y nunca un cumplimiento del 100%

### Requirement: El índice se presenta como comparación, no como puntaje

El sistema SHALL presentar el índice como comparación explícita entre lo prometido y lo real. Un
`87%` sin referencia no comunica nada; `Prometieron 2 horas · Fueron 8` sí (RF022).

#### Scenario: Presentación en la interfaz

- **WHEN** la interfaz muestra el índice de un sector
- **THEN** muestra la barra de «prometido» y la de «real» una junto a la otra, con las cifras en
  lenguaje natural

### Requirement: Evolución del índice en el tiempo

El sistema SHALL exponer la serie temporal del índice y permitir exportarla en formato abierto.

#### Scenario: Serie mensual

- **WHEN** se consulta `GET /api/cumplimiento/serie`
- **THEN** se obtiene la evolución del índice mes a mes

#### Scenario: Exportación para uso periodístico

- **WHEN** se consulta `GET /api/cumplimiento/serie.csv`
- **THEN** se descarga la misma serie en CSV
