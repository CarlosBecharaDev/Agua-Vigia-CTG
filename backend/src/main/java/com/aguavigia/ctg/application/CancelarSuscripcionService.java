package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.Suscripcion;
import com.aguavigia.ctg.domain.port.in.CancelarSuscripcionUseCase;
import com.aguavigia.ctg.domain.port.out.SuscripcionRepository;
import org.springframework.stereotype.Service;

@Service
public class CancelarSuscripcionService implements CancelarSuscripcionUseCase {

    private final SuscripcionRepository suscripciones;

    public CancelarSuscripcionService(SuscripcionRepository suscripciones) {
        this.suscripciones = suscripciones;
    }

    @Override
    public Suscripcion cancelar(String token) {
        Suscripcion suscripcion = suscripciones.buscarPorToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token de suscripción inválido o inexistente"));

        return suscripciones.guardar(suscripcion.cancelar());
    }
}
