package com.aguavigia.ctg.infrastructure.ingest;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * El caso principal es el texto literal del boletín #2854 de Acuacar (21/08/2026), no un ejemplo
 * inventado: la versión anterior del extractor pasaba sus pruebas con textos de laboratorio y
 * devolvía {@code ["del entorno"]} sobre este, perdiendo los 20 barrios afectados.
 */
class HeuristicaExtractorTest {

    private static final Instant PUBLICADO = Instant.parse("2026-08-20T16:32:00Z");

    /** Recorte literal del #2854, con la redacción y la puntuación de la fuente. */
    private static final String BOLETIN_2854 = """
            #2854-AGUA DE CARTAGENA REPARA FUGA EN TUBERIA DE ACUEDUCTO EN AVENIDA EL CONSULADO \
            Habrá suspensión del servicio de acueducto a barrios del entorno. \
            Cartagena de Indias, 20 de agosto de 2026 . Aguas de Cartagena identificó una fuga en un \
            tramo de tubería del sistema de acueducto de 500 milímetros de diámetro, en el sector El \
            Consulado. Por tal motivo, la empresa ha programado la realización de trabajos de \
            reparación de la red de manera segura y eficiente, que conllevan a la suspensión temporal \
            del suministro de agua, mañana viernes 21 de agosto, entre las 9:00 a.m. y las 6:00 p.m. \
            en los siguientes barrios: Armenia, sector Sena, El Cairo, Escallón Villa, La Floresta, \
            Las Gaviotas, Tacarigua, Buenos Aires, Los Ángeles, Villa Sandra, Los Ejecutivos, \
            San Antonio.""";

    private final HeuristicaExtractor extractor = new HeuristicaExtractor();

    private EventoExtraido extraerBoletin2854() {
        return extractor.extraer(DocumentoCrudo.de(
                "acuacar", "https://acuacar.com/2854", PUBLICADO, "#2854", BOLETIN_2854));
    }

    @Test
    void debeLeerLosBarriosDeLaEnumeracionYNoLaFraseDeResumen() {
        EventoExtraido evento = extraerBoletin2854();

        assertThat(evento.sectoresMencionados())
                .contains("Armenia", "El Cairo", "Escallón Villa", "La Floresta", "Las Gaviotas",
                        "Tacarigua", "Buenos Aires", "Los Ángeles", "Villa Sandra",
                        "Los Ejecutivos", "San Antonio")
                .doesNotContain("del entorno");
    }

    @Test
    void debeIgnorarLasMencionesGenericasDeBarrios() {
        EventoExtraido evento = extraerBoletin2854();

        assertThat(evento.sectoresMencionados())
                .noneMatch(nombre -> nombre.toLowerCase().contains("entorno"));
    }

    @Test
    void debeLeerLaVentanaPrometidaEnHoraDeCartagena() {
        EventoExtraido evento = extraerBoletin2854();

        // 21 de agosto, 9:00 a.m. y 6:00 p.m. en UTC-5.
        assertThat(evento.inicioDeclarado()).isEqualTo(Instant.parse("2026-08-21T14:00:00Z"));
        assertThat(evento.finPrometido()).isEqualTo(Instant.parse("2026-08-21T23:00:00Z"));
    }

    @Test
    void debeTomarLaFechaDelCorteYNoLaDeLaLineaDeFecha() {
        EventoExtraido evento = extraerBoletin2854();

        // El boletín se fecha el 20 pero los trabajos son «mañana viernes 21».
        assertThat(evento.inicioDeclarado()).isAfter(Instant.parse("2026-08-21T00:00:00Z"));
    }

    @Test
    void debeGraduarLaConfianzaSegunLaEvidenciaEncontrada() {
        EventoExtraido conVentana = extraerBoletin2854();

        assertThat(conVentana.confianza())
                .isEqualTo(HeuristicaExtractor.CONFIANZA_ENUMERACION_CON_VENTANA);
    }

    @Test
    void debeBajarLaConfianzaCuandoLaEnumeracionNoTraeHorario() {
        String sinHorario = "Habrá suspensión del servicio en los siguientes barrios: Manga, Bocagrande.";

        EventoExtraido evento = extractor.extraer(DocumentoCrudo.de(
                "acuacar", "https://acuacar.com/x", PUBLICADO, "aviso", sinHorario));

        assertThat(evento.confianza()).isEqualTo(HeuristicaExtractor.CONFIANZA_ENUMERACION);
        assertThat(evento.camposInferidos()).contains("inicioDeclarado", "finPrometido");
    }

    @Test
    void debeDeclararLosCamposQueNoSupoLeerEnVezDeInventarlos() {
        EventoExtraido evento = extractor.extraer(DocumentoCrudo.de(
                "acuacar", "https://acuacar.com/x", PUBLICADO, "aviso",
                "Suspensión del servicio en los siguientes barrios: Manga."));

        assertThat(evento.inicioDeclarado()).isNull();
        assertThat(evento.finPrometido()).isNull();
    }

    /** Lo que el veedor necesita contrastar: qué pasa, cuándo y en qué barrios, en una sola cita. */
    @Test
    void laCitaTextualDebeMostrarLaListaDeBarriosYNoLaFraseDeResumen() {
        EventoExtraido evento = extraerBoletin2854();

        assertThat(evento.citaTextual())
                .contains("siguientes barrios")
                .contains("Armenia")
                .doesNotContain("barrios del entorno");
    }

    @Test
    void laCitaTextualDebeSerLiteralDelBoletin() {
        EventoExtraido evento = extraerBoletin2854();

        String sinElipsis = evento.citaTextual().replace("…", "").strip();
        assertThat(BOLETIN_2854).contains(sinElipsis);
    }

    @Test
    void debeReconocerElRestablecimientoComoServicioNormal() {
        EventoExtraido evento = extractor.extraer(DocumentoCrudo.de(
                "acuacar", "https://acuacar.com/x", PUBLICADO, "aviso",
                "Se completó el restablecimiento del servicio en los siguientes barrios: Manga."));

        assertThat(evento.tipo()).isEqualTo("SERVICIO_NORMAL");
    }

    @Test
    void noDebeProponerNadaCuandoElBoletinNoNombraNingunBarrio() {
        EventoExtraido evento = extractor.extraer(DocumentoCrudo.de(
                "acuacar", "https://acuacar.com/x", PUBLICADO, "aviso",
                "Aguas de Cartagena informa que se presentarán intermitencias en algunos "
                        + "sectores de la ciudad durante la temporada seca."));

        assertThat(evento.esInterrupcionDeAcueducto()).isFalse();
    }

    @Test
    void debeRecorrerTodasLasEnumeracionesDelBoletinYNoSoloLaPrimera() {
        String dosListas = "Suspensión del servicio en los siguientes barrios: Manga, Bocagrande. "
                + "Nelson Mandela, sectores: Los Olivos, Las Vegas.";

        EventoExtraido evento = extractor.extraer(DocumentoCrudo.de(
                "acuacar", "https://acuacar.com/x", PUBLICADO, "aviso", dosListas));

        assertThat(evento.sectoresMencionados())
                .contains("Manga", "Bocagrande", "Los Olivos", "Las Vegas");
    }
}
