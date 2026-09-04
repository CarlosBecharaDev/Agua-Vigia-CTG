package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.AccionAuditada;
import com.aguavigia.ctg.domain.AlcanceSesion;
import com.aguavigia.ctg.domain.ContextoDeAccion;
import com.aguavigia.ctg.domain.CredencialInvalidaException;
import com.aguavigia.ctg.domain.SecretoTotp;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.in.ConfigurarSegundoFactorUseCase;
import com.aguavigia.ctg.domain.port.out.EmisorDeSesionPort;
import com.aguavigia.ctg.domain.port.out.GeneradorSecretosPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.RevocacionSesionPort;
import com.aguavigia.ctg.domain.port.out.SegundoFactorPort;
import com.aguavigia.ctg.domain.port.out.UsuarioRepository;
import org.springframework.stereotype.Service;

/**
 * Alta del TOTP en dos pasos. El primero solo guarda el secreto sin confirmar; hasta el segundo, la
 * cuenta entra exactamente igual que antes. Activarlo de una vez convertiría un QR mal escaneado en
 * una cuenta perdida.
 *
 * {@code confirmar} devuelve un token nuevo a propósito: el ADMIN que llega aquí venía con una
 * sesión de alcance ALTA_SEGUNDO_FACTOR, que no sirve para nada más. Sin canjearla, tendría que
 * volver a escribir su clave justo después de haber demostrado dos factores.
 */
@Service
public class ConfigurarSegundoFactorService implements ConfigurarSegundoFactorUseCase {

    private final UsuarioRepository usuarios;
    private final GeneradorSecretosPort generador;
    private final SegundoFactorPort segundoFactor;
    private final EmisorDeSesionPort emisorDeSesion;
    private final RevocacionSesionPort revocacion;
    private final RegistroDeAuditoria auditoria;
    private final RelojPort reloj;

    public ConfigurarSegundoFactorService(UsuarioRepository usuarios,
                                          GeneradorSecretosPort generador,
                                          SegundoFactorPort segundoFactor,
                                          EmisorDeSesionPort emisorDeSesion,
                                          RevocacionSesionPort revocacion,
                                          RegistroDeAuditoria auditoria,
                                          RelojPort reloj) {
        this.usuarios = usuarios;
        this.generador = generador;
        this.segundoFactor = segundoFactor;
        this.emisorDeSesion = emisorDeSesion;
        this.revocacion = revocacion;
        this.auditoria = auditoria;
        this.reloj = reloj;
    }

    @Override
    public AltaSegundoFactor iniciar(UsuarioId usuarioId, ContextoDeAccion contexto) {
        Usuario usuario = cargar(usuarioId);

        // Se genera uno nuevo aunque ya tuviera: rehacer el alta es justamente lo que hace alguien
        // que perdió el teléfono, y reutilizar el secreto viejo no le serviría de nada.
        SecretoTotp secreto = generador.generarSecretoTotp();
        usuarios.guardar(usuario.iniciarSegundoFactor(secreto, reloj.ahora()));

        return new AltaSegundoFactor(segundoFactor.uriDeAlta(secreto, usuario.correo()), secreto.valor());
    }

    @Override
    public String confirmar(UsuarioId usuarioId, String codigo, ContextoDeAccion contexto) {
        Usuario usuario = cargar(usuarioId);
        if (usuario.segundoFactor() == null) {
            throw new IllegalStateException("No hay un alta de segundo factor en curso");
        }
        if (!segundoFactor.codigoEsValido(usuario.segundoFactor().secreto(), codigo)) {
            throw new CredencialInvalidaException(
                    "El código no coincide. Revisa que la hora del teléfono esté en automático.");
        }

        Usuario confirmado = usuarios.guardar(usuario.confirmarSegundoFactor(reloj.ahora()));
        auditoria.registrarConAutor(AccionAuditada.SEGUNDO_FACTOR_ACTIVADO, confirmado, confirmado,
                "Segundo factor TOTP activado", contexto);

        return emisorDeSesion.emitir(confirmado, AlcanceSesion.COMPLETO);
    }

    @Override
    public void desactivar(UsuarioId usuarioId, String codigo, ContextoDeAccion contexto) {
        Usuario usuario = cargar(usuarioId);
        if (!usuario.tieneSegundoFactorConfirmado()) {
            throw new IllegalStateException("Esta cuenta no tiene segundo factor activo");
        }
        // Se exige el código para desactivarlo: si bastara con la sesión, un token robado podría
        // quitar de en medio justamente la defensa que impide usarlo.
        if (!segundoFactor.codigoEsValido(usuario.segundoFactor().secreto(), codigo)) {
            throw new CredencialInvalidaException("El código no coincide.");
        }

        Usuario sinSegundoFactor = usuarios.guardar(usuario.desactivarSegundoFactor(reloj.ahora()));
        revocacion.revocarSesionesAnterioresA(sinSegundoFactor.id(), reloj.ahora());
        auditoria.registrarConAutor(AccionAuditada.SEGUNDO_FACTOR_DESACTIVADO, sinSegundoFactor,
                sinSegundoFactor, "Segundo factor TOTP desactivado", contexto);
    }

    private Usuario cargar(UsuarioId usuarioId) {
        return usuarios.buscarPorId(usuarioId)
                .orElseThrow(() -> new IllegalStateException("La sesión ya no corresponde a una cuenta"));
    }
}
