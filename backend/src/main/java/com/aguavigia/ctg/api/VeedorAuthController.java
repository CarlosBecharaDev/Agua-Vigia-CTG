package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.CredencialVeedor;
import com.aguavigia.ctg.api.dto.SesionVeedor;
import com.aguavigia.ctg.api.dto.UsuarioRespuesta;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.port.in.AutenticarUsuarioUseCase;
import com.aguavigia.ctg.domain.port.in.CerrarSesionUseCase;
import com.aguavigia.ctg.domain.port.in.ConsultarCuentasUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * RF019 — ingreso al panel del veedor. Desde ADR-039 son cuentas individuales con correo y clave,
 * no la credencial compartida de ADR-016.
 *
 * El controlador no decide nada: traduce HTTP a caso de uso. Toda la política —bloqueo por
 * intentos, estado de la cuenta, segundo factor, alcance de la sesión— vive en
 * AutenticarUsuarioService, que es donde se puede probar sin levantar un servidor.
 */
@Tag(name = "Veedor", description = "Autenticacion del panel del veedor")
@RestController
@RequestMapping(value = "/api/veedor", produces = MediaType.APPLICATION_JSON_VALUE)
public class VeedorAuthController {

    private final AutenticarUsuarioUseCase autenticar;
    private final CerrarSesionUseCase cerrarSesion;
    private final ConsultarCuentasUseCase cuentas;

    public VeedorAuthController(AutenticarUsuarioUseCase autenticar,
                                CerrarSesionUseCase cerrarSesion,
                                ConsultarCuentasUseCase cuentas) {
        this.autenticar = autenticar;
        this.cerrarSesion = cerrarSesion;
        this.cuentas = cuentas;
    }

    @Operation(summary = "Iniciar sesion en el panel del veedor",
            description = """
                    Devuelve un token JWT valido por 8 horas (RNF011) junto con el rol y los permisos
                    ya resueltos. Si la cuenta tiene segundo factor y no se envio `codigoTotp`, la
                    respuesta es 401 con type `segundo-factor-requerido`: hay que reintentar con el
                    codigo, no es un error de credencial.""")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Credencial correcta, token emitido"),
            @ApiResponse(responseCode = "401", description = "Credencial incorrecta, o falta el segundo factor"),
            @ApiResponse(responseCode = "403", description = "La cuenta existe pero no esta habilitada para entrar"),
            @ApiResponse(responseCode = "423", description = "Cuenta bloqueada por intentos fallidos"),
            @ApiResponse(responseCode = "429", description = "Demasiados intentos desde esta IP")
    })
    @PostMapping("/sesion")
    public SesionVeedor iniciarSesion(@Valid @RequestBody CredencialVeedor credencial,
                                      HttpServletRequest peticion) {
        return SesionVeedor.de(autenticar.autenticar(
                new CorreoElectronico(credencial.correo()),
                credencial.clave(),
                credencial.codigoTotp(),
                ContextoHttp.de(peticion)));
    }

    @Operation(summary = "Cerrar sesion",
            description = """
                    Revoca en el servidor todas las sesiones vivas de la cuenta, no solo la de este
                    navegador. Un token copiado antes del cierre deja de servir en el acto.""")
    @PostMapping("/sesion/cierre")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cerrar() {
        cerrarSesion.cerrar(ContextoHttp.usuarioActual());
    }

    @Operation(summary = "Datos de la cuenta que tiene la sesion",
            description = """
                    Lo usa el frontend al recargar para saber que puede pintar sin volver a pedir la
                    clave. Devuelve el estado vigente en la base de datos, no lo que dice el token.""")
    @GetMapping("/yo")
    public UsuarioRespuesta yo() {
        return cuentas.buscar(ContextoHttp.usuarioActual())
                .map(UsuarioRespuesta::de)
                .orElseThrow(() -> new IllegalStateException("La sesion ya no corresponde a una cuenta"));
    }
}
