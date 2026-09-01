package com.aguavigia.ctg.domain;

/**
 * Qué puede hacer un token ya emitido. Existe por un caso concreto: el primer ADMIN sembrado no
 * tiene TOTP y el rol se lo exige. Negarle la entrada lo dejaría fuera para siempre; darle una
 * sesión completa haría que "obligatorio" no significara nada. La salida es un token que solo
 * abre el alta del segundo factor.
 */
public enum AlcanceSesion {

    COMPLETO,

    /** Solo CONFIGURAR_SEGUNDO_FACTOR, por mucho que el rol de la cuenta diga otra cosa. */
    ALTA_SEGUNDO_FACTOR
}
