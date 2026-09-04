package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.AccionAuditada;
import com.aguavigia.ctg.domain.ClaveEnClaro;
import com.aguavigia.ctg.domain.ContextoDeAccion;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.EstadoCuenta;
import com.aguavigia.ctg.domain.TipoTokenCuenta;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.port.in.RestablecerClaveUseCase;
import com.aguavigia.ctg.domain.port.out.CifradorClavePort;
import com.aguavigia.ctg.domain.port.out.ControlIntentosPort;
import com.aguavigia.ctg.domain.port.out.NotificacionCuentaPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.RevocacionSesionPort;
import com.aguavigia.ctg.domain.port.out.UsuarioRepository;
import org.springframework.stereotype.Service;

/**
 * "Olvidé mi clave", con la propiedad que hace que no sea también "¿está registrado este correo?":
 * {@code solicitar} termina igual pase lo que pase — mismo resultado, sin excepción, exista o no
 * la cuenta.
 *
 * Restablecer revoca todas las sesiones vivas. Es el caso que más lo necesita: si alguien pide
 * cambiar su clave es a menudo porque sospecha que otro la tiene, y dejarle abierta la sesión al
 * intruso vaciaría de sentido el cambio.
 */
@Service
public class RestablecerClaveService implements RestablecerClaveUseCase {

    private final UsuarioRepository usuarios;
    private final EmisorDeTokensDeCuenta emisorDeTokens;
    private final CifradorClavePort cifrador;
    private final RevocacionSesionPort revocacion;
    private final ControlIntentosPort intentos;
    private final NotificacionCuentaPort notificaciones;
    private final RegistroDeAuditoria auditoria;
    private final RelojPort reloj;

    public RestablecerClaveService(UsuarioRepository usuarios,
                                   EmisorDeTokensDeCuenta emisorDeTokens,
                                   CifradorClavePort cifrador,
                                   RevocacionSesionPort revocacion,
                                   ControlIntentosPort intentos,
                                   NotificacionCuentaPort notificaciones,
                                   RegistroDeAuditoria auditoria,
                                   RelojPort reloj) {
        this.usuarios = usuarios;
        this.emisorDeTokens = emisorDeTokens;
        this.cifrador = cifrador;
        this.revocacion = revocacion;
        this.intentos = intentos;
        this.notificaciones = notificaciones;
        this.auditoria = auditoria;
        this.reloj = reloj;
    }

    @Override
    public void solicitar(CorreoElectronico correo, ContextoDeAccion contexto) {
        usuarios.buscarPorCorreo(correo.normalizado())
                // Una cuenta rechazada o aún sin aceptar su invitación no tiene clave que
                // restablecer, y mandarle el enlace le daría un camino para activarse saltándose
                // la aprobación.
                .filter(usuario -> usuario.estado() != EstadoCuenta.RECHAZADA
                        && usuario.estado() != EstadoCuenta.INVITADA)
                .ifPresent(usuario -> notificaciones.enviarEnlaceDeRestablecimiento(usuario,
                        emisorDeTokens.emitir(usuario.id(), TipoTokenCuenta.RESTABLECER_CLAVE)));
    }

    @Override
    public void restablecer(String tokenEnClaro, ClaveEnClaro claveNueva, ContextoDeAccion contexto) {
        Usuario usuario = emisorDeTokens.consumir(tokenEnClaro, TipoTokenCuenta.RESTABLECER_CLAVE);

        Usuario actualizado = usuarios.guardar(
                usuario.cambiarClave(cifrador.cifrar(claveNueva.valor()), reloj.ahora()));

        revocacion.revocarSesionesAnterioresA(actualizado.id(), reloj.ahora());
        // Si la cuenta estaba bloqueada por intentos fallidos, quien acaba de probar que controla
        // el correo no tiene por qué seguir esperando el castigo del que la atacaba.
        intentos.limpiarIntentos(actualizado.correo().valor());

        notificaciones.avisarCambioDeAcceso(actualizado, "Tu clave de AguaVigía cambió",
                "Se cambió la clave de tu cuenta y se cerraron todas las sesiones abiertas. "
                        + "Si no fuiste tú, avisa a un administrador de inmediato.");
        auditoria.registrarConAutor(AccionAuditada.CLAVE_RESTABLECIDA, actualizado, actualizado,
                "Clave restablecida por enlace de correo; sesiones revocadas", contexto);
    }
}
