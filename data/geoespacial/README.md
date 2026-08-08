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
   - `1250` → dos barrios **distintos**: `NARIÑO` (FID 21, UCG 2) y `CHAMBACU` (FID 145, UCG 1). Error
     de origen: son barrios diferentes con el mismo código.
   - `1959` y `1960` → `OLAYA ST. LA PUNTILLA` y `OLAYA ST. PLAYA BLANCA` aparecen **cada una dos
     veces, como fila literalmente repetida** (mismos `Shape__Area`/`Shape__Length`, FID 160/212 y
     166/213). Confirmado contra un boletín real de Acuacar (ver abajo): **sí son lugares reales**,
     el problema es solo que la fila está duplicada — al deduplicar, conservar una de las dos.
2. **Consecuencia práctica:** `CODIGO` no sirve como clave primaria tal cual. El seed necesita generar
   su propio identificador (p. ej. slug de `NOMBRE`) o deduplicar antes de insertar en Mongo.

---

## Validado contra boletines reales de Acuacar (2026-08-07)

Se compararon los nombres de este GeoJSON contra el contenido real de varios boletines de
`acuacar.com` (API REST, ver `MEMORY.md`), incluida la programación detallada de suspensiones
rotativas de mayo 2026 (boletines #2785 y #2787).

**Coincide bien:** `CASTILLOGRANDE`, `BOCAGRANDE`, `LA BOQUILLA` y, sobre todo, `OLAYA HERRERA` — el
GeoJSON ya la modela como **11 sub-sectores separados** (`OLAYA ST. RICAURTE`, `OLAYA ST. CENTRAL`,
`OLAYA ST. LA MAGDALENA`, `OLAYA ST. PLAYA BLANCA`, `OLAYA ST. ZARABANDA`, etc.), y esos mismos
nombres de sub-sector aparecen **literalmente** en el boletín #2785: *"Olaya Herrera, sectores:
Ricaurte, Central, Progreso, La Magdalena, Playa Blanca, Zarabanda…"*. El propio boletín #2785 lo
confirma como práctica habitual: *"si un barrio de Cartagena aparece más de una vez a la semana en la
programación de suspensión de agua, se debe a que ha sido dividido en varios sectores diferentes."*

**Hallazgo importante para M9 (ingesta con IA) y para el modelo de dominio de `Sector`:** Acuacar a
veces reporta a un nivel **más fino que cualquier polígono de barrio/sub-sector**, por tramo de calle
o manzana — ejemplos textuales reales del boletín #2787: *"La Candelaria entre carrera 34 a la 38 y
calle 31 a la Vía Perimetral"*, o del boletín #2547: *"Chiquinquirá, Mz 01 hasta Mz 05, Mz 11 hasta Mz
25…"*. Este GeoJSON **no puede representar ese nivel de detalle**. D3 (pipeline M9) y D2 (dominio de
`Sector`) deberían tenerlo en cuenta al diseñar la extracción: el matching texto-libre → polígono va a
necesitar tolerancia (fuzzy match al barrio/sub-sector contenedor) y probablemente un umbral de
confianza más bajo para avisos a nivel de tramo de calle, no de barrio completo.

---

## Próximo paso

Sprint 1 — D5: escribir el script de siembra con el `CODIGO` deduplicado. Si la cobertura o calidad no
alcanza para algún caso, aplicar el Plan B de `D5-devops-qa.md` §4 (polígonos simplificados de las 15
localidades/sectores principales). El hallazgo sobre reportes a nivel de tramo de calle/manzana queda
para que D2/D3 lo consideren al diseñar el matching de M9 — no es algo que este GeoJSON pueda resolver.
