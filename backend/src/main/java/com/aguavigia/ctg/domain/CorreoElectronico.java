package com.aguavigia.ctg.domain;

import java.util.regex.Pattern;

/**
 * Validación deliberadamente simple (forma general `algo@algo.algo`), no RFC 5322 completa: el
 * doble opt-in (RF013) es el filtro real de que la dirección exista — esta clase solo evita
 * gastar un correo de confirmación en algo que no tiene forma de dirección.
 */
public record CorreoElectronico(String valor) {

    private static final Pattern FORMATO = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    public CorreoElectronico {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El correo no puede estar vacío");
        }
        if (!FORMATO.matcher(valor).matches()) {
            throw new IllegalArgumentException("El correo '" + valor + "' no tiene un formato válido");
        }
    }

    /**
     * Minúsculas y sin espacios alrededor. La identidad de acceso de una cuenta es el correo, y
     * sin esto `Ana@x.com` y `ana@x.com` serían dos cuentas distintas para el sistema y la misma
     * para el servidor de correo — dos personas creyendo tener la misma cuenta.
     */
    public CorreoElectronico normalizado() {
        return new CorreoElectronico(valor.strip().toLowerCase(java.util.Locale.ROOT));
    }
}
