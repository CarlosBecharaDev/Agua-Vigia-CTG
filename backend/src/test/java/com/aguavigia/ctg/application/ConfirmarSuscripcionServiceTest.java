package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.EstadoSuscripcion;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.Suscripcion;
import com.aguavigia.ctg.domain.SuscripcionId;
import com.aguavigia.ctg.domain.port.out.RelojPort;
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

class ConfirmarSuscripcionServiceTest {

    private static final Instant CREADA = Instant.parse("2026-08-08T15:30:00Z");
    private static final Instant AHORA = CREADA.plusSeconds(3600);

    private SuscripcionRepository suscripciones;
    private ConfirmarSuscripcionService servicio;

    private Suscripcion pendiente() {
        return new Suscripcion(
                new SuscripcionId("s1"),
                new CorreoElectronico("vecino@correo.com"),
                List.of(new SectorId("bocagrande")),
                EstadoSuscripcion.PENDIENTE_CONFIRMACION,
                "token-1",
                CREADA);
    }

    @BeforeEach
    void montar() {
        suscripciones = mock(SuscripcionRepository.class);
        RelojPort reloj = () -> AHORA;
        servicio = new ConfirmarSuscripcionService(suscripciones, reloj, 48);

        given(suscripciones.guardar(any(Suscripcion.class)))
                .willAnswer(invocacion -> invocacion.getArgument(0));
    }

    @Test
    void debeConfirmarLaSuscripcionPendienteConElToken() {
        given(suscripciones.buscarPorTokenConfirmacion("token-1")).willReturn(Optional.of(pendiente()));

        Suscripcion confirmada = servicio.confirmar("token-1");

        assertThat(confirmada.estado()).isEqualTo(EstadoSuscripcion.CONFIRMADA);
        verify(suscripciones).guardar(confirmada);
    }

    @Test
    void debeRechazarUnTokenQueNoCorrespondeANingunaSuscripcion() {
        given(suscripciones.buscarPorTokenConfirmacion("token-x")).willReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.confirmar("token-x"))
                .isInstanceOf(IllegalArgumentException.class);

        verify(suscripciones, never()).guardar(any());
    }

    @Test
    void debeRechazarUnTokenVencido() {
        given(suscripciones.buscarPorTokenConfirmacion("token-1")).willReturn(Optional.of(
                new Suscripcion(
                        new SuscripcionId("s1"),
                        new CorreoElectronico("vecino@correo.com"),
                        List.of(new SectorId("bocagrande")),
                        EstadoSuscripcion.PENDIENTE_CONFIRMACION,
                        "token-1",
                        CREADA.minusSeconds(48 * 3600 + 1))));

        assertThatThrownBy(() -> servicio.confirmar("token-1"))
                .isInstanceOf(IllegalArgumentException.class);

        verify(suscripciones, never()).guardar(any());
    }

    @Test
    void debeRechazarReconfirmarUnaSuscripcionYaConfirmada() {
        Suscripcion yaConfirmada = new Suscripcion(
                new SuscripcionId("1"),
                new CorreoElectronico("vecino@correo.com"),
                List.of(new SectorId("bocagrande")),
                EstadoSuscripcion.CONFIRMADA,
                "token-1",
                CREADA);
        given(suscripciones.buscarPorTokenConfirmacion("token-1")).willReturn(Optional.of(yaConfirmada));

        assertThatThrownBy(() -> servicio.confirmar("token-1"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}