package com.aguavigia.ctg.infrastructure.ingest;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static com.aguavigia.ctg.infrastructure.ingest.PrefiltroDeterminista.posibleInterrupcionDeAcueducto;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Los titulares de las pruebas "debeAceptar*" son reales, citados en
 * docs/ingenieria/pipeline-ingesta-datos.md §1 como ejemplos verificados del sitemap de Acuacar.
 */
class PrefiltroDeterministaTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "AGUAS DE CARTAGENA ANUNCIA SUSPENSIÓN PROGRAMADA DEL SERVICIO EN EL 40 % DE LA CIUDAD",
            "SUSPENSIONES EN EL ACUEDUCTO AL 63 % DE CARTAGENA POR OBRAS PRIORITARIAS",
            "RESTABLECIMIENTO GRADUAL DEL SERVICIO DE ACUEDUCTO",
            "Racionamiento programado por baja presión en la planta El Bosque",
            "Reportan fuga en la PTAP que afecta el suministro"
    })
    void debeAceptarTitularesRealesDeInterrupciones(String titular) {
        assertThat(posibleInterrupcionDeAcueducto(titular)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "Independiente Medellín venció 2-1 a Junior en el estadio Metropolitano",
            "Alcaldía de Cartagena abre convocatoria para el Concurso de Talentos 2026",
            "Acuacar patrocina la Media Maratón de las Murallas"
    })
    void debeRechazarTitularesSinRelacionConElAcueducto(String titular) {
        assertThat(posibleInterrupcionDeAcueducto(titular)).isFalse();
    }

    @Test
    void debeIgnorarAcentosYMayusculas() {
        assertThat(posibleInterrupcionDeAcueducto("racionamiento")).isTrue();
        assertThat(posibleInterrupcionDeAcueducto("RACIONAMIENTO")).isTrue();
        assertThat(posibleInterrupcionDeAcueducto("Averìa en la red")).isTrue();
    }

    @Test
    void debeRechazarTextoVacioONulo() {
        assertThat(posibleInterrupcionDeAcueducto("")).isFalse();
        assertThat(posibleInterrupcionDeAcueducto(null)).isFalse();
    }

    @Test
    void limitacionConocidaDelListadoAprobado_noCubreVocabularioFueraDeLas9Palabras() {
        // Titular real del propio diseño (pipeline-ingesta-datos.md §1) que SÍ es una interrupción,
        // pero "emergencia"/"rotura"/"conducción" no están en las 9 palabras aprobadas por el
        // equipo. No se corrige aquí ampliando la lista por cuenta propia — ver el comentario de
        // clase de PrefiltroDeterminista. Este caso lo cubre el conjunto dorado cuando se valide.
        String titular = "EMERGENCIA EN TIERRA BAJA: ROTURA DE CONDUCCIÓN TERRESTRE";

        assertThat(posibleInterrupcionDeAcueducto(titular)).isFalse();
    }
}
