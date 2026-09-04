package com.aguavigia.ctg.domain;

/**
 * Clave correcta, pero la cuenta tiene TOTP confirmado y no llegó código. No es un fallo: es la
 * mitad del camino, y la respuesta lo dice con un `type` propio para que el frontend sepa que
 * debe pedir el código en vez de acusar de clave incorrecta.
 */
public class SegundoFactorRequeridoException extends RuntimeException {

    public SegundoFactorRequeridoException(String mensaje) {
        super(mensaje);
    }
}
