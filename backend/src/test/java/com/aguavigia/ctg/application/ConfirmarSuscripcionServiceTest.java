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

class ConfirmarSuscripcionServiceTest {

    private static final Instant CREADA = Instant.parse("2026-08-08T15:30:00Z");
    private static final long HORAS_VIGENCIA = 48;

    private SuscripcionRepository suscripciones;
    private RelojPort reloj;
    private ConfirmarSuscripcionService servicio;

    @BeforeEach
    void montar() {
        suscripciones = mock(SuscripcionRepository.class);
        reloj = () -> CREADA;
        servicio = new ConfirmarSuscripcionService(suscripciones, reloj, HORAS_VIGENCIA);
        given(suscripciones.guardar(any(Suscripcion.class)))
                .willAnswer(invocacion -> invocacion.getArgument(0));
    }

    private Suscripcion pendienteCreadaEn(Instant creadaEn) {
        return new Suscripcion(
                new SuscripcionId("s1"), new CorreoElectronico("vecino@correo.com"),
                List.of(new SectorId("bocagrande")), EstadoSuscripcion.PENDIENTE_CONFIRMACION,
                "token-1", creadaEn);
    }

    @Test
    void debeConfirmarLaSuscripcionEncontradaPorToken() {
        given(suscripciones.buscarPorToken("token-1")).willReturn(Optional.of(pendienteCreadaEn(CREADA)));

        Suscripcion confirmada = servicio.confirmar("token-1");

        assertThat(confirmada.estado()).isEqualTo(EstadoSuscripcion.CONFIRMADA);
    }

    @Test
    void debeRechazarUnTokenQueNoExiste() {
        given(suscripciones.buscarPorToken("no-existe")).willReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.confirmar("no-existe"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void debeRechazarUnTokenVencido() {
        // BUG-041: confirmar-suscripcion.html le promete al vecino que el enlace vence en
        // HORAS_VIGENCIA horas — este es el caso que faltaba probar esa promesa.
        RelojPort relojUnSegundoDespuesDelVencimiento = () -> CREADA.plusSeconds(HORAS_VIGENCIA * 3600 + 1);
        servicio = new ConfirmarSuscripcionService(suscripciones, relojUnSegundoDespuesDelVencimiento, HORAS_VIGENCIA);
        given(suscripciones.buscarPorToken("token-1")).willReturn(Optional.of(pendienteCreadaEn(CREADA)));

        assertThatThrownBy(() -> servicio.confirmar("token-1"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void debeAceptarUnTokenJustoAntesDeVencer() {
        RelojPort relojUnSegundoAntesDelVencimiento = () -> CREADA.plusSeconds(HORAS_VIGENCIA * 3600 - 1);
        servicio = new ConfirmarSuscripcionService(suscripciones, relojUnSegundoAntesDelVencimiento, HORAS_VIGENCIA);
        given(suscripciones.buscarPorToken("token-1")).willReturn(Optional.of(pendienteCreadaEn(CREADA)));

        Suscripcion confirmada = servicio.confirmar("token-1");

        assertThat(confirmada.estado()).isEqualTo(EstadoSuscripcion.CONFIRMADA);
    }
}
