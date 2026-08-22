package com.aguavigia.ctg.domain;

import java.time.YearMonth;

/**
 * Un mes con su AgregadoDuraciones, tal como lo devuelve la agregación Mongo agrupada por mes
 * (`CorteAguaRepository.agregarCerradosPorMes`). CalcularCumplimientoService lo traduce a
 * PuntoSerieCumplimiento calculando el porcentaje — esa regla no le corresponde al adaptador.
 */
public record PuntoAgregadoMensual(YearMonth periodo, AgregadoDuraciones agregado) {

    public PuntoAgregadoMensual {
        if (periodo == null) {
            throw new IllegalArgumentException("El punto agregado debe tener período");
        }
        if (agregado == null) {
            throw new IllegalArgumentException("El punto agregado debe tener duraciones");
        }
    }
}
