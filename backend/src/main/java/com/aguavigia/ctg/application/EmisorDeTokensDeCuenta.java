package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.TipoTokenCuenta;
import com.aguavigia.ctg.domain.TokenCuenta;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.out.GeneradorSecretosPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.TokenCuentaRepository;
import com.aguavigia.ctg.domain.port.out.UsuarioRepository;
import org.springframework.stereotype.Component;

/**
 * Emite y consume los enlaces de un solo uso. Los tres flujos que los usan —verificar correo,
 * aceptar invitación, restablecer clave— tienen exactamente el mismo ciclo, y tenerlo escrito una
 * vez evita la variante silenciosa: el sitio donde alguien olvidó marcar el token como usado.
 *
 * En la base de datos vive solo el hash. Quien consiga leer la colección de tokens no puede
 * fabricar el enlace, igual que no puede fabricar una contraseña con la tabla de usuarios.
 */
@Component
public class EmisorDeTokensDeCuenta {

    private final TokenCuentaRepository tokens;
    private final UsuarioRepository usuarios;
    private final GeneradorSecretosPort generador;
    private final RelojPort reloj;

    public EmisorDeTokensDeCuenta(TokenCuentaRepository tokens,
                                  UsuarioRepository usuarios,
                                  GeneradorSecretosPort generador,
                                  RelojPort reloj) {
        this.tokens = tokens;
        this.usuarios = usuarios;
        this.generador = generador;
        this.reloj = reloj;
    }

    /** Devuelve el valor en claro, que solo debe salir de aquí hacia el cuerpo de un correo. */
    public String emitir(UsuarioId usuarioId, TipoTokenCuenta tipo) {
        tokens.invalidarVigentes(usuarioId, tipo);

        String enClaro = generador.generarTokenDeEnlace();
        tokens.guardar(TokenCuenta.nuevo(
                generador.hashDeTokenDeEnlace(enClaro), tipo, usuarioId, reloj.ahora()));
        return enClaro;
    }

    /**
     * Valida, marca el token como usado y devuelve al dueño. Marcar antes de que el llamador
     * actúe es intencional: si el caso de uso falla después, el enlace ya se quemó y hay que pedir
     * otro. Es molesto y es lo correcto — la alternativa deja un enlace reutilizable tras un error.
     */
    public Usuario consumir(String tokenEnClaro, TipoTokenCuenta tipoEsperado) {
        if (tokenEnClaro == null || tokenEnClaro.isBlank()) {
            throw new IllegalArgumentException("Falta el enlace de confirmación");
        }

        TokenCuenta token = tokens.buscarPorHash(generador.hashDeTokenDeEnlace(tokenEnClaro))
                .filter(candidato -> candidato.tipo() == tipoEsperado)
                .orElseThrow(() -> new IllegalArgumentException("El enlace no es válido"));

        if (!token.estaVigente(reloj.ahora())) {
            throw new IllegalArgumentException("El enlace venció o ya se había usado. Pide uno nuevo.");
        }

        Usuario usuario = usuarios.buscarPorId(token.usuarioId())
                .orElseThrow(() -> new IllegalArgumentException("El enlace no es válido"));

        tokens.guardar(token.marcarUsado(reloj.ahora()));
        return usuario;
    }
}
