package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.SecretoTotp;

/** TOTP (RFC 6238). El cálculo del código y el formato del QR son detalle de infraestructura. */
public interface SegundoFactorPort {

    boolean codigoEsValido(SecretoTotp secreto, String codigo);

    /**
     * URI `otpauth://` que la app de autenticación lee del QR. Se genera en el servidor y no en el
     * frontend para que el secreto no tenga que pasar por más manos de las necesarias.
     */
    String uriDeAlta(SecretoTotp secreto, CorreoElectronico correo);
}
