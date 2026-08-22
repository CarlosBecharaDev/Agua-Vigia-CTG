package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.EstadoSuscripcion;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.Suscripcion;
import com.aguavigia.ctg.domain.SuscripcionId;
import com.aguavigia.ctg.domain.port.out.NotificacionPort;
import com.aguavigia.ctg.domain.port.out.SuscripcionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

/**
 * Este servicio es el **único** suscriptor de SectorActualizadoEvent que manda correo. Tanto
 * EvaluarConsensoService como GestionarCorteOficialService recorrían además las suscripciones a
 * mano, y por eso cada cambio de estado mandaba dos correos al mismo vecino. Esta prueba fija el
 * contrato: un evento, un correo por suscriptor confirmado.
 */
class NotificarSuscripcionesServiceTest {

    private static final Instant CREADA_EN = Instant.parse("2026-08-09T20:00:00Z");
    private static final SectorId MANGA = new SectorId("manga");

    private SuscripcionRepository suscripciones;
    private NotificacionPort notificador;
    private NotificarSuscripcionesService servicio;

    @BeforeEach
    void montar() {
        suscripciones = mock(SuscripcionRepository.class);
        notificador = mock(NotificacionPort.class);
        servicio = new NotificarSuscripcionesService(suscripciones, notificador);
    }

    private Suscripcion suscripcion(String id, String correo) {
        return new Suscripcion(new SuscripcionId(id), new CorreoElectronico(correo),
                List.of(MANGA), EstadoSuscripcion.CONFIRMADA, "token-" + id, CREADA_EN);
    }

    private SectorActualizadoEvent evento() {
        return new SectorActualizadoEvent(
                new Sector(MANGA, "Manga", 5000, EstadoServicio.SIN_SERVICIO, CREADA_EN));
    }

    @Test
    void debeAvisarUnaSolaVezACadaSuscriptorConfirmado() {
        Suscripcion una = suscripcion("s-1", "uno@correo.com");
        Suscripcion otra = suscripcion("s-2", "dos@correo.com");
        given(suscripciones.buscarConfirmadasPorSector(MANGA)).willReturn(List.of(una, otra));

        servicio.alActualizarSector(evento());

        verify(notificador, times(1)).avisarCambioDeEstado(una, evento().sector());
        verify(notificador, times(1)).avisarCambioDeEstado(otra, evento().sector());
    }

    @Test
    void debePasarElSectorTalComoLlegaEnElEvento() {
        given(suscripciones.buscarConfirmadasPorSector(MANGA))
                .willReturn(List.of(suscripcion("s-1", "uno@correo.com")));

        SectorActualizadoEvent evento = evento();
        servicio.alActualizarSector(evento);

        // El evento viaja con el sector ya guardado y releído, así que trae la fecha del cambio
        // que el correo necesita mostrar (RF003).
        verify(notificador).avisarCambioDeEstado(any(), org.mockito.ArgumentMatchers.eq(evento.sector()));
    }

    /** RF013 — nadie recibe avisos sin haber pasado por el doble opt-in. */
    @Test
    void sinSuscriptoresConfirmadosNoDebeMandarNada() {
        given(suscripciones.buscarConfirmadasPorSector(MANGA)).willReturn(List.of());

        servicio.alActualizarSector(evento());

        verify(notificador, never()).avisarCambioDeEstado(any(), any());
    }

    @Test
    void debeConsultarLasSuscripcionesDelSectorDelEventoYNoDeOtro() {
        given(suscripciones.buscarConfirmadasPorSector(any())).willReturn(List.of());

        servicio.alActualizarSector(evento());

        verify(suscripciones).buscarConfirmadasPorSector(MANGA);
    }
}
