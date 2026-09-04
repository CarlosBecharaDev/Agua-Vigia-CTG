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

    /**
     * M9 — RF026: la ingesta automatizada cambia estado igual que el consenso ciudadano, así que
     * también anexa.
     *
     * La descripción se redacta para un vecino, no para un log: antes decía *"Ingesta automatizada
     * (acuacar) detectó SIN_SERVICIO en 'pasacaballos'"*, con el identificador interno del barrio y
     * el nombre del enum. La bitácora es la cara pública de la plataforma (RF026); si hay que
     * traducirla mentalmente, no informa.
     */
    public static EventoBitacora detectadoPorIngesta(SectorId sectorId, String nombreDelSector,
                                                       EstadoServicio nuevoEstado, String fuente,
                                                       String urlOriginal, String imagenUrl,
                                                       String tituloOriginal, Instant ahora) {
        String barrio = enCapitalizacionDeNombre(
                nombreDelSector == null || nombreDelSector.isBlank() ? sectorId.valor() : nombreDelSector);
        return new EventoBitacora(
                new EventoId(UUID.randomUUID().toString()),
                TipoEvento.CORTE_DETECTADO_POR_INGESTA,
                sectorId,
                null,
                ahora,
                descripcion(tituloOriginal, nuevoEstado, barrio, fuente),
                nuevoEstado,
                urlOriginal,
                imagenUrl);
    }

    /**
     * Se enseña el titular tal como lo publicó la fuente, no una frase nuestra: la bitácora es un
     * registro de lo que dijo el operador, y `ADR-006` pide que todo lo publicado se pueda
     * contrastar con el original. La frase compuesta queda solo de respaldo, para las fuentes que
     * no traen titular.
     */
    private static String descripcion(String tituloOriginal, EstadoServicio estado, String barrio,
                                       String fuente) {
        String titular = limpiarTitular(tituloOriginal);
        if (!titular.isBlank()) {
            return titular;
        }
        return "%s en %s, según %s".formatted(enPalabras(estado), barrio, nombreDeLaFuente(fuente));
    }

    /**
     * Acuacar antepone el número del boletín al titular (`#2854-AGUAS DE CARTAGENA…`). Se quita
     * porque la tarjeta ya lo muestra como insignia sobre la portada, y repetirlo dentro del texto
     * roba espacio a lo que sí informa. El resto del titular no se toca.
     */
    private static String limpiarTitular(String titulo) {
        if (titulo == null) {
            return "";
        }
        return titulo.replaceFirst("^\\s*#?\\s*\\d{3,5}\\s*[-–—]?\\s*", "").trim();
    }

    /**
     * El catálogo de barrios viene del GeoJSON oficial, que los escribe en mayúscula sostenida
     * (`VISTA HERMOSA`). En una frase corrida eso se lee como un grito, así que se capitaliza para
     * la bitácora. Las palabras de enlace se dejan en minúscula —`Ciudadela de la Paz`, no
     * `Ciudadela De La Paz`— que es como se escriben los nombres propios en español.
     */
    private static String enCapitalizacionDeNombre(String nombre) {
        String[] palabras = nombre.trim().toLowerCase().split("\\s+");
        StringBuilder resultado = new StringBuilder(nombre.length());
        for (int i = 0; i < palabras.length; i++) {
            String palabra = palabras[i];
            if (palabra.isEmpty()) {
                continue;
            }
            if (i > 0) {
                resultado.append(' ');
            }
            if (i > 0 && ENLACES.contains(palabra)) {
                resultado.append(palabra);
            } else {
                resultado.append(Character.toUpperCase(palabra.charAt(0))).append(palabra.substring(1));
            }
        }
        return resultado.toString();
    }

    private static final java.util.Set<String> ENLACES =
            java.util.Set.of("de", "del", "la", "las", "el", "los", "y", "en");

    private static String enPalabras(EstadoServicio estado) {
        return switch (estado) {
            case CON_SERVICIO -> "Servicio restablecido";
            case SIN_SERVICIO -> "Suspensión del servicio";
            case CORTE_PROGRAMADO -> "Corte programado";
            case PRESION_BAJA -> "Baja presión";
        };
    }

    /** `acuacar` es el operador y se nombra como tal; los feeds de prensa ya vienen con su medio. */
    private static String nombreDeLaFuente(String fuente) {
        if (fuente == null || fuente.isBlank()) {
            return "la fuente oficial";
        }
        if ("acuacar".equalsIgnoreCase(fuente)) {
            return "Acuacar";
        }
        return fuente.replace('-', ' ');
    }
}
