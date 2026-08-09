# Plantillas de correo (M4)

El HTML de los correos. Se ven abriendo el archivo en el navegador.

| Archivo | Cuándo se envía | Estado |
|---|---|---|
| `confirmar-suscripcion.html` | Al pedir avisos de un sector — doble opt-in, antes de guardar nada | Enviándose |
| `aviso-corte.html` | Cuando entra un corte que afecta al sector suscrito | Solo plantilla |

## Marcadores

Van como `{{nombre}}` y los sustituye `PlantillaCorreo` con `String.replace`, no un motor de
plantillas: con dos correos y marcadores fijos, Thymeleaf sería abstracción prematura.

**`confirmar-suscripcion.html`** — `nombreSector` · `urlConfirmacion` · `horasVigencia`

**`aviso-corte.html`** — `nombreSector` · `anuncioRelativo` · `inicioLegible` · `inicioRelativo` ·
`duracionPrometida` · `zonasAfectadas` · `citaTextual` · `referenciaBoletin` · `urlBoletin` ·
`urlReportar` · `urlBaja`

## Decisiones que ya están tomadas aquí

**`citaTextual` y `urlBoletin` no son opcionales.** `ADR-006` exige que toda extracción de IA pueda
citar la frase exacta del boletín que la respalda. Un aviso de corte sin esos dos campos no se envía:
el correo es el lugar donde el proyecto se juega la credibilidad ante alguien que no pidió abrir la
página.

**`urlBaja` va en todo correo de aviso**, no solo en un centro de preferencias. Es la baja en un clic
que exige la Ley 1581/2012 y que el rol de D1 tiene como criterio de terminado.

**Tablas y estilos en línea** porque los clientes de correo no aplican CSS moderno. El `<style>` del
encabezado lleva solo lo que puede perderse sin romper nada: los ajustes de pantalla angosta y el tema
oscuro. Lo esencial va en línea, en cada etiqueta.

**Tema oscuro incluido**, con la paleta de `DESIGN.md`. Los clientes que no lo soportan se quedan en
la paleta clara sin degradarse.

**Sin webfonts.** Misma regla que el frontend (`DESIGN.md` §4): pilas de fuentes del sistema. Serif
para titulares, sans para el cuerpo, monoespaciada para horas y etiquetas.

## Lo que falta

`NotificacionPort` ya existe y `MailNotificacionAdapter` envía la confirmación con `JavaMailSender`
y `@Async`. Lo que falta es el aviso de corte: el puerto solo declara
`enviarConfirmacionSuscripcion`, así que `aviso-corte.html` está escrito pero todavía no lo carga
nadie. Falta el método en el puerto, su implementación en el adaptador y quién dispara el envío
cuando entra un corte que cruza un sector suscrito.

Para probar el envío: Mailhog ya está en `docker-compose.yml` (SMTP en `1025`, interfaz en
`http://localhost:8025`).
