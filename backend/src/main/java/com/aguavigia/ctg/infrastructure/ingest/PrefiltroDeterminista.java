package com.aguavigia.ctg.infrastructure.ingest;

import java.text.Normalizer;
import java.util.List;

/**
 * Etapa 3 del pipeline (docs/ingenieria/pipeline-ingesta-datos.md §3): descarta ~70% del volumen
 * antes de gastar un token de IA. Sin costo, sin red, sin estado.
 *
 * Las 9 palabras son exactamente las del diseño ya aprobado por el equipo. Ampliarlas es decision
 * de quien valide el conjunto dorado (100 boletines etiquetados a mano, §4 del mismo documento),
 * no algo que este prefiltro decida solo — un prefiltro que se autoexpande deja de ser determinista.
 */
public final class PrefiltroDeterminista {

    private static final List<String> PALABRAS_CLAVE = List.of(
            "suspension", "racionamiento", "corte", "averia", "restablecimiento",
            "fuga", "ptap", "acueducto", "presion");

    private PrefiltroDeterminista() {
    }

    public static boolean posibleInterrupcionDeAcueducto(String texto) {
        if (texto == null || texto.isBlank()) {
            return false;
        }
        String normalizado = quitarAcentos(texto).toLowerCase();
        return PALABRAS_CLAVE.stream().anyMatch(normalizado::contains);
    }

    private static String quitarAcentos(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }
}
