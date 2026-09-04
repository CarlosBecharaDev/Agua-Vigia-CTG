# Consenso automático

## Purpose

Convertir muchos reportes sueltos en un hecho publicable: cuando suficientes vecinos independientes
coinciden dentro de una ventana de tiempo, el sector cambia de estado sin que nadie lo apruebe a
mano. Es el diferencial del producto y también su mayor riesgo, así que cada cambio queda con los
reportes que lo sustentaron. Cubre M3 (RF009–RF011).

## Requirements

### Requirement: Cambio de estado por masa crítica de reportes

El sistema SHALL cambiar el estado de un sector automáticamente cuando N reportes independientes
coincidan dentro de una ventana de tiempo configurable.

#### Scenario: Se alcanza el umbral

- **WHEN** el número de reportes independientes del mismo tipo en un sector alcanza el umbral
  dentro de la ventana
- **THEN** el estado del sector cambia
- **AND** se registra el evento correspondiente en la bitácora pública

#### Scenario: Reportes insuficientes

- **WHEN** los reportes no alcanzan el umbral dentro de la ventana
- **THEN** el estado del sector no cambia
- **AND** los reportes siguen contando hasta que la ventana los deje fuera

### Requirement: Estrategias de consenso intercambiables

El sistema SHALL soportar al menos dos estrategias de consenso intercambiables: umbral fijo y
umbral proporcional a la población del sector. La estrategia SHALL ser seleccionable por
configuración sin tocar el caso de uso.

#### Scenario: Umbral proporcional en un sector populoso

- **WHEN** la estrategia activa es la proporcional y el sector tiene una población alta registrada
- **THEN** el umbral exigido es mayor que el de un sector pequeño

#### Scenario: Sector sin población registrada

- **WHEN** la estrategia proporcional no encuentra población para el sector
- **THEN** recurre al umbral fijo en vez de fallar

### Requirement: Trazabilidad del cambio por consenso

El sistema SHALL registrar qué reportes sustentaron cada cambio de estado por consenso, para que un
veedor pueda auditar por qué el mapa dice lo que dice.

#### Scenario: Auditoría de un cambio publicado

- **WHEN** un veedor consulta un cambio de estado producido por consenso
- **THEN** obtiene la lista de los reportes que lo sustentaron
