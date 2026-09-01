package com.aguavigia.ctg.domain;

import java.util.EnumSet;
import java.util.Set;

/**
 * Resuelve "rol + ajustes por persona" en una sola respuesta: permisos del rol, más los concedidos
 * a mano, menos los revocados a mano.
 *
 * Que un permiso esté en ambas listas no se arregla eligiendo un ganador en silencio — se rechaza:
 * una configuración así siempre es un error de quien la escribió, y adivinar la intención es cómo
 * se acaba dando acceso que nadie recuerda haber dado.
 */
public record PermisosEfectivos(RolVeedor rol, Set<Permiso> concedidos, Set<Permiso> revocados) {

    public PermisosEfectivos {
        if (rol == null) {
            throw new IllegalArgumentException("Los permisos deben partir de un rol");
        }
        concedidos = concedidos == null ? Set.of() : Set.copyOf(concedidos);
        revocados = revocados == null ? Set.of() : Set.copyOf(revocados);

        Set<Permiso> enConflicto = EnumSet.noneOf(Permiso.class);
        enConflicto.addAll(concedidos);
        enConflicto.retainAll(revocados);
        if (!enConflicto.isEmpty()) {
            throw new IllegalArgumentException(
                    "Un permiso no puede estar concedido y revocado a la vez: " + enConflicto);
        }

        // Sin esta guarda, revocar CONFIGURAR_SEGUNDO_FACTOR a un ADMIN lo deja fuera para siempre:
        // no puede entrar porque le falta el TOTP, y no puede darlo de alta porque le falta este
        // permiso. Es la única puerta que el propio modelo no permite cerrar.
        if (revocados.contains(Permiso.CONFIGURAR_SEGUNDO_FACTOR)) {
            throw new IllegalArgumentException(
                    "No se puede revocar CONFIGURAR_SEGUNDO_FACTOR: dejaría la cuenta sin forma de entrar");
        }
    }

    public static PermisosEfectivos deRol(RolVeedor rol) {
        return new PermisosEfectivos(rol, Set.of(), Set.of());
    }

    public Set<Permiso> resolver() {
        Set<Permiso> efectivos = EnumSet.noneOf(Permiso.class);
        efectivos.addAll(rol.permisosBase());
        efectivos.addAll(concedidos);
        efectivos.removeAll(revocados);
        return Set.copyOf(efectivos);
    }

    public boolean incluye(Permiso permiso) {
        return resolver().contains(permiso);
    }
}
