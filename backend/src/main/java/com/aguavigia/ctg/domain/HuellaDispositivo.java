package com.aguavigia.ctg.domain;

/**
 * Identificador anónimo del aparato que reporta (ADR-007). No es una cuenta ni un dato personal:
 * es lo único que permite RF006 (límite de reportes por dispositivo) sin pedir registro.
 *
 * Distingue dos clases de aparato porque no son el mismo actor. Un celular anónimo puede ser un
 * vecino o alguien inflando el conteo, y por eso RF006 le pone un cupo estrecho. Un sensor de
 * presión se autentica con `X-IoT-Key` (M13) y reporta cada pocos minutos por diseño: con el cupo
 * ciudadano se autobloqueaba al cuarto envío y el endpoint le devolvía 429.
 */
public record HuellaDispositivo(String hash) {

    /** Prefijo reservado a M13. Un cliente que lo falsifique solo consigue el cupo de sensor, y para
     * llegar a `/api/iot/presion` necesita además la clave compartida. */
    private static final String PREFIJO_SENSOR = "IoT-";

    public HuellaDispositivo {
        if (hash == null || hash.isBlank()) {
            throw new IllegalArgumentException("La huella de dispositivo no puede estar vacía");
        }
    }

    /** M13 — huella de un sensor de presión, derivada de su identificador. */
    public static HuellaDispositivo deSensor(String sensorId) {
        if (sensorId == null || sensorId.isBlank()) {
            throw new IllegalArgumentException("El sensor debe declarar su identificador");
        }
        return new HuellaDispositivo(PREFIJO_SENSOR + sensorId.trim());
    }

    public boolean esDeSensor() {
        return hash.startsWith(PREFIJO_SENSOR);
    }
}
