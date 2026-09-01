package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.AltaSegundoFactorRespuesta;
import com.aguavigia.ctg.api.dto.SesionVeedor;
import com.aguavigia.ctg.api.dto.SolicitudCodigo;
import com.aguavigia.ctg.domain.port.in.ConfigurarSegundoFactorUseCase;
import com.aguavigia.ctg.domain.port.in.ConsultarCuentasUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Segundo factor TOTP. Es el único grupo de endpoints que acepta una sesión de alcance
 * ALTA_SEGUNDO_FACTOR, y por eso su permiso (`CONFIGURAR_SEGUNDO_FACTOR`) lo tienen todos los roles
 * y PermisosEfectivos prohíbe revocarlo: un ADMIN al que se le negara la entrada aquí no tendría
 * ninguna otra puerta.
 */
@Tag(name = "Veedor - Segundo factor", description = "Alta y baja del TOTP de la propia cuenta")
@RestController
@RequestMapping(value = "/api/veedor/segundo-factor", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasAuthority('PERM_CONFIGURAR_SEGUNDO_FACTOR')")
public class SegundoFactorController {

    private final ConfigurarSegundoFactorUseCase configurar;
    private final ConsultarCuentasUseCase cuentas;

    public SegundoFactorController(ConfigurarSegundoFactorUseCase configurar,
                                   ConsultarCuentasUseCase cuentas) {
        this.configurar = configurar;
        this.cuentas = cuentas;
    }

    @Operation(summary = "Empezar el alta: genera el secreto y devuelve el QR",
            description = """
                    El secreto queda guardado sin confirmar y todavia no se exige al entrar. Solo
                    empieza a hacerlo tras confirmar un codigo valido. El secreto se muestra una
                    sola vez: no hay endpoint para volver a leerlo.""")
    @PostMapping("/alta")
    public AltaSegundoFactorRespuesta iniciar(HttpServletRequest peticion) {
        var alta = configurar.iniciar(ContextoHttp.usuarioActual(), ContextoHttp.de(peticion));
        return new AltaSegundoFactorRespuesta(alta.uri(), alta.secreto());
    }

    @Operation(summary = "Confirmar el alta con un codigo de la app",
            description = """
                    Devuelve una sesion nueva de alcance COMPLETO. Es lo que permite que un ADMIN
                    recien sembrado pase de su sesion restringida al panel sin volver a escribir la
                    clave que acaba de escribir.""")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Segundo factor activo; sesion nueva emitida"),
            @ApiResponse(responseCode = "401", description = "El codigo no coincide"),
            @ApiResponse(responseCode = "409", description = "No hay un alta en curso")
    })
    @PostMapping("/confirmacion")
    public SesionVeedor confirmar(@Valid @RequestBody SolicitudCodigo solicitud,
                                  HttpServletRequest peticion) {
        var usuarioId = ContextoHttp.usuarioActual();
        String token = configurar.confirmar(usuarioId, solicitud.codigo(), ContextoHttp.de(peticion));

        var usuario = cuentas.buscar(usuarioId)
                .orElseThrow(() -> new IllegalStateException("La sesion ya no corresponde a una cuenta"));

        return SesionVeedor.de(com.aguavigia.ctg.domain.SesionEmitida.de(
                usuario, token, com.aguavigia.ctg.domain.AlcanceSesion.COMPLETO));
    }

    @Operation(summary = "Desactivar el segundo factor de la propia cuenta",
            description = """
                    Exige un codigo valido: si bastara con la sesion, un token robado podria quitar
                    de en medio justamente la defensa que impide usarlo. Un ADMIN no puede
                    desactivarlo, su rol lo exige.""")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Segundo factor desactivado"),
            @ApiResponse(responseCode = "401", description = "El codigo no coincide"),
            @ApiResponse(responseCode = "409", description = "El rol ADMIN exige segundo factor")
    })
    @PostMapping("/baja")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void desactivar(@Valid @RequestBody SolicitudCodigo solicitud, HttpServletRequest peticion) {
        configurar.desactivar(ContextoHttp.usuarioActual(), solicitud.codigo(), ContextoHttp.de(peticion));
    }
}
