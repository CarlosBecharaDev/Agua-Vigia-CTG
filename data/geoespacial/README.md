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
la necesita cruzada de otra fuente — ya verificada, ver `poblacion-barrios.json` más abajo.

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

## `poblacion-barrios.json`

**Fuente:** datos.gov.co (Socrata), dataset `rjh5-tyrd` — "Déficit Habitacional del Distrito de
Cartagena de Indias por Barrio". Atribución: Fondo de Vivienda de Interés Social y Reforma Urbana
Distrital de Cartagena de Indias, con base en el **Censo DANE 2018** y datos de **CORVIVIENDA**. 187
filas, campo `poblacion` entre otros.

**Ojo — un candidato descartado por verificar antes de usarlo:** el primer resultado de búsqueda para
"población por barrios" en datos.gov.co (`x6zm-nfuj`) tiene ese nombre casi idéntico, pero al leer su
`attribution` real es de **La Estrella, Antioquia** — un municipio distinto, nada que ver con
Cartagena. Se descartó después de leer el contenido, no el título. Queda como recordatorio de por qué
este proyecto verifica antes de afirmar (ver `MEMORY.md`, corrección del 2026-08-06 sobre Acuacar).

**Problema de datos encontrado y corregido en el script de siembra:** el campo `poblacion` usa `.`
como separador de miles (`"10.656"` = 10 656 habitantes), pero en algún punto de la tubería de Socrata
el valor pasó por un tipo numérico y **perdió los ceros finales** de la última cifra: `"2.450"` quedó
en `"2.45"`, `"1.080"` en `"1.08"`. Se detecta por la cantidad de dígitos después del punto (134 filas
con 3 dígitos intactos, 12 con 2, 2 con 1, 39 sin punto porque la población es menor a 1000) y se
corrige rellenando con ceros a la derecha. Lógica y comentario completo:
`scripts/sembrar-sectores.mjs` → `corregirPoblacion()`.

**Cobertura:** 184 de los 213 barrios del GeoJSON tienen población en esta fuente. Los 27 que faltan
son, casi todos, corregimientos rurales e insulares (Bocachica, Barú, Islas del Rosario, Tierra Bomba,
Pasacaballos, Bayunca, La Boquilla, Punta Canoa...) — la fuente cubre el censo urbano por UCG, no el
área rural/insular del distrito. 3 nombres del dataset de población no aparecen en el GeoJSON
(`CIUDAD JARDIN`, `LOS GIRASOLES`, `VILLAS DE ARANJUEZ`) — desarrollos que el GeoJSON no tiene
delimitados por separado, sin investigar más a fondo todavía.

---

## `scripts/sembrar-sectores.mjs`

Escrito y **probado de verdad** el 2026-08-08 contra una instancia de MongoDB local (no la de
`docker-compose.yml` — esta máquina no tiene Docker instalado, ver `BL-001`): 211 sectores insertados
(213 menos las 2 filas duplicadas), 184 con población, 27 sin ella (lista exacta impresa por el
script), índice `2dsphere` creado y verificado con una consulta `$geoIntersects` real.

**Lo que decide el script:** genera su propio `slug` como identificador (el `CODIGO` de origen no es
confiable, ver arriba), corrige la población, y **no** siembra `estadoActual` — es estado dinámico de
la aplicación, no dato de referencia; queda para que D2/D3 decidan el valor inicial en el adaptador de
`SectorRepository` cuando `/backend` exista.

---

## Próximo paso

Falta que D2 confirme cómo debe comportarse `Sector` cuando `poblacion` es `null` (27 barrios) antes
de que esto se traduzca a Java. El hallazgo sobre reportes a nivel de tramo de calle/manzana queda para
que D2/D3 lo consideren al diseñar el matching de M9 — no es algo que este GeoJSON pueda resolver.
