package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.EstadoSuscripcion;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.Suscripcion;
import com.aguavigia.ctg.domain.SuscripcionId;
import com.aguavigia.ctg.domain.port.out.SuscripcionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

class ConfirmarSuscripcionServiceTest {

    private static final Instant AHORA = Instant.parse("2026-08-08T15:30:00Z");

    private SuscripcionRepository suscripciones;
    private ConfirmarSuscripcionService servicio;

    @BeforeEach
    void montar() {
        suscripciones = mock(SuscripcionRepository.class);
        servicio = new ConfirmarSuscripcionService(suscripciones);
        given(suscripciones.guardar(any(Suscripcion.class)))
                .willAnswer(invocacion -> invocacion.getArgument(0));
    }

    @Test
    void debeConfirmarLaSuscripcionEncontradaPorToken() {
        Suscripcion pendiente = new Suscripcion(
                new SuscripcionId("s1"), new CorreoElectronico("vecino@correo.com"),
                List.of(new SectorId("bocagrande")), EstadoSuscripcion.PENDIENTE_CONFIRMACION,
                "token-1", AHORA);
        given(suscripciones.buscarPorToken("token-1")).willReturn(Optional.of(pendiente));

        Suscripcion confirmada = servicio.confirmar("token-1");

        assertThat(confirmada.estado()).isEqualTo(EstadoSuscripcion.CONFIRMADA);
    }

    @Test
    void debeRechazarUnTokenQueNoExiste() {
        given(suscripciones.buscarPorToken("no-existe")).willReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.confirmar("no-existe"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
