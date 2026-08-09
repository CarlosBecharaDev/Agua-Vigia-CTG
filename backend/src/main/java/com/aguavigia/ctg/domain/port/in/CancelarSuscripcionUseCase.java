package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.Suscripcion;

/** RF015 — baja en 1 clic, sin pedir credenciales, con el mismo token que identifica la suscripción. */
public interface CancelarSuscripcionUseCase {

    Suscripcion cancelar(String token);
}
