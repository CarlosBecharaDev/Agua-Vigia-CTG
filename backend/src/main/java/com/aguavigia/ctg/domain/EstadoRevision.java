package com.aguavigia.ctg.domain;

/**
 * M9 — toda propuesta de la ingesta automatizada nace PENDIENTE y no toca el mapa hasta que un
 * veedor la aprueba. Mismo criterio que {@link EstadoModeracion} para los reportes ciudadanos
 * (`ADR-023`): lo que entra sin revisar no se publica.
 */
public enum EstadoRevision {
    PENDIENTE,
    APROBADA,
    DESCARTADA
}
