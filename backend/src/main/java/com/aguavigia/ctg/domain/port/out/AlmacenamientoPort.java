package com.aguavigia.ctg.domain.port.out;

public interface AlmacenamientoPort {
    String guardar(String nombreArchivo, byte[] contenido);
}
