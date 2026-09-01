package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.error.ManejadorGlobalDeErrores;
import com.aguavigia.ctg.api.mapper.CumplimientoApiMapperImpl;
import com.aguavigia.ctg.domain.IndiceCumplimiento;
import com.aguavigia.ctg.domain.PuntoSerieCumplimiento;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.CalcularCumplimientoUseCase;
import com.aguavigia.ctg.infrastructure.config.SecurityConfig;
import com.aguavigia.ctg.infrastructure.security.JwtProvider;
import com.aguavigia.ctg.domain.port.out.RevocacionSesionPort;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Duration;
import java.time.Instant;
import java.time.YearMonth;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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

    // SecurityConfig construye JwtAuthenticationFilter con este puerto: el filtro consulta la
    // revocacion en cada peticion con token (ADR-039). Sin el bean, el contexto del slice no carga.
    @MockitoBean
    private RevocacionSesionPort revocacion;

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

    // --- RF024: evolución en el tiempo ---

    private PuntoSerieCumplimiento puntoDeAgosto() {
        return new PuntoSerieCumplimiento(YearMonth.of(2026, 8),
                new IndiceCumplimiento(null, Duration.ofHours(4), Duration.ofHours(8), Duration.ofHours(4), 50.0),
                2);
    }

    @Test
    void debeDevolverLaSerieMensualDeLaCiudad() throws Exception {
        given(calcularCumplimiento.serieMensual(null, null, null)).willReturn(List.of(puntoDeAgosto()));

        mockMvc.perform(get("/api/cumplimiento/serie"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].periodo").value("2026-08"))
                .andExpect(jsonPath("$[0].duracionPrometidaSegundos").value(14400))
                .andExpect(jsonPath("$[0].duracionRealSegundos").value(28800))
                .andExpect(jsonPath("$[0].desviacionSegundos").value(14400))
                .andExpect(jsonPath("$[0].porcentajeCumplimiento").value(50.0))
                .andExpect(jsonPath("$[0].cantidadCortes").value(2));
    }

    @Test
    void debePasarSectorYRangoAlCasoDeUso() throws Exception {
        given(calcularCumplimiento.serieMensual(
                new SectorId("manga"),
                Instant.parse("2026-08-01T00:00:00Z"),
                Instant.parse("2026-08-31T23:59:59Z")))
                .willReturn(List.of(puntoDeAgosto()));

        mockMvc.perform(get("/api/cumplimiento/serie")
                        .param("sectorId", "manga")
                        .param("desde", "2026-08-01T00:00:00Z")
                        .param("hasta", "2026-08-31T23:59:59Z"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].periodo").value("2026-08"));
    }

    /** Una serie sin datos es una respuesta válida, no un 400 como en el índice de un corte. */
    @Test
    void debeDevolver200ConListaVaciaCuandoNoHayDatos() throws Exception {
        given(calcularCumplimiento.serieMensual(null, null, null)).willReturn(List.of());

        mockMvc.perform(get("/api/cumplimiento/serie"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    // --- RF025: exportación ---

    @Test
    void debeExportarLaSerieEnCsvDescargableConHorasLegibles() throws Exception {
        given(calcularCumplimiento.serieMensual(null, null, null)).willReturn(List.of(puntoDeAgosto()));

        String csv = mockMvc.perform(get("/api/cumplimiento/serie.csv"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(header().string("Content-Disposition",
                        "attachment; filename=\"aguavigia-cumplimiento.csv\""))
                .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);

        assertThat(csv).contains(
                "periodo;duracion_prometida_horas;duracion_real_horas;desviacion_horas;"
                        + "porcentaje_cumplimiento;cantidad_cortes");
        // Horas y no segundos, y con coma decimal fijada en es-CO.
        assertThat(csv).contains("2026-08;4,0;8,0;4,0;50,0;2");
    }
}
