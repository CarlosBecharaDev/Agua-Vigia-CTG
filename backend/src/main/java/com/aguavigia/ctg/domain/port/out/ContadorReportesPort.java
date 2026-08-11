package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.SectorId;

import java.time.Duration;

/** Ventana deslizante de reportes por sector — implementado con Redis (ADR-003). */
public interface ContadorReportesPort {

    void registrar(SectorId sectorId, HuellaDispositivo huella);

    long contarRecientes(SectorId sectorId, Duration ventana);

    /**
     * RF006 — reserva un cupo para este dispositivo en este sector y devuelve si quedaba.
     *
     * **Atómico a propósito.** El cupo se calculaba consultando Mongo y guardando después, con lo
     * que dos peticiones simultáneas del mismo dispositivo leían el mismo conteo y pasaban las dos
     * — y Mongo en instancia única no ofrece transacciones multi-documento con las que cerrarlo.
     * Un INCR de Redis sí es atómico, que es el mismo mecanismo del rate limiting HTTP.
     *
     * La cuenta vive en Redis y no en Mongo, así que un reinicio del contenedor la reinicia. Es una
     * concesión consciente: el peor caso es que un dispositivo recupere su cupo antes de tiempo,
     * mucho menos grave que bloquear a un vecino legítimo o que dejar pasar una ráfaga.
     */
    boolean intentarReservarCupo(SectorId sectorId, HuellaDispositivo huella, int limite, Duration ventana);
}
