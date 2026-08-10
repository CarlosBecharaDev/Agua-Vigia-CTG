# Anexo 6 — Modelo de Datos

> Arquitectura de persistencia (MongoDB) y estado efímero (Redis). Este documento evidencia el diseño físico de las bases de datos (Objetivo 2, RNF008).

---

## 1. Justificación Tecnológica (ADR-003)

AguaVigía CTG requiere almacenar datos con estructura variable (historial de eventos, arrays de sectores) y realizar consultas geoespaciales complejas (ej: determinar el sector a partir de una latitud/longitud en menos de 1 segundo). 
Por ello, la persistencia primaria está delegada a **MongoDB**, que ofrece índices nativos `2dsphere` y un esquema flexible.
Para estados efímeros, control de concurrencia y caché, se seleccionó **Redis**, ideal para evaluar ventanas temporales en milisegundos (consenso ciudadano) y rate limiting (seguridad).

---

## 2. Persistencia Principal — MongoDB

El modelo consta de las siguientes colecciones, diseñadas con enfoque en las consultas de lectura (`read-heavy` para el mapa público).

### 2.1 Colección `sectores`
Almacena la geometría oficial de los barrios de Cartagena (formato GeoJSON) y su estado actual consolidado. 
**Índices:** `2dsphere` sobre el campo `geometria`.

```json
{
  "_id": "ObjectId",
  "nombre": "Manga",
  "poblacion": 15000,
  "geometria": {
    "type": "MultiPolygon",
    "coordinates": [[[[...]]]]
  },
  "estadoActual": "CON_SERVICIO | SIN_SERVICIO | PRESION_BAJA | CORTE_PROGRAMADO | null",
  "fechaActualizacion": "ISODate"
}
```

### 2.2 Colección `reportes_ciudadanos`
Registra la telemetría enviada por los vecinos. Por RNF008, no almacena datos personales, sino un hash criptográfico de la huella del dispositivo.

```json
{
  "_id": "ObjectId",
  "sectorId": "ObjectId (Ref: sectores)",
  "estadoReportado": "SIN_SERVICIO | PRESION_BAJA | CON_SERVICIO",
  "huellaDispositivo": "String (SHA-256)",
  "coordenada": {
    "type": "Point",
    "coordinates": [-75.5, 10.4] // [lon, lat]
  },
  "fecha": "ISODate",
  "estadoModeracion": "PENDIENTE | APROBADO | DESCARTADO",
  "fotoUrl": "String (Opcional - Evidencia M10)",
  "confirmaciones": "Integer (Conteo de validaciones M11)",
  "dispositivosQueConfirmaron": ["String (SHA-256)"]
}
```

### 2.3 Colección `cortes`
Registra los anuncios oficiales del operador o cortes registrados por el veedor. Permite calcular el Índice de Cumplimiento comparando `finPrometido` vs `finReal`.

```json
{
  "_id": "ObjectId",
  "sectoresAfectados": ["ObjectId (Ref: sectores)"],
  "inicio": "ISODate",
  "finPrometido": "ISODate",
  "finReal": "ISODate | null",
  "causa": "String",
  "estado": "ACTIVO | RESTABLECIDO"
}
```

### 2.4 Colección `eventos_bitacora`
Repositorio inmutable (solo anexado) para trazabilidad pública. Respalda la transparencia del producto.

```json
{
  "_id": "ObjectId",
  "sectorId": "ObjectId (Ref: sectores)",
  "tipoEvento": "CORTE_ANUNCIADO | CORTE_CONFIRMADO_POR_CIUDADANOS | RESTABLECIDO",
  "fecha": "ISODate",
  "causa": "String (Opcional)",
  "reportesSustento": ["ObjectId (Ref: reportes_ciudadanos)"] // Solo si tipoEvento es de consenso
}
```

### 2.5 Colección `suscripciones`
Maneja las alertas por correo electrónico con doble *opt-in*.

```json
{
  "_id": "ObjectId",
  "sectorId": "ObjectId (Ref: sectores)",
  "correo": "String",
  "telefonoWhatsApp": "String (Opcional - M14)",
  "telegramChatId": "String (Opcional - M14)",
  "token": "String (UUID)",
  "activa": "Boolean"
}
```

---

## 3. Estado Efímero y Caché — Redis

Redis no almacena datos críticos persistentes, sino llaves de tránsito rápido.

### 3.1 Rate Limiting (Protección contra abusos)
Por seguridad (ADR-018), se usa un mecanismo `INCR` + `EXPIRE` genérico basado en la IP.
- **Formato:** `rl:{ruta}:{ip}`
- **Ejemplo:** `rl:/api/reportes:192.168.1.1` → Value: `4` (Peticiones en la ventana)

### 3.2 Consenso Ciudadano (Ventanas deslizantes)
Evalúa cuántos reportes independientes han ocurrido en un sector en las últimas horas. Utiliza Sorted Sets (`ZSET`) donde el *score* es el instante del reporte en millis.
- **Formato:** `reportes:{sectorId}`
- **Valor:** ZSET de los hashes SHA-256 de los dispositivos con el timestamp como score. Permite limpiar reportes viejos con `ZREMRANGEBYSCORE`.

### 3.3 Caché de Respuestas (Rendimiento)
Respuestas JSON cacheadas con TTL (RNF003) para servir el mapa en menos de 3 segundos (RNF001).
- **Formato:** `cache:{nombre_cache}::{llave}`
- **Ejemplo:** `cache:sectores::todos` → Value: `[{...}, {...}]` (JSON serializado de los sectores).
