package com.aguavigia.ctg.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * RF026 — única vía de creación de negocio para `EventoBitacora`, con un método por caso de
 * evento en vez de un constructor genérico. `EventoBitacoraMongoAdapter.aDominio()` es la
 * excepción documentada: rehidrata un evento que ya existió, no crea uno nuevo, así que sigue
 * usando el constructor del record directamente (ver Javadoc de `EventoBitacora`).
 */
public final class EventoBitacoraFactory {

    private EventoBitacoraFactory() {
    }

    public static EventoBitacora corteAnunciado(CorteAgua corte, SectorId sectorId, Instant ahora) {
        return new EventoBitacora(
                new EventoId(UUID.randomUUID().toString()),
                TipoEvento.CORTE_ANUNCIADO,
                sectorId,
                corte.id(),
                ahora,
                "Corte oficial anunciado en '%s': %s".formatted(sectorId.valor(), corte.causa()));
    }

    public static EventoBitacora corteRestablecido(CorteAgua corte, SectorId sectorId, Instant ahora) {
        return new EventoBitacora(
                new EventoId(UUID.randomUUID().toString()),
                TipoEvento.CORTE_RESTABLECIDO,
                sectorId,
                corte.id(),
                ahora,
                "Corte restablecido en '%s'".formatted(sectorId.valor()));
    }

    public static EventoBitacora consensoConfirmado(SectorId sectorId, EstadoServicio nuevoEstado,
                                                      int cantidadReportes, Instant ahora) {
        return new EventoBitacora(
                new EventoId(UUID.randomUUID().toString()),
                TipoEvento.CORTE_CONFIRMADO_POR_CIUDADANOS,
                sectorId,
                null,
                ahora,
                "%d reportes ciudadanos independientes confirmaron %s en '%s'"
                        .formatted(cantidadReportes, nuevoEstado, sectorId.valor()));
    }

    /** M9 — RF026: la ingesta automatizada cambia estado igual que el consenso ciudadano, así que también anexa. */
    public static EventoBitacora detectadoPorIngesta(SectorId sectorId, EstadoServicio nuevoEstado,
                                                       String fuente, Instant ahora) {
        return new EventoBitacora(
                new EventoId(UUID.randomUUID().toString()),
                TipoEvento.CORTE_DETECTADO_POR_INGESTA,
                sectorId,
                null,
                ahora,
                "Ingesta automatizada (%s) detectó %s en '%s'".formatted(fuente, nuevoEstado, sectorId.valor()));
    }
}
