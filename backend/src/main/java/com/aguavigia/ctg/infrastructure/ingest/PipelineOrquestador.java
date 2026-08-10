package com.aguavigia.ctg.infrastructure.ingest;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Stream;

/**
 * Orquestador principal del pipeline de Ingesta Automatizada (M9).
 */
@Service
public class PipelineOrquestador {

    private final AcuacarApiCollector acuacarApiCollector;
    private final RssCollector rssCollector;
    private final PrefiltroDeterminista prefiltro;
    private final DeduplicadorReciente deduplicador;
    private final HeuristicaExtractor extractor;

    public PipelineOrquestador(AcuacarApiCollector acuacarApiCollector,
                               RssCollector rssCollector,
                               PrefiltroDeterminista prefiltro,
                               DeduplicadorReciente deduplicador,
                               HeuristicaExtractor extractor) {
        this.acuacarApiCollector = acuacarApiCollector;
        this.rssCollector = rssCollector;
        this.prefiltro = prefiltro;
        this.deduplicador = deduplicador;
        this.extractor = extractor;
    }

    /**
     * Ejecuta el pipeline periódicamente.
     */
    @Scheduled(fixedDelayString = "${ingesta.intervalo.milisegundos:600000}")
    public void ejecutarCiclo() {
        List<DocumentoCrudo> deAcuacar = acuacarApiCollector.recolectar();
        List<DocumentoCrudo> deRss = rssCollector.recolectar();

        Stream.concat(deAcuacar.stream(), deRss.stream())
                .filter(doc -> !deduplicador.esDuplicado(doc.hash()))
                .filter(prefiltro::pasaFiltro)
                .forEach(doc -> {
                    deduplicador.registrar(doc.hash());
                    EventoExtraido evento = extractor.extraer(doc);
                    enrutar(evento);
                });
    }

    private void enrutar(EventoExtraido evento) {
        // Todo evento va a revisión manual por la política de confianza < 0.85 (actualmente 0.6 por carecer de IA)
        if (evento.esInterrupcionDeAcueducto()) {
            System.out.println("Enviando evento a revisión manual (Moderación M5): " + evento.sectoresMencionados());
            // Aquí iría el llamado a enviar el evento a la base de datos de Moderación.
        }
    }
}
