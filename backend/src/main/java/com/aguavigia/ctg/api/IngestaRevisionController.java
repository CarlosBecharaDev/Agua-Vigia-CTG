package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.PropuestaIngestaRespuesta;
import com.aguavigia.ctg.api.mapper.PropuestaIngestaApiMapper;
import com.aguavigia.ctg.domain.Pagina;
import com.aguavigia.ctg.domain.PropuestaId;
import com.aguavigia.ctg.domain.PropuestaIngesta;
import com.aguavigia.ctg.domain.port.in.RevisarPropuestaIngestaUseCase;
import com.aguavigia.ctg.domain.port.out.PropuestaIngestaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * M9 + M5 — cola de revisión de la ingesta automatizada.
 *
 * Vive bajo `/api/veedor/**`, así que `SecurityConfig` ya exige token sin declarar nada aquí. Es
 * deliberado que sea así y no público: una propuesta es una afirmación **sin verificar** sobre el
 * servicio de un barrio, y publicarla como si fuera dato es justo lo que este rediseño evita.
 *
 * La consulta va directo al puerto de salida (ADR-015): no hay regla de negocio en leer la cola.
 * Aprobar y descartar sí pasan por el caso de uso, que es quien decide si el mapa se mueve.
 */
@Tag(name = "Veedor - Ingesta", description = "Revisión de las propuestas de la ingesta automatizada (M9)")
@RestController
@RequestMapping(value = "/api/veedor/ingesta/propuestas", produces = MediaType.APPLICATION_JSON_VALUE)
public class IngestaRevisionController {

    private final RevisarPropuestaIngestaUseCase revisarPropuesta;
    private final PropuestaIngestaRepository propuestas;
    private final PropuestaIngestaApiMapper mapper;

    public IngestaRevisionController(RevisarPropuestaIngestaUseCase revisarPropuesta,
                                      PropuestaIngestaRepository propuestas,
                                      PropuestaIngestaApiMapper mapper) {
        this.revisarPropuesta = revisarPropuesta;
        this.propuestas = propuestas;
        this.mapper = mapper;
    }

    @Operation(summary = "Listar las propuestas pendientes de revisión, más recientes primero",
            description = """
                    Paginado, con el total y el enlace a la siguiente página en las cabeceras
                    `X-Total-Count` y `Link`. Por defecto 50; el máximo por página es 200.""")
    @ApiResponse(responseCode = "200", description = "Listado generado")
    @GetMapping
    public ResponseEntity<List<PropuestaIngestaRespuesta>> listarPendientes(
            @RequestParam(required = false) Integer pagina,
            @RequestParam(required = false) Integer tamano) {

        Pagina<PropuestaIngesta> resultado = propuestas.listarPendientes(
                Pagina.paginaValida(pagina), Pagina.tamanoValido(tamano));

        return CabecerasDePaginacion.respuesta(
                resultado, mapper.aRespuestas(resultado.contenido()), "/api/veedor/ingesta/propuestas");
    }

    @Operation(summary = "Aprobar una propuesta",
            description = """
                    Aplica el estado propuesto al sector y anexa el evento a la bitácora pública
                    (RF026). Es el único camino por el que la ingesta llega al mapa.""")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Propuesta aprobada y estado aplicado"),
            @ApiResponse(responseCode = "400", description = "La propuesta no existe",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class))),
            @ApiResponse(responseCode = "409", description = "El sector de la propuesta ya no existe",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    @PatchMapping("/{id}/aprobar")
    public PropuestaIngestaRespuesta aprobar(@PathVariable String id) {
        return mapper.aRespuesta(revisarPropuesta.aprobar(new PropuestaId(id)));
    }

    @Operation(summary = "Descartar una propuesta",
            description = "No toca el sector. La propuesta se archiva como descartada, no se borra.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Propuesta descartada"),
            @ApiResponse(responseCode = "400", description = "La propuesta no existe",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    @PatchMapping("/{id}/descartar")
    public PropuestaIngestaRespuesta descartar(@PathVariable String id) {
        return mapper.aRespuesta(revisarPropuesta.descartar(new PropuestaId(id)));
    }
}
