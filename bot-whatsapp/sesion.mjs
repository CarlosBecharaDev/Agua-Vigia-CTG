/**
 * Carga/guarda la sesión de WhatsApp (credenciales del emparejamiento) en
 * bot-whatsapp/sesion/ — esa carpeta NUNCA se comitea (ver .gitignore): quien
 * la tenga puede enviar mensajes como el número vinculado. En CI se restaura
 * y se guarda vía actions/cache (ver .github/workflows/whatsapp-*.yml).
 */
import { useMultiFileAuthState } from "@whiskeysockets/baileys";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CARPETA_SESION = path.join(__dirname, "sesion");

export function cargarSesion() {
  return useMultiFileAuthState(CARPETA_SESION);
}
