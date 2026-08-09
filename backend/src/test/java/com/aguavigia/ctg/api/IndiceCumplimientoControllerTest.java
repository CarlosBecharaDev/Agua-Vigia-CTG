package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.error.ManejadorGlobalDeErrores;
import com.aguavigia.ctg.api.mapper.CumplimientoApiMapperImpl;
import com.aguavigia.ctg.domain.IndiceCumplimiento;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.CalcularCumplimientoUseCase;
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

import java.time.Duration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * `SecurityConfig` sí se importa, aunque el endpoint sea público: sin ella, la autoconfiguración
 * de seguridad de Spring Boot exige autenticación por defecto en todo el slice. La regla real de
 * `SecurityConfig` es `anyRequest().permitAll()` salvo `/api/veedor/**` — que es justo lo que
 * distingue a este controlador de `CorteControllerTest`.
 */
@WebMvcTest(IndiceCumplimientoController.class)
@Import({CumplimientoApiMapperImpl.class, ManejadorGlobalDeErrores.class, SecurityConfig.class})
@TestPropertySource(properties = "aguavigia.rate-limit.reglas=")
class IndiceCumplimientoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CalcularCumplimientoUseCase calcularCumplimiento;

    @MockitoBean
    private JwtProvider jwtProvider;

    // RateLimitConfig implementa WebMvcConfigurer y se instancia en cualquier @WebMvcTest aunque
    // no se importe (REC-006).
    @MockitoBean(name = "redisTemplate")
    private RedisTemplate<String, String> redisTemplateMock;

    @Test
    void debeConsultarElIndiceDeUnCorte() throws Exception {
        given(calcularCumplimiento.porCorte(any())).willReturn(
                new IndiceCumplimiento(null, Duration.ofHours(2), Duration.ofHours(8), Duration.ofHours(6), 25.0));

        mockMvc.perform(get("/api/cumplimiento/cortes/corte-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.duracionPrometidaSegundos").value(Duration.ofHours(2).toSeconds()))
                .andExpect(jsonPath("$.duracionRealSegundos").value(Duration.ofHours(8).toSeconds()))
                .andExpect(jsonPath("$.porcentajeCumplimiento").value(25.0));
    }

    @Test
    void debeResponder400ConFormatoRfc7807SiElCorteNoExiste() throws Exception {
        given(calcularCumplimiento.porCorte(any()))
                .willThrow(new IllegalArgumentException("No existe el corte 'no-existe'"));

        mockMvc.perform(get("/api/cumplimiento/cortes/no-existe"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("No existe el corte 'no-existe'"));
    }

    @Test
    void debeResponder409SiElCorteNoEstaCerrado() throws Exception {
        given(calcularCumplimiento.porCorte(any()))
                .willThrow(new IllegalStateException("El corte 'corte-1' todavía no está cerrado"));

        mockMvc.perform(get("/api/cumplimiento/cortes/corte-1"))
                .andExpect(status().isConflict());
    }

    @Test
    void debeConsultarElIndiceDeUnSectorConSuIdEnLaRespuesta() throws Exception {
        given(calcularCumplimiento.porSector(new SectorId("manga"))).willReturn(
                new IndiceCumplimiento(new SectorId("manga"), Duration.ofHours(3), Duration.ofHours(9),
                        Duration.ofHours(6), 33.33));

        mockMvc.perform(get("/api/cumplimiento/sectores/manga"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sectorId").value("manga"));
    }

    @Test
    void debeResponder400SiElSectorNoTieneCortesCerrados() throws Exception {
        given(calcularCumplimiento.porSector(new SectorId("manga")))
                .willThrow(new IllegalArgumentException("No hay cortes cerrados para el sector 'manga'"));

        mockMvc.perform(get("/api/cumplimiento/sectores/manga"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void debeConsultarElIndiceGlobalSinSectorId() throws Exception {
        given(calcularCumplimiento.global()).willReturn(
                new IndiceCumplimiento(null, Duration.ofHours(4), Duration.ofHours(8), Duration.ofHours(4), 50.0));

        mockMvc.perform(get("/api/cumplimiento"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sectorId").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void debeResponder400SiNoHayCortesCerradosParaElGlobal() throws Exception {
        given(calcularCumplimiento.global())
                .willThrow(new IllegalArgumentException("No hay cortes cerrados todavía"));

        mockMvc.perform(get("/api/cumplimiento"))
                .andExpect(status().isBadRequest());
    }
}
