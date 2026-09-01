package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.ClaveHash;

/**
 * El algoritmo concreto (hoy BCrypt) es detalle de infraestructura: el dominio solo necesita poder
 * convertir una clave en hash y comprobar una candidata contra él.
 */
public interface CifradorClavePort {

    ClaveHash cifrar(String claveEnClaro);

    boolean coincide(String claveEnClaro, ClaveHash hash);

    /**
     * Comparación de duración constante contra un hash falso, para gastar el mismo tiempo cuando
     * el correo no existe que cuando existe. Sin esto, medir el tiempo de respuesta del login
     * revela qué direcciones tienen cuenta, y da igual que los dos casos devuelvan el mismo 401.
     */
    void gastarTiempoEquivalente();
}
