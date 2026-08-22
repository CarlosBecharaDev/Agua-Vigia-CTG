package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.port.in.CalcularEstadisticasUseCase.EstadisticasGlobales;
import com.aguavigia.ctg.domain.port.out.EstadisticasRepository;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

class CalcularEstadisticasServiceTest {

    @Test
    void debeDelegarEnElRepositorio() {
        EstadisticasRepository repositorio = mock(EstadisticasRepository.class);
        EstadisticasGlobales esperado = new EstadisticasGlobales(java.util.List.of(), Map.of(), 3.5);
        given(repositorio.calcularGlobales()).willReturn(esperado);

        CalcularEstadisticasService servicio = new CalcularEstadisticasService(repositorio);

        assertThat(servicio.calcularGlobales()).isSameAs(esperado);
    }
}
