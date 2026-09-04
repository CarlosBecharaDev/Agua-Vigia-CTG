# Reporte ciudadano

## Purpose

Dejar que un vecino diga «no tengo agua» en dos toques, sin registrarse y sin cuenta, porque el
usuario real no se va a registrar. El control de abuso que sustituye al registro es un cupo por
dispositivo, no una barrera de entrada. Cubre M2 (RF005–RF008), M10 (RF037) y M11 (RF038).

## Requirements

### Requirement: Reportar sin registro

El sistema SHALL permitir reportar «no tengo agua», «presión baja» o «ya volvió el servicio» sin
requerir registro ni cuenta.

#### Scenario: Reporte anónimo aceptado

- **WHEN** un vecino envía `POST /api/reportes` con tipo de reporte, sector y huella de dispositivo
- **THEN** la API responde 201 con el identificador del reporte
- **AND** no se almacena ningún dato personal identificable más allá de la huella anónima (RNF008)

#### Scenario: Confirmación bajo un segundo

- **WHEN** se envía un reporte en condiciones normales
- **THEN** el usuario recibe la confirmación en menos de 1 segundo (RNF002)

### Requirement: Cupo de reportes por dispositivo

El sistema SHALL limitar la cantidad de reportes que un mismo dispositivo puede enviar dentro de
una ventana de tiempo configurable, como sustituto del registro (RF006).

El cupo del dispositivo ciudadano y el del sensor IoT SHALL ser independientes: un sensor reporta
cada pocos minutos por diseño y con el cupo ciudadano se autobloquearía.

#### Scenario: Dispositivo dentro del cupo

- **WHEN** un dispositivo ha enviado menos reportes que `limite-por-dispositivo` en la ventana
- **THEN** el reporte se acepta

#### Scenario: Dispositivo que excede el cupo

- **WHEN** un dispositivo supera `limite-por-dispositivo` dentro de `ventana-limite-minutos`
- **THEN** la API responde 429 con un cuerpo RFC 7807 que explica el límite y cuándo se libera
- **AND** el reporte no se persiste

### Requirement: Inferencia del sector desde la ubicación

El sistema SHALL registrar la coordenada del reporte cuando el usuario la autorice, e inferir el
sector a partir de ella. Si el usuario no autoriza la ubicación, SHALL usar el sector que tenía
abierto.

#### Scenario: Ubicación autorizada

- **WHEN** el usuario autoriza la ubicación y su coordenada cae dentro de un sector conocido
- **THEN** el reporte queda asociado a ese sector sin que el usuario lo elija

#### Scenario: Ubicación denegada

- **WHEN** el usuario deniega la ubicación
- **THEN** el reporte usa el sector que el usuario tenía abierto y el flujo continúa sin error

### Requirement: Reporte en dos toques

El sistema SHALL permitir completar un reporte en un máximo de dos toques desde el mapa, sin
campos opcionales y sin captcha visible.

#### Scenario: Camino más corto

- **WHEN** el usuario toca «Reportar que no tengo agua» y confirma el tipo de reporte
- **THEN** el reporte queda enviado, sin pasos intermedios

### Requirement: Evidencia fotográfica opcional

El sistema SHALL permitir adjuntar una fotografía a un reporte ya creado. Al guardarla SHALL
comprimirla y eliminar sus metadatos EXIF, para que la foto no delate la ubicación ni el
dispositivo de quien reporta (RNF021, ADR-027).

#### Scenario: Foto con EXIF de geolocalización

- **WHEN** se sube por `POST /api/reportes/{id}/foto` una imagen con coordenadas en su EXIF
- **THEN** la imagen almacenada queda sin metadatos EXIF
- **AND** se guarda comprimida

#### Scenario: Archivo demasiado grande

- **WHEN** la imagen supera el tamaño máximo de subida
- **THEN** la API responde con un error 413 en formato RFC 7807, no con un 500

### Requirement: Confirmación comunitaria de un reporte

El sistema SHALL permitir confirmar un reporte ciudadano existente con un solo clic —«¿tú también
estás sin agua?»— sin registro (RF038).

#### Scenario: Vecino confirma un reporte abierto

- **WHEN** otro dispositivo llama a `POST /api/reportes/{id}/confirmar`
- **THEN** la confirmación se suma al reporte y cuenta para el consenso
- **AND** el mismo dispositivo no puede confirmar dos veces el mismo reporte
