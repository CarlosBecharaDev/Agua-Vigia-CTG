package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.ReporteRespuesta;
import com.aguavigia.ctg.api.dto.SolicitudReporte;
import com.aguavigia.ctg.api.mapper.ReporteApiMapper;
import com.aguavigia.ctg.domain.Coordenada;
import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.port.in.AgregarEvidenciaUseCase;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestController;

/** M2 — RF005-RF008: reportar sin registro, en máximo dos toques. */
@Tag(name = "Reportes", description = "Reportes ciudadanos de estado del servicio, sin registro")
@RestController
@RequestMapping(value = "/api/reportes", produces = MediaType.APPLICATION_JSON_VALUE)
public class ReporteController {

    private final RegistrarReporteUseCase registrarReporte;
    private final AgregarEvidenciaUseCase agregarEvidenciaUseCase;
    private final com.aguavigia.ctg.domain.port.in.ConfirmarReporteUseCase confirmarReporte;
    private final ReporteApiMapper mapper;

    public ReporteController(RegistrarReporteUseCase registrarReporte, 
                             AgregarEvidenciaUseCase agregarEvidenciaUseCase, 
                             com.aguavigia.ctg.domain.port.in.ConfirmarReporteUseCase confirmarReporte,
                             ReporteApiMapper mapper) {
        this.registrarReporte = registrarReporte;
        this.agregarEvidenciaUseCase = agregarEvidenciaUseCase;
        this.confirmarReporte = confirmarReporte;
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

    @Operation(summary = "Agregar evidencia a un reporte",
            description = "Permite subir una foto y asociarla a un reporte existente (M10).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Evidencia agregada"),
            @ApiResponse(responseCode = "400", description = "Error en la solicitud"),
            @ApiResponse(responseCode = "404", description = "Reporte no encontrado")
    })
    @PostMapping(value = "/{id}/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReporteRespuesta> agregarEvidencia(
            @PathVariable("id") String id,
            @RequestParam("foto") MultipartFile foto) throws java.io.IOException {
        var reporte = agregarEvidenciaUseCase.agregarEvidencia(id, foto.getOriginalFilename(), foto.getBytes());
        return ResponseEntity.ok(mapper.aRespuesta(reporte));
    }

    @Operation(summary = "Confirmar un reporte",
            description = "Permite a otro vecino confirmar un reporte ciudadano (M11).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Reporte confirmado"),
            @ApiResponse(responseCode = "400", description = "Error en la solicitud"),
            @ApiResponse(responseCode = "404", description = "Reporte no encontrado")
    })
    @PostMapping(value = "/{id}/confirmar")
    public ResponseEntity<ReporteRespuesta> confirmar(
            @PathVariable("id") String id,
            @Valid @RequestBody com.aguavigia.ctg.api.dto.SolicitudConfirmar solicitud) {
        var reporte = confirmarReporte.confirmar(new com.aguavigia.ctg.domain.ReporteId(id), new HuellaDispositivo(solicitud.huella()));
        return ResponseEntity.ok(mapper.aRespuesta(reporte));
    }
}
