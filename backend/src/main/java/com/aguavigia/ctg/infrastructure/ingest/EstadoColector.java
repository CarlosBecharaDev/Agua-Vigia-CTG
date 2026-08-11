package com.aguavigia.ctg.infrastructure.ingest;

import java.time.Instant;

/**
 * RNF007 — lo que el requisito pide exponer por colector: última ejecución exitosa, ítems
 * procesados y tasa de error.
 *
 * `fallosConsecutivos` es lo que decide si el colector se reporta caído: una tasa de error
 * acumulada del 20% puede ser un colector sano que tuvo un mal día hace un mes, mientras que tres
 * ciclos seguidos fallando es un problema ahora.
 */
public record EstadoColector(
        String nombre,
        Instant ultimaEjecucionExitosa,
        Instant ultimoFallo,
        String motivoDelUltimoFallo,
        long itemsProcesados,
        long ciclosExitosos,
        long ciclosFallidos,
        int fallosConsecutivos) {

    static EstadoColector inicial(String nombre) {
        return new EstadoColector(nombre, null, null, null, 0, 0, 0, 0);
    }

    EstadoColector conExito(Instant cuando, int items) {
        return new EstadoColector(nombre, cuando, ultimoFallo, motivoDelUltimoFallo,
                itemsProcesados + items, ciclosExitosos + 1, ciclosFallidos, 0);
    }

    EstadoColector conFallo(Instant cuando, String motivo) {
        return new EstadoColector(nombre, ultimaEjecucionExitosa, cuando, motivo,
                itemsProcesados, ciclosExitosos, ciclosFallidos + 1, fallosConsecutivos + 1);
    }

    /** 0.0 cuando todavía no ha corrido nunca: sin ciclos no hay tasa que reportar. */
    public double tasaDeError() {
        long total = ciclosExitosos + ciclosFallidos;
        return total == 0 ? 0.0 : (double) ciclosFallidos / total;
    }
}
