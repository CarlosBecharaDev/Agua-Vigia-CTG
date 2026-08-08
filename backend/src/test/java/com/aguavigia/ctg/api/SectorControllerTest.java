package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.error.ManejadorGlobalDeErrores;
import com.aguavigia.ctg.api.mapper.SectorApiMapperImpl;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import com.aguavigia.ctg.infrastructure.config.SecurityConfig;
import com.aguavigia.ctg.infrastructure.security.JwtProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SectorController.class)
@Import({SectorApiMapperImpl.class, ManejadorGlobalDeErrores.class, SecurityConfig.class})
class SectorControllerTest {

    private static final Instant INSTANTE_FIJO = Instant.parse("2026-08-08T15:30:00Z");

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SectorRepository sectores;

    @MockitoBean
    private RelojPort reloj;

    @MockitoBean
    private JwtProvider jwtProvider;

    @Test
    void debeDevolverElListadoConLaHoraEnQueSeGenero() throws Exception {
        given(reloj.ahora()).willReturn(INSTANTE_FIJO);
        given(sectores.listarTodos()).willReturn(List.of(
                new Sector(new SectorId("bocagrande"), "BOCAGRANDE", 12000, EstadoServicio.SIN_SERVICIO)));

        mockMvc.perform(get("/api/sectores"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.generadoEn").value("2026-08-08T15:30:00Z"))
                .andExpect(jsonPath("$.sectores[0].id").value("bocagrande"))
                .andExpect(jsonPath("$.sectores[0].nombre").value("BOCAGRANDE"))
                .andExpect(jsonPath("$.sectores[0].estado").value("SIN_SERVICIO"));
    }

    @Test
    void debeExponerEstadoNuloTalCualYNoComoConServicio() throws Exception {
        given(reloj.ahora()).willReturn(INSTANTE_FIJO);
        given(sectores.listarTodos()).willReturn(List.of(
                new Sector(new SectorId("isla-fuerte"), "ISLA FUERTE", null, null)));

        // ADR-014: el contrato transmite la ausencia de dato; no la rellena con un valor optimista.
        // La clave viaja presente y en null — explicito para el cliente generado, no omitida.
        mockMvc.perform(get("/api/sectores"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("\"estado\":null")))
                .andExpect(jsonPath("$.sectores[0].estado").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void debeDevolverUnSectorPorSuIdentificador() throws Exception {
        given(sectores.buscarPorId(any(SectorId.class))).willReturn(Optional.of(
                new Sector(new SectorId("manga"), "MANGA", 5000, EstadoServicio.PRESION_BAJA)));

        mockMvc.perform(get("/api/sectores/manga"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("PRESION_BAJA"));
    }

    @Test
    void debeResponder404EnFormatoRfc7807CuandoElSectorNoExiste() throws Exception {
        given(sectores.buscarPorId(any(SectorId.class))).willReturn(Optional.empty());

        mockMvc.perform(get("/api/sectores/no-existe"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.title").value("Recurso no encontrado"))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.type").value("https://aguavigia.example/errores/recurso-no-encontrado"));
    }
}
