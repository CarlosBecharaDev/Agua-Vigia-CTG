package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.Suscripcion;
import com.aguavigia.ctg.domain.port.in.CancelarSuscripcionUseCase;
import com.aguavigia.ctg.domain.port.out.SuscripcionRepository;
import org.springframework.stereotype.Service;

/**
 * RF015 — baja en un clic sin credenciales. La cancelación es idempotente (cancelar algo ya
 * cancelado devuelve lo mismo), porque un vecino puede volver a abrir un correo viejo.
 */
@Service
public class CancelarSuscripcionService implements CancelarSuscripcionUseCase {

    private final SuscripcionRepository suscripciones;

    public CancelarSuscripcionService(SuscripcionRepository suscripciones) {
        this.suscripciones = suscripciones;
    }

    @Override
    public Suscripcion cancelar(String token) {
        Suscripcion suscripcion = suscripciones.buscarPorTokenConfirmacion(token)
                .orElseThrow(() -> new IllegalArgumentException("El enlace de baja no es válido."));

        return suscripciones.guardar(suscripcion.cancelar());
    }
}