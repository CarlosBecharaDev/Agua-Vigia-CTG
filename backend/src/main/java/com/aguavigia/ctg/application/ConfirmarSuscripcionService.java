package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.Suscripcion;
import com.aguavigia.ctg.domain.port.in.ConfirmarSuscripcionUseCase;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SuscripcionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

/**
 * BUG-041: el correo de confirmación (MailNotificacionAdapter, plantilla confirmar-suscripcion.html)
 * le dice al vecino "el enlace vence en {{horasVigencia}} horas" — la misma propiedad
 * `aguavigia.suscripcion.horas-vigencia-token` se lee aqui para que el codigo cumpla esa promesa.
 */
@Service
public class ConfirmarSuscripcionService implements ConfirmarSuscripcionUseCase {

    private final SuscripcionRepository suscripciones;
    private final RelojPort reloj;
    private final long horasVigenciaToken;

    public ConfirmarSuscripcionService(SuscripcionRepository suscripciones,
                                        RelojPort reloj,
                                        @Value("${aguavigia.suscripcion.horas-vigencia-token:48}") long horasVigenciaToken) {
        this.suscripciones = suscripciones;
        this.reloj = reloj;
        this.horasVigenciaToken = horasVigenciaToken;
    }

    @Override
    public Suscripcion confirmar(String token) {
        Suscripcion suscripcion = suscripciones.buscarPorToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token de confirmación inválido o inexistente"));

        Instant vence = suscripcion.creadaEn().plus(Duration.ofHours(horasVigenciaToken));
        if (reloj.ahora().isAfter(vence)) {
            throw new IllegalArgumentException("El enlace de confirmación venció.");
        }

        return suscripciones.guardar(suscripcion.confirmar());
    }
}
