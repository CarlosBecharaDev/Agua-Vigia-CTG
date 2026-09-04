package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.CorteRespuesta;
import com.aguavigia.ctg.api.dto.SolicitudCierreCorte;
import com.aguavigia.ctg.api.dto.SolicitudCorte;
import com.aguavigia.ctg.api.error.RecursoNoEncontradoException;
import com.aguavigia.ctg.api.mapper.CorteApiMapper;
import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.OrigenCorte;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.GestionarCorteOficialUseCase;
import com.aguavigia.ctg.domain.port.out.CorteAguaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * M5 — RF016-RF017: CRUD de cortes oficiales del panel del veedor. Protegido por completo por
 * `SecurityConfig` (`/api/veedor/**` exige token) sin tener que declarar nada de seguridad aquí.
 *
 * Consulta (`GET`) va directo al puerto de salida, sin pasar por el caso de uso (ADR-015): no hay
 * regla de negocio en leer. Escritura sí pasa por `GestionarCorteOficialUseCase`, que es quien
 * valida que los sectores existan.
 *
 * El origen se fija en `VEEDOR` y no lo decide el cliente: `OFICIAL_ACUACAR` e `INGESTA_IA` son
 * de procesos automatizados (M9) que todavía no existen, y dejar que un request arbitrario los
 * declare permitiría que un corte manual se hiciera pasar por uno verificado por la fuente oficial.
 */
@Tag(name = "Veedor - Cortes", description = "Registro y cierre de cortes oficiales (RF016-RF017)")
@RestController
@RequestMapping(value = "/api/veedor/cortes", produces = MediaType.APPLICATION_JSON_VALUE)
public class CorteController {

    private final GestionarCorteOficialUseCase gestionarCorte;
    private final CorteAguaRepository cortes;
    private final CorteApiMapper mapper;

    public CorteController(GestionarCorteOficialUseCase gestionarCorte,
                            CorteAguaRepository cortes,
                            CorteApiMapper mapper) {
        this.gestionarCorte = gestionarCorte;
        this.cortes = cortes;
        this.mapper = mapper;
    }

    @Operation(summary = "Registrar un corte oficial",
            description = "Sectores afectados, inicio, fin prometido y causa (RF016). Origen VEEDOR.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Corte registrado"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos o algún sector no existe",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    @PreAuthorize("hasAuthority('PERM_GESTIONAR_CORTES')")
    @PostMapping
    public ResponseEntity<CorteRespuesta> registrar(@Valid @RequestBody SolicitudCorte solicitud) {
        CorteAgua corte = CorteAgua.builder()
                .id(new CorteId(UUID.randomUUID().toString()))
                .sectoresAfectados(solicitud.sectoresAfectados().stream().map(SectorId::new).toList())
                .inicio(solicitud.inicio())
                .finPrometido(solicitud.finPrometido())
                .causa(solicitud.causa())
                .origen(OrigenCorte.VEEDOR)
                .build();

        CorteAgua guardado = gestionarCorte.registrar(corte);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.aRespuesta(guardado));
    }

    @Operation(summary = "Cerrar un corte con la hora real de restablecimiento (RF017)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Corte cerrado"),
            @ApiResponse(responseCode = "400", description = "El corte no existe",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class))),
            @ApiResponse(responseCode = "409", description = "El corte ya estaba cerrado",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    @PreAuthorize("hasAuthority('PERM_GESTIONAR_CORTES')")
    @PatchMapping("/{id}/cierre")
    public CorteRespuesta cerrar(@PathVariable String id, @Valid @RequestBody SolicitudCierreCorte solicitud) {
        CorteAgua cerrado = gestionarCorte.cerrar(new CorteId(id), solicitud.horaReal());
        return mapper.aRespuesta(cerrado);
    }

    @Operation(summary = "Consultar un corte por su identificador")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Corte encontrado"),
            @ApiResponse(responseCode = "404", description = "No existe un corte con ese id",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    @PreAuthorize("hasAuthority('PERM_VER_PANEL')")
    @GetMapping("/{id}")
    public CorteRespuesta consultar(@PathVariable String id) {
        return cortes.buscarPorId(new CorteId(id))
                .map(mapper::aRespuesta)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el corte '" + id + "'"));
    }

    @Operation(summary = "Listar los cortes que afectan a un sector")
    @PreAuthorize("hasAuthority('PERM_VER_PANEL')")
    @GetMapping
    public List<CorteRespuesta> listarPorSector(@RequestParam String sectorId) {
        return mapper.aRespuestas(cortes.listarPorSector(new SectorId(sectorId)));
    }
}
