package com.aguavigia.ctg.domain;

/**
 * DESIGN.md §2 — los cuatro colores reservados al estado del servicio. No agregar un quinto
 * valor sin actualizar también la paleta visual.
 */
public enum EstadoServicio {
    CON_SERVICIO,
    SIN_SERVICIO,
    PRESION_BAJA,
    CORTE_PROGRAMADO
}
