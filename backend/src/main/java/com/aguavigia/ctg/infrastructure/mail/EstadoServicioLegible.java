package com.aguavigia.ctg.infrastructure.mail;

import com.aguavigia.ctg.domain.EstadoServicio;

/**
 * Traduce {@link EstadoServicio} a lo que ve un vecino en su correo. El adaptador mandaba el nombre
 * crudo del enum ("SIN_SERVICIO"), que es identificador de código, no español — DESIGN.md §5 pide
 * escribir desde el lado del usuario, en voz activa y concreta.
 *
 * Los colores son los cuatro reservados al estado del servicio (DESIGN.md §2), en su variante para
 * fondo claro: el correo se lee en clientes que no respetan {@code prefers-color-scheme} de forma
 * fiable, así que la insignia se fija en un solo par de valores con contraste AA sobre blanco. La
 * etiqueta en texto viaja siempre junto al color, nunca el color solo.
 */
enum EstadoServicioLegible {

    SIN_SERVICIO("Sin agua",
            "No hay servicio de agua en %s.",
            "#AE3428", "#FBEDEB", "#EBC3BE"),

    PRESION_BAJA("Presión baja",
            "El agua está llegando con poca presión en %s.",
            "#8A5200", "#FDF3E3", "#F0DAB4"),

    CORTE_PROGRAMADO("Corte programado",
            "Hay un corte anunciado para %s. Guarda agua antes de que empiece.",
            "#4B5A5E", "#EEF3F3", "#C9D9D8"),

    CON_SERVICIO("Volvió el agua",
            "El servicio de agua está funcionando otra vez en %s.",
            "#1E6E3C", "#E8F5EC", "#BEDFC9");

    private final String etiqueta;
    private final String plantillaDetalle;
    private final String colorTexto;
    private final String colorFondo;
    private final String colorBorde;

    EstadoServicioLegible(String etiqueta, String plantillaDetalle,
                           String colorTexto, String colorFondo, String colorBorde) {
        this.etiqueta = etiqueta;
        this.plantillaDetalle = plantillaDetalle;
        this.colorTexto = colorTexto;
        this.colorFondo = colorFondo;
        this.colorBorde = colorBorde;
    }

    static EstadoServicioLegible de(EstadoServicio estado) {
        return switch (estado) {
            case SIN_SERVICIO -> SIN_SERVICIO;
            case PRESION_BAJA -> PRESION_BAJA;
            case CORTE_PROGRAMADO -> CORTE_PROGRAMADO;
            case CON_SERVICIO -> CON_SERVICIO;
        };
    }

    String etiqueta() {
        return etiqueta;
    }

    /** Titular del correo. Concreto y con el barrio dentro — nada de "Cambio de estado". */
    String titular(String nombreSector) {
        return switch (this) {
            case SIN_SERVICIO -> "Se fue el agua en " + nombreSector;
            case PRESION_BAJA -> "Baja presión en " + nombreSector;
            case CORTE_PROGRAMADO -> "Cortan el agua en " + nombreSector;
            case CON_SERVICIO -> "Volvió el agua en " + nombreSector;
        };
    }

    String detalle(String nombreSector) {
        return plantillaDetalle.formatted(nombreSector);
    }

    String colorTexto() {
        return colorTexto;
    }

    String colorFondo() {
        return colorFondo;
    }

    String colorBorde() {
        return colorBorde;
    }
}
