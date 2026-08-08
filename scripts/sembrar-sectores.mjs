// Siembra la coleccion `sectores` en MongoDB a partir de:
//   - data/geoespacial/barrios-cartagena.geojson (213 barrios, geometria)
//   - data/geoespacial/poblacion-barrios.json (poblacion 2018, DANE + CORVIVIENDA, via datos.gov.co)
//
// Tarea de Sprint 1 de D5 (docs/equipo/D5-devops-qa.md). Documentacion completa de las fuentes,
// la licencia y los problemas de datos: data/geoespacial/README.md — leerlo antes de tocar esto.
//
// Uso:
//   cd scripts && npm install
//   MONGODB_URI="mongodb://localhost:27017" node sembrar-sectores.mjs
//
// Es idempotente: borra la coleccion `sectores` antes de volver a insertar.

import { MongoClient } from 'mongodb';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, '..');
const GEOJSON_PATH = path.join(RAIZ, 'data/geoespacial/barrios-cartagena.geojson');
const POBLACION_PATH = path.join(RAIZ, 'data/geoespacial/poblacion-barrios.json');
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB ?? 'aguavigia';

const LOCALIDAD_POR_CODIGO = {
  LH: 'Histórica y del Caribe Norte',
  LV: 'De la Virgen y Turística',
  LI: 'Industrial y de la Bahía',
};

function normalizarNombre(nombre) {
  return nombre
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // quita tildes para poder cruzar las dos fuentes
}

function generarSlug(nombre) {
  return normalizarNombre(nombre)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// El campo `poblacion` de datos.gov.co usa "." como separador de miles, pero al pasar por un tipo
// numerico en algun punto de la tuberia de Socrata, los ceros finales del ultimo grupo se perdieron
// ("2.450" quedo en "2.45", "1.080" en "1.08"). Se detecta por el numero de digitos tras el punto:
// 3 digitos = intacto, 0 = sin miles (poblacion < 1000), 1 o 2 = se le rellena el cero perdido.
// Verificado 2026-08-08 contra el patron completo del dataset (134 filas con 3 digitos, 12 con 2,
// 2 con 1, 39 sin punto — ver data/geoespacial/README.md).
function corregirPoblacion(valorCrudo) {
  if (!valorCrudo.includes('.')) return parseInt(valorCrudo, 10);
  const [miles, resto] = valorCrudo.split('.');
  const restoCorregido = resto.padEnd(3, '0');
  return parseInt(miles + restoCorregido, 10);
}

function deduplicarFeatures(features) {
  const vistos = new Set();
  const resultado = [];
  for (const f of features) {
    const p = f.properties;
    // Fila literalmente repetida en el origen (mismo nombre + misma geometria) — ver README,
    // "Problemas conocidos": OLAYA ST. LA PUNTILLA y OLAYA ST. PLAYA BLANCA aparecian dos veces.
    const clave = `${p.NOMBRE}|${p.Shape__Area}|${p.Shape__Length}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    resultado.push(f);
  }
  return resultado;
}

async function main() {
  const [geojsonRaw, poblacionRaw] = await Promise.all([
    readFile(GEOJSON_PATH, 'utf-8'),
    readFile(POBLACION_PATH, 'utf-8'),
  ]);
  const geojson = JSON.parse(geojsonRaw);
  const poblacionFilas = JSON.parse(poblacionRaw);

  const poblacionPorNombre = new Map();
  for (const fila of poblacionFilas) {
    poblacionPorNombre.set(normalizarNombre(fila.nombre), corregirPoblacion(fila.poblacion));
  }

  const featuresSinDuplicados = deduplicarFeatures(geojson.features);

  const slugsUsados = new Map();
  const sinPoblacion = [];

  const documentos = featuresSinDuplicados.map((f) => {
    const p = f.properties;
    let slug = generarSlug(p.NOMBRE);
    const usos = slugsUsados.get(slug) ?? 0;
    slugsUsados.set(slug, usos + 1);
    if (usos > 0) slug = `${slug}-${usos + 1}`; // desambigua CODIGO 1250 (NARIÑO / CHAMBACU)

    const poblacion = poblacionPorNombre.get(normalizarNombre(p.NOMBRE)) ?? null;
    if (poblacion === null) sinPoblacion.push(p.NOMBRE);

    return {
      slug,
      nombre: p.NOMBRE,
      // poblacion: requerido por la entidad de dominio Sector (docs/ingenieria/modelo-de-dominio.md).
      // null cuando la fuente no cubre el barrio (mayoria corregimientos rurales/insulares —
      // ver README). D2 decide como Sector maneja poblacion ausente; no se inventa un numero aqui.
      poblacion,
      ucg: p.UCG,
      localidad: LOCALIDAD_POR_CODIGO[p.LOC] ?? p.LOC,
      zona: p.ZONA,
      codigoOrigen: p.CODIGO, // referencia al origen — no es unico, no usar como identidad
      geometry: f.geometry,
      // Nota para D2/D3: estadoActual NO se siembra aqui — es estado dinamico de la aplicacion,
      // no dato de referencia. El adaptador de SectorRepository decide el valor inicial al leer
      // un sector que todavia no tiene estado registrado.
    };
  });

  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const coleccion = db.collection('sectores');

    await coleccion.deleteMany({});
    await coleccion.insertMany(documentos);
    await coleccion.createIndex({ geometry: '2dsphere' });

    console.log(`Sembrados ${documentos.length} sectores en ${DB_NAME}.sectores`);
    console.log(`Con poblacion: ${documentos.length - sinPoblacion.length} · sin poblacion: ${sinPoblacion.length}`);
    if (sinPoblacion.length > 0) {
      console.log('Sin poblacion (esperado — ver data/geoespacial/README.md):');
      console.log(sinPoblacion.map((n) => `  - ${n}`).join('\n'));
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
