package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.IndiceCumplimientoRespuesta;
import com.aguavigia.ctg.api.dto.PuntoSerieRespuesta;
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
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

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

    @Operation(summary = "Evolución del índice mes a mes (RF024)",
            description = """
                    Un punto por mes con al menos un corte cerrado, en hora de Cartagena. Sin
                    `sectorId`, la ciudad completa. `desde` y `hasta` son opcionales y acotan por la
                    hora real de restablecimiento. Lista vacía si no hay cortes cerrados en el
                    rango — una serie sin datos es una respuesta válida.""")
    @ApiResponse(responseCode = "200", description = "Serie generada")
    @GetMapping("/serie")
    public List<PuntoSerieRespuesta> serie(
            @RequestParam(required = false) String sectorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant hasta) {
        return serieDe(sectorId, desde, hasta);
    }

    @Operation(summary = "La misma serie en CSV (RF025)",
            description = "Separador `;` y BOM UTF-8, para que Excel en español la abra sin romper las tildes.")
    @ApiResponse(responseCode = "200", description = "CSV generado")
    @GetMapping(value = "/serie.csv", produces = "text/csv")
    public ResponseEntity<String> serieCsv(
            @RequestParam(required = false) String sectorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant hasta) {

        String csv = EscritorCsv.escribir(
                List.of("periodo", "duracion_prometida_horas", "duracion_real_horas",
                        "desviacion_horas", "porcentaje_cumplimiento", "cantidad_cortes"),
                serieDe(sectorId, desde, hasta).stream()
                        .map(punto -> List.of(
                                punto.periodo(),
                                enHoras(punto.duracionPrometidaSegundos()),
                                enHoras(punto.duracionRealSegundos()),
                                enHoras(punto.desviacionSegundos()),
                                EscritorCsv.numero(punto.porcentajeCumplimiento()),
                                String.valueOf(punto.cantidadCortes())))
                        .toList());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"aguavigia-cumplimiento.csv\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv);
    }

    private List<PuntoSerieRespuesta> serieDe(String sectorId, Instant desde, Instant hasta) {
        return mapper.aRespuestas(calcularCumplimiento.serieMensual(
                sectorId == null || sectorId.isBlank() ? null : new SectorId(sectorId), desde, hasta));
    }

    /** Horas y no segundos: DESIGN.md §5 pide cifras que una persona pueda leer. */
    private static String enHoras(long segundos) {
        return EscritorCsv.numero(segundos / 3600.0);
    }
}
