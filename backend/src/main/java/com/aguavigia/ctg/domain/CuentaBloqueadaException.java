package com.aguavigia.ctg.domain;

import java.time.Duration;

/**
 * Demasiados intentos fallidos seguidos contra la misma cuenta. Va aparte del límite por IP
 * (ADR-018): aquel frena a una máquina, este frena el ataque distribuido contra una cuenta
 * concreta, que es el que las botnets hacen barato.
 */
public class CuentaBloqueadaException extends RuntimeException {

    private final Duration esperaRestante;

    public CuentaBloqueadaException(Duration esperaRestante, String mensaje) {
        super(mensaje);
        this.esperaRestante = esperaRestante;
    }

    public Duration esperaRestante() {
        return esperaRestante;
    }
}
