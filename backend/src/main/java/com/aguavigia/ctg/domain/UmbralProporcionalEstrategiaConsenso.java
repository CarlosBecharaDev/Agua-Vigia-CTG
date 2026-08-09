package com.aguavigia.ctg.domain;

/**
 * RF010 — el umbral crece con la población del sector (un barrio de 12.000 habitantes necesita
 * más reportes que uno de 500 para justificar la misma confianza), con un piso fijo para que un
 * sector muy pequeño —o sin dato censal, 27 de 213 no lo tienen— no quede con un umbral de 0 o 1.
 */
public class UmbralProporcionalEstrategiaConsenso implements EstrategiaConsenso {

    private final double factorPoblacion;
    private final long umbralMinimo;

    public UmbralProporcionalEstrategiaConsenso(double factorPoblacion, long umbralMinimo) {
        if (factorPoblacion <= 0) {
            throw new IllegalArgumentException("El factor de población debe ser mayor que cero");
        }
        if (umbralMinimo <= 0) {
            throw new IllegalArgumentException("El umbral mínimo debe ser mayor que cero");
        }
        this.factorPoblacion = factorPoblacion;
        this.umbralMinimo = umbralMinimo;
    }

    @Override
    public boolean seAlcanzaConsenso(long reportesRecientes, Sector sector) {
        long umbral = sector.poblacion() != null
                ? Math.max(umbralMinimo, (long) Math.ceil(sector.poblacion() * factorPoblacion))
                : umbralMinimo;
        return reportesRecientes >= umbral;
    }
}
