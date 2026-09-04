package com.aguavigia.ctg.domain;

import java.util.Set;

/**
 * Un rol es un paquete de permisos con nombre, no una categoría aparte: el sistema autoriza
 * siempre por Permiso (ver esa clase). Sobre este paquete, el admin puede conceder o revocar
 * permisos sueltos por persona — la resolución vive en PermisosEfectivos.
 */
public enum RolVeedor {

    /** Solo lectura del panel. Sirve para que alguien acompañe la moderación sin poder ejecutarla. */
    OBSERVADOR(Set.of(
            Permiso.VER_PANEL,
            Permiso.CONFIGURAR_SEGUNDO_FACTOR)),

    /** El trabajo diario de veeduría: moderar, registrar y cerrar cortes, revisar la ingesta. */
    VEEDOR(Set.of(
            Permiso.VER_PANEL,
            Permiso.MODERAR_REPORTES,
            Permiso.GESTIONAR_CORTES,
            Permiso.REVISAR_INGESTA,
            Permiso.CONFIGURAR_SEGUNDO_FACTOR)),

    /** Todo lo anterior más la gestión de cuentas y la auditoría. Exige segundo factor. */
    ADMIN(Set.of(Permiso.values()));

    private final Set<Permiso> permisosBase;

    RolVeedor(Set<Permiso> permisosBase) {
        this.permisosBase = Set.copyOf(permisosBase);
    }

    public Set<Permiso> permisosBase() {
        return permisosBase;
    }

    /**
     * RNF011 y la decisión de esta ADR: la cuenta que puede crear y despromover cuentas es la que
     * más daño hace si se la roban, así que el segundo factor no es opcional para ella.
     */
    public boolean exigeSegundoFactor() {
        return this == ADMIN;
    }
}
