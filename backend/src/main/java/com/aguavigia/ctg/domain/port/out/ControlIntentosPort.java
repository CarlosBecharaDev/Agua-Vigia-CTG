package com.aguavigia.ctg.domain.port.out;

import java.time.Duration;
import java.util.Optional;

/**
 * Bloqueo por cuenta tras varios fallos seguidos. Complementa al límite por IP de ADR-018, que no
 * ve el ataque repartido entre muchas direcciones contra un mismo correo.
 *
 * La clave es el correo y no el id de usuario a propósito: un correo que no existe también tiene
 * que contar intentos, o el propio bloqueo delataría qué cuentas son reales.
 */
public interface ControlIntentosPort {

    void registrarFallo(String correoNormalizado, Duration ventana, int maximoIntentos, Duration bloqueo);

    /** Vacío si la cuenta no está bloqueada; si lo está, cuánto falta para que se libere. */
    Optional<Duration> bloqueoVigente(String correoNormalizado);

    void limpiarIntentos(String correoNormalizado);

    /**
     * Falso si ese mismo valor ya se consumió dentro de la ventana. Existe por el reenvío de un
     * código TOTP: un código vale unos segundos, y sin esta guarda vale esos segundos para
     * cualquiera que lo haya visto pasar, no solo para su dueño.
     */
    boolean consumirPorPrimeraVez(String clave, Duration ventana);
}
