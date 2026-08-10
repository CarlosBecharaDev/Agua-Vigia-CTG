package com.aguavigia.ctg.domain.port.out;

import java.time.Duration;
import java.util.Set;

public interface AlmacenamientoPort {

    /** {@code extension} incluye el punto (p. ej. ".jpg"), ya validada por el llamador. */
    String guardar(String extension, byte[] contenido);

    /**
     * Nombres de archivo (no URLs) con antiguedad mayor o igual a la indicada — usado por
     * LimpiezaFotosHuerfanasJob para no considerar candidato un archivo cuyo reporte asociado
     * todavia esta en vuelo de guardarse.
     */
    Set<String> listarNombresConAntiguedadMinima(Duration antiguedadMinima);

    /** Idempotente: si el archivo ya no existe, no falla. */
    void eliminar(String nombre);
}
