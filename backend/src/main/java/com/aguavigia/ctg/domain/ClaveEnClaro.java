package com.aguavigia.ctg.domain;

/**
 * La contraseña tal como la escribe la persona, con la política del proyecto aplicada al construir.
 * Existe para que la política se cumpla en un solo sitio: registro, invitación y restablecimiento
 * pasan todos por aquí, así que no puede haber un camino que acepte una clave más débil que otro.
 *
 * Longitud por encima de complejidad (NIST SP 800-63B): exigir símbolos produce `Contraseña1!` una y
 * otra vez. Se pide un mínimo largo y se rechaza lo evidente, sin obligar a jeroglíficos.
 */
public record ClaveEnClaro(String valor) {

    public static final int LONGITUD_MINIMA = 12;
    public static final int LONGITUD_MAXIMA = 128;

    /**
     * BCrypt trunca en 72 bytes: sin este tope, dos claves largas que compartan los primeros 72
     * bytes serían la misma para el sistema. El máximo está por debajo en caracteres, pero un
     * carácter no ASCII ocupa varios bytes, así que se comprueba en bytes.
     */
    private static final int BYTES_MAXIMOS_BCRYPT = 72;

    public ClaveEnClaro {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("La clave no puede estar vacía");
        }
        if (valor.length() < LONGITUD_MINIMA) {
            throw new IllegalArgumentException(
                    "La clave debe tener al menos " + LONGITUD_MINIMA + " caracteres");
        }
        if (valor.length() > LONGITUD_MAXIMA) {
            throw new IllegalArgumentException(
                    "La clave no puede pasar de " + LONGITUD_MAXIMA + " caracteres");
        }
        if (valor.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > BYTES_MAXIMOS_BCRYPT) {
            throw new IllegalArgumentException(
                    "La clave es demasiado larga para cifrarse de forma segura. Usa menos caracteres.");
        }
        if (valor.chars().distinct().count() < 5) {
            throw new IllegalArgumentException("La clave repite demasiado los mismos caracteres");
        }
        if (valor.strip().length() != valor.length()) {
            throw new IllegalArgumentException("La clave no puede empezar ni terminar con espacios");
        }
    }

    @Override
    public String toString() {
        return "ClaveEnClaro[oculta]";
    }
}
