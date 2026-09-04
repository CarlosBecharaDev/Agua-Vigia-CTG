package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.error.ManejadorGlobalDeErrores;
import com.aguavigia.ctg.api.mapper.ReporteApiMapperImpl;
import com.aguavigia.ctg.domain.Coordenada;
import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.LimiteReportesExcedidoException;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.port.in.AgregarEvidenciaUseCase;
import com.aguavigia.ctg.domain.port.in.ConfirmarReporteUseCase;
import com.aguavigia.ctg.domain.port.in.RegistrarReporteUseCase;
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

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReporteController.class)
@Import({ReporteApiMapperImpl.class, ManejadorGlobalDeErrores.class, SecurityConfig.class})
// Sin reglas de rate limiting: este slice prueba el contrato del controlador, y con la regla real
// de application.yml el interceptor llamaria al RedisTemplate mockeado. El limitador tiene su
// propia prueba contra un Redis real (RateLimitConfigTest).
@TestPropertySource(properties = "aguavigia.rate-limit.reglas=")
class ReporteControllerTest {

    // SecurityConfig construye JwtAuthenticationFilter con este puerto: el filtro consulta la
    // revocacion en cada peticion con token (ADR-039). Sin el bean, el contexto del slice no carga.
    @MockitoBean
    private RevocacionSesionPort revocacion;

    private static final Instant AHORA = Instant.parse("2026-08-08T15:30:00Z");

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RegistrarReporteUseCase registrarReporte;

    @MockitoBean
    private AgregarEvidenciaUseCase agregarEvidenciaUseCase;

    @MockitoBean
    private ConfirmarReporteUseCase confirmarReporte;

    @MockitoBean
    private JwtProvider jwtProvider;

    // Igual que en SectorControllerTest/SuscripcionControllerTest: RateLimitConfig exige este bean
    // en cualquier slice de @WebMvcTest aunque no se importe aquí.
    @MockitoBean(name = "redisTemplate")
    private RedisTemplate<String, String> redisTemplateMock;

    @Test
    void debeRegistrarElReporteYResponder201() throws Exception {
        ReporteCiudadano creado = new ReporteCiudadano(
                new ReporteId("r1"), new SectorId("bocagrande"), TipoReporte.SIN_AGUA,
                new Coordenada(10.39, -75.48), new HuellaDispositivo("hash-1"), AHORA);
        given(registrarReporte.registrar(any(), any(), any(), any())).willReturn(creado);

        mockMvc.perform(post("/api/reportes")
                        .contentType("application/json")
                        .content("""
                                {"sectorId":"bocagrande","tipo":"SIN_AGUA","huella":"hash-1",
                                 "coordenada":{"latitud":10.39,"longitud":-75.48}}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("r1"))
                .andExpect(jsonPath("$.sectorId").value("bocagrande"))
                .andExpect(jsonPath("$.tipo").value("SIN_AGUA"));
    }

    @Test
    void debeAceptarUnReporteSinCoordenada() throws Exception {
        ReporteCiudadano creado = new ReporteCiudadano(
                new ReporteId("r2"), new SectorId("bocagrande"), TipoReporte.PRESION_BAJA,
                null, new HuellaDispositivo("hash-2"), AHORA);
        given(registrarReporte.registrar(any(), any(), isNull(), any())).willReturn(creado);

        mockMvc.perform(post("/api/reportes")
                        .contentType("application/json")
                        .content("""
                                {"sectorId":"bocagrande","tipo":"PRESION_BAJA","huella":"hash-2"}"""))
                .andExpect(status().isCreated());
    }

    @Test
    void debeResponder400ConFormatoRfc7807SiElSectorNoExiste() throws Exception {
        given(registrarReporte.registrar(any(), any(), any(), any()))
                .willThrow(new IllegalArgumentException("No existe el sector 'no-existe'"));

        mockMvc.perform(post("/api/reportes")
                        .contentType("application/json")
                        .content("""
                                {"sectorId":"no-existe","tipo":"SIN_AGUA","huella":"hash-1"}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("No existe el sector 'no-existe'"));
    }

    @Test
    void debeResponder400SiElTipoNoEsValido() throws Exception {
        mockMvc.perform(post("/api/reportes")
                        .contentType("application/json")
                        .content("""
                                {"sectorId":"bocagrande","tipo":"NO_EXISTE","huella":"hash-1"}"""))
                .andExpect(status().isBadRequest());
    }

    @Test
    void debeResponder429CuandoElDispositivoSuperaElLimite() throws Exception {
        given(registrarReporte.registrar(any(), any(), any(), any()))
                .willThrow(new LimiteReportesExcedidoException("Ya reportaste 3 veces en 'bocagrande'"));

        mockMvc.perform(post("/api/reportes")
                        .contentType("application/json")
                        .content("""
                                {"sectorId":"bocagrande","tipo":"SIN_AGUA","huella":"hash-1"}"""))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.title").value("Límite de reportes excedido"));
    }

    @Test
    void debeResponder400SiFaltaLaHuella() throws Exception {
        mockMvc.perform(post("/api/reportes")
                        .contentType("application/json")
                        .content("""
                                {"sectorId":"bocagrande","tipo":"SIN_AGUA"}"""))
                .andExpect(status().isBadRequest());
    }

    /** BUG-062 — un verbo que la ruta no expone es error del cliente (405), no del servidor (500). */
    @Test
    void debeResponder405ConLaCabeceraAllowSiSeConsultaLaRutaDeReportesConGet() throws Exception {
        mockMvc.perform(get("/api/reportes"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(header().string("Allow", "POST"))
                .andExpect(jsonPath("$.title").value("Metodo no permitido"));
    }

    /** BUG-062 — mismo origen: sin manejador, un Content-Type ajeno tambien salia por el 500. */
    @Test
    void debeResponder415SiElCuerpoNoViajaComoJson() throws Exception {
        mockMvc.perform(post("/api/reportes")
                        .contentType("text/plain")
                        .content("sin agua en bocagrande"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.title").value("Tipo de contenido no soportado"));
    }

    @Test
    void debeResponder400EnFormatoRfc7807SiElJsonEstaMalFormado() throws Exception {
        mockMvc.perform(post("/api/reportes")
                        .contentType("application/json")
                        .content("{\"sectorId\":"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Peticion invalida"));
    }

    /** M10 — subir evidencia sin adjuntar el archivo respondia 500 en vez de decir que falta. */
    @Test
    void debeResponder400SiElMultipartLlegaSinLaFoto() throws Exception {
        mockMvc.perform(multipart("/api/reportes/r1/foto"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Peticion invalida"));
    }

    @Test
    void debeConfirmarReporteYResponder200() throws Exception {
        ReporteCiudadano confirmado = new ReporteCiudadano(
                new ReporteId("r1"), new SectorId("bocagrande"), TipoReporte.SIN_AGUA,
                new Coordenada(10.39, -75.48), new HuellaDispositivo("hash-1"), AHORA, com.aguavigia.ctg.domain.EstadoModeracion.PENDIENTE, null, java.util.Set.of("hash-confirm"));
        given(confirmarReporte.confirmar(any(), any())).willReturn(confirmado);

        mockMvc.perform(post("/api/reportes/r1/confirmar")
                        .contentType("application/json")
                        .content("""
                                {"huella":"hash-confirm-hash-confirm-hash-conf"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("r1"))
                .andExpect(jsonPath("$.confirmaciones").value(1));
    }
}
