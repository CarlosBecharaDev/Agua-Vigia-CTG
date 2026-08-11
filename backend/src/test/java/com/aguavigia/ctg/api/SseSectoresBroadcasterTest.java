package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.SectorRespuesta;
import com.aguavigia.ctg.api.mapper.SectorApiMapper;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.List;

import static com.aguavigia.ctg.api.SseSectoresBroadcaster.CANAL;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;

/**
 * estado-del-backend.md #6.1 — "SSE de una sola instancia". `MockMvcBuilders.standaloneSetup` con
 * un controlador de prueba deja driblar el ciclo de vida real de un SseEmitter (Servlet 3 async)
 * sin depender de clases internas de Spring como `ResponseBodyEmitter.Handler`, que no es pública.
 */
class SseSectoresBroadcasterTest {

    private static final Instant INSTANTE = Instant.parse("2026-08-11T10:00:00Z");

    @RestController
    static class ControladorDePrueba {
        private final SseSectoresBroadcaster broadcaster;

        ControladorDePrueba(SseSectoresBroadcaster broadcaster) {
            this.broadcaster = broadcaster;
        }

        @GetMapping(value = "/stream-de-prueba", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
        SseEmitter stream() {
            return broadcaster.registrar();
        }
    }

    private SectorRepository sectores;
    private SectorApiMapper mapper;
    private RelojPort reloj;
    private RedisTemplate<String, String> redisTemplate;
    private SseSectoresBroadcaster broadcaster;
    private MockMvc mockMvc;

    @BeforeEach
    void montar() {
        sectores = mock(SectorRepository.class);
        mapper = mock(SectorApiMapper.class);
        reloj = mock(RelojPort.class);
        redisTemplate = mock(RedisTemplate.class);
        broadcaster = new SseSectoresBroadcaster(sectores, mapper, reloj, redisTemplate);
        mockMvc = MockMvcBuilders.standaloneSetup(new ControladorDePrueba(broadcaster)).build();

        given(reloj.ahora()).willReturn(INSTANTE);
        given(sectores.listarTodos()).willReturn(List.of(
                new Sector(new SectorId("manga"), "MANGA", 5000, EstadoServicio.PRESION_BAJA)));
        given(mapper.aRespuestas(any())).willReturn(List.of(
                new SectorRespuesta("manga", "MANGA", EstadoServicio.PRESION_BAJA, INSTANTE)));
    }

    @Test
    void debeEnviarElEstadoActualAlRegistrarUnNuevoCliente() throws Exception {
        MvcResult resultado = mockMvc.perform(get("/stream-de-prueba"))
                .andExpect(request().asyncStarted())
                .andReturn();

        assertThat(resultado.getResponse().getContentAsString()).contains("manga");
    }

    @Test
    void notificarActualizacionDebePublicarEnElCanalDeRedis() {
        broadcaster.notificarActualizacion();

        verify(redisTemplate).convertAndSend(eq(CANAL), any());
    }

    /**
     * Simula lo que en producción dispara RedisMessageListenerContainer (SseConfig) al recibir un
     * mensaje en el canal: cualquier instancia —incluida la que publicó— reconsulta el estado y
     * empuja a sus clientes locales, no solo la que procesó el cambio original.
     */
    @Test
    void onMessageDebeEmpujarElEstadoActualizadoATodosLosClientesRegistrados() throws Exception {
        MvcResult resultado = mockMvc.perform(get("/stream-de-prueba"))
                .andExpect(request().asyncStarted())
                .andReturn();

        given(sectores.listarTodos()).willReturn(List.of(
                new Sector(new SectorId("bocagrande"), "BOCAGRANDE", 12000, EstadoServicio.SIN_SERVICIO)));
        given(mapper.aRespuestas(any())).willReturn(List.of(
                new SectorRespuesta("bocagrande", "BOCAGRANDE", EstadoServicio.SIN_SERVICIO, INSTANTE)));

        broadcaster.onMessage(null, null);

        assertThat(resultado.getResponse().getContentAsString()).contains("bocagrande");
    }
}
