package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.error.ManejadorGlobalDeErrores;
import com.aguavigia.ctg.domain.ClaveHash;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.EstadoCuenta;
import com.aguavigia.ctg.domain.Permiso;
import com.aguavigia.ctg.domain.PermisosEfectivos;
import com.aguavigia.ctg.domain.RolVeedor;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.in.ConfigurarSegundoFactorUseCase;
import com.aguavigia.ctg.domain.port.in.ConfigurarSegundoFactorUseCase.AltaSegundoFactor;
import com.aguavigia.ctg.domain.port.in.ConsultarCuentasUseCase;
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

import java.time.Instant;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SegundoFactorController.class)
@Import({ManejadorGlobalDeErrores.class, SecurityConfig.class})
@TestPropertySource(properties = "aguavigia.rate-limit.reglas=")
class SegundoFactorControllerTest {

    private static final String TOKEN = "token-totp";
    private static final Instant AHORA = Instant.parse("2026-09-01T12:00:00Z");

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ConfigurarSegundoFactorUseCase configurar;

    @MockitoBean
    private ConsultarCuentasUseCase cuentas;

    @MockitoBean
    private JwtProvider jwtProvider;

    @MockitoBean
    private RevocacionSesionPort revocacion;

    @MockitoBean(name = "redisTemplate")
    private RedisTemplate<String, String> redisTemplateMock;

    @Test
    void llamadaSinTokenDebeResponder401EnFormatoRfc7807() throws Exception {
        mockMvc.perform(post("/api/veedor/segundo-factor/alta"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("No autenticado"))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void usuarioSinPermisoConfigurarSegundoFactorDebeResponder403() throws Exception {
        given(jwtProvider.validar(TOKEN))
                .willReturn(Optional.of(AutenticacionDePrueba.sesionCon(Permiso.VER_PANEL)));
        given(revocacion.revocadasAntesDe(any())).willReturn(Optional.empty());

        mockMvc.perform(post("/api/veedor/segundo-factor/alta")
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Acceso denegado"))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void iniciarAltaConPermisoDevuelveUriYSecreto() throws Exception {
        given(jwtProvider.validar(TOKEN))
                .willReturn(Optional.of(AutenticacionDePrueba.sesionCon(Permiso.CONFIGURAR_SEGUNDO_FACTOR)));
        given(revocacion.revocadasAntesDe(any())).willReturn(Optional.empty());

        given(configurar.iniciar(any(), any()))
                .willReturn(new AltaSegundoFactor("otpauth://totp/AguaVigia:test?secret=JBSWY3DPEHPK3PXP", "JBSWY3DPEHPK3PXP"));

        mockMvc.perform(post("/api/veedor/segundo-factor/alta")
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.uri").value("otpauth://totp/AguaVigia:test?secret=JBSWY3DPEHPK3PXP"))
                .andExpect(jsonPath("$.secreto").value("JBSWY3DPEHPK3PXP"));
    }

    @Test
    void confirmarAltaConCodigoValidoDevuelveNuevaSesion() throws Exception {
        UsuarioId usuarioId = new UsuarioId(AutenticacionDePrueba.USUARIO_ID);
        given(jwtProvider.validar(TOKEN))
                .willReturn(Optional.of(AutenticacionDePrueba.sesionCon(Permiso.CONFIGURAR_SEGUNDO_FACTOR)));
        given(revocacion.revocadasAntesDe(any())).willReturn(Optional.empty());

        given(configurar.confirmar(eq(usuarioId), eq("123456"), any()))
                .willReturn("nuevo-token-completo");

        Usuario usuario = new Usuario(
                usuarioId,
                new CorreoElectronico("veedor@aguavigia.test"),
                "Veedor de prueba",
                new ClaveHash("$2a$10$abcdefghijklmnopqrstuu"),
                EstadoCuenta.ACTIVA,
                PermisosEfectivos.deRol(RolVeedor.VEEDOR),
                null,
                AHORA,
                AHORA);
        given(cuentas.buscar(usuarioId)).willReturn(Optional.of(usuario));

        String json = """
                {
                    "codigo": "123456"
                }
                """;

        mockMvc.perform(post("/api/veedor/segundo-factor/confirmacion")
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("nuevo-token-completo"))
                .andExpect(jsonPath("$.correo").value("veedor@aguavigia.test"));
    }

    @Test
    void desactivarSegundoFactorConCodigoValidoResponde204() throws Exception {
        UsuarioId usuarioId = new UsuarioId(AutenticacionDePrueba.USUARIO_ID);
        given(jwtProvider.validar(TOKEN))
                .willReturn(Optional.of(AutenticacionDePrueba.sesionCon(Permiso.CONFIGURAR_SEGUNDO_FACTOR)));
        given(revocacion.revocadasAntesDe(any())).willReturn(Optional.empty());

        String json = """
                {
                    "codigo": "654321"
                }
                """;

        mockMvc.perform(post("/api/veedor/segundo-factor/baja")
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isNoContent());
    }
}
