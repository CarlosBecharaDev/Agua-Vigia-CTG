#!/usr/bin/env node
/**
 * Manda el resumen diario al grupo de WhatsApp del equipo. Pensado para
 * correr desde un workflow programado (.github/workflows/whatsapp-bot.yml):
 * reconecta con la sesión ya vinculada (restaurada de cache de Actions),
 * manda un mensaje y se desconecta — no mantiene una conexión permanente,
 * por eso puede vivir en un job programado en vez de necesitar un servidor
 * siempre encendido.
 *
 * Requiere WHATSAPP_GROUP_JID (el JID del grupo, obtenido una vez con
 * vincular.mjs) y `gh` autenticado (para leer los datos del proyecto).
 */
import makeWASocket from "@whiskeysockets/baileys";
import { cargarSesion } from "./sesion.mjs";
import { generarDatos } from "../scripts/lib/datos-proyecto.mjs";
import { construirMensaje } from "./mensaje.mjs";

const grupoJid = process.env.WHATSAPP_GROUP_JID;
if (!grupoJid) {
  console.error("Falta la variable de entorno WHATSAPP_GROUP_JID.");
  process.exit(1);
}

async function main() {
  const { state, saveCreds } = await cargarSesion();
  const sock = makeWASocket({ auth: state, printQRInTerminal: false });
  sock.ev.on("creds.update", saveCreds);

  if (!sock.authState.creds.registered) {
    console.error("Esta sesión no está vinculada todavía. Corre vincular.mjs primero (ver bot-whatsapp/README.md).");
    process.exit(1);
  }

  // BUG-022: un `close` es normal e inevitable en cuanto llamamos sock.end() nosotros mismos tras
  // enviar — sin esta bandera, ese cierre autoinducido se trataba igual que un corte real a mitad
  // del envio y el proceso terminaba en 1 aunque el mensaje SI hubiera salido.
  let terminado = false;

  sock.ev.on("connection.update", async (u) => {
    if (u.connection === "open") {
      try {
        const datos = generarDatos();
        const texto = construirMensaje(datos);
        await sock.sendMessage(grupoJid, { text: texto });
        console.log("Mensaje enviado a " + grupoJid);
        terminado = true;
        sock.end();
        process.exit(0);
      } catch (e) {
        console.error("Error generando o enviando el mensaje:", e);
        terminado = true;
        sock.end();
        process.exit(1);
      }
    }
    if (u.connection === "close" && !terminado) {
      const motivo = u.lastDisconnect && u.lastDisconnect.error;
      console.error("Conexión cerrada antes de completar el envío:", motivo ? motivo.message : motivo);
      process.exit(1);
    }
  });
}

main().catch((e) => {
  console.error("Error enviando el resumen:", e);
  process.exit(1);
});
