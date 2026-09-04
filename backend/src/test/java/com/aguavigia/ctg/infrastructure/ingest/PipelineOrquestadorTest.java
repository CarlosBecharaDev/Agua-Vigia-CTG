package com.aguavigia.ctg.infrastructure.ingest;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.RegistrarPropuestaIngestaUseCase;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import com.aguavigia.ctg.infrastructure.persistence.mongo.MarcaDeIngestaMongoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class PipelineOrquestadorTest {

    private static final Instant AHORA = Instant.parse("2026-08-09T15:30:00Z");

    private AcuacarApiCollector acuacar;
    private RssCollector rss;
    private DeduplicadorReciente deduplicador;
    private HeuristicaExtractor extractor;
    private SectorRepository sectores;
    private RegistrarPropuestaIngestaUseCase registrarPropuesta;
    private EstadoColectorRegistry estadoColectores;
    private MarcaDeIngestaMongoRepository marcas;
    private RelojPort reloj;

    private PipelineOrquestador orquestador;

    @BeforeEach
    void montar() {
        acuacar = mock(AcuacarApiCollector.class);
        rss = mock(RssCollector.class);
        deduplicador = mock(DeduplicadorReciente.class);
        extractor = mock(HeuristicaExtractor.class);
        sectores = mock(SectorRepository.class);
        registrarPropuesta = mock(RegistrarPropuestaIngestaUseCase.class);
        reloj = mock(RelojPort.class);
        marcas = mock(MarcaDeIngestaMongoRepository.class);
        // Real y no mock: es un contador en memoria sin dependencias, y así el test puede
        // comprobar de verdad lo que RNF007 exige reportar.
        estadoColectores = new EstadoColectorRegistry(() -> AHORA);

        given(marcas.findById(anyString())).willReturn(Optional.empty());

        given(reloj.ahora()).willReturn(AHORA);
        given(acuacar.obtenerDesde(any())).willReturn(List.of());
        given(rss.obtenerDesde(any())).willReturn(List.of());
        given(deduplicador.yaVistoRecientemente(any())).willReturn(false);
        given(registrarPropuesta.registrar(any(), any(), anyString(), any(), any(), anyDouble(), any(), any(), any(), any(), any()))
                .willReturn(Optional.empty());

        orquestador = new PipelineOrquestador(acuacar, rss, deduplicador, extractor, sectores,
                registrarPropuesta, estadoColectores, marcas, reloj);
    }

    private DocumentoCrudo documento(String texto) {
        return DocumentoCrudo.de("acuacar", "https://acuacar.com/x", AHORA, "Titulo", texto);
    }

    private EventoExtraido eventoParaSectores(List<String> sectoresMencionados) {
        return new EventoExtraido(true, "SUSPENSION_PROGRAMADA", sectoresMencionados,
                null, null, "daño", 0.6, List.of(), "cita del boletin");
    }

    private void hayUnDocumentoSobre(String texto, List<String> mencionados, List<Sector> sembrados) {
        given(acuacar.obtenerDesde(any())).willReturn(List.of(documento(texto)));
        given(extractor.extraer(any())).willReturn(eventoParaSectores(mencionados));
        given(sectores.listarTodos()).willReturn(sembrados);
    }

    // --- Lo esencial del rediseño: la ingesta propone, no publica ---

    @Test
    void nuncaDebeTocarElEstadoDeUnSectorPorSiMisma() {
        hayUnDocumentoSobre("Corte en Manga por daño en la red", List.of("Manga"),
                List.of(new Sector(new SectorId("manga"), "Manga", 1000, EstadoServicio.CON_SERVICIO)));

        orquestador.ejecutarCiclo();

        // Publicar es decisión del veedor (RevisarPropuestaIngestaUseCase), no de una regex.
        verify(sectores, never()).guardar(any());
    }

    @Test
    void debeRegistrarUnaPropuestaCuandoElNombreNormalizadoCoincideExactamente() {
        hayUnDocumentoSobre("Corte en Manga por daño en la red", List.of("Manga"),
                List.of(new Sector(new SectorId("manga"), "Manga", 1000, EstadoServicio.CON_SERVICIO)));

        orquestador.ejecutarCiclo();

        verify(registrarPropuesta).registrar(eq(new SectorId("manga")), eq(EstadoServicio.SIN_SERVICIO),
                eq("acuacar"), eq("https://acuacar.com/x"), eq("cita del boletin"), eq(0.6),
                any(), any(), any(), any(), any());
    }

    @Test
    void noDebeProponerParaUnSectorCuyoNombreSoloContieneLaMencionComoSubstring() {
        // "Manga" es substring de "Mangaville" — el emparejamiento laxo anterior podía pintar
        // decenas de barrios con un solo artículo.
        hayUnDocumentoSobre("Corte en Manga por daño en la red", List.of("Manga"),
                List.of(new Sector(new SectorId("mangaville"), "Mangaville", 500, EstadoServicio.CON_SERVICIO)));

        orquestador.ejecutarCiclo();

        verify(registrarPropuesta, never()).registrar(any(), any(), anyString(), any(), any(), anyDouble(), any(), any(), any(), any(), any());
    }

    // --- Aislamiento de fallos (RNF004) ---

    @Test
    void unColectorCaidoNoDebeImpedirQueSeLeaElOtro() {
        given(acuacar.obtenerDesde(any())).willThrow(new IllegalStateException("acuacar.com responde 503"));
        given(rss.obtenerDesde(any())).willReturn(List.of(documento("Corte en Manga por daño en la red")));
        given(extractor.extraer(any())).willReturn(eventoParaSectores(List.of("Manga")));
        given(sectores.listarTodos()).willReturn(
                List.of(new Sector(new SectorId("manga"), "Manga", 1000, EstadoServicio.CON_SERVICIO)));

        orquestador.ejecutarCiclo();

        verify(registrarPropuesta).registrar(eq(new SectorId("manga")), any(), anyString(), any(), any(), anyDouble(), any(), any(), any(), any(), any());
    }

    @Test
    void losDosColectoresCaidosNoDebenTumbarElCiclo() {
        given(acuacar.obtenerDesde(any())).willThrow(new IllegalStateException("sin user agent"));
        given(rss.obtenerDesde(any())).willThrow(new IllegalStateException("sin user agent"));

        orquestador.ejecutarCiclo();

        verify(registrarPropuesta, never()).registrar(any(), any(), anyString(), any(), any(), anyDouble(), any(), any(), any(), any(), any());
    }

    // --- Salud por colector (RNF007) ---

    @Test
    void debeRegistrarLaUltimaEjecucionExitosaYLosItemsDeCadaColector() {
        given(acuacar.obtenerDesde(any())).willReturn(List.of(documento("Corte en Manga")));
        given(rss.obtenerDesde(any())).willReturn(List.of());
        given(extractor.extraer(any())).willReturn(eventoParaSectores(List.of()));
        given(sectores.listarTodos()).willReturn(List.of());

        orquestador.ejecutarCiclo();

        assertThat(estadoColectores.estados())
                .extracting(EstadoColector::nombre, EstadoColector::itemsProcesados,
                        EstadoColector::ultimaEjecucionExitosa, EstadoColector::fallosConsecutivos)
                .containsExactly(
                        tuple("acuacar", 1L, AHORA, 0),
                        tuple("rss", 0L, AHORA, 0));
    }

    @Test
    void debeRegistrarElFalloDeUnColectorConSuMotivo() {
        given(acuacar.obtenerDesde(any())).willThrow(new IllegalStateException("acuacar.com responde 503"));

        orquestador.ejecutarCiclo();

        EstadoColector acuacarEstado = estadoColectores.estados().getFirst();
        assertThat(acuacarEstado.nombre()).isEqualTo("acuacar");
        assertThat(acuacarEstado.fallosConsecutivos()).isEqualTo(1);
        assertThat(acuacarEstado.ultimaEjecucionExitosa()).isNull();
        assertThat(acuacarEstado.motivoDelUltimoFallo()).contains("503");
        assertThat(acuacarEstado.tasaDeError()).isEqualTo(1.0);
    }

    @Test
    void tresCiclosSeguidosFallandoDebenReportarElColectorComoCaido() {
        given(acuacar.obtenerDesde(any())).willThrow(new IllegalStateException("sin red"));

        orquestador.ejecutarCiclo();
        assertThat(estadoColectores.hayAlgunColectorCaido()).isFalse();
        orquestador.ejecutarCiclo();
        assertThat(estadoColectores.hayAlgunColectorCaido()).isFalse();
        orquestador.ejecutarCiclo();

        assertThat(estadoColectores.hayAlgunColectorCaido()).isTrue();
    }

    @Test
    void unCicloExitosoDebeLimpiarLaRachaDeFallos() {
        given(acuacar.obtenerDesde(any())).willThrow(new IllegalStateException("sin red"));
        orquestador.ejecutarCiclo();
        orquestador.ejecutarCiclo();
        orquestador.ejecutarCiclo();
        assertThat(estadoColectores.hayAlgunColectorCaido()).isTrue();

        org.mockito.Mockito.reset(acuacar);
        given(acuacar.obtenerDesde(any())).willReturn(List.of());
        orquestador.ejecutarCiclo();

        assertThat(estadoColectores.hayAlgunColectorCaido()).isFalse();
    }

    // --- Deduplicación (RNF006: cero descartes silenciosos) ---

    @Test
    void noDebeMarcarComoVistoUnDocumentoQueFalloAlProcesarse() {
        hayUnDocumentoSobre("Corte en Manga por daño en la red", List.of("Manga"),
                List.of(new Sector(new SectorId("manga"), "Manga", 1000, EstadoServicio.CON_SERVICIO)));
        given(registrarPropuesta.registrar(any(), any(), anyString(), any(), any(), anyDouble(), any(), any(), any(), any(), any()))
                .willThrow(new RuntimeException("Mongo caído"));

        orquestador.ejecutarCiclo();

        // Marcarlo dejaría el documento mudo los 7 días de la ventana del deduplicador y nadie
        // lo reintentaría nunca.
        verify(deduplicador, never()).marcarComoVisto(anyString());
    }

    @Test
    void debeMarcarComoVistoUnDocumentoProcesadoConExito() {
        hayUnDocumentoSobre("Corte en Manga por daño en la red", List.of("Manga"),
                List.of(new Sector(new SectorId("manga"), "Manga", 1000, EstadoServicio.CON_SERVICIO)));

        orquestador.ejecutarCiclo();

        verify(deduplicador).marcarComoVisto(anyString());
    }

    @Test
    void noDebeReprocesarUnDocumentoYaVisto() {
        hayUnDocumentoSobre("Corte en Manga por daño en la red", List.of("Manga"),
                List.of(new Sector(new SectorId("manga"), "Manga", 1000, EstadoServicio.CON_SERVICIO)));
        given(deduplicador.yaVistoRecientemente(anyString())).willReturn(true);

        orquestador.ejecutarCiclo();

        verify(registrarPropuesta, never()).registrar(any(), any(), anyString(), any(), any(), anyDouble(), any(), any(), any(), any(), any());
    }

    @Test
    void noDebeProcesarUnDocumentoQueNoPasaElPrefiltro() {
        hayUnDocumentoSobre("La alcaldia inauguro un parque en el centro historico", List.of("Manga"),
                List.of(new Sector(new SectorId("manga"), "Manga", 1000, EstadoServicio.CON_SERVICIO)));

        orquestador.ejecutarCiclo();

        verify(registrarPropuesta, never()).registrar(any(), any(), anyString(), any(), any(), anyDouble(), any(), any(), any(), any(), any());
        verify(deduplicador, never()).marcarComoVisto(anyString());
    }
}
