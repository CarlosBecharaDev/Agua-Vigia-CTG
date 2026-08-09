/**
 * Arma el texto del resumen diario a partir de los mismos datos que usa la
 * Sala de control (scripts/lib/datos-proyecto.mjs) — no calcula nada
 * distinto, solo lo formatea para WhatsApp (*negrita*, _cursiva_).
 */
import { ROSTER, DASHBOARD_URL } from "../scripts/lib/datos-proyecto.mjs";

function nombreDe(login) {
  return (ROSTER[login] && ROSTER[login].nombre) || login;
}

// BUG-021: un titulo de PR/bug real (texto de terceros, no controlado por este bot) puede traer un
// *, _, ~ o ` suelto sin pareja y dejar el resto del mensaje en negrita/cursiva/tachado. WhatsApp no
// tiene caracter de escape, asi que se sustituyen por sus variantes de ancho completo (se ven casi
// igual, pero el parser de formato de WhatsApp no las reconoce).
function neutralizarFormato(texto) {
  return String(texto)
    .replace(/\*/g, "＊")
    .replace(/_/g, "＿")
    .replace(/~/g, "～")
    .replace(/`/g, "｀");
}

export function construirMensaje(datos) {
  const a = datos.avanceProyecto;
  const bugsAbiertos = datos.bugs.filter((b) => b.estado === "Abierto");
  const bugsGraves = bugsAbiertos.filter((b) => b.sev === "S1" || b.sev === "S2");
  const bugsOtros = bugsAbiertos.filter((b) => b.sev !== "S1" && b.sev !== "S2");
  const prsAbiertos = datos.prsAbiertos;

  const lineas = [];
  lineas.push("💧 *AguaVigía CTG — resumen diario*");
  lineas.push(`Avance: *${a.porcentaje}%* (${a.sprintsCerrados}/${a.sprintsTotal} sprints cerrados) · Sprint ${a.sprintActivoNum} en curso`);
  lineas.push("");

  if (bugsGraves.length) {
    lineas.push("🔴 *Bugs graves abiertos*");
    bugsGraves.forEach((b) => lineas.push(`• ${b.id} (${b.sev}) — ${neutralizarFormato(b.titulo)} _(responsable: ${neutralizarFormato(b.responsable)})_`));
    lineas.push("");
  }
  if (bugsOtros.length) {
    lineas.push("🟡 *Otros bugs abiertos*");
    bugsOtros.forEach((b) => lineas.push(`• ${b.id} (${b.sev}) — ${neutralizarFormato(b.titulo)}`));
    lineas.push("");
  }
  if (datos.bloqueos.abiertos) {
    lineas.push(`🚧 *Bloqueos abiertos:* ${datos.bloqueos.abiertos} — detalle en el dashboard`);
    lineas.push("");
  }
  if (prsAbiertos.length) {
    lineas.push("👀 *PRs esperando revisión*");
    prsAbiertos.forEach((p) => lineas.push(`• #${p.numero} — ${neutralizarFormato(p.titulo)} _(${nombreDe(p.login)})_`));
    lineas.push("");
  }
  if (!bugsGraves.length && !bugsOtros.length && !datos.bloqueos.abiertos && !prsAbiertos.length) {
    lineas.push("✅ Nada pendiente ahora mismo — todo cerrado o revisado.");
    lineas.push("");
  }

  lineas.push(`Detalle completo: ${DASHBOARD_URL}`);
  return lineas.join("\n");
}
