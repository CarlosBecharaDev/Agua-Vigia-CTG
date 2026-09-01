package com.aguavigia.ctg.domain;

import java.time.Instant;

/**
 * Enlace de un solo uso para verificar un correo, aceptar una invitación o restablecer una clave.
 *
 * Solo se guarda el hash del valor que viaja en el correo, igual que con una contraseña: quien
 * lea la base de datos no debe poder fabricar el enlace. Y `usadoEn` lo convierte en single-use —
 * sin eso, un enlace de restablecimiento reenviado o cacheado sigue sirviendo hasta que caduque.
 */
public record TokenCuenta(
        String hash,
        TipoTokenCuenta tipo,
        UsuarioId usuarioId,
        Instant creadoEn,
        Instant usadoEn) {

    public TokenCuenta {
        if (hash == null || hash.isBlank()) {
            throw new IllegalArgumentException("El token debe tener un hash");
        }
        if (tipo == null) {
            throw new IllegalArgumentException("El token debe tener un tipo");
        }
        if (usuarioId == null) {
            throw new IllegalArgumentException("El token debe pertenecer a un usuario");
        }
        if (creadoEn == null) {
            throw new IllegalArgumentException("El token debe tener fecha de creación");
        }
    }

    public static TokenCuenta nuevo(String hash, TipoTokenCuenta tipo, UsuarioId usuarioId, Instant creadoEn) {
        return new TokenCuenta(hash, tipo, usuarioId, creadoEn, null);
    }

    public Instant venceEn() {
        return creadoEn.plus(tipo.vigencia());
    }

    public boolean estaVigente(Instant ahora) {
        return usadoEn == null && ahora.isBefore(venceEn());
    }

    public TokenCuenta marcarUsado(Instant momento) {
        if (usadoEn != null) {
            throw new IllegalStateException("Este enlace ya se usó");
        }
        return new TokenCuenta(hash, tipo, usuarioId, creadoEn, momento);
    }
}
