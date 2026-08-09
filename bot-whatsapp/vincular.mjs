#!/usr/bin/env node
/**
 * Vincula este bot a un número de WhatsApp — UNA SOLA VEZ. Genera un código
 * de emparejamiento de 8 caracteres (no un QR): se escribe en el teléfono
 * en WhatsApp > Ajustes > Dispositivos vinculados > Vincular un dispositivo
 * > "Vincular con número de teléfono en su lugar".
 *
 * Pensado para correrse tanto en local como desde el workflow manual
 * .github/workflows/whatsapp-vincular.yml — en ese caso, alguien tiene que
 * estar viendo el log en vivo para escribir el código a tiempo (caduca en
 * unos 60 segundos).
 *
 * Al conectar (ya sea por primera vez o re-conectando una sesión existente),
 * imprime los grupos a los que pertenece el número — de ahí se saca el JID
 * que va en el secreto WHATSAPP_GROUP_JID.
 *
 * Uso: node vincular.mjs +573001234567   (número dedicado, con código de país)
 */
import makeWASocket from "@whiskeysockets/baileys";
import { cargarSesion } from "./sesion.mjs";

const numero = process.argv[2];

async function main() {
  const { state, saveCreds } = await cargarSesion();
  const sock = makeWASocket({ auth: state, printQRInTerminal: false });
  sock.ev.on("creds.update", saveCreds);

  if (!sock.authState.creds.registered) {
    if (!numero) {
      console.error("Esta sesión todavía no está vinculada. Uso: node vincular.mjs +573001234567");
      process.exit(1);
    }
    const codigo = await sock.requestPairingCode(numero.replace(/[^\d]/g, ""));
    console.log("\n>>> Código de emparejamiento: " + codigo + " <<<");
    console.log("En el teléfono del número dedicado: WhatsApp > Ajustes > Dispositivos vinculados >");
    console.log('Vincular un dispositivo > "¿Problemas para escanear?" > escribe ese código.');
    console.log("Caduca en aproximadamente 60 segundos — hazlo ya.\n");
  } else {
    console.log("Sesión ya vinculada, reconectando...");
  }

  // BUG-022 (mismo patron que enviar.mjs): sock.end() propio dispara un `close` normal — sin esta
  // bandera se trataba igual que un corte real y el proceso terminaba en 1 aunque ya hubiera
  // impreso los grupos correctamente.
  let terminado = false;

  sock.ev.on("connection.update", async (u) => {
    if (u.connection === "open") {
      console.log("\nConectado.");
      const grupos = await sock.groupFetchAllParticipating();
      const lista = Object.values(grupos);
      if (!lista.length) {
        console.log("Este número todavía no pertenece a ningún grupo. Agrégalo al grupo del equipo y vuelve a correr este script para ver su JID.");
      } else {
        console.log("\nGrupos encontrados:");
        lista.forEach((g) => console.log(`  "${g.subject}" — JID: ${g.id}`));
        console.log("\nCopia el JID del grupo del equipo y guárdalo como el secreto WHATSAPP_GROUP_JID en GitHub (Settings > Secrets and variables > Actions).");
      }
      terminado = true;
      sock.end();
      process.exit(0);
    }
    if (u.connection === "close" && !terminado) {
      const motivo = u.lastDisconnect && u.lastDisconnect.error;
      console.error("Conexión cerrada antes de completar:", motivo ? motivo.message : motivo);
      process.exit(1);
    }
  });
}

main().catch((e) => {
  console.error("Error vinculando:", e);
  process.exit(1);
});
