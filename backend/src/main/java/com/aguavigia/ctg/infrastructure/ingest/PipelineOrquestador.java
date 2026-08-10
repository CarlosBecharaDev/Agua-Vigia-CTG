package com.aguavigia.ctg.infrastructure.ingest;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
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
    private final DeduplicadorReciente deduplicador;
    private final HeuristicaExtractor extractor;
    private final SectorRepository sectorRepository;

    public PipelineOrquestador(AcuacarApiCollector acuacarApiCollector,
                               RssCollector rssCollector,
                               DeduplicadorReciente deduplicador,
                               HeuristicaExtractor extractor,
                               SectorRepository sectorRepository) {
        this.acuacarApiCollector = acuacarApiCollector;
        this.rssCollector = rssCollector;
        this.deduplicador = deduplicador;
        this.extractor = extractor;
        this.sectorRepository = sectorRepository;
    }

    /**
     * Ejecuta el pipeline periódicamente.
     */
    @Scheduled(fixedDelayString = "${ingesta.intervalo.milisegundos:600000}")
    public void ejecutarCiclo() {
        java.time.Instant desde = java.time.Instant.now().minus(java.time.Duration.ofDays(1));
        List<DocumentoCrudo> deAcuacar = acuacarApiCollector.obtenerDesde(desde);
        List<DocumentoCrudo> deRss = rssCollector.obtenerDesde(desde);

        Stream.concat(deAcuacar.stream(), deRss.stream())
                .filter(doc -> !deduplicador.yaVistoRecientemente(doc.hash()))
                .filter(doc -> PrefiltroDeterminista.posibleInterrupcionDeAcueducto(doc.texto()))
                .forEach(doc -> {
                    deduplicador.marcarComoVisto(doc.hash());
                    EventoExtraido evento = extractor.extraer(doc);
                    enrutar(evento);
                });
    }

    private void enrutar(EventoExtraido evento) {
        if (evento.esInterrupcionDeAcueducto()) {
            System.out.println("Reflejando evento en la base de datos: " + evento.sectoresMencionados() + " - Tipo: " + evento.tipo());
            List<Sector> todosSectores = sectorRepository.listarTodos();
            
            EstadoServicio nuevoEstado = EstadoServicio.SIN_SERVICIO;
            if ("PRESION_BAJA".equals(evento.tipo())) {
                nuevoEstado = EstadoServicio.PRESION_BAJA;
            } else if ("SERVICIO_NORMAL".equals(evento.tipo())) {
                nuevoEstado = EstadoServicio.CON_SERVICIO;
            }
            
            for (String sectorMencionado : evento.sectoresMencionados()) {
                String mencionadoNorm = normalizarParaComparacion(sectorMencionado);
                EstadoServicio estadoFinal = nuevoEstado;
                todosSectores.stream()
                        .filter(s -> normalizarParaComparacion(s.nombre()).contains(mencionadoNorm) || 
                                     mencionadoNorm.contains(normalizarParaComparacion(s.nombre())))
                        .forEach(s -> {
                            Sector actualizado = s.conEstado(estadoFinal);
                            sectorRepository.guardar(actualizado);
                            System.out.println("Sector actualizado: " + s.nombre() + " a " + estadoFinal);
                        });
            }
        }
    }
    
    private String normalizarParaComparacion(String texto) {
        if (texto == null) return "";
        return texto.toLowerCase()
                .replaceAll("[áàäâ]", "a")
                .replaceAll("[éèëê]", "e")
                .replaceAll("[íìïî]", "i")
                .replaceAll("[óòöô]", "o")
                .replaceAll("[úùüû]", "u")
                .replaceAll("[^a-z0-9]", "");
    }
}

