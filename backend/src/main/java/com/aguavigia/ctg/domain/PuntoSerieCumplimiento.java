package com.aguavigia.ctg.domain;

import java.time.YearMonth;

/**
 * RF024 — un punto de la evolución del Índice de Cumplimiento en el tiempo.
 *
 * Lleva `cantidadCortes` junto al índice porque un 40% calculado sobre un solo corte y uno
 * calculado sobre veinte no significan lo mismo, y DESIGN.md §5 exige cifras con contexto. Sin ese
 * número, un mes con un único corte atípico se leería como una tendencia.
 */
public record PuntoSerieCumplimiento(YearMonth periodo, IndiceCumplimiento indice, int cantidadCortes) {

    public PuntoSerieCumplimiento {
        if (periodo == null) {
            throw new IllegalArgumentException("El punto de la serie debe tener período");
        }
        if (indice == null) {
            throw new IllegalArgumentException("El punto de la serie debe tener índice");
        }
        if (cantidadCortes <= 0) {
            throw new IllegalArgumentException("Un período sin cortes cerrados no es un punto de la serie");
        }
    }
}
