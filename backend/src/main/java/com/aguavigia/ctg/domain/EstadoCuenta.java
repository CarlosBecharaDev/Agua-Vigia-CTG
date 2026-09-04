package com.aguavigia.ctg.domain;

/**
 * El registro es abierto, pero registrarse no concede nada: una cuenta recién creada atraviesa
 * verificación de correo y aprobación humana antes de poder autenticarse. Solo ACTIVA emite token.
 */
public enum EstadoCuenta {

    /** Se registró sola y todavía no ha probado que el correo es suyo. */
    PENDIENTE_VERIFICACION,

    /** Correo verificado; espera a que un ADMIN la apruebe y le asigne rol. */
    PENDIENTE_APROBACION,

    /** La creó un ADMIN por invitación; espera a que la persona fije su clave desde el enlace. */
    INVITADA,

    /** Puede iniciar sesión y ejercer sus permisos. */
    ACTIVA,

    /** Un ADMIN le quitó el acceso. Reversible, y revoca las sesiones vivas al instante. */
    SUSPENDIDA,

    /** Un ADMIN denegó el alta. Terminal: no se reactiva, se crea una cuenta nueva si hiciera falta. */
    RECHAZADA;

    public boolean permiteIniciarSesion() {
        return this == ACTIVA;
    }
}
