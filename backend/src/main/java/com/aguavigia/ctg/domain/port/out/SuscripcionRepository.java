package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.Suscripcion;

import java.util.Optional;

public interface SuscripcionRepository {

    Suscripcion guardar(Suscripcion suscripcion);

    Optional<Suscripcion> buscarPorToken(String token);
}
