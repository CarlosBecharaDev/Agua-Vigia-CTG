package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.SolicitudSuscripcion;
import com.aguavigia.ctg.api.dto.SuscripcionRespuesta;
import com.aguavigia.ctg.api.mapper.SuscripcionApiMapper;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.CancelarSuscripcionUseCase;
import com.aguavigia.ctg.domain.port.in.ConfirmarSuscripcionUseCase;
import com.aguavigia.ctg.domain.port.in.SuscribirseUseCase;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** M4 — RF012-RF013: suscribirse a sectores queda pendiente de confirmación por correo. */
@Tag(name = "Suscripciones", description = "Alertas por correo cuando cambia el estado de un sector")
@RestController
@RequestMapping(value = "/api/suscripciones", produces = MediaType.APPLICATION_JSON_VALUE)
public class SuscripcionController {

    private final SuscribirseUseCase suscribirse;
    private final ConfirmarSuscripcionUseCase confirmar;
    private final CancelarSuscripcionUseCase cancelar;
    private final SuscripcionApiMapper mapper;

    public SuscripcionController(SuscribirseUseCase suscribirse,
                                 ConfirmarSuscripcionUseCase confirmar,
                                 CancelarSuscripcionUseCase cancelar,
                                 SuscripcionApiMapper mapper) {
        this.suscribirse = suscribirse;
        this.confirmar = confirmar;
        this.cancelar = cancelar;
        this.mapper = mapper;
    }

    @Operation(summary = "Suscribirse a los avisos de uno o más sectores",
            description = """
                    Crea la suscripción en PENDIENTE_CONFIRMACION y envía un correo de doble
                    opt-in (Ley 1581/2012, RF013). No empieza a recibir avisos hasta confirmarla.""")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Suscripción creada, correo de confirmación en camino"),
            @ApiResponse(responseCode = "400", description = "Correo inválido o algún sector no existe",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    @PostMapping
    public ResponseEntity<SuscripcionRespuesta> suscribirse(@Valid @RequestBody SolicitudSuscripcion solicitud) {
        var suscripcion = suscribirse.suscribir(
                new CorreoElectronico(solicitud.correo()),
                solicitud.sectorIds().stream().map(SectorId::new).toList());

        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.aRespuesta(suscripcion));
    }

    @Operation(summary = "Confirmar una suscripción desde el enlace del correo",
            description = """
                    El token es de un solo uso (RF013): la suscripción pasa de PENDIENTE_CONFIRMACION
                    a CONFIRMADA. El enlace vence según `aguavigia.suscripcion.horas-vigencia-token` —
                    la misma cifra que la plantilla de correo le promete al vecino.""")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Suscripción confirmada"),
            @ApiResponse(responseCode = "400", description = "Token inválido, vencido o ya usado",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    @GetMapping("/confirmar")
    public ResponseEntity<SuscripcionRespuesta> confirmar(@RequestParam("token") String token) {
        return ResponseEntity.ok(mapper.aRespuesta(confirmar.confirmar(token)));
    }

    @Operation(summary = "Cancelar una suscripción en un clic, sin credenciales",
            description = """
                    RF015 — el enlace de baja no pide contraseña y es idempotente: volver a abrir
                    un correo viejo cancela el mismo estado sin error.""")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Suscripción cancelada"),
            @ApiResponse(responseCode = "400", description = "Token inválido",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ProblemDetail.class)))
    })
    @GetMapping("/cancelar")
    public ResponseEntity<SuscripcionRespuesta> cancelar(@RequestParam("token") String token) {
        return ResponseEntity.ok(mapper.aRespuesta(cancelar.cancelar(token)));
    }
}
