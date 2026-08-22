package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.EstadoRevision;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.EventoBitacora;
import com.aguavigia.ctg.domain.PropuestaId;
import com.aguavigia.ctg.domain.PropuestaIngesta;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoEvento;
import com.aguavigia.ctg.domain.port.in.RegistrarEventoBitacoraUseCase;
import com.aguavigia.ctg.domain.port.out.PropuestaIngestaRepository;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class RevisarPropuestaIngestaServiceTest {

    private static final Instant AHORA = Instant.parse("2026-08-09T15:30:00Z");
    private static final PropuestaId ID = new PropuestaId("p-1");
    private static final SectorId MANGA = new SectorId("manga");

    private PropuestaIngestaRepository propuestas;
    private SectorRepository sectores;
    private RegistrarEventoBitacoraUseCase registrarEvento;
    private RevisarPropuestaIngestaService servicio;

    @BeforeEach
    void montar() {
        propuestas = mock(PropuestaIngestaRepository.class);
        sectores = mock(SectorRepository.class);
        registrarEvento = mock(RegistrarEventoBitacoraUseCase.class);
        RelojPort reloj = () -> AHORA;
        servicio = new RevisarPropuestaIngestaService(propuestas, sectores, registrarEvento, reloj);

        given(propuestas.guardar(any())).willAnswer(invocacion -> invocacion.getArgument(0));
        given(propuestas.buscarPorId(ID)).willReturn(Optional.of(propuestaPendiente()));
    }

    private PropuestaIngesta propuestaPendiente() {
        return new PropuestaIngesta(ID, MANGA, EstadoServicio.SIN_SERVICIO, "acuacar",
                "https://acuacar.com/x", "cita", 0.6, AHORA);
    }

    private void sectorEsta(EstadoServicio estado) {
        given(sectores.buscarPorId(MANGA)).willReturn(Optional.of(new Sector(MANGA, "Manga", 1000, estado)));
    }

    @Test
    void aprobarDebeAplicarElEstadoAlSectorYAnexarloALaBitacora() {
        sectorEsta(EstadoServicio.CON_SERVICIO);

        PropuestaIngesta resultado = servicio.aprobar(ID);

        assertThat(resultado.estadoRevision()).isEqualTo(EstadoRevision.APROBADA);
        verify(sectores).guardar(new Sector(MANGA, "Manga", 1000, EstadoServicio.SIN_SERVICIO));

        ArgumentCaptor<EventoBitacora> captor = ArgumentCaptor.forClass(EventoBitacora.class);
        verify(registrarEvento).registrar(captor.capture());
        assertThat(captor.getValue().tipo()).isEqualTo(TipoEvento.CORTE_DETECTADO_POR_INGESTA);
        assertThat(captor.getValue().sectorId()).isEqualTo(MANGA);
        assertThat(captor.getValue().timestamp()).isEqualTo(AHORA);
        assertThat(captor.getValue().descripcion()).contains("acuacar");
    }

    @Test
    void aprobarUnaPropuestaCuyoEstadoYaRigeNoDebeDuplicarElEventoDeBitacora() {
        sectorEsta(EstadoServicio.SIN_SERVICIO);

        PropuestaIngesta resultado = servicio.aprobar(ID);

        assertThat(resultado.estadoRevision()).isEqualTo(EstadoRevision.APROBADA);
        verify(sectores, never()).guardar(any());
        verify(registrarEvento, never()).registrar(any());
    }

    @Test
    void descartarNoDebeTocarElSectorNiLaBitacora() {
        PropuestaIngesta resultado = servicio.descartar(ID);

        assertThat(resultado.estadoRevision()).isEqualTo(EstadoRevision.DESCARTADA);
        verify(sectores, never()).guardar(any());
        verify(registrarEvento, never()).registrar(any());
    }

    @Test
    void debeRechazarRevisarUnaPropuestaQueNoExiste() {
        given(propuestas.buscarPorId(any())).willReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.aprobar(new PropuestaId("no-existe")))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> servicio.descartar(new PropuestaId("no-existe")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    /** 409 y no 500: la petición está bien formada, es el estado del sistema lo que la impide. */
    @Test
    void aprobarDebeFallarConConflictoSiElSectorYaNoExiste() {
        given(sectores.buscarPorId(MANGA)).willReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.aprobar(ID)).isInstanceOf(IllegalStateException.class);
        verify(propuestas, never()).guardar(any());
    }
}
