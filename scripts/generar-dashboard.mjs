#!/usr/bin/env node
/**
 * Genera la Sala de control (docs/gestion/) como HTML estatico, a partir de
 * scripts/lib/datos-proyecto.mjs — la misma fuente de datos que usa
 * bot-whatsapp/enviar.mjs para el resumen diario. Este archivo solo se
 * encarga de inyectar esos datos en la plantilla HTML y escribir el archivo.
 *
 * Uso: node scripts/generar-dashboard.mjs [--out DIR]
 * Requiere: `gh` autenticado (GH_TOKEN o sesion local).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { generarDatos } from "./lib/datos-proyecto.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, "..");

function leer(rel) {
  return readFileSync(path.join(RAIZ, rel), "utf8").replace(/\r\n/g, "\n");
}

function main() {
  const outArgIdx = process.argv.indexOf("--out");
  const outDir = outArgIdx >= 0 ? process.argv[outArgIdx + 1] : path.join(RAIZ, "dist-dashboard");
  mkdirSync(outDir, { recursive: true });

  const datos = generarDatos();
  const plantilla = leer("scripts/dashboard-template.html");
  const marcador = "/*__DASHBOARD_DATA__*/{}";
  if (!plantilla.includes(marcador)) {
    throw new Error(`La plantilla no tiene el marcador exacto "${marcador}" — no se puede inyectar datos`);
  }
  // < en vez de "<" literal: un titulo de PR/issue/bug con "</script>" (nada raro en un
  // proyecto que documenta bugs de HTML) cerraria este <script> a la mitad y rompería la pagina —
  // o, sin ese escape, seria una inyeccion de script real via un titulo de PR/issue malicioso.
  const datosSeguros = JSON.stringify(datos).replace(/</g, "\\u003c");
  const html = plantilla.replace(marcador, datosSeguros);

  writeFileSync(path.join(outDir, "index.html"), html, "utf8");
  console.log(`Sala de control generada: ${outDir}/index.html`);
  console.log(`  PRs fusionados: ${datos.prsMerged.length} · abiertos: ${datos.prsAbiertos.length}`);
  console.log(`  Issues abiertos: ${datos.issuesAbiertos.length} · Ideas del equipo: ${datos.ideas.length}`);
  console.log(`  ADRs: ${datos.adrs.length} (${datos.adrs.filter((a) => a.pendiente).length} pendientes)`);
  console.log(`  Bugs: ${datos.bugs.length} (${datos.bugs.filter((b) => b.estado === "Abierto").length} abiertos)`);
  console.log(`  Recomendaciones: ${datos.recomendaciones.length} (${datos.recomendaciones.filter((r) => r.estado === "Pendiente").length} pendientes)`);
  console.log(`  Bloqueos: ${datos.bloqueos.cerrados} cerrados, ${datos.bloqueos.abiertos} abiertos`);
  console.log(`  Compuertas abiertas: ${datos.compuertas.filter((c) => c.estado === "abierta").length}/${datos.compuertas.length}`);
  console.log(`  Avance del proyecto: ${datos.avanceProyecto.porcentaje}% (${datos.avanceProyecto.sprintsCerrados}/${datos.avanceProyecto.sprintsTotal} sprints cerrados) · ritmo: ${datos.avanceProyecto.ritmoPRsPorDia} PRs/día`);

  avisarDeSeccionesVacias(datos);
}

// Un extractor que deja de reconocer su tabla no explota: devuelve una lista vacia, y la Sala de
// control muestra "sin bugs registrados" con 33 bugs en el archivo. Como el HTML se publica solo en
// cada push, nadie se entera. Estas advertencias son la unica senal de que el formato cambio.
function avisarDeSeccionesVacias(datos) {
  const activo = datos.sprints.find((s) => s.activo);
  const avisos = [];
  const revisar = (condicion, mensaje) => { if (condicion) avisos.push(mensaje); };

  revisar(!datos.bugs.length, "registro-de-bugs.md — tabla de estado sin filas `| BUG-`");
  revisar(!datos.adrs.length, "design-decisions.md — ningún encabezado `## ADR-NNN — `");
  revisar(!datos.deudaTecnica.length, "registro-de-bloqueos.md §4 — tabla de desbloqueos sin filas `| DT-`");
  revisar(!datos.cobertura.porModulo.length, "registro-de-implementaciones.md — tabla `| Módulo | Requisitos | Implementados | % |`");
  revisar(!datos.cobertura.funcionales.total, "registro-de-implementaciones.md — fila `**Total funcionales**`");
  revisar(activo && !activo.detalle.compromisos.length, `sprint-${activo && activo.n}.md §2 — tabla de compromisos`);
  revisar(activo && activo.detalle && !activo.detalle.criterioCierre && !activo.detalle.cerrado,
    `sprint-${activo && activo.n}.md — criterio de cierre entre paréntesis al lado de "**Cerrado:** —"`);

  if (!avisos.length) return;
  console.warn("\n⚠️  Secciones que quedaron vacías — probablemente cambió el formato del archivo:");
  for (const a of avisos) console.warn(`   · ${a}`);
  console.warn("   La página se publicó igual, pero esas secciones salen vacías o incompletas.\n");
}

main();
