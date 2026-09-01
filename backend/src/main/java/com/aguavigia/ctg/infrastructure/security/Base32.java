package com.aguavigia.ctg.infrastructure.security;

import java.nio.charset.StandardCharsets;

/**
 * Base32 de RFC 4648, que es el alfabeto que las apps de autenticación esperan en un `otpauth://`.
 *
 * Se escribe aquí en vez de traer commons-codec por una dependencia de treinta líneas. El proyecto
 * ya pagó el precio contrario en ADR-025, cuando una dependencia externa bloqueó un módulo entero.
 *
 * Sin relleno `=`: Google Authenticator y compatibles lo aceptan igual, y un secreto sin signos
 * raros es más fácil de teclear a mano cuando la cámara no coopera.
 */
final class Base32 {

    private static final String ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int BITS_POR_CARACTER = 5;
    private static final int BITS_POR_BYTE = 8;

    private Base32() {
    }

    static String codificar(byte[] datos) {
        StringBuilder salida = new StringBuilder();
        int acumulador = 0;
        int bitsDisponibles = 0;

        for (byte dato : datos) {
            acumulador = (acumulador << BITS_POR_BYTE) | (dato & 0xFF);
            bitsDisponibles += BITS_POR_BYTE;

            while (bitsDisponibles >= BITS_POR_CARACTER) {
                bitsDisponibles -= BITS_POR_CARACTER;
                salida.append(ALFABETO.charAt((acumulador >>> bitsDisponibles) & 0x1F));
            }
        }

        if (bitsDisponibles > 0) {
            salida.append(ALFABETO.charAt((acumulador << (BITS_POR_CARACTER - bitsDisponibles)) & 0x1F));
        }
        return salida.toString();
    }

    static byte[] decodificar(String texto) {
        String limpio = texto.replace("=", "").replace(" ", "").toUpperCase(java.util.Locale.ROOT);
        byte[] salida = new byte[limpio.length() * BITS_POR_CARACTER / BITS_POR_BYTE];

        int acumulador = 0;
        int bitsDisponibles = 0;
        int escritos = 0;

        for (char caracter : limpio.toCharArray()) {
            int valor = ALFABETO.indexOf(caracter);
            if (valor < 0) {
                throw new IllegalArgumentException("Carácter no válido en Base32: " + caracter);
            }
            acumulador = (acumulador << BITS_POR_CARACTER) | valor;
            bitsDisponibles += BITS_POR_CARACTER;

            if (bitsDisponibles >= BITS_POR_BYTE) {
                bitsDisponibles -= BITS_POR_BYTE;
                salida[escritos++] = (byte) ((acumulador >>> bitsDisponibles) & 0xFF);
            }
        }
        return salida;
    }

    static byte[] bytesUtf8(String texto) {
        return texto.getBytes(StandardCharsets.UTF_8);
    }
}
