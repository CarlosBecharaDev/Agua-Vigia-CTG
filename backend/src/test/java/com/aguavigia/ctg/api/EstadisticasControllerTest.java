package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.mapper.EstadisticasApiMapperImpl;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.CalcularEstadisticasUseCase;
import com.aguavigia.ctg.domain.port.in.CalcularEstadisticasUseCase.EstadisticaSector;
import com.aguavigia.ctg.domain.port.in.CalcularEstadisticasUseCase.EstadisticasGlobales;
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

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EstadisticasController.class)
@Import({EstadisticasApiMapperImpl.class, SecurityConfig.class})
@TestPropertySource(properties = "aguavigia.rate-limit.reglas=")
class EstadisticasControllerTest {

    // SecurityConfig construye JwtAuthenticationFilter con este puerto: el filtro consulta la
    // revocacion en cada peticion con token (ADR-039). Sin el bean, el contexto del slice no carga.
    @MockitoBean
    private RevocacionSesionPort revocacion;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CalcularEstadisticasUseCase useCase;

    @MockitoBean
    private JwtProvider jwtProvider;

    @MockitoBean(name = "redisTemplate")
    private RedisTemplate<String, String> redisTemplateMock;

    @Test
    void debeExponerLasEstadisticasGlobalesComoDto() throws Exception {
        EstadisticasGlobales globales = new EstadisticasGlobales(
                List.of(new EstadisticaSector(new SectorId("manga"), "Manga", 5)),
                Map.of("Lunes", 3),
                4.5);
        given(useCase.calcularGlobales()).willReturn(globales);

        mockMvc.perform(get("/api/estadisticas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sectoresMasAfectados[0].sectorId").value("manga"))
                .andExpect(jsonPath("$.sectoresMasAfectados[0].nombre").value("Manga"))
                .andExpect(jsonPath("$.sectoresMasAfectados[0].cantidadCortes").value(5))
                .andExpect(jsonPath("$.cortesPorDiaDeSemana.Lunes").value(3))
                .andExpect(jsonPath("$.duracionPromedioHoras").value(4.5));
    }

    @Test
    void debeExportarLasEstadisticasEnCsvDescargable() throws Exception {
        given(useCase.calcularGlobales()).willReturn(new EstadisticasGlobales(
                List.of(new EstadisticaSector(new SectorId("manga"), "Manga", 5)),
                Map.of("Lunes", 3),
                4.5));

        String csv = mockMvc.perform(get("/api/estadisticas/exportar.csv"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(header().string("Content-Disposition",
                        "attachment; filename=\"aguavigia-estadisticas.csv\""))
                .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);

        assertThat(csv).contains("sector_id;nombre;cantidad_cortes;duracion_promedio_horas_ciudad");
        // Coma decimal fijada en es-CO, no heredada del locale del servidor: el archivo tiene que
        // salir igual en la maquina de cualquiera del equipo y en el contenedor de produccion.
        assertThat(csv).contains("manga;Manga;5;4,5");
    }
}
