package com.aguavigia.ctg.infrastructure.mail;

import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.Suscripcion;
import com.aguavigia.ctg.domain.port.out.NotificacionPort;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * @Async: el hilo HTTP de POST /api/suscripciones no espera a que Mailhog (o el SMTP real en
 * producción) responda — RNF de Sprint 1. Requiere @EnableAsync (AsyncConfig) para que Spring
 * proxee esta clase; sin eso el método corre síncrono sin avisar.
 *
 * Fallos de envío solo se registran (log.error): un correo que no salió no debe tumbar el resto
 * del flujo ni reintentarse a ciegas — la suscripción ya quedó guardada.
 */
@Component
public class MailNotificacionAdapter implements NotificacionPort {

    private static final Logger log = LoggerFactory.getLogger(MailNotificacionAdapter.class);

    private final JavaMailSender mailSender;
    private final PlantillaCorreo plantillaConfirmacion;
    private final String remitente;
    private final String urlBasePublica;
    private final int horasVigenciaToken;

    public MailNotificacionAdapter(JavaMailSender mailSender,
                                    @Value("${aguavigia.correo.remitente:AguaVigía CTG <no-responder@aguavigia.local>}") String remitente,
                                    @Value("${aguavigia.app.url-publica:http://localhost:8080}") String urlBasePublica,
                                    @Value("${aguavigia.suscripcion.horas-vigencia-token:48}") int horasVigenciaToken) {
        this.mailSender = mailSender;
        this.plantillaConfirmacion = PlantillaCorreo.desdeClasspath("plantillas-correo/confirmar-suscripcion.html");
        this.remitente = remitente;
        this.urlBasePublica = urlBasePublica;
        this.horasVigenciaToken = horasVigenciaToken;
    }

    @Async
    @Override
    public void enviarConfirmacionSuscripcion(Suscripcion suscripcion, List<Sector> sectoresSuscritos) {
        String nombresSectores = sectoresSuscritos.stream()
                .map(Sector::nombre)
                .collect(Collectors.joining(", "));
        String urlConfirmacion = urlBasePublica + "/api/suscripciones/confirmar?token=" + suscripcion.tokenConfirmacion();

        String html = plantillaConfirmacion.renderizar(java.util.Map.of(
                "nombreSector", nombresSectores,
                "urlConfirmacion", urlConfirmacion,
                "horasVigencia", String.valueOf(horasVigenciaToken)));

        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper ayudante = new MimeMessageHelper(mensaje, "UTF-8");
            ayudante.setFrom(remitente);
            ayudante.setTo(suscripcion.correo().valor());
            ayudante.setSubject("Confirma que quieres recibir los avisos de " + nombresSectores);
            ayudante.setText(html, true);
            mailSender.send(mensaje);
        } catch (Exception fallo) {
            log.error("No se pudo enviar el correo de confirmación a la suscripción {}", suscripcion.id().valor(), fallo);
        }
    }

    @Async
    @Override
    public void avisarCambioDeEstado(Suscripcion suscripcion, Sector sector) {
        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper ayudante = new MimeMessageHelper(mensaje, "UTF-8");
            ayudante.setFrom(remitente);
            ayudante.setTo(suscripcion.correo().valor());
            ayudante.setSubject("AguaVigía CTG - Cambio de estado en tu sector: " + sector.nombre());
            
            String estado = sector.estadoActual() != null ? sector.estadoActual().name() : "Desconocido";
            String texto = "<p>Hola,</p><p>Te informamos que el sector <strong>" + sector.nombre() 
                    + "</strong> ha cambiado su estado a: <strong>" + estado + "</strong>.</p>"
                    + "<p>Gracias por usar AguaVigía CTG.</p>";
                    
            ayudante.setText(texto, true);
            mailSender.send(mensaje);
        } catch (Exception fallo) {
            log.error("No se pudo enviar el aviso a la suscripción {}", suscripcion.id().valor(), fallo);
        }
    }
}
