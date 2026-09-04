package com.aguavigia.ctg.infrastructure.mail;

import com.aguavigia.ctg.domain.TipoTokenCuenta;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.port.out.NotificacionCuentaPort;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Los correos del ciclo de vida de una cuenta. Mismo criterio que MailNotificacionAdapter: `@Async`
 * para que el hilo HTTP no espere al servidor de correo, y los fallos se registran sin propagarse —
 * la cuenta ya quedó creada, y tumbar la petición porque el SMTP tardó no la desharía.
 *
 * Hay una excepción deliberada a "no propagar": si el correo de invitación no sale, quien invita se
 * queda con una cuenta INVITADA que nadie podrá activar nunca, porque el enlace solo existía en ese
 * mensaje. Ese caso sí se avisa (ver enviarInvitacion).
 */
@Component
public class MailCuentaAdapter implements NotificacionCuentaPort {

    private static final Logger log = LoggerFactory.getLogger(MailCuentaAdapter.class);

    private final JavaMailSender mailSender;
    private final PlantillaCorreo plantillaConEnlace;
    private final PlantillaCorreo plantillaAviso;
    private final String remitente;
    private final String urlBasePublica;

    public MailCuentaAdapter(JavaMailSender mailSender,
                             @Value("${aguavigia.correo.remitente:AguaVigía CTG <no-responder@aguavigia.local>}") String remitente,
                             @Value("${aguavigia.app.url-publica:http://localhost:8080}") String urlBasePublica) {
        this.mailSender = mailSender;
        this.plantillaConEnlace = PlantillaCorreo.desdeClasspath("plantillas-correo/cuenta-con-enlace.html");
        this.plantillaAviso = PlantillaCorreo.desdeClasspath("plantillas-correo/cuenta-aviso.html");
        this.remitente = remitente;
        this.urlBasePublica = urlBasePublica.endsWith("/")
                ? urlBasePublica.substring(0, urlBasePublica.length() - 1)
                : urlBasePublica;
    }

    @Async
    @Override
    public void enviarVerificacionDeCorreo(Usuario usuario, String tokenEnClaro) {
        String html = plantillaConEnlace.renderizar(Map.of(
                "titulo", "Confirma tu correo",
                "preencabezado", "Falta un paso para que tu solicitud de acceso llegue a un administrador.",
                "nombre", escapar(usuario.nombre()),
                "mensaje", "Recibimos tu solicitud de acceso al panel del veedor de AguaVigía. "
                        + "Confirma que esta dirección es tuya y un administrador revisará tu solicitud. "
                        + "Te avisaremos por correo cuando decida.",
                "textoBoton", "Confirmar mi correo",
                "urlAccion", enlace("verificar", tokenEnClaro),
                "vigencia", vigenciaLegible(TipoTokenCuenta.VERIFICACION_CORREO)));

        enviar(usuario, "Confirma tu correo para acceder al panel de AguaVigía", html);
    }

    @Override
    public void enviarInvitacion(Usuario invitado, Usuario autorDeLaInvitacion, String tokenEnClaro) {
        String html = plantillaConEnlace.renderizar(Map.of(
                "titulo", "Te invitaron al panel del veedor",
                "preencabezado", "Crea tu clave y entra al panel de AguaVigía.",
                "nombre", escapar(invitado.nombre()),
                "mensaje", escapar(autorDeLaInvitacion.nombre()) + " te dio acceso al panel del veedor "
                        + "de AguaVigía con el rol " + invitado.permisos().rol() + ". "
                        + "Elige tu clave y podrás entrar de inmediato.",
                "textoBoton", "Crear mi clave y entrar",
                "urlAccion", enlace("invitacion", tokenEnClaro),
                "vigencia", vigenciaLegible(TipoTokenCuenta.INVITACION)));

        // Sin `@Async` y propagando el fallo: es el único correo cuyo enlace no se puede volver a
        // pedir desde fuera. Si no sale, quien invita tiene que enterarse en el acto para reintentar.
        try {
            enviarOFallar(invitado, "Te invitaron al panel del veedor de AguaVigía", html);
        } catch (RuntimeException noSalio) {
            throw new IllegalStateException(
                    "La cuenta se creó pero no se pudo enviar la invitación a " + invitado.correo().valor()
                            + ". Revisa la configuración de correo y vuelve a invitar.", noSalio);
        }
    }

    @Async
    @Override
    public void enviarEnlaceDeRestablecimiento(Usuario usuario, String tokenEnClaro) {
        String html = plantillaConEnlace.renderizar(Map.of(
                "titulo", "Restablece tu clave",
                "preencabezado", "Un enlace de 30 minutos para volver a entrar al panel.",
                "nombre", escapar(usuario.nombre()),
                "mensaje", "Alguien pidió restablecer la clave de tu cuenta del panel del veedor. "
                        + "Si fuiste tú, elige una clave nueva con el botón de abajo. "
                        + "Al cambiarla se cerrarán todas las sesiones abiertas de tu cuenta.",
                "textoBoton", "Elegir una clave nueva",
                "urlAccion", enlace("restablecer", tokenEnClaro),
                "vigencia", vigenciaLegible(TipoTokenCuenta.RESTABLECER_CLAVE)));

        enviar(usuario, "Restablece tu clave de AguaVigía", html);
    }

    @Async
    @Override
    public void avisarCambioDeAcceso(Usuario usuario, String asunto, String mensaje) {
        String html = plantillaAviso.renderizar(Map.of(
                "titulo", escapar(asunto),
                "nombre", escapar(usuario.nombre()),
                "mensaje", escapar(mensaje)));

        enviar(usuario, asunto, html);
    }

    private void enviar(Usuario destinatario, String asunto, String html) {
        try {
            enviarOFallar(destinatario, asunto, html);
        } catch (RuntimeException noSalio) {
            log.error("No se pudo enviar '{}' a {}", asunto, destinatario.correo().valor(), noSalio);
        }
    }

    private void enviarOFallar(Usuario destinatario, String asunto, String html) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper ayudante = new MimeMessageHelper(mensaje, "UTF-8");
            ayudante.setFrom(remitente);
            ayudante.setTo(destinatario.correo().valor());
            ayudante.setSubject(asunto);
            ayudante.setText(html, true);
            mailSender.send(mensaje);
        } catch (Exception fallo) {
            throw new IllegalStateException("Fallo al enviar el correo", fallo);
        }
    }

    /**
     * Apunta al frontend y no a la API: la persona necesita una pantalla donde escribir su clave,
     * no una respuesta JSON. Es el frontend quien llama después al endpoint con el token.
     */
    private String enlace(String ruta, String tokenEnClaro) {
        return urlBasePublica + "/cuentas/" + ruta + "?token="
                + URLEncoder.encode(tokenEnClaro, StandardCharsets.UTF_8);
    }

    private static String vigenciaLegible(TipoTokenCuenta tipo) {
        long horas = tipo.vigencia().toHours();
        if (horas == 0) {
            return tipo.vigencia().toMinutes() + " minutos";
        }
        return horas < 48 ? horas + " horas" : (horas / 24) + " días";
    }

    /**
     * El nombre lo escribe quien se registra, y acaba dentro de un cuerpo HTML. Sin escapar, un
     * nombre con etiquetas se ejecutaría en el cliente de correo de quien lo lea.
     */
    private static String escapar(String texto) {
        if (texto == null) {
            return "";
        }
        return texto.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
