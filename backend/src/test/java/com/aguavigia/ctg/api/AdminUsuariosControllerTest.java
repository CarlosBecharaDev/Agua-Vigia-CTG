package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.error.ManejadorGlobalDeErrores;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.EstadoCuenta;
import com.aguavigia.ctg.domain.Pagina;
import com.aguavigia.ctg.domain.Permiso;
import com.aguavigia.ctg.domain.ClaveHash;
import com.aguavigia.ctg.domain.PermisosEfectivos;
import com.aguavigia.ctg.domain.RolVeedor;
import com.aguavigia.ctg.domain.Usuario;
import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.in.AdministrarCuentaUseCase;
import com.aguavigia.ctg.domain.port.in.ConsultarCuentasUseCase;
import com.aguavigia.ctg.domain.port.in.InvitarUsuarioUseCase;
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
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminUsuariosController.class)
@Import({ManejadorGlobalDeErrores.class, SecurityConfig.class})
@TestPropertySource(properties = "aguavigia.rate-limit.reglas=")
class AdminUsuariosControllerTest {

    private static final String TOKEN = "token-admin";
    private static final Instant AHORA = Instant.parse("2026-09-01T12:00:00Z");

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ConsultarCuentasUseCase cuentas;

    @MockitoBean
    private AdministrarCuentaUseCase administrar;

    @MockitoBean
    private InvitarUsuarioUseCase invitar;

    @MockitoBean
    private JwtProvider jwtProvider;

    @MockitoBean
    private RevocacionSesionPort revocacion;

    @MockitoBean(name = "redisTemplate")
    private RedisTemplate<String, String> redisTemplateMock;

    @Test
    void llamadaSinTokenDebeResponder401EnFormatoRfc7807() throws Exception {
        mockMvc.perform(get("/api/veedor/usuarios"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("No autenticado"))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void usuarioSinPermisoGestionarUsuariosDebeResponder403EnFormatoRfc7807() throws Exception {
        given(jwtProvider.validar(TOKEN))
                .willReturn(Optional.of(AutenticacionDePrueba.sesionCon(Permiso.VER_PANEL)));
        given(revocacion.revocadasAntesDe(any())).willReturn(Optional.empty());

        mockMvc.perform(get("/api/veedor/usuarios")
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Acceso denegado"))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void usuarioConPermisoGestionarUsuariosPuedeListarUsuarios() throws Exception {
        given(jwtProvider.validar(TOKEN))
                .willReturn(Optional.of(AutenticacionDePrueba.sesionCon(Permiso.GESTIONAR_USUARIOS)));
        given(revocacion.revocadasAntesDe(any())).willReturn(Optional.empty());

        Usuario usuario = new Usuario(
                new UsuarioId("22222222-2222-2222-2222-222222222222"),
                new CorreoElectronico("veedor@aguavigia.ctg"),
                "Veedor CTG",
                new ClaveHash("$2a$10$abcdefghijklmnopqrstuu"),
                EstadoCuenta.ACTIVA,
                PermisosEfectivos.deRol(RolVeedor.VEEDOR),
                null,
                AHORA,
                AHORA);

        given(cuentas.listar(any(), anyInt(), anyInt()))
                .willReturn(new Pagina<>(List.of(usuario), 0, 20, 1));

        mockMvc.perform(get("/api/veedor/usuarios")
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].correo").value("veedor@aguavigia.ctg"))
                .andExpect(jsonPath("$[0].nombre").value("Veedor CTG"))
                .andExpect(jsonPath("$[0].rol").value("VEEDOR"));
    }
}
