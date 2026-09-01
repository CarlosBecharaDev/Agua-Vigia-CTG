package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.error.ManejadorGlobalDeErrores;
import com.aguavigia.ctg.api.mapper.PropuestaIngestaApiMapperImpl;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Pagina;
import com.aguavigia.ctg.domain.PropuestaId;
import com.aguavigia.ctg.domain.PropuestaIngesta;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.RevisarPropuestaIngestaUseCase;
import com.aguavigia.ctg.domain.port.out.PropuestaIngestaRepository;
import com.aguavigia.ctg.infrastructure.config.SecurityConfig;
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

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(IngestaRevisionController.class)
@Import({PropuestaIngestaApiMapperImpl.class, ManejadorGlobalDeErrores.class, SecurityConfig.class})
@TestPropertySource(properties = "aguavigia.rate-limit.reglas=")
class IngestaRevisionControllerTest {

    private static final Instant DETECTADA_EN = Instant.parse("2026-08-09T20:00:00Z");
    private static final String TOKEN = "Bearer token-de-veedor";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RevisarPropuestaIngestaUseCase revisarPropuesta;

    @MockitoBean
    private PropuestaIngestaRepository propuestas;

    @MockitoBean
    private JwtProvider jwtProvider;

    @MockitoBean
    private com.aguavigia.ctg.domain.port.out.RevocacionSesionPort revocacion;

    // RateLimitConfig implementa WebMvcConfigurer y se instancia en cualquier @WebMvcTest aunque
    // no se importe (REC-006).
    @MockitoBean(name = "redisTemplate")
    private RedisTemplate<String, String> redisTemplateMock;

    private void autenticarComoVeedor() {
        given(jwtProvider.validar("token-de-veedor"))
                .willReturn(Optional.of(AutenticacionDePrueba.sesionCon(Permiso.VER_PANEL, Permiso.REVISAR_INGESTA)));
    }

    private PropuestaIngesta propuesta() {
        return new PropuestaIngesta(new PropuestaId("p-1"), new SectorId("manga"),
                EstadoServicio.SIN_SERVICIO, "acuacar", "https://acuacar.com/x",
                "Se suspende el servicio en el barrio Manga", 0.6, DETECTADA_EN);
    }

    /**
     * Una propuesta es una afirmación sin verificar sobre el servicio de un barrio: exponerla
     * públicamente sería publicar justo lo que este rediseño evita.
     */
    @Test
    void debeRechazarLaColaDeRevisionSinTokenCon401() throws Exception {
        mockMvc.perform(get("/api/veedor/ingesta/propuestas"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void debeRechazarAprobarSinTokenCon401() throws Exception {
        mockMvc.perform(patch("/api/veedor/ingesta/propuestas/p-1/aprobar"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void debeListarLasPropuestasPendientesConSuCitaYConfianza() throws Exception {
        autenticarComoVeedor();
        given(propuestas.listarPendientes(anyInt(), anyInt()))
                .willReturn(new Pagina<>(List.of(propuesta()), 0, 50, 1));

        mockMvc.perform(get("/api/veedor/ingesta/propuestas").header("Authorization", TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("p-1"))
                .andExpect(jsonPath("$[0].sectorId").value("manga"))
                .andExpect(jsonPath("$[0].estadoPropuesto").value("SIN_SERVICIO"))
                .andExpect(jsonPath("$[0].fuente").value("acuacar"))
                .andExpect(jsonPath("$[0].citaTextual").value("Se suspende el servicio en el barrio Manga"))
                .andExpect(jsonPath("$[0].confianza").value(0.6))
                .andExpect(jsonPath("$[0].estadoRevision").value("PENDIENTE"));
    }

    @Test
    void debeAprobarUnaPropuesta() throws Exception {
        autenticarComoVeedor();
        given(revisarPropuesta.aprobar(new PropuestaId("p-1"))).willReturn(propuesta().aprobar());

        mockMvc.perform(patch("/api/veedor/ingesta/propuestas/p-1/aprobar").header("Authorization", TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoRevision").value("APROBADA"));
    }

    @Test
    void debeDescartarUnaPropuesta() throws Exception {
        autenticarComoVeedor();
        given(revisarPropuesta.descartar(new PropuestaId("p-1"))).willReturn(propuesta().descartar());

        mockMvc.perform(patch("/api/veedor/ingesta/propuestas/p-1/descartar").header("Authorization", TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estadoRevision").value("DESCARTADA"));
    }

    @Test
    void debeResponder400EnFormatoRfc7807SiLaPropuestaNoExiste() throws Exception {
        autenticarComoVeedor();
        given(revisarPropuesta.aprobar(any()))
                .willThrow(new IllegalArgumentException("No existe la propuesta 'no-existe'"));

        mockMvc.perform(patch("/api/veedor/ingesta/propuestas/no-existe/aprobar").header("Authorization", TOKEN))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Peticion invalida"));
    }

    @Test
    void debeResponder409SiElSectorDeLaPropuestaYaNoExiste() throws Exception {
        autenticarComoVeedor();
        given(revisarPropuesta.aprobar(any()))
                .willThrow(new IllegalStateException("El sector 'manga' de la propuesta ya no existe"));

        mockMvc.perform(patch("/api/veedor/ingesta/propuestas/p-1/aprobar").header("Authorization", TOKEN))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Conflicto de estado"));
    }
}
