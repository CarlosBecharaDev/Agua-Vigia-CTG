package com.aguavigia.ctg.domain;

import java.time.Duration;

/**
 * Suma de duraciones prometida/real de un conjunto de cortes cerrados, ya calculada por el
 * adaptador (agregación Mongo) para no traer cada corte a memoria — ver
 * `CorteAguaRepository.agregarCerrados` (estado-del-backend.md #6.1, "Índice global sin paginar").
 */
public record AgregadoDuraciones(Duration duracionPrometida, Duration duracionReal, long cantidadCortes) {

    public AgregadoDuraciones {
        if (duracionPrometida == null || duracionReal == null) {
            throw new IllegalArgumentException("Duración prometida y real son obligatorias");
        }
        if (cantidadCortes < 0) {
            throw new IllegalArgumentException("La cantidad de cortes no puede ser negativa");
        }
    }

    public static AgregadoDuraciones vacio() {
        return new AgregadoDuraciones(Duration.ZERO, Duration.ZERO, 0);
    }
}
