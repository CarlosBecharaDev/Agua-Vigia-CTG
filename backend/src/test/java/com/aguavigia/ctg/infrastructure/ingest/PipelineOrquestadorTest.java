package com.aguavigia.ctg.infrastructure.ingest;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.EventoBitacora;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoEvento;
import com.aguavigia.ctg.domain.port.in.RegistrarEventoBitacoraUseCase;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
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
    private RegistrarEventoBitacoraUseCase registrarEvento;
    private RelojPort reloj;

    private PipelineOrquestador orquestador;

    @BeforeEach
    void montar() {
        acuacar = mock(AcuacarApiCollector.class);
        rss = mock(RssCollector.class);
        deduplicador = mock(DeduplicadorReciente.class);
        extractor = mock(HeuristicaExtractor.class);
        sectores = mock(SectorRepository.class);
        registrarEvento = mock(RegistrarEventoBitacoraUseCase.class);
        reloj = mock(RelojPort.class);

        given(reloj.ahora()).willReturn(AHORA);
        given(rss.obtenerDesde(any())).willReturn(List.of());
        given(deduplicador.yaVistoRecientemente(any())).willReturn(false);

        orquestador = new PipelineOrquestador(acuacar, rss, deduplicador, extractor, sectores, registrarEvento, reloj);
    }

    private DocumentoCrudo documento(String texto) {
        return DocumentoCrudo.de("acuacar", "https://acuacar.com/x", AHORA, "Titulo", texto);
    }

    private EventoExtraido eventoParaSectores(List<String> sectoresMencionados) {
        return new EventoExtraido(true, "SUSPENSION_PROGRAMADA", sectoresMencionados, AHORA, AHORA, "daño", 0.6, List.of(), "cita");
    }

    @Test
    void noDebeActualizarUnSectorCuyoNombreSoloContieneLaMencionComoSubstring() {
        given(acuacar.obtenerDesde(any())).willReturn(List.of(documento("Corte en Manga por daño en la red")));
        given(extractor.extraer(any())).willReturn(eventoParaSectores(List.of("Manga")));
        // "Manga" es substring de "Mangaville" — el emparejamiento laxo anterior lo hubiera actualizado igual.
        given(sectores.listarTodos()).willReturn(List.of(
                new Sector(new SectorId("mangaville"), "Mangaville", 500, EstadoServicio.CON_SERVICIO)));

        orquestador.ejecutarCiclo();

        verify(sectores, never()).guardar(any());
        verify(registrarEvento, never()).registrar(any());
    }

    @Test
    void debeActualizarElSectorCuyoNombreNormalizadoCoincideExactamente() {
        given(acuacar.obtenerDesde(any())).willReturn(List.of(documento("Corte en Manga por daño en la red")));
        given(extractor.extraer(any())).willReturn(eventoParaSectores(List.of("Manga")));
        given(sectores.listarTodos()).willReturn(List.of(
                new Sector(new SectorId("manga"), "Manga", 1000, EstadoServicio.CON_SERVICIO)));

        orquestador.ejecutarCiclo();

        verify(sectores).guardar(new Sector(new SectorId("manga"), "Manga", 1000, EstadoServicio.SIN_SERVICIO));

        var captor = org.mockito.ArgumentCaptor.forClass(EventoBitacora.class);
        verify(registrarEvento).registrar(captor.capture());
        assertThat(captor.getValue().tipo()).isEqualTo(TipoEvento.CORTE_DETECTADO_POR_INGESTA);
        assertThat(captor.getValue().sectorId()).isEqualTo(new SectorId("manga"));
    }

    @Test
    void noDebeGuardarNiAnexarEventoSiElEstadoNoCambia() {
        given(acuacar.obtenerDesde(any())).willReturn(List.of(documento("Corte en Manga por daño en la red")));
        given(extractor.extraer(any())).willReturn(eventoParaSectores(List.of("Manga")));
        given(sectores.listarTodos()).willReturn(List.of(
                new Sector(new SectorId("manga"), "Manga", 1000, EstadoServicio.SIN_SERVICIO)));

        orquestador.ejecutarCiclo();

        verify(sectores, never()).guardar(any());
        verify(registrarEvento, never()).registrar(any());
    }
}
