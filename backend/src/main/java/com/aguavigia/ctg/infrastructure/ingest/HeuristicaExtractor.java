package com.aguavigia.ctg.infrastructure.ingest;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Reemplazo de la extracción con IA por una heurística de expresiones regulares, tras el bloqueo
 * BL-005 (`ADR-025`).
 *
 * La confianza fija de 0.6 no es decorativa: por debajo del umbral de publicación automática, toda
 * salida de este extractor termina en la cola de revisión del veedor
 * (`RegistrarPropuestaIngestaUseCase`) y ninguna llega sola al mapa. Antes el orquestador ignoraba
 * este número y escribía el estado igual.
 *
 * `inicioDeclarado` y `finPrometido` viajan nulos a propósito. Antes se rellenaban con
 * `Instant.now()` y `now + 12h` bajo el comentario "fallback: asume": eran datos inventados que
 * nadie leía, y publicarlos como si se hubieran extraído del boletín contradice la ética de datos
 * del proyecto. Quedan listados en `camposInferidos` para que se vea que no se supieron.
 */
@Component
public class HeuristicaExtractor {

    /** Confianza de una extracción por expresiones regulares: suficiente para proponer, no para publicar. */
    static final double CONFIANZA_HEURISTICA = 0.6;

    private static final int LARGO_MAXIMO_CITA = 300;

    private static final Pattern PATRON_BARRIOS =
            Pattern.compile("(?i)(?:barrios?|sectores?)\\s+([\\p{L}0-9 ,]+?)(?=[.;:]|\\s+(?:y\\s+)?(?:se|no|por|para|desde|hasta|durante|debido)\\b|$)");
    private static final Pattern PATRON_CAUSA = Pattern.compile("(?i)debido a\\s+([^,.]+)|por\\s+([^,.]+)");
    private static final Pattern SEPARADOR_BARRIOS = Pattern.compile(",|\\sy\\s");

    public EventoExtraido extraer(DocumentoCrudo documento) {
        String texto = documento.texto();
        String enMinusculas = texto.toLowerCase();

        boolean esInterrupcion = enMinusculas.contains("suspensión") || enMinusculas.contains("suspension")
                || enMinusculas.contains("corte");
        boolean esPresionBaja = enMinusculas.contains("baja presión") || enMinusculas.contains("presión baja")
                || enMinusculas.contains("baja presion") || enMinusculas.contains("presion baja");
        boolean esNormal = enMinusculas.contains("servicio restablecido") || enMinusculas.contains("normalidad");

        String tipoEvento = "SUSPENSION_PROGRAMADA";
        if (esPresionBaja) {
            tipoEvento = "PRESION_BAJA";
        }
        if (esNormal) {
            tipoEvento = "SERVICIO_NORMAL";
        }

        return new EventoExtraido(
                esInterrupcion || esPresionBaja || esNormal,
                tipoEvento,
                barriosMencionados(texto),
                null,
                null,
                causaDeclarada(texto),
                CONFIANZA_HEURISTICA,
                List.of("inicioDeclarado", "finPrometido"),
                citaTextual(texto));
    }

    private static List<String> barriosMencionados(String texto) {
        Matcher coincidencia = PATRON_BARRIOS.matcher(texto);
        if (!coincidencia.find()) {
            return List.of();
        }
        return SEPARADOR_BARRIOS.splitAsStream(coincidencia.group(1))
                .map(String::trim)
                .filter(nombre -> !nombre.isEmpty())
                .toList();
    }

    private static String causaDeclarada(String texto) {
        Matcher coincidencia = PATRON_CAUSA.matcher(texto);
        if (!coincidencia.find()) {
            return "Mantenimiento / Daño general";
        }
        return coincidencia.group(1) != null ? coincidencia.group(1).trim() : coincidencia.group(2).trim();
    }

    /**
     * Fragmento literal del documento, no un resumen: es lo que el veedor lee para decidir si la
     * propuesta se sostiene (`ADR-006` — cita verificable en toda extracción). Se recorta para que
     * quepa en la cola de revisión sin volverse un muro de texto.
     */
    private static String citaTextual(String texto) {
        String limpio = texto.strip();
        return limpio.length() <= LARGO_MAXIMO_CITA
                ? limpio
                : limpio.substring(0, LARGO_MAXIMO_CITA).stripTrailing() + "…";
    }
}
