package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.AccionAuditada;
import com.aguavigia.ctg.domain.ClaveEnClaro;
import com.aguavigia.ctg.domain.ContextoDeAccion;
import com.aguavigia.ctg.domain.TipoTokenCuenta;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.port.in.AceptarInvitacionUseCase;
import com.aguavigia.ctg.domain.port.out.CifradorClavePort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.UsuarioRepository;
import org.springframework.stereotype.Service;

/**
 * La invitación ya probó el correo y ya trae el rol decidido: fijar la clave deja la cuenta ACTIVA
 * sin más aprobaciones. No hace falta una segunda — quien invitó es justamente quien aprueba.
 */
@Service
public class AceptarInvitacionService implements AceptarInvitacionUseCase {

    private final UsuarioRepository usuarios;
    private final EmisorDeTokensDeCuenta emisorDeTokens;
    private final CifradorClavePort cifrador;
    private final RegistroDeAuditoria auditoria;
    private final RelojPort reloj;

    public AceptarInvitacionService(UsuarioRepository usuarios,
                                    EmisorDeTokensDeCuenta emisorDeTokens,
                                    CifradorClavePort cifrador,
                                    RegistroDeAuditoria auditoria,
                                    RelojPort reloj) {
        this.usuarios = usuarios;
        this.emisorDeTokens = emisorDeTokens;
        this.cifrador = cifrador;
        this.auditoria = auditoria;
        this.reloj = reloj;
    }

    @Override
    public Usuario aceptar(String tokenEnClaro, ClaveEnClaro clave, ContextoDeAccion contexto) {
        Usuario invitado = emisorDeTokens.consumir(tokenEnClaro, TipoTokenCuenta.INVITACION);
        Usuario activo = usuarios.guardar(invitado.aceptarInvitacion(
                cifrador.cifrar(clave.valor()), reloj.ahora()));

        auditoria.registrarConAutor(AccionAuditada.INVITACION_ACEPTADA, activo, activo,
                "Invitación aceptada; cuenta activa con rol " + activo.permisos().rol(), contexto);
        return activo;
    }
}
