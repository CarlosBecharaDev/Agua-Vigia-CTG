package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.mapper.EventoBitacoraApiMapperImpl;
import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.EventoBitacora;
import com.aguavigia.ctg.domain.EventoId;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoEvento;
import com.aguavigia.ctg.domain.port.out.EventoBitacoraRepository;
import com.aguavigia.ctg.infrastructure.config.SecurityConfig;
import com.aguavigia.ctg.infrastructure.security.JwtProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * `SecurityConfig` se importa aunque el endpoint sea público: sin ella, la autoconfiguración de
 * seguridad de Spring Boot exige autenticación por defecto en el slice (mismo motivo que
 * IndiceCumplimientoControllerTest).
 */
@WebMvcTest(BitacoraController.class)
@Import({EventoBitacoraApiMapperImpl.class, SecurityConfig.class})
@TestPropertySource(properties = "aguavigia.rate-limit.reglas=")
class BitacoraControllerTest {

    private static final Instant TIMESTAMP = Instant.parse("2026-08-09T20:00:00Z");

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EventoBitacoraRepository eventos;

    @MockitoBean
    private JwtProvider jwtProvider;

    // RateLimitConfig implementa WebMvcConfigurer y se instancia en cualquier @WebMvcTest aunque
    // no se importe (REC-006).
    @MockitoBean(name = "redisTemplate")
    private RedisTemplate<String, String> redisTemplateMock;

    @Test
    void debeListarLosEventosSinAutenticacion() throws Exception {
        given(eventos.listarTodos()).willReturn(List.of(
                new EventoBitacora(new EventoId("evento-1"), TipoEvento.CORTE_ANUNCIADO,
                        new SectorId("manga"), new CorteId("corte-1"), TIMESTAMP,
                        "Corte oficial anunciado en 'manga': Mantenimiento")));

        mockMvc.perform(get("/api/bitacora"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("evento-1"))
                .andExpect(jsonPath("$[0].tipo").value("CORTE_ANUNCIADO"))
                .andExpect(jsonPath("$[0].sectorId").value("manga"))
                .andExpect(jsonPath("$[0].corteId").value("corte-1"));
    }

    @Test
    void debeExponerSectorIdYCorteIdNulosCuandoElEventoNoLosTiene() throws Exception {
        given(eventos.listarTodos()).willReturn(List.of(
                new EventoBitacora(new EventoId("evento-2"), TipoEvento.CORTE_CONFIRMADO_POR_CIUDADANOS,
                        new SectorId("bocagrande"), null, TIMESTAMP,
                        "3 reportes ciudadanos confirmaron SIN_SERVICIO")));

        mockMvc.perform(get("/api/bitacora"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].corteId").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void debeDevolverListaVaciaSinEventosAunTodavia() throws Exception {
        given(eventos.listarTodos()).willReturn(List.of());

        mockMvc.perform(get("/api/bitacora"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }
}
