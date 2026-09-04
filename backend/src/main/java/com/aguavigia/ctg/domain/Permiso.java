package com.aguavigia.ctg.domain;

/**
 * La unidad que de verdad protege cada endpoint del panel. Los roles existen para que un admin
 * no tenga que razonar permiso por permiso, pero la autorización se comprueba siempre contra un
 * Permiso concreto: así, añadir un rol nuevo no obliga a repasar cada `@PreAuthorize` del proyecto.
 */
public enum Permiso {

    /** Leer las colas del panel: moderación, cortes, propuestas de ingesta, salud de colectores. */
    VER_PANEL,

    /** RF018 — aprobar o descartar reportes ciudadanos. */
    MODERAR_REPORTES,

    /** RF016-RF017 — registrar cortes oficiales y cerrarlos con su hora real. */
    GESTIONAR_CORTES,

    /** ADR-028 — aprobar o descartar lo que la heurística de ingesta propone. */
    REVISAR_INGESTA,

    /** Aprobar altas, asignar roles, suspender y reactivar cuentas. */
    GESTIONAR_USUARIOS,

    /** Leer la bitácora de auditoría de acciones administrativas. */
    VER_AUDITORIA,

    /**
     * Dar de alta o rehacer el propio segundo factor. Lo tienen todos los roles: es la única
     * acción que una sesión con alcance restringido (ADMIN sin TOTP todavía) puede ejecutar.
     */
    CONFIGURAR_SEGUNDO_FACTOR
}
