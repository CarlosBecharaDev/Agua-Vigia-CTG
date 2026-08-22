package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.EstadoRevision;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.PropuestaIngesta;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
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
    private RegistrarPropuestaIngestaService servicio;

    @BeforeEach
    void montar() {
        propuestas = mock(PropuestaIngestaRepository.class);
        sectores = mock(SectorRepository.class);
        RelojPort reloj = () -> AHORA;
        servicio = new RegistrarPropuestaIngestaService(propuestas, sectores, reloj);

        given(propuestas.guardar(any())).willAnswer(invocacion -> invocacion.getArgument(0));
        given(sectores.buscarPorId(MANGA)).willReturn(
                Optional.of(new Sector(MANGA, "Manga", 1000, EstadoServicio.CON_SERVICIO)));
    }

    private Optional<PropuestaIngesta> registrar() {
        return servicio.registrar(MANGA, EstadoServicio.SIN_SERVICIO, "acuacar",
                "https://acuacar.com/x", "cita del boletin", 0.6, null, null);
    }

    @Test
    void debeRegistrarLaPropuestaComoPendiente() {
        Optional<PropuestaIngesta> resultado = registrar();

        assertThat(resultado).isPresent();
        assertThat(resultado.get().estadoRevision()).isEqualTo(EstadoRevision.PENDIENTE);
        assertThat(resultado.get().sectorId()).isEqualTo(MANGA);
        assertThat(resultado.get().estadoPropuesto()).isEqualTo(EstadoServicio.SIN_SERVICIO);
        assertThat(resultado.get().citaTextual()).isEqualTo("cita del boletin");
        assertThat(resultado.get().detectadaEn()).isEqualTo(AHORA);
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

    @Test
    void nuncaDebeTocarElEstadoDelSector() {
        registrar();

        verify(sectores, never()).guardar(any());
    }
}
