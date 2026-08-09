# Bot de WhatsApp — resumen diario

Manda un resumen del proyecto (bugs graves abiertos, bloqueos, PRs sin
revisar, avance) al grupo de WhatsApp del equipo, una vez al día. No calcula
nada nuevo: lee exactamente los mismos datos que la Sala de control
(`../scripts/lib/datos-proyecto.mjs`).

> **Por qué existe y por qué así:** `docs/design-decisions.md` (ADR de este
> bot) tiene el detalle completo — usa WhatsApp con una librería no oficial
> (`Baileys`), sobre un **número dedicado, no el personal de nadie**, porque
> automatizar WhatsApp viola sus términos de uso y el número corre riesgo
> real de ser bloqueado. Léelo antes de tocar esto.

## Cómo funciona

No mantiene una conexión permanente — no hace falta un servidor 24/7. Cada
corrida (un job programado de GitHub Actions, `.github/workflows/whatsapp-bot.yml`)
reconecta con la sesión ya vinculada, manda un mensaje y se desconecta.

## Puesta en marcha — una sola vez

1. **Consigan el número dedicado** (una SIM nueva, no la de nadie del
   equipo) y agréguenlo al grupo de WhatsApp del equipo.
2. **Vincúlenlo desde GitHub Actions** (recomendado — deja la sesión
   directamente donde el bot diario la necesita, sin copiar archivos a
   mano): pestaña **Actions** → `whatsapp-vincular.yml` → **Run workflow**
   → escriban el número con código de país (ej. `+573001234567`) → **Run**.
   Abran el log en vivo: va a imprimir un código de 8 caracteres. En el
   teléfono del número dedicado: WhatsApp → Ajustes → Dispositivos
   vinculados → Vincular un dispositivo → "¿Problemas para escanear?" →
   escribir ese código. **Caduca en ~60 segundos** — tengan el teléfono a
   mano antes de darle "Run workflow".
   - *(Alternativa para probar en una laptop:* `cd bot-whatsapp && npm
     install && node vincular.mjs +573001234567` — pero esa sesión queda
     solo en esa laptop, no la ve CI, así que para el bot programado hay
     que vincular por Actions igual.)*
3. **Anoten el JID del grupo.** El mismo log de `whatsapp-vincular.yml`
   imprime, al conectar, la lista de grupos a los que pertenece el número
   con su JID (algo como `123456789-987654321@g.us`). Guárdenlo como el
   secreto **`WHATSAPP_GROUP_JID`** del repositorio (Settings → Secrets and
   variables → Actions → New repository secret).

Después de esto, `whatsapp-bot.yml` corre solo, todos los días a las 8:00
a.m. hora de Cartagena.

## Archivos

| Archivo | Qué hace |
|---|---|
| `sesion.mjs` | Carga/guarda las credenciales vinculadas (`sesion/`, nunca se comitea) |
| `vincular.mjs` | Vincula el número (una vez) y lista los grupos disponibles |
| `mensaje.mjs` | Arma el texto del resumen — formato, no cálculo |
| `enviar.mjs` | El job diario: reconecta, manda el mensaje, se desconecta |

## Probar sin mandar nada de verdad

```bash
node -e "
import('../scripts/lib/datos-proyecto.mjs').then(async ({generarDatos}) => {
  const { construirMensaje } = await import('./mensaje.mjs');
  console.log(construirMensaje(generarDatos()));
});
"
```

Esto imprime el mensaje exacto que se mandaría, sin tocar WhatsApp — útil
para revisar el formato antes de cambiar algo en `mensaje.mjs`.

## Si el número se bloquea

Es el riesgo aceptado al elegir WhatsApp no oficial (ver el ADR). Si pasa:
consigan otro número dedicado y repitan "Puesta en marcha" — no hay nada
más que perder porque el número nunca fue personal de nadie.
