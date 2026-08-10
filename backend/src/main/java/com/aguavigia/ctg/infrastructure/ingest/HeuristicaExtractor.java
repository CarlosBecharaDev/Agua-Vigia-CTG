package com.aguavigia.ctg.infrastructure.ingest;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Reemplazo de la extracción de IA (Anthropic) por una heurística basada en expresiones regulares,
 * debido al bloqueo BL-005. Al tener una confianza base baja (0.6), obliga a que los resultados
 * pasen a moderación manual (M5), asegurando la fiabilidad del sistema.
 */
@Component
public class HeuristicaExtractor {

    private static final Pattern PATRON_BARRIOS = Pattern.compile("(?i)(barrios?|sectores?)\\s+([a-záéíóúñ, y]+)");
    private static final Pattern PATRON_CAUSA = Pattern.compile("(?i)debido a\\s+([^,.]+)|por\\s+([^,.]+)");

    public EventoExtraido extraer(DocumentoCrudo documento) {
        String texto = documento.texto();
        boolean esInterrupcion = texto.toLowerCase().contains("suspensión") || texto.toLowerCase().contains("corte");
        
        List<String> sectores = List.of();
        Matcher mBarrios = PATRON_BARRIOS.matcher(texto);
        if (mBarrios.find()) {
            sectores = List.of(mBarrios.group(2).split(",| y "));
        }
        
        String causa = "Mantenimiento / Daño general";
        Matcher mCausa = PATRON_CAUSA.matcher(texto);
        if (mCausa.find()) {
            causa = mCausa.group(1) != null ? mCausa.group(1).trim() : mCausa.group(2).trim();
        }

        return new EventoExtraido(
                esInterrupcion,
                "SUSPENSION_PROGRAMADA",
                sectores.stream().map(String::trim).filter(s -> !s.isEmpty()).toList(),
                Instant.now(), // Fallback: asume ahora
                Instant.now().plusSeconds(3600 * 12), // Fallback: asume 12 horas
                causa,
                0.6, // < 0.85 para forzar la revisión humana
                List.of("sectoresMencionados", "inicioDeclarado", "finPrometido"),
                "Extracción heurística (sin IA)"
        );
    }
}
