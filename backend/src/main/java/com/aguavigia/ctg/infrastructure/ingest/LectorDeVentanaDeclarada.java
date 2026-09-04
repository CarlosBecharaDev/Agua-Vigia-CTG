package com.aguavigia.ctg.infrastructure.ingest;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Lee del texto del boletín la ventana que Acuacar <b>promete</b>: «mañana viernes 21 de agosto,
 * entre las 9:00 a.m. y las 6:00 p.m.».
 *
 * Sin esto el Índice de Cumplimiento (RF020–RF022) no tiene con qué comparar la duración real, que
 * es la tesis del proyecto. Antes estos dos campos se rellenaban con `now` y `now + 12h` bajo un
 * comentario «fallback: asume»: dato inventado. La corrección fue ponerlos en nulo; lo que faltaba
 * era leer el que sí está escrito.
 *
 * <b>Si no hay ventana explícita se devuelve null, nunca una estimada.</b> Un cumplimiento calculado
 * contra una promesa que nadie hizo sería peor que no calcular ninguno.
 *
 * La hora se interpreta en la zona de Cartagena: el boletín le habla a un vecino, no a UTC.
 */
final class LectorDeVentanaDeclarada {

    /** Ventana declarada por la fuente. Cualquiera de los dos extremos puede faltar. */
    record Ventana(Instant inicio, Instant fin) {
        boolean vacia() {
            return inicio == null && fin == null;
        }
    }

    static final ZoneId ZONA_CARTAGENA = ZoneId.of("America/Bogota");

    private static final Map<String, Integer> MESES = Map.ofEntries(
            Map.entry("enero", 1), Map.entry("febrero", 2), Map.entry("marzo", 3),
            Map.entry("abril", 4), Map.entry("mayo", 5), Map.entry("junio", 6),
            Map.entry("julio", 7), Map.entry("agosto", 8), Map.entry("septiembre", 9),
            Map.entry("setiembre", 9), Map.entry("octubre", 10), Map.entry("noviembre", 11),
            Map.entry("diciembre", 12));

    /** «entre las 9:00 a.m. y las 6:00 p.m.» — Acuacar escribe indistintamente «a.m.» y «a. m.». */
    private static final Pattern RANGO_HORARIO = Pattern.compile(
            "(?i)entre\\s+las\\s+(\\d{1,2})(?::(\\d{2}))?\\s*([ap])\\.?\\s*m\\.?"
                    + "\\s*y\\s+(?:las\\s+)?(\\d{1,2})(?::(\\d{2}))?\\s*([ap])\\.?\\s*m\\.?");

    private static final Pattern FECHA = Pattern.compile(
            "(?i)(\\d{1,2})\\s+de\\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|"
                    + "septiembre|setiembre|octubre|noviembre|diciembre)(?:\\s+de\\s+(\\d{4}))?");

    private LectorDeVentanaDeclarada() {
    }

    static Ventana leer(String texto, Instant publicadoEn) {
        if (texto == null || texto.isBlank()) {
            return new Ventana(null, null);
        }
        Matcher horario = RANGO_HORARIO.matcher(texto);
        if (!horario.find()) {
            return new Ventana(null, null);
        }
        LocalDate dia = fechaAplicable(texto, horario.start(), publicadoEn);
        if (dia == null) {
            return new Ventana(null, null);
        }
        LocalDateTime inicio = dia.atTime(
                aHora24(entero(horario.group(1)), horario.group(3)), entero(horario.group(2)));
        LocalDateTime fin = dia.atTime(
                aHora24(entero(horario.group(4)), horario.group(6)), entero(horario.group(5)));

        // «de 8:00 p.m. a 5:00 a.m.» cruza la medianoche: el fin cae al día siguiente.
        if (!fin.isAfter(inicio)) {
            fin = fin.plusDays(1);
        }
        return new Ventana(
                inicio.atZone(ZONA_CARTAGENA).toInstant(),
                fin.atZone(ZONA_CARTAGENA).toInstant());
    }

    /**
     * La fecha del corte es la que precede al horario, no la primera del documento: los boletines
     * abren con la línea de fecha («Cartagena de Indias, 20 de agosto de 2026») y anuncian los
     * trabajos para otro día («mañana viernes 21 de agosto»). Tomar la primera adelantaba la
     * ventana un día entero.
     */
    private static LocalDate fechaAplicable(String texto, int posicionDelHorario, Instant publicadoEn) {
        Matcher fechas = FECHA.matcher(texto);
        MatchResultSimple mejorAntes = null;
        MatchResultSimple primeraDespues = null;
        while (fechas.find()) {
            MatchResultSimple actual = new MatchResultSimple(
                    fechas.start(), entero(fechas.group(1)),
                    MESES.get(fechas.group(2).toLowerCase()), fechas.group(3));
            if (actual.mes == null) {
                continue;
            }
            if (actual.posicion < posicionDelHorario) {
                mejorAntes = actual;
            } else if (primeraDespues == null) {
                primeraDespues = actual;
            }
        }
        MatchResultSimple elegida = mejorAntes != null ? mejorAntes : primeraDespues;
        return elegida == null ? null : elegida.aFecha(publicadoEn);
    }

    private record MatchResultSimple(int posicion, int dia, Integer mes, String anio) {

        LocalDate aFecha(Instant publicadoEn) {
            if (anio != null) {
                return fechaSegura(Integer.parseInt(anio), mes, dia);
            }
            // Sin año explícito se toma el de publicación, y se corrige el salto de fin de año:
            // un boletín del 30 de diciembre que anuncia trabajos «el 2 de enero» es del año
            // siguiente, no de nueve meses antes.
            LocalDate publicacion = publicadoEn == null
                    ? LocalDate.now(ZONA_CARTAGENA)
                    : LocalDate.ofInstant(publicadoEn, ZONA_CARTAGENA);
            LocalDate candidata = fechaSegura(publicacion.getYear(), mes, dia);
            if (candidata == null) {
                return null;
            }
            if (candidata.isBefore(publicacion.minusMonths(6))) {
                return fechaSegura(publicacion.getYear() + 1, mes, dia);
            }
            return candidata;
        }

        private static LocalDate fechaSegura(int anio, int mes, int dia) {
            try {
                return LocalDate.of(anio, mes, dia);
            } catch (java.time.DateTimeException fechaInexistente) {
                // «31 de febrero» en un boletín mal redactado no debe tumbar el ciclo de ingesta.
                return null;
            }
        }
    }

    private static int aHora24(int hora, String meridiano) {
        int normalizada = hora % 12;
        return meridiano.equalsIgnoreCase("p") ? normalizada + 12 : normalizada;
    }

    private static int entero(String valor) {
        return valor == null || valor.isBlank() ? 0 : Integer.parseInt(valor);
    }
}
