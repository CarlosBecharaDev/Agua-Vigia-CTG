package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.error.ManejadorGlobalDeErrores;
import com.aguavigia.ctg.infrastructure.config.SecurityConfig;
import com.aguavigia.ctg.infrastructure.ingest.EstadoColectorRegistry;
import com.aguavigia.ctg.domain.Permiso;
import com.aguavigia.ctg.infrastructure.security.JwtProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(IngestaSaludController.class)
@Import({ManejadorGlobalDeErrores.class, SecurityConfig.class})
@TestPropertySource(properties = "aguavigia.rate-limit.reglas=")
class IngestaSaludControllerTest {

    private static final String TOKEN = "Bearer token-de-veedor";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EstadoColectorRegistry estadoColectores;

    @MockitoBean
    private JwtProvider jwtProvider;

    @MockitoBean
    private com.aguavigia.ctg.domain.port.out.RevocacionSesionPort revocacion;

    @MockitoBean(name = "redisTemplate")
    private RedisTemplate<String, String> redisTemplateMock;

    /** Cuántos ítems trae cada fuente y con qué error es información operativa, no pública. */
    @Test
    void debeExigirTokenDeVeedor() throws Exception {
        mockMvc.perform(get("/api/veedor/ingesta/salud"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void debeExponerLaSaludDeCadaColectorAlVeedor() throws Exception {
        given(jwtProvider.validar("token-de-veedor"))
                .willReturn(Optional.of(AutenticacionDePrueba.sesionCon(Permiso.VER_PANEL)));
        EstadoColectorRegistry real = new EstadoColectorRegistry(
                () -> java.time.Instant.parse("2026-08-09T15:30:00Z"));
        real.registrarExito("acuacar", 7);
        real.registrarFallo("rss", "sin red");
        given(estadoColectores.estados()).willReturn(real.estados());

        mockMvc.perform(get("/api/veedor/ingesta/salud").header("Authorization", TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("acuacar"))
                .andExpect(jsonPath("$[0].itemsProcesados").value(7))
                .andExpect(jsonPath("$[0].ultimaEjecucionExitosa").value("2026-08-09T15:30:00Z"))
                .andExpect(jsonPath("$[0].tasaDeError").value(0.0))
                .andExpect(jsonPath("$[1].nombre").value("rss"))
                .andExpect(jsonPath("$[1].motivoDelUltimoFallo").value("sin red"))
                .andExpect(jsonPath("$[1].tasaDeError").value(1.0))
                .andExpect(jsonPath("$[1].fallosConsecutivos").value(1));
    }
}
