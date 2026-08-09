package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.Suscripcion;

/** RF013 — doble opt-in: confirma la suscripción a partir del token de un solo uso enviado por correo. */
public interface ConfirmarSuscripcionUseCase {

    Suscripcion confirmar(String token);
}
