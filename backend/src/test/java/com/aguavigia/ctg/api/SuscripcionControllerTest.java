package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.error.ManejadorGlobalDeErrores;
import com.aguavigia.ctg.api.mapper.SuscripcionApiMapperImpl;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.EstadoSuscripcion;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.Suscripcion;
import com.aguavigia.ctg.domain.SuscripcionId;
import com.aguavigia.ctg.domain.port.in.CancelarSuscripcionUseCase;
import com.aguavigia.ctg.domain.port.in.ConfirmarSuscripcionUseCase;
import com.aguavigia.ctg.domain.port.in.SuscribirseUseCase;
import com.aguavigia.ctg.infrastructure.config.SecurityConfig;
import com.aguavigia.ctg.infrastructure.security.JwtProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SuscripcionController.class)
@Import({SuscripcionApiMapperImpl.class, ManejadorGlobalDeErrores.class, SecurityConfig.class})
class SuscripcionControllerTest {

    private static final Instant AHORA = Instant.parse("2026-08-08T15:30:00Z");

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SuscribirseUseCase suscribirse;

    @MockitoBean
    private ConfirmarSuscripcionUseCase confirmarSuscripcion;

    @MockitoBean
    private CancelarSuscripcionUseCase cancelarSuscripcion;

    @MockitoBean
    private JwtProvider jwtProvider;

    // Ver nota identica en SectorControllerTest: RateLimitConfig exige este bean en cualquier
    // slice de @WebMvcTest aunque no se importe aqui.
    @MockitoBean(name = "redisTemplate")
    private RedisTemplate<String, String> redisTemplateMock;

    @Test
    void debeCrearLaSuscripcionYResponder201() throws Exception {
        Suscripcion creada = new Suscripcion(
                new SuscripcionId("s1"), new CorreoElectronico("vecino@correo.com"),
                List.of(new SectorId("bocagrande")), EstadoSuscripcion.PENDIENTE_CONFIRMACION,
                "token-1", AHORA);
        given(suscribirse.suscribir(any(), any())).willReturn(creada);

        mockMvc.perform(post("/api/suscripciones")
                        .contentType("application/json")
                        .content("""
                                {"correo":"vecino@correo.com","sectorIds":["bocagrande"]}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("s1"))
                .andExpect(jsonPath("$.correo").value("vecino@correo.com"))
                .andExpect(jsonPath("$.estado").value("PENDIENTE_CONFIRMACION"))
                .andExpect(jsonPath("$.sectorIds[0]").value("bocagrande"));
    }

    @Test
    void debeResponder400EnFormatoRfc7807ConCorreoInvalido() throws Exception {
        mockMvc.perform(post("/api/suscripciones")
                        .contentType("application/json")
                        .content("""
                                {"correo":"no-es-un-correo","sectorIds":["bocagrande"]}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Peticion invalida"));
    }

    @Test
    void debeResponder400ConListaDeSectoresVacia() throws Exception {
        mockMvc.perform(post("/api/suscripciones")
                        .contentType("application/json")
                        .content("""
                                {"correo":"vecino@correo.com","sectorIds":[]}"""))
                .andExpect(status().isBadRequest());
    }

    @Test
    void debeResponder400CuandoElCasoDeUsoRechazaUnSectorInexistente() throws Exception {
        given(suscribirse.suscribir(any(), any()))
                .willThrow(new IllegalArgumentException("No existe el sector 'no-existe'"));

        mockMvc.perform(post("/api/suscripciones")
                        .contentType("application/json")
                        .content("""
                                {"correo":"vecino@correo.com","sectorIds":["no-existe"]}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("No existe el sector 'no-existe'"));
    }

    @Test
    void debeConfirmarLaSuscripcionYResponder200() throws Exception {
        Suscripcion confirmada = new Suscripcion(
                new SuscripcionId("s1"), new CorreoElectronico("vecino@correo.com"),
                List.of(new SectorId("bocagrande")), EstadoSuscripcion.CONFIRMADA,
                "token-1", AHORA);
        given(confirmarSuscripcion.confirmar("token-1")).willReturn(confirmada);

        mockMvc.perform(get("/api/suscripciones/confirmar").param("token", "token-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CONFIRMADA"));
    }

    @Test
    void debeResponder400SiElTokenDeConfirmacionNoExiste() throws Exception {
        given(confirmarSuscripcion.confirmar("no-existe"))
                .willThrow(new IllegalArgumentException("Token de confirmación inválido o inexistente"));

        mockMvc.perform(get("/api/suscripciones/confirmar").param("token", "no-existe"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Token de confirmación inválido o inexistente"));
    }

    @Test
    void debeCancelarLaSuscripcionYResponder200() throws Exception {
        Suscripcion cancelada = new Suscripcion(
                new SuscripcionId("s1"), new CorreoElectronico("vecino@correo.com"),
                List.of(new SectorId("bocagrande")), EstadoSuscripcion.CANCELADA,
                "token-1", AHORA);
        given(cancelarSuscripcion.cancelar("token-1")).willReturn(cancelada);

        mockMvc.perform(get("/api/suscripciones/cancelar").param("token", "token-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CANCELADA"));
    }

    @Test
    void debeResponder400SiElTokenDeCancelacionNoExiste() throws Exception {
        given(cancelarSuscripcion.cancelar("no-existe"))
                .willThrow(new IllegalArgumentException("Token de suscripción inválido o inexistente"));

        mockMvc.perform(get("/api/suscripciones/cancelar").param("token", "no-existe"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void debeConfirmarEnHtmlCuandoElNavegadorLoPide() throws Exception {
        Suscripcion confirmada = new Suscripcion(
                new SuscripcionId("s1"), new CorreoElectronico("vecino@correo.com"),
                List.of(new SectorId("bocagrande")), EstadoSuscripcion.CONFIRMADA,
                "token-1", AHORA);
        given(confirmarSuscripcion.confirmar("token-1")).willReturn(confirmada);

        mockMvc.perform(get("/api/suscripciones/confirmar").param("token", "token-1")
                        .accept("text/html,application/xhtml+xml,*/*;q=0.8"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Suscripción confirmada")));
    }

    @Test
    void debeResponder400EnHtmlSiElTokenDeConfirmacionNoExiste() throws Exception {
        given(confirmarSuscripcion.confirmar("no-existe"))
                .willThrow(new IllegalArgumentException("Token de confirmación inválido o inexistente"));

        mockMvc.perform(get("/api/suscripciones/confirmar").param("token", "no-existe")
                        .accept("text/html,application/xhtml+xml,*/*;q=0.8"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Token de confirmación inválido o inexistente")));
    }

    @Test
    void debeCancelarEnHtmlCuandoElNavegadorLoPide() throws Exception {
        Suscripcion cancelada = new Suscripcion(
                new SuscripcionId("s1"), new CorreoElectronico("vecino@correo.com"),
                List.of(new SectorId("bocagrande")), EstadoSuscripcion.CANCELADA,
                "token-1", AHORA);
        given(cancelarSuscripcion.cancelar("token-1")).willReturn(cancelada);

        mockMvc.perform(get("/api/suscripciones/cancelar").param("token", "token-1")
                        .accept("text/html,application/xhtml+xml,*/*;q=0.8"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Baja confirmada")));
    }
}
