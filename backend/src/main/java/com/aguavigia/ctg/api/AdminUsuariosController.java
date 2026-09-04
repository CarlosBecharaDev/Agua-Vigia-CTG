package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.EventoAuditoriaRespuesta;
import com.aguavigia.ctg.api.dto.SolicitudInvitacion;
import com.aguavigia.ctg.api.dto.SolicitudPermisos;
import com.aguavigia.ctg.api.dto.UsuarioRespuesta;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.EstadoCuenta;
import com.aguavigia.ctg.domain.EventoAuditoria;
import com.aguavigia.ctg.domain.Pagina;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.in.AdministrarCuentaUseCase;
import com.aguavigia.ctg.domain.port.in.ConsultarCuentasUseCase;
import com.aguavigia.ctg.domain.port.in.InvitarUsuarioUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;

/**
 * El panel de cuentas. Todo aquí exige `GESTIONAR_USUARIOS` salvo la auditoría, que se separa en
 * `VER_AUDITORIA` a propósito: leer quién hizo qué y poder cambiar quién puede hacer qué son dos
 * capacidades distintas, y un rol de supervisión debería poder tener la primera sin la segunda.
 *
 * Las guardas de verdad —no administrarse a uno mismo, no dejar el sistema sin ADMIN, revocar las
 * sesiones al cambiar el acceso— están en AdministrarCuentaService, no aquí: un `@PreAuthorize`
 * dice quién puede llamar, no si la operación deja el sistema en un estado válido.
 */
@Tag(name = "Veedor - Cuentas", description = "Gestion de cuentas y permisos del panel (solo ADMIN)")
@RestController
@RequestMapping(value = "/api/veedor", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasAuthority('PERM_GESTIONAR_USUARIOS')")
public class AdminUsuariosController {

    private final ConsultarCuentasUseCase cuentas;
    private final AdministrarCuentaUseCase administrar;
    private final InvitarUsuarioUseCase invitar;

    public AdminUsuariosController(ConsultarCuentasUseCase cuentas,
                                   AdministrarCuentaUseCase administrar,
                                   InvitarUsuarioUseCase invitar) {
        this.cuentas = cuentas;
        this.administrar = administrar;
        this.invitar = invitar;
    }

    @Operation(summary = "Listar cuentas, mas recientes primero",
            description = """
                    Paginado, con el total y el enlace a la siguiente pagina en `X-Total-Count` y
                    `Link`. `estado` filtra por PENDIENTE_APROBACION para ver solo la cola de altas.""")
    @GetMapping("/usuarios")
    public ResponseEntity<List<UsuarioRespuesta>> listar(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Integer pagina,
            @RequestParam(required = false) Integer tamano) {

        Pagina<Usuario> resultado = cuentas.listar(
                aEstado(estado), Pagina.paginaValida(pagina), Pagina.tamanoValido(tamano));

        return CabecerasDePaginacion.respuesta(
                resultado,
                resultado.contenido().stream().map(UsuarioRespuesta::de).toList(),
                "/api/veedor/usuarios");
    }

    @Operation(summary = "Invitar a una persona con un rol ya decidido",
            description = """
                    Crea la cuenta en INVITADA y le envia un enlace para que fije su clave. Al
                    aceptarlo queda ACTIVA sin necesitar otra aprobacion.""")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Invitacion enviada"),
            @ApiResponse(responseCode = "409", description = "Ya existe una cuenta con ese correo")
    })
    @PostMapping("/usuarios/invitaciones")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioRespuesta invitar(@Valid @RequestBody SolicitudInvitacion solicitud,
                                    HttpServletRequest peticion) {
        return UsuarioRespuesta.de(invitar.invitar(
                new CorreoElectronico(solicitud.correo()),
                solicitud.nombre(),
                solicitud.rolDominio(),
                ContextoHttp.de(peticion)));
    }

    @Operation(summary = "Aprobar una cuenta que ya verifico su correo, asignandole permisos")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cuenta activa"),
            @ApiResponse(responseCode = "409", description = "La cuenta no esta esperando aprobacion, o el ADMIN se administra a si mismo")
    })
    @PatchMapping("/usuarios/{id}/aprobacion")
    public UsuarioRespuesta aprobar(@PathVariable String id,
                                    @Valid @RequestBody SolicitudPermisos permisos,
                                    HttpServletRequest peticion) {
        return UsuarioRespuesta.de(administrar.aprobar(
                new UsuarioId(id), permisos.aDominio(), ContextoHttp.de(peticion)));
    }

    @Operation(summary = "Denegar una solicitud de acceso")
    @PatchMapping("/usuarios/{id}/rechazo")
    public UsuarioRespuesta rechazar(@PathVariable String id, HttpServletRequest peticion) {
        return UsuarioRespuesta.de(administrar.rechazar(new UsuarioId(id), ContextoHttp.de(peticion)));
    }

    @Operation(summary = "Suspender una cuenta activa",
            description = "Revoca sus sesiones al instante: no espera a que caduque su token.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cuenta suspendida"),
            @ApiResponse(responseCode = "409", description = "Es el unico ADMIN activo, o el ADMIN se administra a si mismo")
    })
    @PatchMapping("/usuarios/{id}/suspension")
    public UsuarioRespuesta suspender(@PathVariable String id, HttpServletRequest peticion) {
        return UsuarioRespuesta.de(administrar.suspender(new UsuarioId(id), ContextoHttp.de(peticion)));
    }

    @Operation(summary = "Devolver el acceso a una cuenta suspendida")
    @PatchMapping("/usuarios/{id}/reactivacion")
    public UsuarioRespuesta reactivar(@PathVariable String id, HttpServletRequest peticion) {
        return UsuarioRespuesta.de(administrar.reactivar(new UsuarioId(id), ContextoHttp.de(peticion)));
    }

    @Operation(summary = "Cambiar rol y ajustes de permisos de una cuenta",
            description = """
                    Revoca las sesiones vivas de esa persona, tanto si los permisos se amplian como
                    si se recortan: el token los lleva dentro y una sesion abierta seguiria usando
                    los anteriores.""")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Permisos actualizados"),
            @ApiResponse(responseCode = "409", description = "Dejaria al sistema sin ningun ADMIN activo")
    })
    @PatchMapping("/usuarios/{id}/permisos")
    public UsuarioRespuesta cambiarPermisos(@PathVariable String id,
                                            @Valid @RequestBody SolicitudPermisos permisos,
                                            HttpServletRequest peticion) {
        return UsuarioRespuesta.de(administrar.cambiarPermisos(
                new UsuarioId(id), permisos.aDominio(), ContextoHttp.de(peticion)));
    }

    @Operation(summary = "Bitacora de auditoria de cuentas, mas recientes primero",
            description = "Solo anexado: no hay forma de editar ni borrar un asiento desde la API.")
    @GetMapping("/auditoria")
    @PreAuthorize("hasAuthority('PERM_VER_AUDITORIA')")
    public ResponseEntity<List<EventoAuditoriaRespuesta>> auditoria(
            @RequestParam(required = false) Integer pagina,
            @RequestParam(required = false) Integer tamano) {

        Pagina<EventoAuditoria> resultado = cuentas.auditoria(
                Pagina.paginaValida(pagina), Pagina.tamanoValido(tamano));

        return CabecerasDePaginacion.respuesta(
                resultado,
                resultado.contenido().stream().map(EventoAuditoriaRespuesta::de).toList(),
                "/api/veedor/auditoria");
    }

    /** Un filtro con un estado que no existe es un 400, no una lista vacia que parece un sistema sin cuentas. */
    private static EstadoCuenta aEstado(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        try {
            return EstadoCuenta.valueOf(valor.strip().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException noExiste) {
            throw new IllegalArgumentException("Estado de cuenta no valido: '" + valor + "'");
        }
    }
}
