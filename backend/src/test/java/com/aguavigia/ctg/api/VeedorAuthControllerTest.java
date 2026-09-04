package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.error.ManejadorGlobalDeErrores;
import com.aguavigia.ctg.domain.AlcanceSesion;
import com.aguavigia.ctg.domain.CorreoElectronico;
import com.aguavigia.ctg.domain.CredencialInvalidaException;
import com.aguavigia.ctg.domain.CuentaBloqueadaException;
import com.aguavigia.ctg.domain.CuentaNoHabilitadaException;
import com.aguavigia.ctg.domain.EstadoCuenta;
import com.aguavigia.ctg.domain.Permiso;
import com.aguavigia.ctg.domain.RolVeedor;
import com.aguavigia.ctg.domain.SegundoFactorRequeridoException;
import com.aguavigia.ctg.domain.SesionEmitida;
import com.aguavigia.ctg.domain.UsuarioId;
import com.aguavigia.ctg.domain.port.in.AutenticarUsuarioUseCase;
import com.aguavigia.ctg.domain.port.in.CerrarSesionUseCase;
import com.aguavigia.ctg.domain.port.in.ConsultarCuentasUseCase;
import com.aguavigia.ctg.domain.port.out.RevocacionSesionPort;
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
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Desde ADR-039 el login es por cuenta individual, no por la clave compartida de ADR-016. Toda la
 * política vive en AutenticarUsuarioService y aquí se prueba solo la traducción HTTP: que cada
 * excepción del dominio salga con el código y el `type` que el frontend necesita para distinguirlas.
 */
@WebMvcTest(VeedorAuthController.class)
@Import({SecurityConfig.class, ManejadorGlobalDeErrores.class})
@TestPropertySource(properties = {
        // Sin reglas de rate limiting: este slice prueba el login, y con la regla real de
        // application.yml el interceptor llamaria al RedisTemplate mockeado. Que /api/veedor/sesion
        // quede protegido de verdad lo prueba ReglasDeRateLimitDeProduccionTest.
        "aguavigia.rate-limit.reglas="
})
class VeedorAuthControllerTest {

    private static final String CUERPO = """
            {"correo":"veedor@aguavigia.test","clave":"clave-correcta-de-prueba"}""";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AutenticarUsuarioUseCase autenticar;

    @MockitoBean
    private CerrarSesionUseCase cerrarSesion;

    @MockitoBean
    private ConsultarCuentasUseCase cuentas;

    @MockitoBean
    private JwtProvider jwtProvider;

    @MockitoBean
    private RevocacionSesionPort revocacion;

    // RateLimitConfig implementa WebMvcConfigurer: @WebMvcTest lo detecta e instancia en
    // cualquier slice del proyecto, aunque no se importe aqui — necesita este bean para construirse.
    // name="redisTemplate" porque RateLimitConfig lo pide con @Qualifier("redisTemplate").
    @MockitoBean(name = "redisTemplate")
    private RedisTemplate<String, String> redisTemplateMock;

    private static SesionEmitida sesion() {
        return new SesionEmitida("token-de-prueba", new UsuarioId("u-1"), "Veedor de prueba",
                new CorreoElectronico("veedor@aguavigia.test"), RolVeedor.VEEDOR,
                Set.of(Permiso.VER_PANEL, Permiso.MODERAR_REPORTES), AlcanceSesion.COMPLETO);
    }

    @Test
    void debeEmitirUnTokenConCredencialCorrecta() throws Exception {
        given(autenticar.autenticar(any(), eq("clave-correcta-de-prueba"), isNull(), any()))
                .willReturn(sesion());

        mockMvc.perform(post("/api/veedor/sesion").contentType("application/json").content(CUERPO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token-de-prueba"))
                .andExpect(jsonPath("$.rol").value("VEEDOR"))
                .andExpect(jsonPath("$.alcance").value("COMPLETO"));
    }

    /** El frontend pinta el panel a partir de esto: si no viajan los permisos, no sabe qué mostrar. */
    @Test
    void debeDevolverLosPermisosEfectivosJuntoConElToken() throws Exception {
        given(autenticar.autenticar(any(), any(), any(), any())).willReturn(sesion());

        mockMvc.perform(post("/api/veedor/sesion").contentType("application/json").content(CUERPO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.permisos").isArray())
                .andExpect(jsonPath("$.permisos[0]").value("MODERAR_REPORTES"))
                .andExpect(jsonPath("$.permisos[1]").value("VER_PANEL"));
    }

    @Test
    void debeRechazarUnaCredencialIncorrectaCon401() throws Exception {
        willThrow(new CredencialInvalidaException("Correo o clave incorrectos."))
                .given(autenticar).autenticar(any(), any(), any(), any());

        mockMvc.perform(post("/api/veedor/sesion").contentType("application/json").content(CUERPO))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.type").value("https://aguavigia.example/errores/credencial-invalida"));
    }

    /**
     * 401 con un `type` distinto al de credencial inválida: el frontend tiene que poder pedir el
     * código en vez de decirle a la persona que su clave está mal, que es lo contrario de la verdad.
     */
    @Test
    void debeDistinguirLaFaltaDeSegundoFactorDeUnaClaveIncorrecta() throws Exception {
        willThrow(new SegundoFactorRequeridoException("Esta cuenta pide el código de tu app."))
                .given(autenticar).autenticar(any(), any(), any(), any());

        mockMvc.perform(post("/api/veedor/sesion").contentType("application/json").content(CUERPO))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.type")
                        .value("https://aguavigia.example/errores/segundo-factor-requerido"));
    }

    @Test
    void unaCuentaSinAprobarDebeRecibir403ConSuEstado() throws Exception {
        willThrow(new CuentaNoHabilitadaException(EstadoCuenta.PENDIENTE_APROBACION,
                "Tu cuenta espera la aprobación de un administrador."))
                .given(autenticar).autenticar(any(), any(), any(), any());

        mockMvc.perform(post("/api/veedor/sesion").contentType("application/json").content(CUERPO))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.estado").value("PENDIENTE_APROBACION"));
    }

    /** 423 y no 429: el bloqueo por cuenta y el límite por IP son dos frenos y se dicen distinto. */
    @Test
    void unaCuentaBloqueadaDebeRecibir423ConLoQueFaltaDeEspera() throws Exception {
        willThrow(new CuentaBloqueadaException(Duration.ofMinutes(10), "Demasiados intentos fallidos."))
                .given(autenticar).autenticar(any(), any(), any(), any());

        mockMvc.perform(post("/api/veedor/sesion").contentType("application/json").content(CUERPO))
                .andExpect(status().isLocked())
                .andExpect(jsonPath("$.segundosRestantes").value(600));
    }

    @Test
    void debeRechazarUnCorreoMalFormadoAntesDeLlamarAlCasoDeUso() throws Exception {
        mockMvc.perform(post("/api/veedor/sesion").contentType("application/json")
                        .content("{\"correo\":\"no-es-un-correo\",\"clave\":\"cualquiera\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void debeRechazarUnaClaveEnBlancoAntesDeConsultarNada() throws Exception {
        mockMvc.perform(post("/api/veedor/sesion").contentType("application/json")
                        .content("{\"correo\":\"veedor@aguavigia.test\",\"clave\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void debeRechazarUnaRutaDeVeedorSinTokenCon401() throws Exception {
        mockMvc.perform(get("/api/veedor/yo"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unTokenValidoDebeAtravesarElFiltroDeSeguridad() throws Exception {
        given(jwtProvider.validar("token-valido"))
                .willReturn(Optional.of(AutenticacionDePrueba.sesionCon(Permiso.VER_PANEL)));
        given(revocacion.revocadasAntesDe(any())).willReturn(Optional.empty());
        given(cuentas.buscar(any())).willReturn(Optional.empty());

        // 409 y no 401/403: el filtro dejo pasar la peticion y fue el controlador quien se quejo de
        // que la cuenta ya no existe. Es la prueba de que la autenticacion funciono.
        mockMvc.perform(get("/api/veedor/yo").header("Authorization", "Bearer token-valido"))
                .andExpect(status().isConflict());
    }

    /** Cerrar sesión revoca en el servidor: no basta con que el navegador tire el token. */
    @Test
    void cerrarSesionDebeRevocarEnElServidor() throws Exception {
        given(jwtProvider.validar("token-valido"))
                .willReturn(Optional.of(AutenticacionDePrueba.sesionCon(Permiso.VER_PANEL)));
        given(revocacion.revocadasAntesDe(any())).willReturn(Optional.empty());

        mockMvc.perform(post("/api/veedor/sesion/cierre").header("Authorization", "Bearer token-valido"))
                .andExpect(status().isNoContent());

        verify(cerrarSesion).cerrar(new UsuarioId(AutenticacionDePrueba.USUARIO_ID));
    }
}
