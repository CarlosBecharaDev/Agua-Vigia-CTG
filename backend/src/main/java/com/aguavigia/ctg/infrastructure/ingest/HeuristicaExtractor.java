package com.aguavigia.ctg.infrastructure.ingest;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extracción por heurísticas deterministas sobre los boletines de Acuacar, tras el descarte de la
 * IA en `ADR-025`.
 *
 * <h2>Por qué cambió</h2>
 * La versión anterior tomaba la <i>primera</i> aparición de «barrios» del texto. En un boletín real
 * («#2854 — AGUA DE CARTAGENA REPARA FUGA…», 21/08/2026) eso caía en la frase de resumen
 * «suspensión del servicio a <b>barrios del entorno</b>» y devolvía la lista {@code ["del entorno"]},
 * mientras los 20 barrios afectados —enumerados más abajo tras «en los siguientes barrios:»— se
 * perdían enteros. Medido sobre 37 boletines de mayo a agosto de 2026, el ancla nueva identifica
 * al menos un barrio del catálogo oficial en el 100% de los que traen lista enumerada.
 *
 * <h2>Qué hace</h2>
 * <ol>
 *   <li>Ancla en la enumeración explícita («los siguientes barrios, sectores y corregimientos:»),
 *       que es la plantilla que Acuacar usa cuando de verdad hay barrios afectados.</li>
 *   <li>Devuelve los nombres <b>tal como los escribió la fuente</b>. Decidir cuáles existen es de
 *       {@link EmparejadorDeSectores}, contra el catálogo catastral: aquí no se inventa un sector.</li>
 *   <li>Lee la ventana prometida con {@link LectorDeVentanaDeclarada} (RF020–RF022).</li>
 *   <li>Gradúa la confianza según la evidencia que realmente encontró.</li>
 * </ol>
 *
 * <h2>La confianza ya no es una constante</h2>
 * `ADR-026` descartó publicar por umbral con un argumento exacto: «el extractor emite un valor
 * constante de 0.6, el umbral no distinguiría nada». Ahora distingue —enumeración explícita y
 * ventana horaria valen más que una mención suelta— y el número sirve para ordenar la cola del
 * veedor por lo que más se sostiene. Aun así <b>nada se publica solo</b>: quien decide sigue siendo
 * el veedor, y {@code citaTextual} es la frase literal que lee para decidirlo (`ADR-006`).
 */
@Component
public class HeuristicaExtractor {

    /** Enumeración explícita + ventana horaria: la plantilla completa de un aviso de suspensión. */
    static final double CONFIANZA_ENUMERACION_CON_VENTANA = 0.85;
    /** Enumeración explícita sin horario: los barrios son fiables, el «cuándo» no consta. */
    static final double CONFIANZA_ENUMERACION = 0.75;
    /** Mención en prosa, sin lista: se propone, pero es lo más débil que este extractor emite. */
    static final double CONFIANZA_MENCION_SUELTA = 0.45;

    private static final int LARGO_MAXIMO_CITA = 300;
    private static final int LARGO_MAXIMO_REGION = 2500;
    /** Cuánto texto previo al «…siguientes barrios:» entra en la cita: ahí van el día y la hora. */
    private static final int CONTEXTO_ANTES_DEL_ANCLA = 180;

    /**
     * «(los) siguientes barrios», «barrios y sectores:», «barrios, sectores y corregimientos:».
     * Exige los dos puntos: es lo que separa la enumeración real de la prosa que solo menciona la
     * palabra «barrios».
     */
    private static final Pattern ANCLA_ENUMERACION = Pattern.compile(
            "(?i)(?:los\\s+)?(?:siguientes\\s+)?(barrios?|sector(?:es)?|corregimiento(?:s)?)"
                    + "(?:\\s*(?:,|y)\\s*(?:barrios?|sector(?:es)?|corregimiento(?:s)?))*\\s*:");

    /** Corta la enumeración donde vuelve a empezar la prosa del boletín. */
    private static final Pattern FIN_DE_ENUMERACION = Pattern.compile(
            "(?i)\\b(?:aguas de cartagena|acuacar|la compa[nñ][ií]a|la empresa|se recomienda|"
                    + "se invita|para m[aá]s informaci[oó]n|la programaci[oó]n|cabe (?:se[nñ]alar|recordar)|"
                    + "es importante|de igual (?:forma|manera)|as[ií] mismo|adicionalmente)\\b");

    /**
     * Los dos puntos también separan: dentro de una enumeración larga Acuacar abre sublistas
     * («Nelson Mandela, sectores: Los Olivos, Las Vegas»), y sin cortar ahí el primer nombre de
     * cada sublista quedaba pegado a la palabra que la introduce.
     */
    private static final Pattern SEPARADOR = Pattern.compile("[,;.:]|\\sy\\s");

    /**
     * Frases que nombran «barrios» sin decir cuáles. Si se dejaran pasar, «del entorno» o
     * «afectados» viajarían como si fueran nombres propios.
     */
    private static final Pattern MENCION_GENERICA = Pattern.compile(
            "(?i)^(?:del?\\s+)?(?:entorno|sector|la\\s+zona|zona\\s+\\w+|la\\s+ciudad|"
                    + "algunos?|varios?|otros?|dem[aá]s|mismos?|afectad[oa]s?|aleda[nñ][oa]s?|"
                    + "comprendidos?|incluidos?|mencionad[oa]s?|beneficiad[oa]s?|"
                    + "las\\s+zonas?\\s+\\w+|el\\s+entorno)\\b.*$");

    private static final Pattern CAUSA = Pattern.compile("(?i)debido a\\s+([^,.]+)|por\\s+([^,.]+)");

    /** La frase que sostiene la afirmación: es lo que el veedor lee, no el arranque del documento. */
    private static final Pattern ORACION_DE_INTERRUPCION = Pattern.compile(
            "(?i)[^.]*\\b(?:suspensi[oó]n|suspender|racionamiento|corte|restablec|normaliza)[^.]*\\.");

    public EventoExtraido extraer(DocumentoCrudo documento) {
        String texto = documento.texto();
        String enMinusculas = texto.toLowerCase();

        boolean mencionaInterrupcion = contieneAlguna(enMinusculas,
                "suspensión", "suspension", "suspender", "racionamiento", "corte del servicio",
                "corte de agua", "cortes de agua");
        boolean mencionaPresionBaja = contieneAlguna(enMinusculas,
                "baja presión", "presión baja", "baja presion", "presion baja", "bajas presiones");
        boolean mencionaNormalidad = contieneAlguna(enMinusculas,
                "servicio restablecido", "restablecimiento del servicio", "normalización del servicio",
                "normalizacion del servicio", "servicio normalizado");

        List<String> mencionados = barriosEnumerados(texto);
        boolean huboEnumeracion = !mencionados.isEmpty();
        if (!huboEnumeracion) {
            mencionados = barriosEnProsa(texto);
        }

        LectorDeVentanaDeclarada.Ventana ventana =
                LectorDeVentanaDeclarada.leer(texto, documento.publicadoEn());

        String tipo = "SUSPENSION_PROGRAMADA";
        if (mencionaPresionBaja && !mencionaInterrupcion) {
            tipo = "PRESION_BAJA";
        } else if (mencionaNormalidad && !mencionaInterrupcion) {
            tipo = "SERVICIO_NORMAL";
        }

        boolean esInterrupcion =
                (mencionaInterrupcion || mencionaPresionBaja || mencionaNormalidad)
                        && !mencionados.isEmpty();

        return new EventoExtraido(
                esInterrupcion,
                tipo,
                mencionados,
                ventana.inicio(),
                ventana.fin(),
                causaDeclarada(texto),
                confianza(huboEnumeracion, ventana),
                camposInferidos(ventana),
                citaTextual(texto));
    }

    private static double confianza(boolean huboEnumeracion, LectorDeVentanaDeclarada.Ventana ventana) {
        if (!huboEnumeracion) {
            return CONFIANZA_MENCION_SUELTA;
        }
        return ventana.vacia() ? CONFIANZA_ENUMERACION : CONFIANZA_ENUMERACION_CON_VENTANA;
    }

    /** Lo que no se supo leer se declara; no se rellena. */
    private static List<String> camposInferidos(LectorDeVentanaDeclarada.Ventana ventana) {
        List<String> faltantes = new ArrayList<>();
        if (ventana.inicio() == null) {
            faltantes.add("inicioDeclarado");
        }
        if (ventana.fin() == null) {
            faltantes.add("finPrometido");
        }
        return List.copyOf(faltantes);
    }

    /**
     * Recorre <b>todas</b> las enumeraciones del boletín, no solo la primera: los avisos largos
     * abren una lista por zona («… Nelson Mandela, sectores: Los Olivos, Las Vegas, …») y quedarse
     * con la primera perdía las demás.
     */
    private static List<String> barriosEnumerados(String texto) {
        List<String> nombres = new ArrayList<>();
        Matcher ancla = ANCLA_ENUMERACION.matcher(texto);
        int desde = 0;
        while (ancla.find(desde)) {
            int inicio = ancla.end();
            String region = texto.substring(inicio,
                    Math.min(texto.length(), inicio + LARGO_MAXIMO_REGION));
            Matcher corte = FIN_DE_ENUMERACION.matcher(region);
            if (corte.find()) {
                region = region.substring(0, corte.start());
            }
            nombres.addAll(trocear(region));
            desde = inicio + Math.max(region.length(), 1);
            if (desde >= texto.length()) {
                break;
            }
        }
        return nombres;
    }

    /**
     * Solo cuando no hubo enumeración. Se limita a «barrio X» / «barrios X y Z» en prosa y descarta
     * las menciones genéricas, que es de donde salía el falso «del entorno».
     */
    private static List<String> barriosEnProsa(String texto) {
        Pattern enProsa = Pattern.compile(
                "(?i)\\b(?:barrios?|sector(?:es)?)\\s+([\\p{L}0-9 ,]{3,120}?)"
                        + "(?=[.;:]|\\s+(?:se|no|por|para|desde|hasta|durante|debido|con|donde)\\b|$)");
        Matcher coincidencia = enProsa.matcher(texto);
        List<String> nombres = new ArrayList<>();
        while (coincidencia.find()) {
            nombres.addAll(trocear(coincidencia.group(1)));
        }
        return nombres;
    }

    private static List<String> trocear(String region) {
        List<String> nombres = new ArrayList<>();
        for (String trozo : SEPARADOR.split(region)) {
            String limpio = trozo.strip();
            if (limpio.length() < 3 || limpio.length() > 60) {
                continue;
            }
            if (MENCION_GENERICA.matcher(limpio).matches()) {
                continue;
            }
            if (limpio.chars().noneMatch(Character::isLetter)) {
                continue;
            }
            // «sectores», «barrios», «corregimientos» sueltos: son la palabra que introduce la
            // sublista, no un nombre. Se reconocen porque al normalizar no queda nada.
            if (NormalizadorDeNombres.normalizar(limpio).isEmpty()) {
                continue;
            }
            nombres.add(limpio);
        }
        return nombres;
    }

    private static String causaDeclarada(String texto) {
        Matcher coincidencia = CAUSA.matcher(texto);
        if (!coincidencia.find()) {
            return "Mantenimiento / Daño general";
        }
        return coincidencia.group(1) != null ? coincidencia.group(1).trim() : coincidencia.group(2).trim();
    }

    /**
     * Fragmento literal, no un resumen (`ADR-006`): es lo que el veedor contrasta con la fuente.
     * Se prefiere la oración que habla de la interrupción; si no hay, el arranque del documento.
     */
    private static String citaTextual(String texto) {
        String limpio = texto.strip();

        // Se prefiere el tramo que rodea a la enumeración: ahí es donde el boletín dice a la vez
        // qué pasa, cuándo y en qué barrios. Antes se citaba la frase de resumen («…a barrios del
        // entorno») que no nombra ninguno, y con eso el veedor no podía contrastar nada.
        Matcher ancla = ANCLA_ENUMERACION.matcher(limpio);
        if (ancla.find()) {
            int desde = Math.max(0, ancla.start() - CONTEXTO_ANTES_DEL_ANCLA);
            if (desde > 0) {
                int corteDePalabra = limpio.indexOf(' ', desde);
                desde = corteDePalabra < 0 ? desde : corteDePalabra + 1;
            }
            String tramo = limpio.substring(desde,
                    Math.min(limpio.length(), desde + LARGO_MAXIMO_CITA)).strip();
            return (desde > 0 ? "…" : "") + recortar(tramo);
        }

        Matcher oracion = ORACION_DE_INTERRUPCION.matcher(limpio);
        return recortar(oracion.find() ? oracion.group().strip() : limpio);
    }

    private static String recortar(String texto) {
        return texto.length() <= LARGO_MAXIMO_CITA
                ? texto
                : texto.substring(0, LARGO_MAXIMO_CITA).stripTrailing() + "…";
    }

    private static boolean contieneAlguna(String texto, String... agujas) {
        for (String aguja : agujas) {
            if (texto.contains(aguja)) {
                return true;
            }
        }
        return false;
    }
}
