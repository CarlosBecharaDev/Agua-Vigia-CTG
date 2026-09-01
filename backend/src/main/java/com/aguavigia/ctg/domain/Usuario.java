package com.aguavigia.ctg.domain;

import java.time.Instant;
import java.util.Set;

/**
 * Cuenta del panel del veedor. Sustituye a la credencial compartida de ADR-016.
 *
 * Todas las transiciones de estado viven aquí y devuelven una copia nueva: si estuvieran en los
 * servicios, cada nuevo caso de uso podría inventarse su propio camino hasta ACTIVA, y "aprobada"
 * dejaría de significar lo mismo en todo el sistema. La regla que sostiene el resto es simple —
 * ninguna cuenta llega a ACTIVA sin clave, y solo ACTIVA autentica.
 */
public record Usuario(
        UsuarioId id,
        CorreoElectronico correo,
        String nombre,
        ClaveHash claveHash,
        EstadoCuenta estado,
        PermisosEfectivos permisos,
        SegundoFactor segundoFactor,
        Instant creadoEn,
        Instant actualizadoEn) {

    public Usuario {
        if (id == null) {
            throw new IllegalArgumentException("El usuario debe tener id");
        }
        if (correo == null) {
            throw new IllegalArgumentException("El usuario debe tener correo");
        }
        if (nombre == null || nombre.isBlank()) {
            throw new IllegalArgumentException("El usuario debe tener nombre");
        }
        if (estado == null) {
            throw new IllegalArgumentException("El usuario debe tener estado");
        }
        if (permisos == null) {
            throw new IllegalArgumentException("El usuario debe tener permisos");
        }
        if (creadoEn == null) {
            throw new IllegalArgumentException("El usuario debe tener fecha de creación");
        }
        if (estado.permiteIniciarSesion() && claveHash == null) {
            throw new IllegalArgumentException("Una cuenta activa no puede estar sin clave");
        }
    }

    /** Auto-registro: nace sin permisos útiles y sin poder entrar hasta verificar y ser aprobada. */
    public static Usuario registrado(UsuarioId id, CorreoElectronico correo, String nombre,
                                     ClaveHash claveHash, Instant momento) {
        if (claveHash == null) {
            throw new IllegalArgumentException("Quien se registra debe fijar una clave");
        }
        return new Usuario(id, correo, nombre, claveHash, EstadoCuenta.PENDIENTE_VERIFICACION,
                PermisosEfectivos.deRol(RolVeedor.OBSERVADOR), null, momento, momento);
    }

    /**
     * Alta por invitación: el rol ya viene decidido por quien invita, y el correo se da por probado
     * — la invitación llegó a esa dirección. Falta solo que la persona fije su clave.
     */
    public static Usuario invitado(UsuarioId id, CorreoElectronico correo, String nombre,
                                   RolVeedor rol, Instant momento) {
        return new Usuario(id, correo, nombre, null, EstadoCuenta.INVITADA,
                PermisosEfectivos.deRol(rol), null, momento, momento);
    }

    public Usuario verificarCorreo(Instant momento) {
        if (estado != EstadoCuenta.PENDIENTE_VERIFICACION) {
            throw new IllegalStateException("Esta cuenta no está esperando verificación de correo");
        }
        return copiaCon(claveHash, EstadoCuenta.PENDIENTE_APROBACION, permisos, segundoFactor, momento);
    }

    public Usuario aceptarInvitacion(ClaveHash nuevaClave, Instant momento) {
        if (estado != EstadoCuenta.INVITADA) {
            throw new IllegalStateException("Esta cuenta no tiene una invitación pendiente");
        }
        if (nuevaClave == null) {
            throw new IllegalArgumentException("Aceptar la invitación exige fijar una clave");
        }
        return copiaCon(nuevaClave, EstadoCuenta.ACTIVA, permisos, segundoFactor, momento);
    }

    public Usuario aprobar(PermisosEfectivos permisosAsignados, Instant momento) {
        if (estado != EstadoCuenta.PENDIENTE_APROBACION) {
            throw new IllegalStateException(
                    "Solo se aprueba una cuenta que ya verificó su correo y espera aprobación");
        }
        if (permisosAsignados == null) {
            throw new IllegalArgumentException("Aprobar exige decir con qué permisos");
        }
        return copiaCon(claveHash, EstadoCuenta.ACTIVA, permisosAsignados, segundoFactor, momento);
    }

    public Usuario rechazar(Instant momento) {
        if (estado == EstadoCuenta.ACTIVA || estado == EstadoCuenta.SUSPENDIDA) {
            throw new IllegalStateException("Una cuenta que ya entró en servicio se suspende, no se rechaza");
        }
        if (estado == EstadoCuenta.RECHAZADA) {
            throw new IllegalStateException("Esta cuenta ya estaba rechazada");
        }
        return copiaCon(claveHash, EstadoCuenta.RECHAZADA, permisos, segundoFactor, momento);
    }

    public Usuario suspender(Instant momento) {
        if (estado != EstadoCuenta.ACTIVA) {
            throw new IllegalStateException("Solo se suspende una cuenta activa");
        }
        return copiaCon(claveHash, EstadoCuenta.SUSPENDIDA, permisos, segundoFactor, momento);
    }

    public Usuario reactivar(Instant momento) {
        if (estado != EstadoCuenta.SUSPENDIDA) {
            throw new IllegalStateException("Solo se reactiva una cuenta suspendida");
        }
        return copiaCon(claveHash, EstadoCuenta.ACTIVA, permisos, segundoFactor, momento);
    }

    public Usuario cambiarPermisos(PermisosEfectivos nuevos, Instant momento) {
        if (nuevos == null) {
            throw new IllegalArgumentException("Los permisos nuevos no pueden ser nulos");
        }
        if (estado == EstadoCuenta.RECHAZADA) {
            throw new IllegalStateException("Una cuenta rechazada no tiene permisos que cambiar");
        }
        return copiaCon(claveHash, estado, nuevos, segundoFactor, momento);
    }

    public Usuario cambiarClave(ClaveHash nueva, Instant momento) {
        if (nueva == null) {
            throw new IllegalArgumentException("La clave nueva no puede ser nula");
        }
        if (estado == EstadoCuenta.RECHAZADA) {
            throw new IllegalStateException("Una cuenta rechazada no puede cambiar su clave");
        }
        return copiaCon(nueva, estado, permisos, segundoFactor, momento);
    }

    /** Genera el secreto, pero no exige nada todavía: ver el javadoc de SegundoFactor. */
    public Usuario iniciarSegundoFactor(SecretoTotp secreto, Instant momento) {
        return copiaCon(claveHash, estado, permisos, SegundoFactor.sinConfirmar(secreto), momento);
    }

    public Usuario confirmarSegundoFactor(Instant momento) {
        if (segundoFactor == null) {
            throw new IllegalStateException("No hay un alta de segundo factor en curso");
        }
        return copiaCon(claveHash, estado, permisos, segundoFactor.confirmar(momento), momento);
    }

    public Usuario desactivarSegundoFactor(Instant momento) {
        if (permisos.rol().exigeSegundoFactor()) {
            throw new IllegalStateException(
                    "El rol " + permisos.rol() + " exige segundo factor: no se puede desactivar");
        }
        return copiaCon(claveHash, estado, permisos, null, momento);
    }

    public boolean tieneSegundoFactorConfirmado() {
        return segundoFactor != null && segundoFactor.estaConfirmado();
    }

    /** Un ADMIN sin TOTP confirmado tiene que darlo de alta antes de poder hacer nada más. */
    public boolean debeCompletarAltaDeSegundoFactor() {
        return permisos.rol().exigeSegundoFactor() && !tieneSegundoFactorConfirmado();
    }

    public Set<Permiso> permisosEfectivos() {
        return permisos.resolver();
    }

    private Usuario copiaCon(ClaveHash nuevaClave, EstadoCuenta nuevoEstado, PermisosEfectivos nuevosPermisos,
                             SegundoFactor nuevoSegundoFactor, Instant momento) {
        if (momento == null) {
            throw new IllegalArgumentException("Todo cambio en la cuenta necesita un instante");
        }
        return new Usuario(id, correo, nombre, nuevaClave, nuevoEstado, nuevosPermisos,
                nuevoSegundoFactor, creadoEn, momento);
    }
}
