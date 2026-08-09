package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.Suscripcion;

import java.util.Optional;

public interface SuscripcionRepository {

    Suscripcion guardar(Suscripcion suscripcion);

    /** RF013-RF015 — el token llega por el enlace del correo (confirmación o baja) y solo ese campo identifica. */
    Optional<Suscripcion> buscarPorTokenConfirmacion(String tokenConfirmacion);
}
