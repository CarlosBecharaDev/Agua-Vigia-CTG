package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.ReporteRespuesta;
import com.aguavigia.ctg.api.dto.SolicitudReporte;
import com.aguavigia.ctg.api.mapper.ReporteApiMapper;
import com.aguavigia.ctg.domain.Coordenada;
import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.port.in.RegistrarReporteUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** M2 — RF005-RF008: reportar sin registro, en máximo dos toques. */
@Tag(name = "Reportes", description = "Reportes ciudadanos de estado del servicio, sin registro")
@RestController
@RequestMapping(value = "/api/reportes", produces = MediaType.APPLICATION_JSON_VALUE)
public class ReporteController {

    private final RegistrarReporteUseCase registrarReporte;
    private final ReporteApiMapper mapper;

    public ReporteController(RegistrarReporteUseCase registrarReporte, ReporteApiMapper mapper) {
        this.registrarReporte = registrarReporte;
        this.mapper = mapper;
    }

    @Operation(summary = "Registrar un reporte ciudadano",
            description = """
                    Sin registro ni cuenta (RF005). Limita automáticamente los reportes por
                    dispositivo en la ventana vigente (RF006) — ver 429. La coordenada es opcional,
                    solo si el usuario autorizó compartir su ubicación (RF007).""")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Reporte registrado"),
            @ApiResponse(responseCode = "400", description = "Sector inexistente o tipo de reporte inválido",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class))),
            @ApiResponse(responseCode = "429", description = "El dispositivo superó el límite de reportes para este sector",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    @PostMapping
    public ResponseEntity<ReporteRespuesta> registrar(@Valid @RequestBody SolicitudReporte solicitud) {
        Coordenada coordenada = solicitud.coordenada() != null
                ? new Coordenada(solicitud.coordenada().latitud(), solicitud.coordenada().longitud())
                : null;

        var reporte = registrarReporte.registrar(
                new SectorId(solicitud.sectorId()),
                TipoReporte.valueOf(solicitud.tipo()),
                coordenada,
                new HuellaDispositivo(solicitud.huella()));

        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.aRespuesta(reporte));
    }
}
