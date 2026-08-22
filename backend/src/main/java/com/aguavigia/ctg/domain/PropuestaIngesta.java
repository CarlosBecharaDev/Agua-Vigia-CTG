package com.aguavigia.ctg.domain;

import java.time.Instant;

/**
 * M9 — lo que la ingesta automatizada *propone* para un sector, no lo que publica.
 *
 * Antes el pipeline llamaba directo a `SectorRepository.guardar()`, y con eso una expresión regular
 * sobre una nota de prensa cambiaba el estado público de un barrio, mandaba correo a sus
 * suscriptores y movía el mapa. Ahora deja una propuesta PENDIENTE y el mapa no se entera hasta que
 * un veedor la aprueba (`RevisarPropuestaIngestaUseCase`), que es lo que el propio Javadoc de
 * `HeuristicaExtractor` ya prometía con su confianza de 0.6.
 *
 * `citaTextual` y `confianza` existen para que esa decisión sea informada: el veedor ve de dónde
 * salió la afirmación antes de publicarla. Es la misma exigencia de `ADR-006` (cita verificable en
 * toda extracción), que no se cayó con el descarte de la IA en `ADR-025`.
 */
public record PropuestaIngesta(
        PropuestaId id,
        SectorId sectorId,
        EstadoServicio estadoPropuesto,
        String fuente,
        String urlOriginal,
        String citaTextual,
        double confianza,
        Instant detectadaEn,
        EstadoRevision estadoRevision) {

    public PropuestaIngesta {
        if (sectorId == null) {
            throw new IllegalArgumentException("La propuesta debe apuntar a un sector");
        }
        if (estadoPropuesto == null) {
            throw new IllegalArgumentException("La propuesta debe declarar el estado que propone");
        }
        if (fuente == null || fuente.isBlank()) {
            throw new IllegalArgumentException("La propuesta debe declarar su fuente");
        }
        if (confianza < 0 || confianza > 1) {
            throw new IllegalArgumentException("La confianza debe estar entre 0 y 1: " + confianza);
        }
        if (detectadaEn == null) {
            throw new IllegalArgumentException("La propuesta debe tener fecha de detección");
        }
        if (estadoRevision == null) {
            throw new IllegalArgumentException("La propuesta debe tener un estado de revisión");
        }
    }

    /** Una propuesta recién detectada siempre nace PENDIENTE: nada entra al mapa sin revisar. */
    public PropuestaIngesta(PropuestaId id, SectorId sectorId, EstadoServicio estadoPropuesto,
                             String fuente, String urlOriginal, String citaTextual,
                             double confianza, Instant detectadaEn) {
        this(id, sectorId, estadoPropuesto, fuente, urlOriginal, citaTextual, confianza, detectadaEn,
                EstadoRevision.PENDIENTE);
    }

    /** Idempotente, igual que {@link ReporteCiudadano#aprobar()}. */
    public PropuestaIngesta aprobar() {
        return conRevision(EstadoRevision.APROBADA);
    }

    public PropuestaIngesta descartar() {
        return conRevision(EstadoRevision.DESCARTADA);
    }

    private PropuestaIngesta conRevision(EstadoRevision nueva) {
        return new PropuestaIngesta(id, sectorId, estadoPropuesto, fuente, urlOriginal, citaTextual,
                confianza, detectadaEn, nueva);
    }
}
