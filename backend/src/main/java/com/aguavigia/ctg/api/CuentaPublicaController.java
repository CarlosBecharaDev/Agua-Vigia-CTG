package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.SolicitudFijarClave;
import com.aguavigia.ctg.api.dto.SolicitudRegistro;
import com.aguavigia.ctg.api.dto.SolicitudRestablecer;
import com.aguavigia.ctg.domain.ClaveEnClaro;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.port.in.AceptarInvitacionUseCase;
import com.aguavigia.ctg.domain.port.in.RegistrarUsuarioUseCase;
import com.aguavigia.ctg.domain.port.in.RestablecerClaveUseCase;
import com.aguavigia.ctg.domain.port.in.VerificarCorreoUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Los cuatro pasos que una persona da sin tener sesión todavía: registrarse, verificar su correo,
 * aceptar una invitación y restablecer su clave.
 *
 * Todos responden 202 sin cuerpo cuando su efecto real es "mandamos un correo". Devolver el usuario
 * creado, o un 404 cuando el correo no existe, convertiría estos endpoints —que son públicos por
 * necesidad— en un buscador de cuentas ajenas. Su freno es el límite por IP de `application.yml`.
 */
@Tag(name = "Cuentas", description = "Alta, verificacion y recuperacion de cuentas del panel")
@RestController
@RequestMapping(value = "/api/cuentas", produces = MediaType.APPLICATION_JSON_VALUE)
public class CuentaPublicaController {

    private final RegistrarUsuarioUseCase registrar;
    private final VerificarCorreoUseCase verificar;
    private final AceptarInvitacionUseCase aceptarInvitacion;
    private final RestablecerClaveUseCase restablecer;

    public CuentaPublicaController(RegistrarUsuarioUseCase registrar,
                                   VerificarCorreoUseCase verificar,
                                   AceptarInvitacionUseCase aceptarInvitacion,
                                   RestablecerClaveUseCase restablecer) {
        this.registrar = registrar;
        this.verificar = verificar;
        this.aceptarInvitacion = aceptarInvitacion;
        this.restablecer = restablecer;
    }

    @Operation(summary = "Solicitar una cuenta del panel",
            description = """
                    Crea la cuenta en PENDIENTE_VERIFICACION y envia el enlace de confirmacion.
                    Registrarse no concede ningun permiso: hace falta verificar el correo y que un
                    ADMIN apruebe. Responde 202 aunque el correo ya tenga cuenta, para no revelar
                    que direcciones estan registradas.""")
    @ApiResponses({
            @ApiResponse(responseCode = "202", description = "Solicitud recibida; revisa tu correo"),
            @ApiResponse(responseCode = "400", description = "Correo mal formado o clave que no cumple la politica")
    })
    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void registrarse(@Valid @RequestBody SolicitudRegistro solicitud, HttpServletRequest peticion) {
        registrar.registrar(
                new CorreoElectronico(solicitud.correo()),
                solicitud.nombre(),
                new ClaveEnClaro(solicitud.clave()),
                ContextoHttp.de(peticion));
    }

    @Operation(summary = "Confirmar el correo con el token del enlace",
            description = "Pasa la cuenta a PENDIENTE_APROBACION. Sigue sin poder entrar hasta que un ADMIN la apruebe.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Correo confirmado"),
            @ApiResponse(responseCode = "400", description = "Enlace invalido, vencido o ya usado")
    })
    @PostMapping("/verificacion")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void verificarCorreo(@RequestParam String token, HttpServletRequest peticion) {
        verificar.verificar(token, ContextoHttp.de(peticion));
    }

    @Operation(summary = "Aceptar una invitacion fijando la clave",
            description = "Deja la cuenta ACTIVA con el rol que eligio quien invito. No hace falta otra aprobacion.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Cuenta activa; ya puedes iniciar sesion"),
            @ApiResponse(responseCode = "400", description = "Enlace invalido o clave que no cumple la politica")
    })
    @PostMapping("/invitacion")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void aceptar(@Valid @RequestBody SolicitudFijarClave solicitud, HttpServletRequest peticion) {
        aceptarInvitacion.aceptar(
                solicitud.token(), new ClaveEnClaro(solicitud.clave()), ContextoHttp.de(peticion));
    }

    @Operation(summary = "Pedir el enlace para restablecer la clave",
            description = "Responde 202 siempre, exista o no la cuenta. Ver el javadoc de esta clase.")
    @PostMapping("/restablecimiento")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void pedirRestablecimiento(@Valid @RequestBody SolicitudRestablecer solicitud,
                                      HttpServletRequest peticion) {
        restablecer.solicitar(new CorreoElectronico(solicitud.correo()), ContextoHttp.de(peticion));
    }

    @Operation(summary = "Fijar la clave nueva con el token del enlace",
            description = "Cambia la clave y revoca todas las sesiones abiertas de esa cuenta.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Clave cambiada"),
            @ApiResponse(responseCode = "400", description = "Enlace invalido, vencido o ya usado")
    })
    @PostMapping("/clave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void fijarClave(@Valid @RequestBody SolicitudFijarClave solicitud, HttpServletRequest peticion) {
        restablecer.restablecer(
                solicitud.token(), new ClaveEnClaro(solicitud.clave()), ContextoHttp.de(peticion));
    }
}
