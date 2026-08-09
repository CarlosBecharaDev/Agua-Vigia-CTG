package com.aguavigia.ctg.domain;

/** RF010 — el mismo número de reportes alcanza consenso sin importar la población del sector. */
public class UmbralFijoEstrategiaConsenso implements EstrategiaConsenso {

    private final long umbral;

    public UmbralFijoEstrategiaConsenso(long umbral) {
        if (umbral <= 0) {
            throw new IllegalArgumentException("El umbral fijo debe ser mayor que cero");
        }
        this.umbral = umbral;
    }

    @Override
    public boolean seAlcanzaConsenso(long reportesRecientes, Sector sector) {
        return reportesRecientes >= umbral;
    }
}
