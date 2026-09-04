# Ingesta automatizada

## Purpose

Traer al sistema lo que el operador y la prensa publican, sin que nadie tenga que copiarlo a mano, y
sin publicar nunca algo que no se pueda respaldar. La clasificación por IA se descartó (ADR-025); lo
que queda es una heurística que **propone** a una cola de revisión del veedor y no publica por su
cuenta (ADR-028), salvo el boletín oficial del propio operador. Cubre M9 (RF029–RF031); RF032–RF036
quedaron fuera de alcance.

## Requirements

### Requirement: Consumo periódico de la fuente oficial

El sistema SHALL consumir periódicamente la API oficial del operador y detectar publicaciones
nuevas o modificadas. SHALL recordar hasta dónde leyó cada fuente, en vez de mirar siempre los
últimos N días.

#### Scenario: Publicación nueva desde la última lectura

- **WHEN** el colector corre y la fuente tiene boletines posteriores a su última marca de lectura
- **THEN** los ingiere y avanza la marca

#### Scenario: Ejecución sin novedades

- **WHEN** no hay publicaciones posteriores a la marca
- **THEN** el colector no ingiere nada y no retrocede la marca

### Requirement: Consumo de prensa por RSS respetando robots.txt

El sistema SHALL consumir fuentes de prensa vía RSS de agregadores públicos, y SHALL NOT acceder a
fuentes cuyo `robots.txt` bloquee agentes de IA. El colector SHALL identificarse siempre con un
`User-Agent` que incluya el nombre del proyecto y un correo de contacto, y SHALL NOT disfrazarlo
(ADR-005).

#### Scenario: Fuente que bloquea agentes de IA

- **WHEN** el `robots.txt` de una fuente bloquea a los agentes de IA
- **THEN** el sistema no la consume, aunque el bloqueo sea técnicamente evadible

#### Scenario: Identificación del colector

- **WHEN** el colector hace una petición saliente
- **THEN** su `User-Agent` nombra al proyecto y da un correo de contacto

### Requirement: Descarte de duplicados por hash del contenido

El sistema SHALL descartar automáticamente el contenido duplicado mediante hash del contenido
normalizado.

#### Scenario: El mismo boletín republicado

- **WHEN** una fuente vuelve a publicar un contenido ya ingerido
- **THEN** su hash coincide y no se crea un documento nuevo

### Requirement: Robustez ante fallo de una fuente

La caída de cualquier fuente externa SHALL NOT impedir que el resto del sistema funcione. Ante un
fallo, el sistema SHALL reintentar con retroceso exponencial y abrir un cortacircuitos tras 3
fallos consecutivos (RNF004, RNF005).

#### Scenario: Fuente caída

- **WHEN** una fuente falla tres veces seguidas
- **THEN** su cortacircuitos se abre y deja de llamarla hasta que expire la espera
- **AND** las demás fuentes y el resto del sistema siguen funcionando

#### Scenario: Ningún documento se pierde en silencio

- **WHEN** el procesamiento de un documento falla
- **THEN** el documento va a la cola muerta con el motivo del fallo (RNF006)

### Requirement: Salud observable de cada colector

El sistema SHALL exponer el estado de salud de cada colector: última ejecución exitosa, ítems
procesados y tasa de error (RNF007).

#### Scenario: Consulta de salud de la ingesta

- **WHEN** un veedor consulta `GET /api/veedor/ingesta/salud`
- **THEN** obtiene, por colector, su última ejecución exitosa, sus ítems procesados y su tasa de
  error

### Requirement: La ingesta propone; publicar es decisión del veedor

Lo que la heurística deduce de una fuente de prensa SHALL entrar como propuesta a una cola de
revisión, y SHALL NOT cambiar el estado publicado de un sector por su cuenta (ADR-028). Los
boletines oficiales del propio operador son la excepción declarada: se publican sin revisión porque
su origen ya es la autoridad del dato.

#### Scenario: Propuesta desde una nota de prensa

- **WHEN** la heurística deduce un corte a partir de una nota de prensa
- **THEN** crea una propuesta pendiente en `GET /api/veedor/ingesta/propuestas`
- **AND** el mapa público no cambia hasta que un veedor la apruebe

#### Scenario: Propuesta aprobada

- **WHEN** el veedor llama a `PATCH /api/veedor/ingesta/propuestas/{id}/aprobar`
- **THEN** el cambio se publica y queda anotado en la bitácora

#### Scenario: Propuesta descartada

- **WHEN** el veedor llama a `PATCH /api/veedor/ingesta/propuestas/{id}/descartar`
- **THEN** la propuesta se cierra sin publicar nada
