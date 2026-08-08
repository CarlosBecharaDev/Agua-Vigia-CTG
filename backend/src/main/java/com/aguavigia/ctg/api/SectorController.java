package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.RespuestaSectores;
import com.aguavigia.ctg.api.dto.SectorRespuesta;
import com.aguavigia.ctg.api.error.RecursoNoEncontradoException;
import com.aguavigia.ctg.api.mapper.SectorApiMapper;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
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
 * M1 — mapa en vivo (RF001-RF004).
 *
 * Consulta de solo lectura sin regla de negocio: va directo al puerto de salida, sin caso de
 * uso intermedio (ADR-015). Si alguna vez aparece una regla aqui, deja de ser cosa del
 * controlador y pasa a application/, que es de D2.
 */
@Tag(name = "Sectores", description = "Estado del servicio de agua por sector de Cartagena")
@RestController
@RequestMapping(value = "/api/sectores", produces = MediaType.APPLICATION_JSON_VALUE)
public class SectorController {

    private final SectorRepository sectores;
    private final SectorApiMapper mapper;
    private final RelojPort reloj;

    public SectorController(SectorRepository sectores, SectorApiMapper mapper, RelojPort reloj) {
        this.sectores = sectores;
        this.mapper = mapper;
        this.reloj = reloj;
    }

    @Operation(summary = "Listar los sectores con su estado conocido",
            description = """
                    Devuelve los sectores de Cartagena (211 barrios sembrados desde el GeoJSON
                    oficial). `estado` viaja nulo mientras no haya dato verificado del sector —
                    el cliente debe mostrarlo como "sin datos" y no suponer que hay servicio.""")
    @ApiResponse(responseCode = "200", description = "Listado generado")
    @GetMapping
    public RespuestaSectores listarSectores() {
        return new RespuestaSectores(mapper.aRespuestas(sectores.listarTodos()), reloj.ahora());
    }

    @Operation(summary = "Consultar un sector por su identificador")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Sector encontrado"),
            @ApiResponse(responseCode = "404", description = "No existe un sector con ese id",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    @GetMapping("/{id}")
    public SectorRespuesta consultarSector(@PathVariable String id) {
        return sectores.buscarPorId(new SectorId(id))
                .map(mapper::aRespuesta)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el sector '" + id + "'"));
    }
}
