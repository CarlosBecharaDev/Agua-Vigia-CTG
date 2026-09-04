package com.aguavigia.ctg.domain;

/**
 * Envuelve el hash, nunca la clave en claro. Existe como tipo propio para que sea imposible pasar
 * por descuido un `String` con la contraseña real donde se espera el hash: el compilador lo impide.
 *
 * `toString` se sobrescribe a propósito — un record vuelca todos sus campos, y este acabaría en
 * cualquier log que imprima un Usuario.
 */
public record ClaveHash(String valor) {

    public ClaveHash {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El hash de la clave no puede estar vacío");
        }
        if (!valor.startsWith("$2")) {
            throw new IllegalArgumentException(
                    "El hash de la clave no tiene formato BCrypt. Nunca se guarda la clave en claro.");
        }
    }

    @Override
    public String toString() {
        return "ClaveHash[oculto]";
    }
}
