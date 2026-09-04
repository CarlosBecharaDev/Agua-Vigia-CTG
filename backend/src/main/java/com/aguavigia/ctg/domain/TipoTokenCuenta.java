package com.aguavigia.ctg.domain;

import java.time.Duration;

/**
 * Cada tipo lleva su propia vigencia porque el riesgo no es el mismo: un enlace para fijar clave
 * en manos ajenas entrega una cuenta, mientras que uno de verificación solo confirma un correo.
 */
public enum TipoTokenCuenta {

    VERIFICACION_CORREO(Duration.ofHours(48)),

    INVITACION(Duration.ofDays(7)),

    RESTABLECER_CLAVE(Duration.ofMinutes(30));

    private final Duration vigencia;

    TipoTokenCuenta(Duration vigencia) {
        this.vigencia = vigencia;
    }

    public Duration vigencia() {
        return vigencia;
    }
}
