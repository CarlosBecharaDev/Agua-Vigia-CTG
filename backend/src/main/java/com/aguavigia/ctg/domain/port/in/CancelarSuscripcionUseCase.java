package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.Suscripcion;

/** RF015 — cancela una suscripción por correo, en un clic, sin credenciales. */
public interface CancelarSuscripcionUseCase {

    Suscripcion cancelar(String token);
}