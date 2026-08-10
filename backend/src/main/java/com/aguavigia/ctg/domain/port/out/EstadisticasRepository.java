package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.port.in.CalcularEstadisticasUseCase.EstadisticasGlobales;

/** M7 — RF023. Agregaciones sobre cortes y sectores; la implementación real es de infrastructure. */
public interface EstadisticasRepository {

    EstadisticasGlobales calcularGlobales();
}
