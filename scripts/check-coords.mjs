import fs from "fs";

const geo = JSON.parse(fs.readFileSync("frontend/public/barrios-cartagena.geojson", "utf8"));
const res = await fetch("http://localhost:8081/api/sectores");
const data = await res.json();

const sinServicio = data.sectores.filter(s => s.estado === "SIN_SERVICIO");
console.log("Barrios SIN_SERVICIO count:", sinServicio.length);

for (const s of sinServicio) {
  const feat = geo.features.find(f => f.properties.NOMBRE.trim().toUpperCase() === s.nombre.trim().toUpperCase());
  if (feat) {
    let coords = feat.geometry.coordinates;
    while (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
      coords = coords.flat(1);
    }
    const lats = coords.map(c => c[1]);
    const lngs = coords.map(c => c[0]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    console.log(`${s.nombre}: Lat [${minLat.toFixed(4)}, ${maxLat.toFixed(4)}], Lng [${minLng.toFixed(4)}, ${maxLng.toFixed(4)}]`);
  } else {
    console.log(`${s.nombre}: NOT FOUND`);
  }
}
