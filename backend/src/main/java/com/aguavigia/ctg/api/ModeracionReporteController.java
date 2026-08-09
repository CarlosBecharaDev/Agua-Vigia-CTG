package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.ReporteModeracionRespuesta;
import com.aguavigia.ctg.api.mapper.ReporteModeracionApiMapper;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.port.in.ModerarReporteUseCase;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * M5 — RF018: moderar (aprobar/descartar) reportes ciudadanos. Protegido por completo por
 * `SecurityConfig` (`/api/veedor/**` exige token), sin declarar nada de seguridad aquí.
 *
 * `ADR-023`: "dudoso" es "todo lo que sigue PENDIENTE" — no hay una preselección automática. La
 * cola completa de pendientes es lo que ve el veedor.
 */
@Tag(name = "Veedor - Moderación", description = "Moderar reportes ciudadanos pendientes (RF018)")
@RestController
@RequestMapping(value = "/api/veedor/reportes", produces = MediaType.APPLICATION_JSON_VALUE)
public class ModeracionReporteController {

    private final ModerarReporteUseCase moderarReporte;
    private final ReporteCiudadanoRepository reportes;
    private final ReporteModeracionApiMapper mapper;

    public ModeracionReporteController(ModerarReporteUseCase moderarReporte,
                                        ReporteCiudadanoRepository reportes,
                                        ReporteModeracionApiMapper mapper) {
        this.moderarReporte = moderarReporte;
        this.reportes = reportes;
        this.mapper = mapper;
    }

    @Operation(summary = "Listar los reportes pendientes de moderación")
    @GetMapping("/pendientes")
    public List<ReporteModeracionRespuesta> listarPendientes() {
        return mapper.aRespuestas(reportes.listarPendientes());
    }

    @Operation(summary = "Aprobar un reporte")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Reporte aprobado"),
            @ApiResponse(responseCode = "400", description = "El reporte no existe",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    @PatchMapping("/{id}/aprobar")
    public ReporteModeracionRespuesta aprobar(@PathVariable String id) {
        return mapper.aRespuesta(moderarReporte.aprobar(new ReporteId(id)));
    }

    @Operation(summary = "Descartar un reporte")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Reporte descartado"),
            @ApiResponse(responseCode = "400", description = "El reporte no existe",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    @PatchMapping("/{id}/descartar")
    public ReporteModeracionRespuesta descartar(@PathVariable String id) {
        return mapper.aRespuesta(moderarReporte.descartar(new ReporteId(id)));
    }
}
