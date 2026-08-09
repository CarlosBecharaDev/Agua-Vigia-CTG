package com.aguavigia.ctg.domain;

/** RF013 — nadie recibe alertas sin pasar por CONFIRMADA; el doble opt-in es la puerta, no un adorno. */
public enum EstadoSuscripcion {
    PENDIENTE_CONFIRMACION,
    CONFIRMADA,
    CANCELADA
}
