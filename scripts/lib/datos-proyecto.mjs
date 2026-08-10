/**
 * Fuente única de los datos reales del proyecto: PRs e issues via `gh`, y los
 * registros en markdown (ADRs, bugs, bloqueos, sprints, cobertura). La usan
 * tanto scripts/generar-dashboard.mjs (la Sala de control en HTML) como
 * bot-whatsapp/enviar.mjs (el resumen diario) — un dato, un lugar
 * (protocolo-de-contexto.md §2). Ninguno de los dos vuelve a leer ni a
 * calcular nada por su cuenta.
 *
 * No inventa nada que no este en el repositorio. Si un archivo cambia de
 * formato, este modulo debe fallar de forma visible (no rellenar en silencio).
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, "..", "..");
export const REPO = "CarlosBecharaDev/Agua-Vigia-CTG";
export const DASHBOARD_URL = `https://${REPO.split("/")[0].toLowerCase()}.github.io/${REPO.split("/")[1]}/`;

// ─── Roster: mapeo login de GitHub -> nombre/roles reales ───
// Fuente de verdad de nombres y roles: docs/equipo/roles-y-tareas.md.
// El login de GitHub no aparece ahi, asi que se mantiene aqui aparte.
// Actualizar si cambia el roster (ADR-021, nuevo integrante, etc).
export const ROSTER = {
  "CarlosBecharaDev": { nombre: "Carlos Bechara Arias", roles: ["D2"], iniciales: "CB" },
  "Jordy-Lv": { nombre: "Yordy Pardo Pajaro", roles: ["D5"], iniciales: "YP" },
  "SebastianMontes-Dev": { nombre: "Sebastián Montes Olivera", roles: ["D3"], iniciales: "SM" },
  "josezambranol": { nombre: "José Daniel Zambrano", roles: ["D4"], iniciales: "JZ" },
  "sarmientordev": { nombre: "Rafael Sarmiento Peña", roles: ["D1"], iniciales: "RS" }
};

function leer(rel) {
  // Normaliza CRLF -> LF: varios archivos del repo se versionan con CRLF en Windows,
  // y las regex de este modulo asumen \n como separador de linea.
  return readFileSync(path.join(RAIZ, rel), "utf8").replace(/\r\n/g, "\n");
}

/** Divide una fila de tabla markdown en columnas, respetando `\|` escapado dentro de backticks. */
function columnasDeFila(fila) {
  const marcador = " PIPE ";
  return fila
    .replace(/\\\|/g, marcador)
    .split("|")
    .map((c) => c.replace(new RegExp(marcador, "g"), "|").trim());
}

function gh(args) {
  return execFileSync("gh", args, { cwd: RAIZ, encoding: "utf8", maxBuffer: 1024 * 1024 * 20 });
}

// ─── PRs e issues reales ───
function obtenerPRs() {
  const json = gh(["pr", "list", "--repo", REPO, "--state", "all", "--limit", "300",
    "--json", "number,title,author,state,mergedAt,createdAt,url"]);
  const prs = JSON.parse(json);
  const merged = [];
  const abiertos = [];
  for (const pr of prs) {
    const login = pr.author && pr.author.login;
    if (!ROSTER[login]) continue; // ignora PRs de cuentas fuera del roster (bots, etc.)
    const fila = { numero: pr.number, titulo: pr.title, login, url: pr.url };
    if (pr.state === "MERGED") { fila.fecha = pr.mergedAt; merged.push(fila); }
    else if (pr.state === "OPEN") { fila.fecha = pr.createdAt; abiertos.push(fila); }
  }
  merged.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  abiertos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  return { merged, abiertos };
}

const ETIQUETA_IDEA = "idea-equipo";

function obtenerIssuesAbiertos() {
  const json = gh(["issue", "list", "--repo", REPO, "--state", "open", "--limit", "100",
    "--json", "number,title,url,createdAt,labels,author,body"]);
  const todos = JSON.parse(json).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const esIdea = (i) => i.labels.some((l) => l.name === ETIQUETA_IDEA);
  return {
    pendientes: todos.filter((i) => !esIdea(i)).map((i) => ({ number: i.number, title: i.title, url: i.url, createdAt: i.createdAt })),
    ideas: todos.filter(esIdea).map((i) => ({
      number: i.number, title: i.title, url: i.url, createdAt: i.createdAt,
      autor: (i.author && i.author.login) || "?",
      cuerpo: (i.body || "").trim()
    }))
  };
}

// ─── ADRs: docs/design-decisions.md ───
function obtenerADRs() {
  const texto = leer("docs/design-decisions.md");
  const adrs = [];
  const re = /^## ADR-(\d+) — (.+)$/gm;
  let m;
  while ((m = re.exec(texto))) {
    const bloque = texto.slice(m.index, m.index + 600);
    const estadoMatch = bloque.match(/- \*\*Estado:\*\* (.+)/);
    const fechaMatch = bloque.match(/- \*\*Fecha:\*\* (\d{4}-\d{2}-\d{2})/);
    const estadoTexto = estadoMatch ? estadoMatch[1] : "";
    const pendiente = /propuesta|pendiente/i.test(estadoTexto);
    adrs.push({ numero: Number(m[1]), titulo: m[2].trim(), pendiente, fecha: fechaMatch ? fechaMatch[1] : null });
  }
  return adrs;
}

// ─── Bugs: docs/gestion/registro-de-bugs.md, tabla de estado ───
// La columna Estado a veces trae solo la palabra (`Abierto`, `Cerrado`) y a veces una nota larga
// (ej. BUG-029: "🟡 Parcial — ítems 1, 2, 4 y 5 (sala de control) cerrados; ítem 3 ... sigue abierto").
// Se separa en un balde corto para mostrar en un badge, y el texto largo aparte — igual que ya se
// hace con las compuertas (estado vs. detalle) en obtenerCompuertas().
function normalizarEstadoBug(estadoRaw) {
  const texto = estadoRaw.trim();
  let estado = "Abierto";
  if (/^cerrado/i.test(texto)) estado = "Cerrado";
  else if (/^en curso/i.test(texto)) estado = "En curso";
  else if (/^no se corrige/i.test(texto)) estado = "No se corrige";
  else if (/parcial/i.test(texto)) estado = "Parcial";
  const notaMatch = texto.match(/—\s*(.*)$/);
  const notaEstado = notaMatch ? notaMatch[1].trim() : (texto === estado ? null : texto.replace(/^[🟡🟢🔴]\s*/, ""));
  return { estado, notaEstado };
}

// Cada bug con sección propia trae el análisis completo (síntoma, reproducción, causa raíz,
// corrección) bajo un encabezado `### BUG-NNN — ...`. La tabla de estado solo tiene el título corto;
// esto es lo que la Sala de control despliega detrás del botón "Ver posible solución".
function obtenerDetallesBugs(texto) {
  const detalles = {};
  const re = /\n### (BUG-\d+) — .*\n([\s\S]*?)(?=\n### BUG-\d+ — |\n## |$)/g;
  let m;
  while ((m = re.exec(texto))) {
    const id = m[1];
    const cuerpo = m[2].trim().replace(/\n?-{3,}\s*$/, "").trim();
    if (!detalles[id] && cuerpo) detalles[id] = cuerpo;
  }
  return detalles;
}

function obtenerBugs() {
  const texto = leer("docs/gestion/registro-de-bugs.md");
  const tabla = texto.match(/\| ID \| Fecha \| Sev \|.*?\n\|---.*?\n([\s\S]*?)\n\n/);
  if (!tabla) return [];
  const detalles = obtenerDetallesBugs(texto);
  const filas = tabla[1].trim().split("\n").filter((l) => l.startsWith("| BUG-"));
  return filas.map((f) => {
    const cols = columnasDeFila(f).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    const [id, fecha, sev, modulo, titulo, estadoRaw, responsable] = cols;
    const { estado, notaEstado } = normalizarEstadoBug(estadoRaw);
    return { id, fecha, sev, modulo, titulo, estado, notaEstado, responsable, detalle: detalles[id] || null };
  });
}

// ─── Recomendaciones de la IA: docs/gestion/recomendaciones-ia.md ───
function obtenerRecomendaciones() {
  const texto = leer("docs/gestion/recomendaciones-ia.md");
  const tabla = texto.match(/\| ID \| Fecha \| Título \|.*?\n\|---.*?\n([\s\S]*?)\n\n/);
  if (!tabla) return [];
  const filas = tabla[1].trim().split("\n").filter((l) => l.startsWith("| REC-"));
  return filas.map((f) => {
    const cols = columnasDeFila(f).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    const [id, fecha, titulo, estado] = cols;
    const bloque = texto.match(new RegExp(`### ${id} — .*?\\n\\n- \\*\\*Fecha:\\*\\*[^\\n]*\\n\\n([\\s\\S]*?)(?=\\n### |\\n---|$)`));
    return { id, fecha, titulo, estado, detalle: bloque ? bloque[1].trim() : "" };
  });
}

// ─── Compuertas: docs/gestion/registro-de-bloqueos.md §1 ───
function obtenerCompuertas() {
  const texto = leer("docs/gestion/registro-de-bloqueos.md");
  const tabla = texto.match(/\| Compuerta \| La abre \|.*?\n\|---.*?\n([\s\S]*?)\n\nEstados:/);
  if (!tabla) throw new Error("No se pudo parsear la tabla de compuertas — revisar formato de registro-de-bloqueos.md §1");
  const filas = tabla[1].trim().split("\n").filter((l) => l.startsWith("|"));
  return filas.map((f) => {
    const cols = columnasDeFila(f).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    const [compuertaRaw, abre, habilita, comandoRaw, estadoRaw, fecha] = cols;
    const idMatch = compuertaRaw.match(/C\d/);
    const nombre = compuertaRaw.replace(/\*\*C\d\*\*\s*·\s*/, "").trim();
    const comando = comandoRaw.replace(/^`|`$/g, "");
    const detalleMatch = estadoRaw.match(/^(?:🟢|🟡|🔴)\s*\*{0,2}(?:Abierta|Cerrada|Parcial)\*{0,2}\s*(?:—\s*(.*))?$/);
    const detalle = detalleMatch && detalleMatch[1] ? detalleMatch[1].trim() : null;
    let estado = "cerrada";
    if (estadoRaw.includes("🟢")) estado = "abierta";
    else if (estadoRaw.includes("🟡")) estado = "parcial";
    return {
      id: idMatch ? idMatch[0] : "?",
      nombre,
      abre: abre.replace(/`/g, ""),
      habilita: habilita.replace(/`/g, ""),
      comando,
      detalle,
      estado,
      fecha: fecha && fecha !== "—" ? fecha : null
    };
  });
}

// ─── Bloqueos: docs/gestion/registro-de-bloqueos.md §2 (abiertos) y §3 (cerrados) ───
/** Extrae el valor de un campo `**Nombre:** ...` hasta el siguiente campo, linea en blanco o fin. */
function campoDeBloque(bloque, nombre) {
  const re = new RegExp(`\\*\\*${nombre}:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\s*\\n|\\n\\*\\*|$)`);
  const m = bloque.match(re);
  return m ? m[1].replace(/\s*\n\s*/g, " ").trim() : null;
}

/** Campo dentro de una linea con varios separados por `·` — no debe tragarse los siguientes. */
function campoEnLinea(bloque, nombre) {
  const re = new RegExp(`\\*\\*${nombre}:\\*\\*\\s*([^·\\n]+)`);
  const m = bloque.match(re);
  return m ? m[1].replace(/\*\*/g, "").trim() : null;
}

// El detalle de cada bloqueo abierto es lo que responde "quien esta detenido y por que" en la Sala
// de control: sin el, un contador de bloqueos abiertos no le dice a nadie que hacer al respecto.
function obtenerBloqueos() {
  const texto = leer("docs/gestion/registro-de-bloqueos.md");
  const seccionAbiertos = texto.match(/## 2\. Bloqueos abiertos.*?\n([\s\S]*?)\n## 3\./);

  const detalle = [];
  if (seccionAbiertos) {
    for (const bloque of seccionAbiertos[1].split(/\n(?=### BL-)/)) {
      const cab = bloque.match(/^### (BL-\d+) — (.+)$/m);
      if (!cab) continue;
      const titulo = cab[2].trim();
      const estado = campoEnLinea(bloque, "Estado") || "";
      // Un bloqueo ya cerrado deja su bloque en §2 con la marca en el titulo o en Estado.
      if (/cerrad[oa]/i.test(titulo) || /cerrad[oa]/i.test(estado)) continue;
      const fecha = (bloque.match(/\*\*Fecha:\*\*\s*(\d{4}-\d{2}-\d{2})/) || [])[1] || null;
      detalle.push({
        id: cab[1],
        titulo: titulo.replace(/\*/g, "").trim(),
        fecha,
        diasDetenido: fecha ? Math.max(0, Math.round((Date.now() - new Date(`${fecha}T12:00:00`)) / 86400000)) : null,
        rol: campoEnLinea(bloque, "Rol bloqueado"),
        compuerta: campoEnLinea(bloque, "Compuerta"),
        titular: campoEnLinea(bloque, "Titular que lo resuelve") || campoEnLinea(bloque, "Titular que la abre"),
        tareaDetenida: campoDeBloque(bloque, "Tarea detenida"),
        insumoQueFalta: campoDeBloque(bloque, "Insumo que falta"),
        verificacion: campoDeBloque(bloque, "Verificación"),
        trabajoAlterno: campoDeBloque(bloque, "Trabajo alterno tomado"),
        cierre: campoDeBloque(bloque, "Cierre")
      });
    }
  }

  const seccionCerrados = texto.match(/## 3\. Bloqueos cerrados[\s\S]*?\n\|---.*?\n([\s\S]*?)\n\n/);
  const cerrados = seccionCerrados
    ? seccionCerrados[1].trim().split("\n").filter((l) => /^\|\s*(BL-\d+|—)\s*\|/.test(l) && !l.includes("| — | — | — |")).length
    : 0;
  return { abiertos: detalle.length, cerrados, detalle };
}

// ─── Deuda tecnica autorizada: registro-de-bloqueos.md §4 ───
// Cada DT es un mock vivo con fecha de caducidad. Es lo que falta por limpiar antes de cerrar el
// sprint que la caduca, y sin verlo en la Sala de control nadie recuerda que sigue ahi.
function obtenerDeudaTecnica() {
  const texto = leer("docs/gestion/registro-de-bloqueos.md");
  const tabla = texto.match(/\| ID \| Compuerta \| Autoriza \|.*?\n\|---.*?\n([\s\S]*?)\n\n/);
  if (!tabla) return [];
  return tabla[1].trim().split("\n").filter((l) => l.startsWith("| DT-")).map((f) => {
    const cols = columnasDeFila(f).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    const [id, compuerta, autoriza, quePermite, caduca, issueRaw, estado] = cols;
    const issueM = (issueRaw || "").match(/\[#(\d+)\]\(([^)]+)\)/);
    return {
      id,
      compuerta,
      autoriza: (autoriza || "").replace(/^✅\s*/, "").trim(),
      quePermite,
      caduca: (caduca || "").replace(/\*\*/g, "").trim(),
      issue: issueM ? { numero: Number(issueM[1]), url: issueM[2] } : null,
      estado: (estado || "").replace(/\*\*/g, "").replace(/^[🟡🟢🔴]\s*/u, "").trim(),
      vigente: /vigente/i.test(estado || "")
    };
  });
}

// ─── Detalle de un sprint: docs/gestion/sprint-N.md (si existe) ───
// La tabla de "Compromisos" de cada sprint.md ya trae su propio Estado (✅/🟡/nada) puesto a mano
// por quien cierra cada entregable — no se infiere de otra fuente, se lee tal cual está escrito.
function leerDetalleSprint(n) {
  const ruta = path.join(RAIZ, "docs/gestion", `sprint-${n}.md`);
  if (!existsSync(ruta)) return null;
  const texto = leer(`docs/gestion/sprint-${n}.md`);
  const abiertoM = texto.match(/\*\*Abierto:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  const cerradoM = texto.match(/\*\*Cerrado:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  // "Un sprint no cierra por calendario: cierra cuando su entregable se demuestra funcionando"
  // (CLAUDE.md). Ese criterio esta escrito entre parentesis al lado de "Cerrado: —".
  const criterioM = texto.match(/\*\*Cerrado:\*\*\s*—\s*\*\(([\s\S]*?)\)\*/);
  const objetivoM = texto.match(/## 1\. Objetivo del sprint\s*\n+\*\*([\s\S]*?)\*\*/);
  const limpiarParrafo = (s) => s.replace(/\s*\n\s*/g, " ").trim();
  const tabla = texto.match(/\| Resp\. \| RF\/RNF \| Entregable \|.*?\n\|---.*?\n([\s\S]*?)\n\n/);
  const compromisos = tabla
    ? tabla[1].trim().split("\n").filter((l) => l.startsWith("|")).map((f) => {
        const cols = columnasDeFila(f).filter((_, i, arr) => i > 0 && i < arr.length - 1);
        const [resp, rf, entregableRaw, dependeDe] = cols;
        // El estado se lee de dos formas, porque el equipo usa las dos: una columna `Estado` al final
        // (5 columnas) o el mismo `✅`/`🟡` al principio del Entregable, que es como se ha venido
        // marcando en sprint-1.md. Si se soportara solo la columna, cuatro entregables ya entregados
        // seguirian contando como pendientes y el avance del proyecto saldria mas bajo de lo real.
        const marcaEnEntregable = (entregableRaw || "").match(/^(✅|🟡)\s*([^—\-]*)[—\-]?\s*/u);
        const estadoRaw = cols[4] || "";
        const marca = estadoRaw.match(/^(✅|🟡)/u) ? estadoRaw[0] : (marcaEnEntregable ? marcaEnEntregable[1] : "");
        const estado = marca === "✅" ? "hecho" : marca === "🟡" ? "parcial" : "pendiente";
        const nota = estadoRaw
          ? estadoRaw.replace(/^(✅|🟡)\s*/u, "")
          : (marcaEnEntregable ? marcaEnEntregable[2].trim() : "");
        const entregable = marcaEnEntregable ? entregableRaw.slice(marcaEnEntregable[0].length) : entregableRaw;
        return { resp, rf, entregable, dependeDe, estado, nota };
      })
    : [];
  return {
    abierto: abiertoM ? abiertoM[1] : null,
    cerrado: cerradoM ? cerradoM[1] : null,
    objetivo: objetivoM ? limpiarParrafo(objetivoM[1]) : null,
    criterioCierre: criterioM ? limpiarParrafo(criterioM[1]) : null,
    compromisos
  };
}

// ─── Sprints: docs/equipo/secuencia-de-trabajo.md §4 ───
function obtenerSprints() {
  const texto = leer("docs/equipo/secuencia-de-trabajo.md");
  const tabla = texto.match(/\| Sprint \| Enfoque principal \|.*?\n\|---.*?\n([\s\S]*?)\n\n/);
  if (!tabla) throw new Error("No se pudo parsear la tabla de sprints — revisar formato de secuencia-de-trabajo.md §4");
  const limpiar = (s) => s.replace(/\*\*/g, "").replace(/`/g, "").trim();
  const filas = tabla[1].trim().split("\n").filter((l) => l.startsWith("|"));
  const sprints = filas.map((f) => {
    const cols = columnasDeFila(f).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    const [sprintRaw, enfoque, d5, d2, d3, d1, d4] = cols;
    const n = Number((sprintRaw.match(/\d+/) || [0])[0]);
    return {
      n,
      enfoque: limpiar(enfoque),
      filas: [["D5", limpiar(d5)], ["D2", limpiar(d2)], ["D3", limpiar(d3)], ["D1", limpiar(d1)], ["D4", limpiar(d4)]]
    };
  });
  // El sprint activo es el de mayor numero que ya tiene su sprint-N.md (documento de seguimiento).
  let activo = 0;
  for (const s of sprints) {
    if (existsSync(path.join(RAIZ, "docs/gestion", `sprint-${s.n}.md`))) activo = s.n;
  }
  sprints.forEach((s) => { s.activo = s.n === activo; s.detalle = leerDetalleSprint(s.n); });
  return sprints;
}

// ─── Fecha de inicio del repositorio: primer commit real, no una fecha escrita a mano ───
function obtenerFechaInicioRepo() {
  const salida = execFileSync("git", ["log", "--reverse", "--format=%aI"], { cwd: RAIZ, encoding: "utf8" }).trim();
  return salida.split("\n")[0] || null;
}

// ─── Avance del proyecto: sprints cerrados + fraccion del sprint activo, ritmo real y proyeccion ───
// No hay fecha de entrega ni duracion fija de sprint (secuencia-de-trabajo.md lo dice explicitamente):
// por eso la fecha estimada de cierre solo se calcula cuando ya cerro al menos un sprint de verdad —
// antes de eso seria inventar una cifra a partir de cero datos reales, y este proyecto no hace eso.
function calcularAvanceProyecto(sprints, prsMerged, fechaInicioRepo) {
  const total = sprints.length;
  const cerrados = sprints.filter((s) => s.detalle && s.detalle.cerrado).length;

  const activo = sprints.find((s) => s.activo);
  let fraccionActivo = 0;
  if (activo && activo.detalle && activo.detalle.compromisos.length) {
    const puntos = activo.detalle.compromisos.reduce(
      (acc, c) => acc + (c.estado === "hecho" ? 1 : c.estado === "parcial" ? 0.5 : 0), 0
    );
    fraccionActivo = puntos / activo.detalle.compromisos.length;
  }
  const avanceFraccion = total ? (cerrados + fraccionActivo) / total : 0;

  const ahora = new Date();
  const inicio = fechaInicioRepo ? new Date(fechaInicioRepo) : null;
  const diasTranscurridos = inicio ? Math.max(1, Math.round((ahora - inicio) / 86400000)) : null;
  const ritmoPRsPorDia = diasTranscurridos ? Math.round((prsMerged.length / diasTranscurridos) * 100) / 100 : null;

  const sprintsConCierre = sprints.filter((s) => s.detalle && s.detalle.abierto && s.detalle.cerrado);
  let fechaEstimada = null;
  let diasPromedioPorSprint = null;
  if (sprintsConCierre.length) {
    const duraciones = sprintsConCierre.map((s) => (new Date(s.detalle.cerrado) - new Date(s.detalle.abierto)) / 86400000);
    diasPromedioPorSprint = duraciones.reduce((a, b) => a + b, 0) / duraciones.length;
    const sprintsRestantes = Math.max(0, total - cerrados - fraccionActivo);
    const diasRestantes = Math.round(sprintsRestantes * diasPromedioPorSprint);
    fechaEstimada = new Date(ahora.getTime() + diasRestantes * 86400000).toISOString().slice(0, 10);
  }

  return {
    sprintsTotal: total,
    sprintsCerrados: cerrados,
    porcentaje: Math.round(avanceFraccion * 1000) / 10,
    diasTranscurridos,
    ritmoPRsPorDia,
    diasPromedioPorSprint: diasPromedioPorSprint !== null ? Math.round(diasPromedioPorSprint * 10) / 10 : null,
    fechaEstimada,
    sprintActivoNum: activo ? activo.n : null,
    sprintActivoAbiertoEn: activo && activo.detalle ? activo.detalle.abierto : null
  };
}

// ─── Cobertura de requisitos: docs/gestion/registro-de-implementaciones.md ───
function obtenerCobertura() {
  const texto = leer("docs/gestion/registro-de-implementaciones.md");
  const totalFunc = texto.match(/\*\*Total funcionales\*\* \| \*\*(\d+)\*\* \| \*\*(\d+)\*\* \| \*\*(\d+)%\*\*/);
  const noFunc = texto.match(/\*\*No funcionales\*\* \| \*\*(\d+)\*\* \| \*\*(\d+)\*\* \| \*\*(\d+)%\*\*/);

  // Desglose por modulo: el total solo dice "vamos en 0%"; el desglose dice de que modulo se trata.
  const tabla = texto.match(/\| Módulo \| Requisitos \| Implementados \| % \|\n\|---.*?\n([\s\S]*?)\n\n/);
  const porModulo = tabla
    ? tabla[1].trim().split("\n")
        .filter((l) => /^\|\s*M\d/.test(l))
        .map((f) => {
          const cols = columnasDeFila(f).filter((_, i, arr) => i > 0 && i < arr.length - 1);
          const [modulo, requisitos, implementados] = cols;
          const total = Number(requisitos) || 0;
          const hechos = Number(implementados) || 0;
          return {
            modulo: modulo.replace(/\*\*/g, "").trim(),
            estrella: modulo.includes("⭐"),
            total,
            implementados: hechos,
            porcentaje: total ? Math.round((hechos / total) * 100) : 0
          };
        })
    : [];

  return {
    funcionales: totalFunc ? { total: Number(totalFunc[1]), implementados: Number(totalFunc[2]) } : { total: 0, implementados: 0 },
    noFuncionales: noFunc ? { total: Number(noFunc[1]), implementados: Number(noFunc[2]) } : { total: 0, implementados: 0 },
    porModulo
  };
}

// ─── Ensamblar ───
export function generarDatos() {
  const { merged, abiertos } = obtenerPRs();
  const { pendientes, ideas } = obtenerIssuesAbiertos();
  const adrs = obtenerADRs();
  const bugs = obtenerBugs();
  const recomendaciones = obtenerRecomendaciones();
  const bloqueos = obtenerBloqueos();
  const deudaTecnica = obtenerDeudaTecnica();
  const compuertas = obtenerCompuertas();
  const sprints = obtenerSprints();
  const cobertura = obtenerCobertura();
  const avanceProyecto = calcularAvanceProyecto(sprints, merged, obtenerFechaInicioRepo());

  return {
    generadoEn: new Date().toISOString(),
    roster: ROSTER,
    prsMerged: merged,
    prsAbiertos: abiertos,
    issuesAbiertos: pendientes,
    ideas,
    adrs,
    bugs,
    recomendaciones,
    bloqueos,
    deudaTecnica,
    compuertas,
    sprints,
    cobertura,
    avanceProyecto,
    repoUrl: `https://github.com/${REPO}`,
    etiquetaIdea: ETIQUETA_IDEA
  };
}
