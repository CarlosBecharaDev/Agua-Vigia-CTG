import fs from "node:fs";

const originalPath = "frontend/public/barrios-cartagena.geojson";
const geo = JSON.parse(fs.readFileSync(originalPath, "utf8"));
const origSize = fs.statSync(originalPath).size;

function roundCoords(coords) {
  if (typeof coords[0] === "number") {
    return coords.map(c => Number(c.toFixed(5)));
  }
  return coords.map(roundCoords);
}

const optimized = {
  type: geo.type,
  features: geo.features.map(f => ({
    type: f.type,
    properties: f.properties,
    geometry: {
      type: f.geometry.type,
      coordinates: roundCoords(f.geometry.coordinates)
    }
  }))
};

const optJson = JSON.stringify(optimized);
console.log("Original size:", (origSize / 1024).toFixed(1), "KB");
console.log("Optimized size:", (optJson.length / 1024).toFixed(1), "KB");
console.log("Reduction:", ((1 - optJson.length / origSize) * 100).toFixed(1), "%");
fs.writeFileSync(originalPath, optJson, "utf8");
console.log("GeoJSON optimized successfully!");
