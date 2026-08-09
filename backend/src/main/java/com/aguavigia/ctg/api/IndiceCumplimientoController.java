package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.IndiceCumplimientoRespuesta;
import com.aguavigia.ctg.api.mapper.CumplimientoApiMapper;
import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.CalcularCumplimientoUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * M6 — RF020-RF022: el diferencial del proyecto. Público, sin token: el actor de estos tres
 * requisitos es la ciudadanía, no el veedor (a diferencia de `CorteController`).
 */
@Tag(name = "Cumplimiento", description = "Índice de Cumplimiento — prometido vs. real (RF020-RF022)")
@RestController
@RequestMapping(value = "/api/cumplimiento", produces = MediaType.APPLICATION_JSON_VALUE)
public class IndiceCumplimientoController {

    private final CalcularCumplimientoUseCase calcularCumplimiento;
    private final CumplimientoApiMapper mapper;

    public IndiceCumplimientoController(CalcularCumplimientoUseCase calcularCumplimiento,
                                         CumplimientoApiMapper mapper) {
        this.calcularCumplimiento = calcularCumplimiento;
        this.mapper = mapper;
    }

    @Operation(summary = "Índice de un corte cerrado")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Índice calculado"),
            @ApiResponse(responseCode = "400", description = "El corte no existe",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class))),
            @ApiResponse(responseCode = "409", description = "El corte todavía no está cerrado",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    @GetMapping("/cortes/{corteId}")
    public IndiceCumplimientoRespuesta porCorte(@PathVariable String corteId) {
        return mapper.aRespuesta(calcularCumplimiento.porCorte(new CorteId(corteId)));
    }

    @Operation(summary = "Índice agregado de un sector, sobre sus cortes cerrados")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Índice calculado"),
            @ApiResponse(responseCode = "400", description = "El sector no tiene cortes cerrados todavía",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    @GetMapping("/sectores/{sectorId}")
    public IndiceCumplimientoRespuesta porSector(@PathVariable String sectorId) {
        return mapper.aRespuesta(calcularCumplimiento.porSector(new SectorId(sectorId)));
    }

    @Operation(summary = "Índice global de la ciudad, sobre todos los cortes cerrados")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Índice calculado"),
            @ApiResponse(responseCode = "400", description = "Todavía no hay cortes cerrados",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    @GetMapping
    public IndiceCumplimientoRespuesta global() {
        return mapper.aRespuesta(calcularCumplimiento.global());
    }
}
