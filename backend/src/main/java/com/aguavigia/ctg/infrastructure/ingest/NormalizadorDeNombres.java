package com.aguavigia.ctg.infrastructure.ingest;

import java.text.Normalizer;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Lleva a una forma comparable los nombres de barrio que escribe Acuacar y los que trae el GeoJSON
 * catastral, que son la misma ciudad escrita de dos maneras.
 *
 * Las tres diferencias que se observaron sobre 37 boletines reales (mayo–agosto 2026):
 *
 * <ol>
 *   <li><b>Prefijos de tipo.</b> El boletín dice «sector Sena», «urbanización La Heroica»,
 *       «conjunto Terraza de La Plazuela»; el catastro solo guarda el nombre.</li>
 *   <li><b>Números.</b> El boletín escribe «9 de Abril» y «7 de Agosto»; el catastro,
 *       «NUEVE DE ABRIL» y «SIETE DE AGOSTO».</li>
 *   <li><b>La preposición intermedia.</b> «Piedra Bolívar» en el boletín contra
 *       «PIEDRA DE BOLIVAR» en el catastro.</li>
 * </ol>
 *
 * Deliberadamente <b>no</b> hay coincidencia aproximada. Medida sobre el corpus real, la distancia
 * de edición emparejaba «Las Gavias» con «LAS GAVIOTAS» —dos barrios distintos, ambos nombrados en
 * el mismo boletín— y «Andalucía» con «SANTA LUCIA». Publicar un corte en el barrio equivocado es
 * exactamente el daño que esta plataforma existe para evitar: ante la duda no se adivina, el nombre
 * queda sin reconocer y lo ve el veedor.
 */
final class NormalizadorDeNombres {

    /**
     * Se quitan por delante, repetidamente: «parque residencial Los Alpes» lleva dos.
     * `sector(?:es)?` y no `sectores?`, que solo casaría «sectore»/«sectores» y nunca «sector».
     */
    private static final Pattern PREFIJO_DE_TIPO = Pattern.compile(
            "^(?:barrios?|sector(?:es)?|urbanizacion(?:es)?|urb|conjunto(?:s)?|"
                    + "residencial(?:es)?|parque(?:\\s+residencial)?|corregimiento(?:s)?(?:\\s+de)?|"
                    + "via|torres?\\s+de|portal(?:es)?\\s+de|boulevard(?:\\s+de)?)\\s+");

    private static final Pattern NO_ALFANUMERICO = Pattern.compile("[^a-z0-9\\s]");
    private static final Pattern ESPACIOS = Pattern.compile("\\s+");
    private static final Pattern MARCAS_DIACRITICAS = Pattern.compile("\\p{M}");

    /** Solo los que aparecen en nombres de barrio de Cartagena; no es una tabla de cardinales. */
    private static final Map<String, String> NUMERO_EN_LETRAS = Map.ofEntries(
            Map.entry("1", "primero"), Map.entry("2", "dos"), Map.entry("3", "tres"),
            Map.entry("4", "cuatro"), Map.entry("5", "cinco"), Map.entry("6", "seis"),
            Map.entry("7", "siete"), Map.entry("8", "ocho"), Map.entry("9", "nueve"),
            Map.entry("10", "diez"), Map.entry("11", "once"), Map.entry("12", "doce"),
            Map.entry("13", "trece"), Map.entry("14", "catorce"), Map.entry("15", "quince"),
            Map.entry("16", "dieciseis"), Map.entry("17", "diecisiete"), Map.entry("18", "dieciocho"),
            Map.entry("19", "diecinueve"), Map.entry("20", "veinte"), Map.entry("21", "veintiuno"),
            Map.entry("30", "treinta"), Map.entry("31", "treintaiuno"));

    private NormalizadorDeNombres() {
    }

    static String normalizar(String texto) {
        if (texto == null || texto.isBlank()) {
            return "";
        }
        String sinAcentos = MARCAS_DIACRITICAS.matcher(
                Normalizer.normalize(texto, Normalizer.Form.NFD)).replaceAll("");
        String limpio = ESPACIOS.matcher(
                NO_ALFANUMERICO.matcher(sinAcentos.toLowerCase()).replaceAll(" ")).replaceAll(" ").trim();

        String anterior = null;
        while (!limpio.equals(anterior)) {
            anterior = limpio;
            limpio = PREFIJO_DE_TIPO.matcher(limpio).replaceFirst("").trim();
        }

        StringBuilder enLetras = new StringBuilder();
        for (String palabra : limpio.split(" ")) {
            if (palabra.isEmpty() || palabra.equals("st")) {
                continue;
            }
            enLetras.append(NUMERO_EN_LETRAS.getOrDefault(palabra, palabra)).append(' ');
        }
        return enLetras.toString().trim();
    }

    /**
     * Formas equivalentes bajo las que se indexa un nombre, para que «Piedra Bolívar» encuentre a
     * «PIEDRA DE BOLIVAR» sin recurrir a distancia de edición. Solo se genera la variante con «de»
     * para nombres de dos palabras: en los más largos insertarla produce cadenas que no son nombres
     * de nada y solo agregan ruido al índice.
     */
    static Set<String> variantes(String texto) {
        String base = normalizar(texto);
        if (base.isEmpty()) {
            return Set.of();
        }
        Set<String> formas = new LinkedHashSet<>();
        formas.add(base);
        formas.add(ESPACIOS.matcher(base.replace(" de ", " ")).replaceAll(" ").trim());
        List<String> palabras = List.of(base.split(" "));
        if (palabras.size() == 2) {
            formas.add(palabras.get(0) + " de " + palabras.get(1));
        }
        formas.removeIf(String::isBlank);
        return formas;
    }
}
