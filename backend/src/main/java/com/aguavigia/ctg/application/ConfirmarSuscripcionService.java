package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.Suscripcion;
import com.aguavigia.ctg.domain.port.in.ConfirmarSuscripcionUseCase;
import com.aguavigia.ctg.domain.port.out.SuscripcionRepository;
import org.springframework.stereotype.Service;

@Service
public class ConfirmarSuscripcionService implements ConfirmarSuscripcionUseCase {

    private final SuscripcionRepository suscripciones;

    public ConfirmarSuscripcionService(SuscripcionRepository suscripciones) {
        this.suscripciones = suscripciones;
    }

    @Override
    public Suscripcion confirmar(String token) {
        Suscripcion suscripcion = suscripciones.buscarPorToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token de confirmación inválido o inexistente"));

        return suscripciones.guardar(suscripcion.confirmar());
    }
}
