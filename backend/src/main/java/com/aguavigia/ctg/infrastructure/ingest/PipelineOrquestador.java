package com.aguavigia.ctg.infrastructure.ingest;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.RegistrarPropuestaIngestaUseCase;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import com.aguavigia.ctg.infrastructure.persistence.mongo.MarcaDeIngestaDocumento;
import com.aguavigia.ctg.infrastructure.persistence.mongo.MarcaDeIngestaMongoRepository;
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
     * Desde dónde lee un colector que nunca ha corrido. Acuacar publica desde mayo de 2020, así que
     * la primera ejecución se trae el histórico completo (317 boletines el 30/08/2026): sin él, las
     * estadísticas y el Índice de Cumplimiento solo tendrían lo publicado desde que alguien encendió
     * el sistema, que no es una medición de la ciudad sino de nuestro tiempo de actividad.
     */
    private static final Instant ORIGEN = Instant.parse("2020-01-01T00:00:00Z");

    /**
     * Cuánto se relee hacia atrás por encima de la marca. La API de WordPress filtra por fecha de
     * publicación, y un boletín editado después de publicarse no cambia de fecha: sin este solape,
     * una corrección publicada un minuto antes de la marca no se volvería a mirar nunca.
     */
    private static final Duration SOLAPE = Duration.ofDays(2);

    private final AcuacarApiCollector acuacarApiCollector;
    private final RssCollector rssCollector;
    private final DeduplicadorReciente deduplicador;
    private final HeuristicaExtractor extractor;
    private final SectorRepository sectorRepository;
    private final RegistrarPropuestaIngestaUseCase registrarPropuesta;
    private final EstadoColectorRegistry estadoColectores;
    private final MarcaDeIngestaMongoRepository marcas;
    private final RelojPort reloj;

    public PipelineOrquestador(AcuacarApiCollector acuacarApiCollector,
                               RssCollector rssCollector,
                               DeduplicadorReciente deduplicador,
                               HeuristicaExtractor extractor,
                               SectorRepository sectorRepository,
                               RegistrarPropuestaIngestaUseCase registrarPropuesta,
                               EstadoColectorRegistry estadoColectores,
                               MarcaDeIngestaMongoRepository marcas,
                               RelojPort reloj) {
        this.acuacarApiCollector = acuacarApiCollector;
        this.rssCollector = rssCollector;
        this.deduplicador = deduplicador;
        this.extractor = extractor;
        this.sectorRepository = sectorRepository;
        this.registrarPropuesta = registrarPropuesta;
        this.estadoColectores = estadoColectores;
        this.marcas = marcas;
        this.reloj = reloj;
    }

    /**
     * Cada fuente arranca donde quedó, no en los últimos N días. Una ventana rodante daba por
     * perdido todo lo publicado mientras el sistema estaba apagado más tiempo que la ventana:
     * medido el 30/08/2026, el boletín más reciente de Acuacar tenía 9 días y la ventana era de 7,
     * así que el ciclo no veía absolutamente nada y los boletines de corte de julio y agosto nunca
     * se ingirieron.
     */
    @Scheduled(fixedDelayString = "${aguavigia.ingesta.intervalo-ms:600000}")
    public void ejecutarCiclo() {
        List<DocumentoCrudo> deAcuacar = recolectar("acuacar", () -> acuacarApiCollector.obtenerDesde(desdeDondeLeer("acuacar")));
        List<DocumentoCrudo> deRss = recolectar("rss", () -> rssCollector.obtenerDesde(desdeDondeLeer("rss")));

        List<DocumentoCrudo> documentos = new ArrayList<>();
        documentos.addAll(deAcuacar);
        documentos.addAll(deRss);

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

        avanzarMarca("acuacar", deAcuacar);
        avanzarMarca("rss", deRss);
    }

    /**
     * Dónde retomar la lectura de una fuente. El solape hacia atrás es deliberado: reprocesar unos
     * pocos boletines no cuesta nada porque el deduplicador los descarta por hash, mientras que
     * saltarse uno lo pierde para siempre.
     */
    private Instant desdeDondeLeer(String fuente) {
        return marcas.findById(fuente)
                .map(MarcaDeIngestaDocumento::getUltimoPublicadoEn)
                .map(marca -> marca.minus(SOLAPE))
                .orElse(ORIGEN);
    }

    /**
     * La marca se guarda con el nombre del **colector**, no con el de `DocumentoCrudo.fuente()`: en
     * el RSS cada feed se identifica por su medio (`zona-cero`, `caracol-radio`), así que agrupar
     * por el campo del documento escribía marcas que `desdeDondeLeer("rss")` nunca encontraba y el
     * colector volvía al origen en cada ciclo.
     *
     * Avanza al más reciente que se llegó a *recolectar*, no al que produjo una propuesta: un
     * boletín que no habla de cortes también está leído. Un colector que falló devuelve lista vacía,
     * así que su marca no se mueve y el próximo ciclo reintenta desde el mismo punto.
     */
    private void avanzarMarca(String colector, List<DocumentoCrudo> documentos) {
        documentos.stream()
                .map(DocumentoCrudo::publicadoEn)
                .filter(java.util.Objects::nonNull)
                .max(java.util.Comparator.naturalOrder())
                .ifPresent(masReciente -> {
                    marcas.save(new MarcaDeIngestaDocumento(colector, masReciente));
                    log.info("Marca de ingesta de '{}' avanzada a {}", colector, masReciente);
                });
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
                        evento.inicioDeclarado(), evento.finPrometido(), documento.imagenUrl(), documento.publicadoEn(), documento.titulo());
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
