package com.aguavigia.ctg.infrastructure.ingest;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.RegistrarPropuestaIngestaUseCase;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Orquestador principal del pipeline de Ingesta Automatizada (M9).
 *
 * **No decide qué se publica: siempre entrega a `RegistrarPropuestaIngestaUseCase`**, que separa lo
 * oficial de lo inferido. Un boletín de Acuacar sale al mapa en el acto; una nota de prensa queda
 * PENDIENTE para el veedor. Lo que este orquestador nunca vuelve a hacer es llamar a
 * `SectorRepository.guardar()` directamente, que es lo que permitía que una expresión regular sobre
 * prensa cambiara el estado público de un barrio y disparara correo, push y SSE sin revisión.
 *
 * Cada colector se llama por separado y con su propio try/catch: son sitios de terceros
 * independientes y uno caído no puede impedir que se lea el otro (RNF004). `RssCollector` ya aislaba
 * feed por feed; lo que faltaba era el mismo aislamiento a nivel de fuente.
 */
@Service
public class PipelineOrquestador {

    private static final Logger log = LoggerFactory.getLogger(PipelineOrquestador.class);
    /**
     * Siete días, no uno. Acuacar publica cada 3–7 días: medido sobre su API el 22/08/2026, la
     * ventana de un día devolvía 0 documentos mientras el boletín más reciente —una suspensión real
     * en 20 barrios— tenía 34 horas. El ciclo corría cada 10 minutos contra el vacío. El
     * deduplicador (7 días) evita que reprocesar la misma ventana genere propuestas repetidas.
     */
    private static final Duration VENTANA_DE_BUSQUEDA = Duration.ofDays(7);

    private final AcuacarApiCollector acuacarApiCollector;
    private final RssCollector rssCollector;
    private final DeduplicadorReciente deduplicador;
    private final HeuristicaExtractor extractor;
    private final SectorRepository sectorRepository;
    private final RegistrarPropuestaIngestaUseCase registrarPropuesta;
    private final EstadoColectorRegistry estadoColectores;
    private final RelojPort reloj;

    public PipelineOrquestador(AcuacarApiCollector acuacarApiCollector,
                               RssCollector rssCollector,
                               DeduplicadorReciente deduplicador,
                               HeuristicaExtractor extractor,
                               SectorRepository sectorRepository,
                               RegistrarPropuestaIngestaUseCase registrarPropuesta,
                               EstadoColectorRegistry estadoColectores,
                               RelojPort reloj) {
        this.acuacarApiCollector = acuacarApiCollector;
        this.rssCollector = rssCollector;
        this.deduplicador = deduplicador;
        this.extractor = extractor;
        this.sectorRepository = sectorRepository;
        this.registrarPropuesta = registrarPropuesta;
        this.estadoColectores = estadoColectores;
        this.reloj = reloj;
    }

    @Scheduled(fixedDelayString = "${aguavigia.ingesta.intervalo-ms:600000}")
    public void ejecutarCiclo() {
        Instant desde = reloj.ahora().minus(VENTANA_DE_BUSQUEDA);

        List<DocumentoCrudo> documentos = new ArrayList<>();
        documentos.addAll(recolectar("acuacar", () -> acuacarApiCollector.obtenerDesde(desde)));
        documentos.addAll(recolectar("rss", () -> rssCollector.obtenerDesde(desde)));

        // listarTodos() una sola vez por ciclo: son 213 barrios y antes se pedia dentro del bucle,
        // una vez por documento que pasara el prefiltro.
        List<Sector> sectores = sectorRepository.listarTodos();

        EmparejadorDeSectores emparejador = new EmparejadorDeSectores(sectores);
        for (DocumentoCrudo documento : documentos) {
            if (deduplicador.yaVistoRecientemente(documento.hash())) {
                continue;
            }
            if (!PrefiltroDeterminista.posibleInterrupcionDeAcueducto(documento.texto())) {
                continue;
            }
            procesar(documento, emparejador);
        }
    }

    private interface Colector {
        List<DocumentoCrudo> obtener();
    }

    /**
     * Un colector caído devuelve lista vacía en vez de tumbar el ciclo. Antes, un 5xx de
     * acuacar.com —o un COLLECTOR_USER_AGENT sin configurar— lanzaba antes de que el RSS se
     * llegara a leer.
     *
     * El resultado se registra en `EstadoColectorRegistry` pase lo que pase: RNF007 pide saber
     * cuándo fue la última ejecución exitosa de cada colector, y eso no se puede reconstruir
     * después si el fallo se tragó en silencio.
     */
    private List<DocumentoCrudo> recolectar(String nombre, Colector colector) {
        try {
            List<DocumentoCrudo> documentos = colector.obtener();
            estadoColectores.registrarExito(nombre, documentos.size());
            return documentos;
        } catch (Exception fallo) {
            log.warn("El colector '{}' falló en este ciclo, se sigue con el resto: {}", nombre, fallo.toString());
            estadoColectores.registrarFallo(nombre, fallo.toString());
            return List.of();
        }
    }

    /**
     * Se marca como visto **después** de registrar la propuesta, no antes: si el registro falla, el
     * documento debe poder reintentarse en el siguiente ciclo. Marcarlo primero lo dejaba mudo
     * durante los 7 días de la ventana del deduplicador, que es el descarte silencioso que RNF006
     * prohíbe.
     */
    private void procesar(DocumentoCrudo documento, EmparejadorDeSectores emparejador) {
        try {
            EventoExtraido evento = extractor.extraer(documento);
            if (!evento.esInterrupcionDeAcueducto()) {
                deduplicador.marcarComoVisto(documento.hash());
                return;
            }

            EstadoServicio estadoPropuesto = aEstadoServicio(evento, reloj.ahora());
            EmparejadorDeSectores.Resultado emparejados =
                    emparejador.emparejar(evento.sectoresMencionados());

            // RNF006: lo que la fuente nombra y el catálogo no reconoce se deja anotado. Antes
            // desaparecía sin rastro, y con ello la única señal de que al GeoJSON le faltan barrios.
            if (!emparejados.noReconocidos().isEmpty()) {
                log.info("Ingesta de '{}': {} nombre(s) sin sector en el catálogo: {}",
                        documento.fuente(), emparejados.noReconocidos().size(),
                        emparejados.noReconocidos());
            }

            for (SectorId sectorId : emparejados.sectores()) {
                registrarPropuesta.registrar(sectorId, estadoPropuesto, documento.fuente(),
                        documento.urlOriginal(), evento.citaTextual(), evento.confianza(),
                        evento.inicioDeclarado(), evento.finPrometido());
            }
            deduplicador.marcarComoVisto(documento.hash());
        } catch (Exception fallo) {
            log.warn("Documento de '{}' no procesado, se reintentará en el próximo ciclo: {}",
                    documento.fuente(), fallo.toString());
        }
    }

    /**
     * Una suspensión anunciada para mañana es un CORTE_PROGRAMADO, no un SIN_SERVICIO: antes
     * cualquier aviso caía en el `default` y el mapa pintaba de rojo barrios que en ese momento
     * tenían agua. La distinción sale de la ventana que el boletín declara; si no la declara, se
     * mantiene el estado del tipo de evento en vez de suponer un horario.
     */
    private static EstadoServicio aEstadoServicio(EventoExtraido evento, Instant ahora) {
        return switch (evento.tipo()) {
            case "PRESION_BAJA" -> EstadoServicio.PRESION_BAJA;
            case "SERVICIO_NORMAL" -> EstadoServicio.CON_SERVICIO;
            default -> {
                Instant inicio = evento.inicioDeclarado();
                Instant fin = evento.finPrometido();
                if (inicio != null && ahora.isBefore(inicio)) {
                    yield EstadoServicio.CORTE_PROGRAMADO;
                }
                if (fin != null && !ahora.isBefore(fin)) {
                    yield EstadoServicio.CON_SERVICIO;
                }
                yield EstadoServicio.SIN_SERVICIO;
            }
        };
    }
}
