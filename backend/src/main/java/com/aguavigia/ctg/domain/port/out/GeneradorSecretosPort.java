package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.SecretoTotp;

/**
 * Aleatoriedad criptográfica. Es un puerto y no un `Math.random()` incrustado porque el dominio no
 * puede depender de `java.security` para poder probarse con valores fijos — y sobre todo porque
 * así el generador débil no puede colarse por descuido en una clase de negocio.
 */
public interface GeneradorSecretosPort {

    /** Valor en claro que viaja en el correo; de él se guarda solo el hash. */
    String generarTokenDeEnlace();

    /** Hash del token de enlace. SHA-256 basta: el valor ya es aleatorio de 256 bits. */
    String hashDeTokenDeEnlace(String tokenEnClaro);

    SecretoTotp generarSecretoTotp();
}
