package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.Suscripcion;

/** RF013 — confirma una suscripción pendiente con un token de un solo uso recibido por correo. */
public interface ConfirmarSuscripcionUseCase {

    Suscripcion confirmar(String token);
}