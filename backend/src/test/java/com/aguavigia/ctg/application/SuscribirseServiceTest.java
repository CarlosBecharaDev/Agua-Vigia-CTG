package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.EstadoSuscripcion;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.Suscripcion;
import com.aguavigia.ctg.domain.port.out.NotificacionPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
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

class SuscribirseServiceTest {

    private static final Instant AHORA = Instant.parse("2026-08-08T15:30:00Z");
    private static final CorreoElectronico CORREO = new CorreoElectronico("vecino@correo.com");

    private SectorRepository sectores;
    private SuscripcionRepository suscripciones;
    private NotificacionPort notificaciones;
    private SuscribirseService servicio;

    @BeforeEach
    void montar() {
        sectores = mock(SectorRepository.class);
        suscripciones = mock(SuscripcionRepository.class);
        notificaciones = mock(NotificacionPort.class);
        RelojPort reloj = () -> AHORA;
        servicio = new SuscribirseService(sectores, suscripciones, notificaciones, reloj);

        given(suscripciones.guardar(any(Suscripcion.class)))
                .willAnswer(invocacion -> invocacion.getArgument(0));
    }

    @Test
    void debeCrearLaSuscripcionEnPendienteConfirmacionYNotificar() {
        Sector bocagrande = new Sector(new SectorId("bocagrande"), "BOCAGRANDE", 12000, EstadoServicio.SIN_SERVICIO);
        given(sectores.buscarPorId(new SectorId("bocagrande"))).willReturn(Optional.of(bocagrande));

        Suscripcion suscripcion = servicio.suscribir(CORREO, List.of(new SectorId("bocagrande")));

        assertThat(suscripcion.estado()).isEqualTo(EstadoSuscripcion.PENDIENTE_CONFIRMACION);
        assertThat(suscripcion.correo()).isEqualTo(CORREO);
        assertThat(suscripcion.creadaEn()).isEqualTo(AHORA);
        assertThat(suscripcion.tokenConfirmacion()).isNotBlank();
        verify(notificaciones).enviarConfirmacionSuscripcion(suscripcion, List.of(bocagrande));
    }

    @Test
    void debeRechazarLaSuscripcionCompletaSiUnSectorNoExiste() {
        given(sectores.buscarPorId(new SectorId("bocagrande"))).willReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.suscribir(CORREO, List.of(new SectorId("bocagrande"))))
                .isInstanceOf(IllegalArgumentException.class);

        verify(suscripciones, never()).guardar(any());
        verify(notificaciones, never()).enviarConfirmacionSuscripcion(any(), any());
    }
}
