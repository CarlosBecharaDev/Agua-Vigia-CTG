package com.aguavigia.ctg.domain;

/**
 * La clave era correcta pero la cuenta no está en servicio: sin verificar, sin aprobar, suspendida
 * o rechazada.
 *
 * Aquí sí se explica el motivo, y no contradice a CredencialInvalidaException: solo se llega
 * después de acertar la clave, así que quien lee el mensaje ya demostró ser el dueño de la cuenta.
 */
public class CuentaNoHabilitadaException extends RuntimeException {

    private final EstadoCuenta estado;

    public CuentaNoHabilitadaException(EstadoCuenta estado, String mensaje) {
        super(mensaje);
        this.estado = estado;
    }

    public EstadoCuenta estado() {
        return estado;
    }
}
