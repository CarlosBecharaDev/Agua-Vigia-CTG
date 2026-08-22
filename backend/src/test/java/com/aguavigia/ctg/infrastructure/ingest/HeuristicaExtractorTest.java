package com.aguavigia.ctg.infrastructure.ingest;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class HeuristicaExtractorTest {

    private static final Instant PUBLICADO = Instant.parse("2026-08-09T15:30:00Z");

    private final HeuristicaExtractor extractor = new HeuristicaExtractor();

    private EventoExtraido extraer(String texto) {
        return extractor.extraer(DocumentoCrudo.de("acuacar", "https://acuacar.com/x", PUBLICADO, "Titulo", texto));
    }

    @Test
    void debeReconocerUnaSuspensionComoInterrupcion() {
        EventoExtraido evento = extraer("Acuacar informa la suspensión del servicio en el barrio Manga");

        assertThat(evento.esInterrupcionDeAcueducto()).isTrue();
        assertThat(evento.tipo()).isEqualTo("SUSPENSION_PROGRAMADA");
    }

    /** Los boletines llegan tanto con tilde como sin ella; ambos deben clasificar igual. */
    @Test
    void debeReconocerLaBajaPresionConYSinTilde() {
        assertThat(extraer("Se reporta baja presión en el barrio Manga").tipo()).isEqualTo("PRESION_BAJA");
        assertThat(extraer("Se reporta baja presion en el barrio Manga").tipo()).isEqualTo("PRESION_BAJA");
    }

    @Test
    void debeReconocerElRestablecimiento() {
        assertThat(extraer("El servicio restablecido en el barrio Manga").tipo()).isEqualTo("SERVICIO_NORMAL");
        assertThat(extraer("Se retorna a la normalidad en el barrio Manga").tipo()).isEqualTo("SERVICIO_NORMAL");
    }

    @Test
    void noDebeMarcarComoInterrupcionUnaNoticiaSinRelacion() {
        assertThat(extraer("La alcaldia inauguro un parque en el centro historico")
                .esInterrupcionDeAcueducto()).isFalse();
    }

    @Test
    void debeExtraerVariosBarriosSeparadosPorComaYPorLaConjuncion() {
        EventoExtraido evento = extraer("Suspensión en los barrios Manga, Bocagrande y El Laguito por mantenimiento");

        assertThat(evento.sectoresMencionados()).containsExactly("Manga", "Bocagrande", "El Laguito");
    }

    /**
     * El patrón anterior era `[a-záéíóúñ, y]+`: no aceptaba mayúsculas, así que "Manga" no
     * empataba y en la práctica casi nunca extraía nada.
     */
    @Test
    void debeExtraerBarriosConMayusculasYTildes() {
        assertThat(extraer("Corte en el barrio NARIÑO por daño en la red").sectoresMencionados())
                .containsExactly("NARIÑO");
    }

    @Test
    void debeCortarLaListaDeBarriosAntesDeLaCausa() {
        EventoExtraido evento = extraer("Suspensión en los barrios Manga y Crespo debido a un daño en la matriz");

        assertThat(evento.sectoresMencionados()).containsExactly("Manga", "Crespo");
    }

    @Test
    void debeDevolverListaVaciaCuandoNoMencionaBarrios() {
        assertThat(extraer("Se presenta una suspensión general del servicio").sectoresMencionados()).isEmpty();
    }

    @Test
    void debeExtraerLaCausaDeclarada() {
        assertThat(extraer("Corte en el barrio Manga debido a un daño en la matriz").causaDeclarada())
                .isEqualTo("un daño en la matriz");
    }

    @Test
    void debeUsarUnaCausaGenericaCuandoNoLaDeclara() {
        assertThat(extraer("Suspensión del servicio").causaDeclarada())
                .isEqualTo("Mantenimiento / Daño general");
    }

    /**
     * La confianza por debajo del umbral de publicación es lo que obliga a que toda salida pase por
     * la cola del veedor. Si alguien la sube, este test debe hacerlo consciente.
     */
    @Test
    void laConfianzaDebeMantenerseBajaParaForzarRevisionHumana() {
        assertThat(extraer("Suspensión en el barrio Manga").confianza()).isEqualTo(0.6);
    }

    /**
     * Antes se rellenaban con Instant.now() y now+12h bajo el comentario "fallback: asume": datos
     * inventados presentados como extraídos del boletín.
     */
    @Test
    void noDebeInventarFechasQueElBoletinNoTrae() {
        EventoExtraido evento = extraer("Suspensión en el barrio Manga");

        assertThat(evento.inicioDeclarado()).isNull();
        assertThat(evento.finPrometido()).isNull();
        assertThat(evento.camposInferidos()).containsExactly("inicioDeclarado", "finPrometido");
    }

    @Test
    void debeTraerUnaCitaLiteralDelDocumentoParaQueElVeedorLaVerifique() {
        String texto = "Acuacar informa la suspensión del servicio en el barrio Manga";

        assertThat(extraer(texto).citaTextual()).isEqualTo(texto);
    }

    @Test
    void debeRecortarLaCitaCuandoElDocumentoEsMuyLargo() {
        String largo = "Suspensión del servicio. " + "texto de relleno ".repeat(60);

        String cita = extraer(largo).citaTextual();

        assertThat(cita).hasSizeLessThanOrEqualTo(301).endsWith("…");
    }
}
