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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class CancelarSuscripcionServiceTest {

    private static final Instant CREADA = Instant.parse("2026-08-08T15:30:00Z");

    private SuscripcionRepository suscripciones;
    private CancelarSuscripcionService servicio;

    private Suscripcion confirmada() {
        return new Suscripcion(
                new SuscripcionId("s1"),
                new CorreoElectronico("vecino@correo.com"),
                List.of(new SectorId("bocagrande")),
                EstadoSuscripcion.CONFIRMADA,
                "token-1",
                CREADA);
    }

    @BeforeEach
    void montar() {
        suscripciones = mock(SuscripcionRepository.class);
        servicio = new CancelarSuscripcionService(suscripciones);

        given(suscripciones.guardar(any(Suscripcion.class)))
                .willAnswer(invocacion -> invocacion.getArgument(0));
    }

    @Test
    void debeCancelarUnaSuscripcionConfirmada() {
        given(suscripciones.buscarPorTokenConfirmacion("token-1")).willReturn(Optional.of(confirmada()));

        Suscripcion cancelada = servicio.cancelar("token-1");

        assertThat(cancelada.estado()).isEqualTo(EstadoSuscripcion.CANCELADA);
        verify(suscripciones).guardar(cancelada);
    }

    @Test
    void debeSerIdempotenteAlCancelarAlgoYaCancelado() {
        Suscripcion yaCancelada = new Suscripcion(
                new SuscripcionId("s1"),
                new CorreoElectronico("vecino@correo.com"),
                List.of(new SectorId("bocagrande")),
                EstadoSuscripcion.CANCELADA,
                "token-1",
                CREADA);
        given(suscripciones.buscarPorTokenConfirmacion("token-1")).willReturn(Optional.of(yaCancelada));
        given(suscripciones.guardar(any())).willAnswer(invocacion -> invocacion.getArgument(0));

        Suscripcion resultado = servicio.cancelar("token-1");

        assertThat(resultado.estado()).isEqualTo(EstadoSuscripcion.CANCELADA);
    }

    @Test
    void debeRechazarUnTokenDeBajaInvalido() {
        given(suscripciones.buscarPorTokenConfirmacion("token-x")).willReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.cancelar("token-x"))
                .isInstanceOf(IllegalArgumentException.class);

        verify(suscripciones, never()).guardar(any());
    }
}