package com.aguavigia.ctg.domain;

/**
 * RF010 — patrón Strategy: al menos dos formas intercambiables de decidir si suficientes reportes
 * independientes justifican cambiar el estado de un sector. La estrategia activa se elige en
 * infrastructure/config/ConsensoConfig, no aquí — domain/ no sabe de configuración.
 */
public interface EstrategiaConsenso {

    boolean seAlcanzaConsenso(long reportesRecientes, Sector sector);
}
