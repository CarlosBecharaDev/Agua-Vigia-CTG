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
 * RF013 — confirma el doble opt-in con el token del correo. El token es de un solo uso (el estado
 * de la suscripción deja de ser PENDIENTE_CONFIRMACION) y vence según `horas-vigencia-token`, la
 * misma cifra que la plantilla de correo le promete al vecino: un enlace que no vence sería una
 * promesa falsa en el propio correo (ADR-006: no afirmar lo que no es).
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
        Suscripcion pendiente = suscripciones.buscarPorTokenConfirmacion(token)
                .orElseThrow(() -> new IllegalArgumentException("El enlace de confirmación no es válido."));

        Instant vence = pendiente.creadaEn().plus(Duration.ofHours(horasVigenciaToken));
        if (reloj.ahora().isAfter(vence)) {
            throw new IllegalArgumentException("El enlace de confirmación venció.");
        }

        return suscripciones.guardar(pendiente.confirmar());
    }
}