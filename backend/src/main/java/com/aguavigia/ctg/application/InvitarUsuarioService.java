package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.AccionAuditada;
import com.aguavigia.ctg.domain.ContextoDeAccion;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.RolVeedor;
import com.aguavigia.ctg.domain.TipoTokenCuenta;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.in.InvitarUsuarioUseCase;
import com.aguavigia.ctg.domain.port.out.NotificacionCuentaPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.UsuarioRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Aquí sí se rechaza en claro un correo repetido, al revés que en el registro abierto: quien invita
 * ya está autenticado como ADMIN y tiene la lista de cuentas delante. Ocultárselo no protegería
 * nada y le haría creer que la invitación salió.
 */
@Service
public class InvitarUsuarioService implements InvitarUsuarioUseCase {

    private final UsuarioRepository usuarios;
    private final EmisorDeTokensDeCuenta emisorDeTokens;
    private final NotificacionCuentaPort notificaciones;
    private final RegistroDeAuditoria auditoria;
    private final RelojPort reloj;

    public InvitarUsuarioService(UsuarioRepository usuarios,
                                 EmisorDeTokensDeCuenta emisorDeTokens,
                                 NotificacionCuentaPort notificaciones,
                                 RegistroDeAuditoria auditoria,
                                 RelojPort reloj) {
        this.usuarios = usuarios;
        this.emisorDeTokens = emisorDeTokens;
        this.notificaciones = notificaciones;
        this.auditoria = auditoria;
        this.reloj = reloj;
    }

    @Override
    public Usuario invitar(CorreoElectronico correo, String nombre, RolVeedor rol,
                           ContextoDeAccion contexto) {
        CorreoElectronico normalizado = correo.normalizado();
        if (usuarios.existePorCorreo(normalizado)) {
            throw new IllegalStateException("Ya existe una cuenta con el correo " + normalizado.valor());
        }

        Usuario autor = usuarios.buscarPorId(contexto.autorId())
                .orElseThrow(() -> new IllegalStateException("La sesión que invita ya no existe"));

        Usuario invitado = usuarios.guardar(Usuario.invitado(
                new UsuarioId(UUID.randomUUID().toString()),
                normalizado,
                nombre.strip(),
                rol,
                reloj.ahora()));

        String token = emisorDeTokens.emitir(invitado.id(), TipoTokenCuenta.INVITACION);
        notificaciones.enviarInvitacion(invitado, autor, token);
        auditoria.registrarConAutor(AccionAuditada.CUENTA_INVITADA, autor, invitado,
                "Invitación enviada con rol " + rol, contexto);
        return invitado;
    }
}
