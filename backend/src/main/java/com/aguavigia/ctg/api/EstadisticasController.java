package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.EstadisticasRespuesta;
import com.aguavigia.ctg.api.mapper.EstadisticasApiMapper;
import com.aguavigia.ctg.domain.port.in.CalcularEstadisticasUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

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

    /**
     * RF025 — exportación en formato abierto. Se exportan los sectores más afectados, que es la
     * parte tabular: los cortes por día de semana y la duración promedio son una fila cada uno y
     * viajan como columnas repetidas para que una sola descarga se baste sola.
     */
    @Operation(summary = "Exportar las estadísticas en CSV (RF025)",
            description = "Separador `;` y BOM UTF-8, para que Excel en español lo abra sin romper las tildes.")
    @ApiResponse(responseCode = "200", description = "CSV generado")
    @GetMapping(value = "/exportar.csv", produces = "text/csv")
    public ResponseEntity<String> exportarCsv() {
        EstadisticasRespuesta estadisticas = mapper.aRespuesta(useCase.calcularGlobales());

        String csv = EscritorCsv.escribir(
                List.of("sector_id", "nombre", "cantidad_cortes", "duracion_promedio_horas_ciudad"),
                estadisticas.sectoresMasAfectados().stream()
                        .map(sector -> List.of(
                                sector.sectorId(),
                                sector.nombre(),
                                String.valueOf(sector.cantidadCortes()),
                                EscritorCsv.numero(estadisticas.duracionPromedioHoras())))
                        .toList());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"aguavigia-estadisticas.csv\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv);
    }
}
