package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.EstadoRevision;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.PropuestaIngesta;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.RevisarPropuestaIngestaUseCase;
import com.aguavigia.ctg.domain.port.out.PropuestaIngestaRepository;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class RegistrarPropuestaIngestaServiceTest {

    private static final Instant AHORA = Instant.parse("2026-08-09T15:30:00Z");
    private static final SectorId MANGA = new SectorId("manga");

    private PropuestaIngestaRepository propuestas;
    private SectorRepository sectores;
    private RevisarPropuestaIngestaUseCase revisar;
    private RegistrarPropuestaIngestaService servicio;

    @BeforeEach
    void montar() {
        propuestas = mock(PropuestaIngestaRepository.class);
        sectores = mock(SectorRepository.class);
        revisar = mock(RevisarPropuestaIngestaUseCase.class);
        RelojPort reloj = () -> AHORA;
        servicio = new RegistrarPropuestaIngestaService(propuestas, sectores, revisar, reloj);

        given(propuestas.guardar(any())).willAnswer(invocacion -> invocacion.getArgument(0));
        given(sectores.buscarPorId(MANGA)).willReturn(
                Optional.of(new Sector(MANGA, "Manga", 1000, EstadoServicio.CON_SERVICIO)));
        given(revisar.aprobar(any())).willAnswer(invocacion -> PROPUESTA_APROBADA);
    }

    private static final PropuestaIngesta PROPUESTA_APROBADA = new PropuestaIngesta(
            new com.aguavigia.ctg.domain.PropuestaId("aprobada"), MANGA, EstadoServicio.SIN_SERVICIO,
            "acuacar", "https://acuacar.com/x", "cita del boletin", 0.85, AHORA,
            EstadoRevision.APROBADA, null, null);

    private Optional<PropuestaIngesta> registrar(String fuente) {
        return servicio.registrar(MANGA, EstadoServicio.SIN_SERVICIO, fuente,
                "https://acuacar.com/x", "cita del boletin", 0.6, null, null);
    }

    private Optional<PropuestaIngesta> registrar() {
        return registrar("rss");
    }

    @Test
    void debeEncolarComoPendienteLoQueVieneDePrensa() {
        Optional<PropuestaIngesta> resultado = registrar("rss");

        assertThat(resultado).isPresent();
        assertThat(resultado.get().estadoRevision()).isEqualTo(EstadoRevision.PENDIENTE);
        assertThat(resultado.get().sectorId()).isEqualTo(MANGA);
        assertThat(resultado.get().estadoPropuesto()).isEqualTo(EstadoServicio.SIN_SERVICIO);
        assertThat(resultado.get().citaTextual()).isEqualTo("cita del boletin");
        assertThat(resultado.get().detectadaEn()).isEqualTo(AHORA);
        verify(revisar, never()).aprobar(any());
    }

    /**
     * Acuacar es el operador: su boletín se publica sin esperar al veedor. Se delega en el mismo
     * caso de uso que usa el panel para que el camino automático no pueda divergir del manual.
     */
    @Test
    void debePublicarSinRevisionLoQueVieneDeAcuacar() {
        Optional<PropuestaIngesta> resultado = registrar("acuacar");

        assertThat(resultado).isPresent();
        assertThat(resultado.get().estadoRevision()).isEqualTo(EstadoRevision.APROBADA);
        verify(revisar).aprobar(any());
    }

    /** Un nombre extraído de una nota de prensa no tiene por qué ser un barrio de Cartagena. */
    @Test
    void noDebeRegistrarNadaSiElSectorNoExiste() {
        given(sectores.buscarPorId(MANGA)).willReturn(Optional.empty());

        assertThat(registrar()).isEmpty();
        verify(propuestas, never()).guardar(any());
    }

    /**
     * Los cuatro feeds cubren las mismas noticias con hashes distintos, así que el deduplicador por
     * documento no las une: sin este chequeo, un solo corte le deja al veedor cuatro propuestas
     * idénticas.
     */
    @Test
    void noDebeDuplicarUnaPropuestaPendienteIdentica() {
        given(propuestas.existePendiente(MANGA, EstadoServicio.SIN_SERVICIO)).willReturn(true);

        assertThat(registrar()).isEmpty();
        verify(propuestas, never()).guardar(any());
    }

    /** Publicar es cosa de {@link RevisarPropuestaIngestaUseCase}; este servicio nunca escribe el sector. */
    @Test
    void nuncaDebeTocarElEstadoDelSectorDirectamente() {
        registrar("rss");
        registrar("acuacar");

        verify(sectores, never()).guardar(any());
    }
}
