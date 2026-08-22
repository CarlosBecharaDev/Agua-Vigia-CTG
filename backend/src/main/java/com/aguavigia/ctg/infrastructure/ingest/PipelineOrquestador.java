package com.aguavigia.ctg.infrastructure.ingest;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.EventoBitacoraFactory;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.port.in.RegistrarEventoBitacoraUseCase;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.stream.Stream;

/**
 * Orquestador principal del pipeline de Ingesta Automatizada (M9).
 */
@Service
public class PipelineOrquestador {

    private static final Logger log = LoggerFactory.getLogger(PipelineOrquestador.class);

    private final AcuacarApiCollector acuacarApiCollector;
    private final RssCollector rssCollector;
    private final DeduplicadorReciente deduplicador;
    private final HeuristicaExtractor extractor;
    private final SectorRepository sectorRepository;
    private final RegistrarEventoBitacoraUseCase registrarEvento;
    private final RelojPort reloj;

    public PipelineOrquestador(AcuacarApiCollector acuacarApiCollector,
                               RssCollector rssCollector,
                               DeduplicadorReciente deduplicador,
                               HeuristicaExtractor extractor,
                               SectorRepository sectorRepository,
                               RegistrarEventoBitacoraUseCase registrarEvento,
                               RelojPort reloj) {
        this.acuacarApiCollector = acuacarApiCollector;
        this.rssCollector = rssCollector;
        this.deduplicador = deduplicador;
        this.extractor = extractor;
        this.sectorRepository = sectorRepository;
        this.registrarEvento = registrarEvento;
        this.reloj = reloj;
    }

    /**
     * Ejecuta el pipeline periódicamente.
     */
    @Scheduled(fixedDelayString = "${aguavigia.ingesta.intervalo-ms:600000}")
    public void ejecutarCiclo() {
        java.time.Instant desde = reloj.ahora().minus(Duration.ofDays(1));
        List<DocumentoCrudo> deAcuacar = acuacarApiCollector.obtenerDesde(desde);
        List<DocumentoCrudo> deRss = rssCollector.obtenerDesde(desde);

        Stream.concat(deAcuacar.stream(), deRss.stream())
                .filter(doc -> !deduplicador.yaVistoRecientemente(doc.hash()))
                .filter(doc -> PrefiltroDeterminista.posibleInterrupcionDeAcueducto(doc.texto()))
                .forEach(doc -> {
                    deduplicador.marcarComoVisto(doc.hash());
                    EventoExtraido evento = extractor.extraer(doc);
                    enrutar(evento, doc.fuente());
                });
    }

    private void enrutar(EventoExtraido evento, String fuente) {
        if (!evento.esInterrupcionDeAcueducto()) {
            return;
        }
        log.info("Reflejando evento en la base de datos: {} - Tipo: {}", evento.sectoresMencionados(), evento.tipo());
        List<Sector> todosSectores = sectorRepository.listarTodos();

        EstadoServicio nuevoEstado = switch (evento.tipo()) {
            case "PRESION_BAJA" -> EstadoServicio.PRESION_BAJA;
            case "SERVICIO_NORMAL" -> EstadoServicio.CON_SERVICIO;
            default -> EstadoServicio.SIN_SERVICIO;
        };

        for (String sectorMencionado : evento.sectoresMencionados()) {
            String mencionadoNorm = normalizarParaComparacion(sectorMencionado);
            // Coincidencia exacta del nombre normalizado, no `contains`: una mención larga
            // extraída de una nota de prensa contenía como substring el nombre de decenas de los
            // 211 barrios sembrados, y un solo artículo podía pintar media Cartagena de rojo.
            todosSectores.stream()
                    .filter(s -> normalizarParaComparacion(s.nombre()).equals(mencionadoNorm))
                    .forEach(s -> actualizarSector(s, nuevoEstado, fuente));
        }
    }

    private void actualizarSector(Sector sector, EstadoServicio nuevoEstado, String fuente) {
        if (sector.estadoActual() == nuevoEstado) {
            return;
        }
        Sector actualizado = sector.conEstado(nuevoEstado);
        sectorRepository.guardar(actualizado);
        log.info("Sector actualizado: {} a {}", sector.nombre(), nuevoEstado);

        // RF026: la ingesta cambia estado igual que el consenso ciudadano, así que también anexa
        // a la bitácora — antes lo hacía en silencio.
        registrarEvento.registrar(EventoBitacoraFactory.detectadoPorIngesta(
                sector.id(), nuevoEstado, fuente, reloj.ahora()));
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
