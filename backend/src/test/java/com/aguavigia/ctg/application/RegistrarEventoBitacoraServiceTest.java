package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.EventoBitacora;
import com.aguavigia.ctg.domain.EventoId;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoEvento;
import com.aguavigia.ctg.domain.port.out.EventoBitacoraRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

class RegistrarEventoBitacoraServiceTest {

    private EventoBitacoraRepository eventos;
    private RegistrarEventoBitacoraService servicio;

    @BeforeEach
    void montar() {
        eventos = mock(EventoBitacoraRepository.class);
        servicio = new RegistrarEventoBitacoraService(eventos);
    }

    private EventoBitacora evento(String id) {
        return new EventoBitacora(new EventoId(id), TipoEvento.CORTE_ANUNCIADO,
                new SectorId("manga"), new CorteId("corte-1"), Instant.parse("2026-08-09T10:00:00Z"),
                "descripción");
    }

    @Test
    void debeDelegarElGuardadoAlRepositorioSinAlterarElEvento() {
        EventoBitacora evento = evento("e1");

        servicio.registrar(evento);

        verify(eventos).guardar(evento);
        verifyNoMoreInteractions(eventos);
    }

    @Test
    void debePropagarLaExcepcionSiElRepositorioFalla() {
        EventoBitacora evento = evento("e2");
        given(eventos.guardar(evento)).willThrow(new RuntimeException("mongo caído"));

        assertThatThrownBy(() -> servicio.registrar(evento)).isInstanceOf(RuntimeException.class);
    }
}
