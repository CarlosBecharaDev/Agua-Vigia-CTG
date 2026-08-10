package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.IotPresionRequest;
import com.aguavigia.ctg.api.error.ManejadorGlobalDeErrores;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.RegistrarReporteUseCase;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import com.aguavigia.ctg.infrastructure.config.SecurityConfig;
import com.aguavigia.ctg.infrastructure.security.JwtProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(IotController.class)
@Import({ManejadorGlobalDeErrores.class, SecurityConfig.class})
@TestPropertySource(properties = {
        "aguavigia.rate-limit.reglas=",
        "aguavigia.iot.key=clave-de-prueba"
})
class IotControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private RegistrarReporteUseCase registrarReporte;

    @MockitoBean
    private SectorRepository sectores;

    @MockitoBean
    private JwtProvider jwtProvider;

    @MockitoBean(name = "redisTemplate")
    private RedisTemplate<String, String> redisTemplateMock;

    @Test
    void debeRechazarSinHeaderDeClave() throws Exception {
        IotPresionRequest cuerpo = new IotPresionRequest("sensor-1", "manga", 10.0, null);

        mockMvc.perform(post("/api/iot/presion")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cuerpo)))
                .andExpect(status().isUnauthorized());

        verify(registrarReporte, never()).registrar(any(), any(), any(), any());
    }

    @Test
    void debeRechazarConClaveIncorrecta() throws Exception {
        IotPresionRequest cuerpo = new IotPresionRequest("sensor-1", "manga", 10.0, null);

        mockMvc.perform(post("/api/iot/presion")
                        .header("X-IoT-Key", "clave-equivocada")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cuerpo)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void debeRechazarUnSectorQueNoExiste() throws Exception {
        given(sectores.buscarPorId(new SectorId("no-existe"))).willReturn(Optional.empty());
        IotPresionRequest cuerpo = new IotPresionRequest("sensor-1", "no-existe", 10.0, null);

        mockMvc.perform(post("/api/iot/presion")
                        .header("X-IoT-Key", "clave-de-prueba")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cuerpo)))
                .andExpect(status().isBadRequest());

        verify(registrarReporte, never()).registrar(any(), any(), any(), any());
    }

    @Test
    void debeRegistrarReporteDePresionBajaParaElSectorIndicado() throws Exception {
        given(sectores.buscarPorId(new SectorId("manga")))
                .willReturn(Optional.of(new Sector(new SectorId("manga"), "Manga", 1000, EstadoServicio.CON_SERVICIO)));
        IotPresionRequest cuerpo = new IotPresionRequest("sensor-1", "manga", 10.0, null);

        mockMvc.perform(post("/api/iot/presion")
                        .header("X-IoT-Key", "clave-de-prueba")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cuerpo)))
                .andExpect(status().isOk());

        verify(registrarReporte).registrar(any(), any(), any(), any());
    }

    @Test
    void noDebeRegistrarReporteSiLaPresionEsNormal() throws Exception {
        given(sectores.buscarPorId(new SectorId("manga")))
                .willReturn(Optional.of(new Sector(new SectorId("manga"), "Manga", 1000, EstadoServicio.CON_SERVICIO)));
        IotPresionRequest cuerpo = new IotPresionRequest("sensor-1", "manga", 40.0, null);

        mockMvc.perform(post("/api/iot/presion")
                        .header("X-IoT-Key", "clave-de-prueba")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cuerpo)))
                .andExpect(status().isOk());

        verify(registrarReporte, never()).registrar(any(), any(), any(), any());
    }
}
