package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.SaludColectorRespuesta;
import com.aguavigia.ctg.infrastructure.ingest.EstadoColectorRegistry;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * RNF007 — detalle de salud de los colectores, para el veedor.
 *
 * Existe además de `/actuator/health` porque `application-prod.yml` fija `show-details: never`: en
 * producción el health público dice si el servicio está degradado, y no cuántos ítems trajo cada
 * fuente ni con qué error. Ese detalle es operativo y va detrás del token, bajo `/api/veedor/**`.
 *
 * Lee del componente de infraestructura directamente, sin caso de uso intermedio (ADR-015): no hay
 * regla de negocio en consultar telemetría del propio proceso.
 */
@Tag(name = "Veedor - Ingesta", description = "Salud de los colectores del pipeline de ingesta (RNF007)")
@RestController
@RequestMapping(value = "/api/veedor/ingesta/salud", produces = MediaType.APPLICATION_JSON_VALUE)
public class IngestaSaludController {

    private final EstadoColectorRegistry estadoColectores;

    public IngestaSaludController(EstadoColectorRegistry estadoColectores) {
        this.estadoColectores = estadoColectores;
    }

    @Operation(summary = "Salud de cada colector: última ejecución exitosa, ítems y tasa de error",
            description = """
                    Lista vacía mientras el pipeline no haya corrido un ciclo. La telemetría vive en
                    memoria del proceso, así que un reinicio la reinicia.""")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Estado generado"),
            @ApiResponse(responseCode = "401", description = "Falta el token del veedor")
    })
    @GetMapping
    public List<SaludColectorRespuesta> salud() {
        return estadoColectores.estados().stream()
                .map(estado -> new SaludColectorRespuesta(
                        estado.nombre(),
                        estado.ultimaEjecucionExitosa(),
                        estado.ultimoFallo(),
                        estado.motivoDelUltimoFallo(),
                        estado.itemsProcesados(),
                        estado.tasaDeError(),
                        estado.fallosConsecutivos()))
                .toList();
    }
}
