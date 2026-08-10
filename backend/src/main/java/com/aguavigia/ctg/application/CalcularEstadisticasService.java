package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.port.in.CalcularEstadisticasUseCase;
import com.aguavigia.ctg.domain.port.out.EstadisticasRepository;
import org.springframework.stereotype.Service;

@Service
public class CalcularEstadisticasService implements CalcularEstadisticasUseCase {

    private final EstadisticasRepository estadisticas;

    public CalcularEstadisticasService(EstadisticasRepository estadisticas) {
        this.estadisticas = estadisticas;
    }

    @Override
    public EstadisticasGlobales calcularGlobales() {
        return estadisticas.calcularGlobales();
    }
}
