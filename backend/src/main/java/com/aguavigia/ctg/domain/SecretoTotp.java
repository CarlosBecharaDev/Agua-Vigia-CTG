package com.aguavigia.ctg.domain;

/**
 * Secreto compartido del segundo factor, en Base32 (lo que esperan Google Authenticator, Aegis y
 * demás). Mismo criterio que ClaveHash: tipo propio y `toString` mudo, porque quien tenga este
 * valor puede generar códigos válidos indefinidamente.
 */
public record SecretoTotp(String valor) {

    private static final int LONGITUD_MINIMA = 16;

    public SecretoTotp {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El secreto TOTP no puede estar vacío");
        }
        if (valor.length() < LONGITUD_MINIMA) {
            throw new IllegalArgumentException(
                    "El secreto TOTP debe tener al menos " + LONGITUD_MINIMA + " caracteres Base32");
        }
        if (!valor.chars().allMatch(c -> (c >= 'A' && c <= 'Z') || (c >= '2' && c <= '7'))) {
            throw new IllegalArgumentException("El secreto TOTP debe estar en Base32 (A-Z, 2-7)");
        }
    }

    @Override
    public String toString() {
        return "SecretoTotp[oculto]";
    }
}
