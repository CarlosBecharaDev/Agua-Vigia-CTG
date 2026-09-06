package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.error.ManejadorGlobalDeErrores;
import com.aguavigia.ctg.domain.port.in.AceptarInvitacionUseCase;
import com.aguavigia.ctg.domain.port.in.RegistrarUsuarioUseCase;
import com.aguavigia.ctg.domain.port.in.RestablecerClaveUseCase;
import com.aguavigia.ctg.domain.port.in.VerificarCorreoUseCase;
import com.aguavigia.ctg.domain.port.out.RevocacionSesionPort;
import com.aguavigia.ctg.infrastructure.config.SecurityConfig;
import com.aguavigia.ctg.infrastructure.security.JwtProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CuentaPublicaController.class)
@Import({ManejadorGlobalDeErrores.class, SecurityConfig.class})
@TestPropertySource(properties = "aguavigia.rate-limit.reglas=")
class CuentaPublicaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RegistrarUsuarioUseCase registrar;

    @MockitoBean
    private VerificarCorreoUseCase verificar;

    @MockitoBean
    private AceptarInvitacionUseCase aceptarInvitacion;

    @MockitoBean
    private RestablecerClaveUseCase restablecer;

    @MockitoBean
    private JwtProvider jwtProvider;

    @MockitoBean
    private RevocacionSesionPort revocacion;

    @MockitoBean(name = "redisTemplate")
    private RedisTemplate<String, String> redisTemplateMock;

    @Test
    void registrarseConDatosValidosDebeResponder202() throws Exception {
        String json = """
                {
                    "correo": "ciudadano@ejemplo.com",
                    "nombre": "Ciudadano Ejemplar",
                    "clave": "ClaveSegura123#!"
                }
                """;

        mockMvc.perform(post("/api/cuentas/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isAccepted());

        verify(registrar).registrar(any(), eq("Ciudadano Ejemplar"), any(), any());
    }

    @Test
    void registrarseConCorreoInvalidoDebeResponder400EnFormatoRfc7807() throws Exception {
        String json = """
                {
                    "correo": "correo-invalido",
                    "nombre": "A",
                    "clave": "123"
                }
                """;

        mockMvc.perform(post("/api/cuentas/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void verificarCorreoDebeResponder204() throws Exception {
        mockMvc.perform(post("/api/cuentas/verificacion")
                        .param("token", "token-de-verificacion-valido"))
                .andExpect(status().isNoContent());

        verify(verificar).verificar(eq("token-de-verificacion-valido"), any());
    }

    @Test
    void aceptarInvitacionConDatosValidosDebeResponder204() throws Exception {
        String json = """
                {
                    "token": "token-invitacion-valido",
                    "clave": "NuevaClaveValida123#!"
                }
                """;

        mockMvc.perform(post("/api/cuentas/invitacion")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isNoContent());

        verify(aceptarInvitacion).aceptar(eq("token-invitacion-valido"), any(), any());
    }

    @Test
    void pedirRestablecimientoDebeResponder202() throws Exception {
        String json = """
                {
                    "correo": "usuario@ejemplo.com"
                }
                """;

        mockMvc.perform(post("/api/cuentas/restablecimiento")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isAccepted());

        verify(restablecer).solicitar(any(), any());
    }

    @Test
    void fijarClaveDebeResponder204() throws Exception {
        String json = """
                {
                    "token": "token-restablecimiento-valido",
                    "clave": "NuevaClaveSegura123#!"
                }
                """;

        mockMvc.perform(post("/api/cuentas/clave")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isNoContent());

        verify(restablecer).restablecer(eq("token-restablecimiento-valido"), any(), any());
    }
}
