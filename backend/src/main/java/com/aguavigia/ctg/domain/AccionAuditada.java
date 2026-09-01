package com.aguavigia.ctg.domain;

/**
 * ADR-016 se reprochó a sí misma no poder decir qué persona hizo qué. Estas son las acciones que
 * cambian quién puede entrar o qué puede hacer: todas quedan registradas con autor, sujeto e instante.
 */
public enum AccionAuditada {

    CUENTA_REGISTRADA,
    CORREO_VERIFICADO,
    CUENTA_INVITADA,
    INVITACION_ACEPTADA,
    CUENTA_APROBADA,
    CUENTA_RECHAZADA,
    CUENTA_SUSPENDIDA,
    CUENTA_REACTIVADA,
    PERMISOS_CAMBIADOS,
    CLAVE_RESTABLECIDA,
    SEGUNDO_FACTOR_ACTIVADO,
    SEGUNDO_FACTOR_DESACTIVADO,
    SESION_INICIADA,
    SESION_RECHAZADA
}
