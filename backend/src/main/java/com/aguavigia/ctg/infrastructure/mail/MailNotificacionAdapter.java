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

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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

    /** Hora de Cartagena: al vecino no le sirve un UTC. CLAUDE.md — fecha en hora local. */
    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter
            .ofPattern("d 'de' MMMM 'a las' h:mm a", Locale.forLanguageTag("es-CO"))
            .withZone(ZoneId.of("America/Bogota"));

    private final JavaMailSender mailSender;
    private final PlantillaCorreo plantillaConfirmacion;
    private final PlantillaCorreo plantillaCambioDeEstado;
    private final String remitente;
    private final String urlBasePublica;
    private final int horasVigenciaToken;

    public MailNotificacionAdapter(JavaMailSender mailSender,
                                    @Value("${aguavigia.correo.remitente:AguaVigía CTG <no-responder@aguavigia.local>}") String remitente,
                                    @Value("${aguavigia.app.url-publica:http://localhost:8080}") String urlBasePublica,
                                    @Value("${aguavigia.suscripcion.horas-vigencia-token:48}") int horasVigenciaToken) {
        this.mailSender = mailSender;
        this.plantillaConfirmacion = PlantillaCorreo.desdeClasspath("plantillas-correo/confirmar-suscripcion.html");
        this.plantillaCambioDeEstado = PlantillaCorreo.desdeClasspath("plantillas-correo/cambio-de-estado.html");
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

    /**
     * Un sector sin estado registrado no genera aviso: no hay nada que contarle al vecino, y
     * "Desconocido" era exactamente lo que el correo anterior le mandaba.
     */
    @Async
    @Override
    public void avisarCambioDeEstado(Suscripcion suscripcion, Sector sector) {
        if (sector.estadoActual() == null) {
            log.warn("Sector '{}' sin estado registrado: no se envía aviso a la suscripción {}",
                    sector.id().valor(), suscripcion.id().valor());
            return;
        }

        EstadoServicioLegible estado = EstadoServicioLegible.de(sector.estadoActual());
        String html = plantillaCambioDeEstado.renderizar(Map.ofEntries(
                Map.entry("nombreSector", sector.nombre()),
                Map.entry("estadoEtiqueta", estado.etiqueta()),
                Map.entry("estadoTitular", estado.titular(sector.nombre())),
                Map.entry("estadoDetalle", estado.detalle(sector.nombre())),
                Map.entry("estadoColorTexto", estado.colorTexto()),
                Map.entry("estadoColorFondo", estado.colorFondo()),
                Map.entry("estadoColorBorde", estado.colorBorde()),
                Map.entry("actualizadoLegible", fechaLegible(sector.estadoActualizadoEn())),
                Map.entry("urlReportar", urlBasePublica + "/sectores/" + sector.id().valor()),
                // RF015 — baja en 1 clic en cada correo, no solo en el de confirmación.
                Map.entry("urlBaja", urlBasePublica + "/api/suscripciones/cancelar?token="
                        + suscripcion.tokenConfirmacion())));

        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper ayudante = new MimeMessageHelper(mensaje, "UTF-8");
            ayudante.setFrom(remitente);
            ayudante.setTo(suscripcion.correo().valor());
            ayudante.setSubject(estado.titular(sector.nombre()));
            ayudante.setText(html, true);
            mailSender.send(mensaje);
        } catch (Exception fallo) {
            log.error("No se pudo enviar el aviso a la suscripción {}", suscripcion.id().valor(), fallo);
        }
    }

    private static String fechaLegible(Instant instante) {
        return instante == null ? "hace un momento" : FORMATO_FECHA.format(instante);
    }
}
