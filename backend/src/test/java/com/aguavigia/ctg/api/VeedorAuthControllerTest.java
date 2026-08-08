package com.aguavigia.ctg.api;

import com.aguavigia.ctg.infrastructure.config.SecurityConfig;
import com.aguavigia.ctg.infrastructure.security.JwtProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.TestPropertySource;

import java.util.Optional;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * La clave de prueba nunca sale de aqui: es "clave-correcta-de-prueba", con su hash BCrypt
 * calculado una sola vez y pegado como propiedad — asi el test no depende de que BCrypt sea
 * determinista (no lo es: cada .encode() de la misma clave da un hash distinto).
 */
@WebMvcTest(VeedorAuthController.class)
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
        "aguavigia.veedor.password-hash=$2a$10$LvpcjoXWl6t7H8c.oTJ0GOS/KHQbhIxn7MnwsKT5tRd3Ya3UZSeAW"
})
class VeedorAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtProvider jwtProvider;

    // RateLimitConfig implementa WebMvcConfigurer: @WebMvcTest lo detecta e instancia en
    // cualquier slice del proyecto, aunque no se importe aqui — necesita este bean para construirse.
    // name="redisTemplate" porque RateLimitConfig lo pide con @Qualifier("redisTemplate").
    @MockitoBean(name = "redisTemplate")
    private RedisTemplate<String, String> redisTemplateMock;

    @Test
    void debeEmitirUnTokenConCredencialCorrecta() throws Exception {
        given(jwtProvider.emitirParaVeedor()).willReturn("token-de-prueba");

        mockMvc.perform(post("/api/veedor/sesion")
                        .contentType("application/json")
                        .content("{\"clave\":\"clave-correcta-de-prueba\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token-de-prueba"));
    }

    @Test
    void debeRechazarUnaCredencialIncorrectaCon401() throws Exception {
        mockMvc.perform(post("/api/veedor/sesion")
                        .contentType("application/json")
                        .content("{\"clave\":\"clave-equivocada\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void debeRechazarUnaClaveEnBlancoAntesDeConsultarElHash() throws Exception {
        mockMvc.perform(post("/api/veedor/sesion")
                        .contentType("application/json")
                        .content("{\"clave\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void debeRechazarUnaRutaDeVeedorSinTokenCon401() throws Exception {
        // No hay controlador para /api/veedor/moderacion todavia (Sprint 3 de D2/D3, pendiente).
        // El 401 tiene que llegar desde SecurityConfig, antes de que falte el handler.
        mockMvc.perform(get("/api/veedor/moderacion"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unTokenValidoDebeAtravesarElFiltroDeSeguridad() throws Exception {
        given(jwtProvider.validarYObtenerSujeto("token-valido")).willReturn(Optional.of("veedor"));

        // 404 y no 401/403: el filtro dejo pasar la peticion, y simplemente no existe (todavia)
        // un controlador para esta ruta. Es la prueba de que la autenticacion, no la autorizacion
        // de negocio, es lo que este PR entrega.
        mockMvc.perform(get("/api/veedor/moderacion").header("Authorization", "Bearer token-valido"))
                .andExpect(status().isNotFound());
    }

    @Test
    void debeGenerarUnHashQueLaPruebaPuedaVerificar() {
        // Ancla el hash usado arriba: si alguien cambia la clave de prueba sin regenerar el hash,
        // esta prueba lo dice en vez de dejar que debeEmitirUnTokenConCredencialCorrecta falle
        // con un mensaje que no explica por que.
        var encoder = new BCryptPasswordEncoder();
        org.assertj.core.api.Assertions.assertThat(
                encoder.matches("clave-correcta-de-prueba",
                        "$2a$10$LvpcjoXWl6t7H8c.oTJ0GOS/KHQbhIxn7MnwsKT5tRd3Ya3UZSeAW"))
                .isTrue();
    }
}
