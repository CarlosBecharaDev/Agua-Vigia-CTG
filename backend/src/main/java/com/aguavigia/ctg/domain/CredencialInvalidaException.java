package com.aguavigia.ctg.domain;

/**
 * Correo inexistente, clave incorrecta o código de segundo factor equivocado: los tres casos usan
 * esta misma excepción y el mismo mensaje a propósito. Distinguirlos en la respuesta convertiría
 * el login en un oráculo para averiguar qué correos tienen cuenta.
 */
public class CredencialInvalidaException extends RuntimeException {

    public CredencialInvalidaException(String mensaje) {
        super(mensaje);
    }
}
