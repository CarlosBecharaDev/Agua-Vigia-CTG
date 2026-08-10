package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.EstadisticasRespuesta;
import com.aguavigia.ctg.api.mapper.EstadisticasApiMapper;
import com.aguavigia.ctg.domain.port.in.CalcularEstadisticasUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Estadisticas", description = "M7 — Estadísticas Públicas (RF023)")
@RestController
@RequestMapping(value = "/api/estadisticas", produces = MediaType.APPLICATION_JSON_VALUE)
public class EstadisticasController {

    private final CalcularEstadisticasUseCase useCase;
    private final EstadisticasApiMapper mapper;

    public EstadisticasController(CalcularEstadisticasUseCase useCase, EstadisticasApiMapper mapper) {
        this.useCase = useCase;
        this.mapper = mapper;
    }

    @Operation(summary = "Obtener estadísticas globales de la ciudad")
    @GetMapping
    public EstadisticasRespuesta globales() {
        return mapper.aRespuesta(useCase.calcularGlobales());
    }
}
