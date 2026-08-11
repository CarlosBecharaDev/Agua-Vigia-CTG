package com.aguavigia.ctg.api;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** RF025 — el archivo tiene que abrirse bien donde lo van a abrir: Excel en español. */
class EscritorCsvTest {

    private static final String BOM = "﻿";

    @Test
    void debeEmpezarConBomYSepararConPuntoYComa() {
        String csv = EscritorCsv.escribir(List.of("a", "b"), List.of(List.of("1", "2")));

        // Sin BOM, Excel asume la codificacion del sistema y "Cienaga" llega como "CiÃ©naga".
        assertThat(csv).startsWith(BOM);
        assertThat(csv).isEqualTo(BOM + "a;b\r\n1;2\r\n");
    }

    @Test
    void debeTerminarCadaFilaEnCrlfComoPideRfc4180() {
        String csv = EscritorCsv.escribir(List.of("a"), List.of(List.of("1"), List.of("2")));

        assertThat(csv).isEqualTo(BOM + "a\r\n1\r\n2\r\n");
    }

    /** Los nombres de barrio vienen de un GeoJSON de terceros, no de una lista que controlemos. */
    @Test
    void debeEntrecomillarUnValorQueTraeElSeparador() {
        String csv = EscritorCsv.escribir(List.of("nombre"), List.of(List.of("Manga; Bocagrande")));

        assertThat(csv).isEqualTo(BOM + "nombre\r\n\"Manga; Bocagrande\"\r\n");
    }

    @Test
    void debeDuplicarLasComillasInternas() {
        String csv = EscritorCsv.escribir(List.of("nombre"), List.of(List.of("El \"Laguito\"")));

        assertThat(csv).isEqualTo(BOM + "nombre\r\n\"El \"\"Laguito\"\"\"\r\n");
    }

    @Test
    void debeEntrecomillarUnValorConSaltoDeLinea() {
        String csv = EscritorCsv.escribir(List.of("nombre"), List.of(List.of("Manga\nCrespo")));

        assertThat(csv).isEqualTo(BOM + "nombre\r\n\"Manga\nCrespo\"\r\n");
    }

    @Test
    void unValorNuloDebeSalirComoCeldaVacia() {
        String csv = EscritorCsv.escribir(List.of("a", "b"), List.of(java.util.Arrays.asList("1", null)));

        assertThat(csv).isEqualTo(BOM + "a;b\r\n1;\r\n");
    }

    @Test
    void sinFilasDebeQuedarSoloElEncabezado() {
        assertThat(EscritorCsv.escribir(List.of("a", "b"), List.of())).isEqualTo(BOM + "a;b\r\n");
    }
}
