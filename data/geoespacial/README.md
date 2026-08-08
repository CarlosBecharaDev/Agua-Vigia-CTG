# Datos geoespaciales — barrios de Cartagena

> Datos crudos de referencia. No es código de aplicación: son el insumo de origen para el script de
> siembra (seed) de MongoDB que crea D5 en Sprint 1 (`docs/equipo/D5-devops-qa.md` §2).
> Verificado con peticiones reales el 2026-08-07 (D5).

---

## `barrios-cartagena.geojson`

**Fuente:** Feature Service público de **Cartagena Cómo Vamos** en ArcGIS Online.
`https://services7.arcgis.com/t784NacZjQPpWVsA/arcgis/rest/services/Barrios_de_Cartagena/FeatureServer/0`

**Cómo se obtuvo:** consulta directa a la API REST de Esri (no scraping de HTML):
```
.../FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=geojson
```
`outSR=4326` fuerza WGS84 (lat/lon), compatible con el índice `2dsphere` de MongoDB y con Leaflet.

**Verificación de acceso:** `robots.txt` del portal (`ccv-cgenacomovamos.opendata.arcgis.com`) no
bloquea rastreadores de IA ni la ruta de datasets; el servicio de datos vive en un dominio de API de
Esri (`services7.arcgis.com`) sin `robots.txt` (403 genérico en rutas no válidas — es un gateway de
API, no un sitio indexable). Se identificó el colector con `User-Agent` propio en cada petición.

**Licencia:** el ítem en ArcGIS Online no declara `licenseInfo`. Es un dataset **público** (`access:
public`) publicado por Cartagena Cómo Vamos (organización civil independiente de veeduría ciudadana,
fuente ya citada en la documentación de ingeniería del proyecto). **Pendiente:** confirmar términos de
uso exactos antes de publicarlo en producción — anotar en `docs/design-decisions.md` si el equipo
decide citarlo formalmente en el Capítulo II/Anexo 6.

---

## Diccionario de campos

| Campo | Tipo | Significado |
|---|---|---|
| `CODIGO` | string (4) | Código interno del barrio. **No es único** — ver "Problemas conocidos". |
| `NOMBRE` | string | Nombre del barrio, en mayúsculas. |
| `UCG` | entero | Número de Unidad Comunera de Gobierno (1–15, 20). |
| `LOC` | string (3) | Localidad: `LH` (1 · Histórica y del Caribe Norte), `LV` (2 · De la Virgen y Turística), `LI` (3 · Industrial y de la Bahía). |
| `ZONA` | string | Etiqueta de zona (`UCG N`). |
| `Shape__Area` / `Shape__Length` | double | Área y perímetro en el sistema de referencia proyectado original de Esri — **no usar directamente**, recalcular si se necesita área en m² sobre WGS84. |

**Geometría:** `Polygon` o `MultiPolygon` según el barrio. 213 features, 0 geometrías nulas.

**Lo que NO trae:** población por barrio. RF010 (consenso con umbral proporcional a la población)
va a necesitar cruzarlo con otra fuente — candidato sin verificar:
`datos.gov.co` → "Déficit Habitacional del Distrito de Cartagena de Indias por Barrio".

---

## Problemas conocidos (verificados, no corregidos aquí)

El archivo se guarda **tal como lo entrega la fuente** — no se alteran datos sin que el equipo lo
decida. Quien construya el seed de Sprint 1 debe resolver esto explícitamente:

1. **3 `CODIGO` duplicados de 213:**
   - `1250` → dos barrios distintos: `NARIÑO` (FID 21, UCG 2) y `CHAMBACU` (FID 145, UCG 1). Error de
     origen: son barrios diferentes con el mismo código.
   - `1959` y `1960` → `OLAYA ST. LA PUNTILLA` y `OLAYA ST. PLAYA BLANCA` aparecen **duplicados
     exactos** (mismos `Shape__Area`/`Shape__Length`, FID 160/212 y 166/213). Parecen filas repetidas
     en la fuente, no dos barrios reales.
2. **Consecuencia práctica:** `CODIGO` no sirve como clave primaria tal cual. El seed necesita generar
   su propio identificador (p. ej. slug de `NOMBRE`) o deduplicar antes de insertar en Mongo.

---

## Próximo paso

Sprint 1 — D5: validar este archivo contra los boletines reales de Acuacar (¿los nombres de barrio
coinciden con los que usa Acuacar en sus avisos?) y escribir el script de siembra. Si la cobertura o
calidad no alcanza, aplicar el Plan B de `D5-devops-qa.md` §4 (polígonos simplificados de las 15
localidades/sectores principales).
