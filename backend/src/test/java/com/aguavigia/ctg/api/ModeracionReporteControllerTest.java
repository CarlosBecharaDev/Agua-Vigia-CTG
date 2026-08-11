package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.error.ManejadorGlobalDeErrores;
import com.aguavigia.ctg.api.mapper.ReporteModeracionApiMapperImpl;
import com.aguavigia.ctg.domain.EstadoModeracion;
import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.Pagina;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.port.in.ModerarReporteUseCase;
import com.aguavigia.ctg.domain.port.out.ReporteCiudadanoRepository;
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
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ModeracionReporteController.class)
@Import({ReporteModeracionApiMapperImpl.class, ManejadorGlobalDeErrores.class, SecurityConfig.class})
@TestPropertySource(properties = "aguavigia.rate-limit.reglas=")
class ModeracionReporteControllerTest {

    private static final Instant TIMESTAMP = Instant.parse("2026-08-09T20:00:00Z");
    private static final String TOKEN = "Bearer token-de-veedor";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ModerarReporteUseCase moderarReporte;

    @MockitoBean
    private ReporteCiudadanoRepository reportes;

    @MockitoBean
    private JwtProvider jwtProvider;

    // RateLimitConfig implementa WebMvcConfigurer y se instancia en cualquier @WebMvcTest aunque
    // no se importe (REC-006).
    @MockitoBean(name = "redisTemplate")
    private RedisTemplate<String, String> redisTemplateMock;

    private void autenticarComoVeedor() {
        given(jwtProvider.validarYObtenerSujeto("token-de-veedor")).willReturn(Optional.of("veedor"));
    }

    private ReporteCiudadano reporte(EstadoModeracion estado) {
        return new ReporteCiudadano(new ReporteId("r1"), new SectorId("manga"), TipoReporte.SIN_AGUA,
                null, new HuellaDispositivo("hash-1"), TIMESTAMP, estado);
    }

    @Test
    void debeRechazarUnaPeticionSinTokenCon401() throws Exception {
        mockMvc.perform(get("/api/veedor/reportes/pendientes"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void debeListarLosReportesPendientes() throws Exception {
        autenticarComoVeedor();
        given(reportes.listarPendientes(anyInt(), anyInt()))
                .willReturn(new Pagina<>(List.of(reporte(EstadoModeracion.PENDIENTE)), 0, 50, 1));

        mockMvc.perform(get("/api/veedor/reportes/pendientes").header("Authorization", TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("r1"))
                .andExpect(jsonPath("$[0].estadoModeracion").value("PENDIENTE"));
    }

    @Test
    void debeAprobarUnReporte() throws Exception {
        autenticarComoVeedor();
        given(moderarReporte.aprobar(new ReporteId("r1"))).willReturn(reporte(EstadoModeracion.APROBADO));

        mockMvc.perform(patch("/api/veedor/reportes/r1/aprobar").header("Authorization", TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoModeracion").value("APROBADO"));
    }

    @Test
    void debeDescartarUnReporte() throws Exception {
        autenticarComoVeedor();
        given(moderarReporte.descartar(new ReporteId("r1"))).willReturn(reporte(EstadoModeracion.DESCARTADO));

        mockMvc.perform(patch("/api/veedor/reportes/r1/descartar").header("Authorization", TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoModeracion").value("DESCARTADO"));
    }

    @Test
    void debeResponder400ConFormatoRfc7807SiElReporteNoExiste() throws Exception {
        autenticarComoVeedor();
        given(moderarReporte.aprobar(new ReporteId("no-existe")))
                .willThrow(new IllegalArgumentException("No existe el reporte 'no-existe'"));

        mockMvc.perform(patch("/api/veedor/reportes/no-existe/aprobar").header("Authorization", TOKEN))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("No existe el reporte 'no-existe'"));
    }
}
