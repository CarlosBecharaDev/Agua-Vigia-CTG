package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.error.ManejadorGlobalDeErrores;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import com.aguavigia.ctg.infrastructure.config.SecurityConfig;
import com.aguavigia.ctg.infrastructure.security.JwtProvider;
import com.aguavigia.ctg.domain.port.out.RevocacionSesionPort;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(Open311Controller.class)
@Import({ManejadorGlobalDeErrores.class, SecurityConfig.class})
class Open311ControllerTest {

    // SecurityConfig construye JwtAuthenticationFilter con este puerto: el filtro consulta la
    // revocacion en cada peticion con token (ADR-039). Sin el bean, el contexto del slice no carga.
    @MockitoBean
    private RevocacionSesionPort revocacion;

    private static final java.time.Instant ACTUALIZADO_EN = java.time.Instant.parse("2026-08-09T20:00:00Z");

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SectorRepository sectores;

    @MockitoBean
    private JwtProvider jwtProvider;

    @MockitoBean(name = "redisTemplate")
    private RedisTemplate<String, String> redisTemplateMock;

    @Test
    void debeDevolverActivosEnFormatoOpen311() throws Exception {
        given(sectores.listarTodos()).willReturn(List.of(
                new Sector(new SectorId("bocagrande"), "BOCAGRANDE", 12000, EstadoServicio.SIN_SERVICIO),
                new Sector(new SectorId("manga"), "MANGA", 5000, EstadoServicio.CON_SERVICIO)
        ));

        mockMvc.perform(get("/api/v2/requests.json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].service_request_id").value("bocagrande"))
                .andExpect(jsonPath("$[0].status").value("open"))
                .andExpect(jsonPath("$[0].service_name").value("Problema de suministro (SIN_SERVICIO)"))
                .andExpect(jsonPath("$[0].address").value("BOCAGRANDE"));
    }

    /** GeoReport v2 espera service_code, description y las marcas de tiempo; sin ellas un
     * consumidor estandar no procesa la respuesta. */
    @Test
    void debeTraerLosCamposQueExigeGeoReportV2() throws Exception {
        given(sectores.listarTodos()).willReturn(List.of(
                new Sector(new SectorId("bocagrande"), "BOCAGRANDE", 12000, EstadoServicio.SIN_SERVICIO,
                        ACTUALIZADO_EN)));

        mockMvc.perform(get("/api/v2/requests.json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].service_code").value("AGUA-001"))
                .andExpect(jsonPath("$[0].description").value("No hay servicio de agua en BOCAGRANDE, Cartagena de Indias."))
                .andExpect(jsonPath("$[0].requested_datetime").value("2026-08-09T20:00:00Z"))
                .andExpect(jsonPath("$[0].updated_datetime").value("2026-08-09T20:00:00Z"));
    }

    @Test
    void debeDescribirCadaEstadoEnEspanolYNoConElNombreDelEnum() throws Exception {
        given(sectores.listarTodos()).willReturn(List.of(
                new Sector(new SectorId("manga"), "MANGA", 5000, EstadoServicio.PRESION_BAJA, ACTUALIZADO_EN),
                new Sector(new SectorId("crespo"), "CRESPO", 5000, EstadoServicio.CORTE_PROGRAMADO, ACTUALIZADO_EN)));

        mockMvc.perform(get("/api/v2/requests.json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].description").value("El agua llega con poca presión en MANGA, Cartagena de Indias."))
                .andExpect(jsonPath("$[1].description").value("Hay un corte de agua anunciado en CRESPO, Cartagena de Indias."));
    }

    /**
     * ADR-014: un sector sin estado verificado no aparece. Publicar "sin novedad" sin haberlo
     * comprobado es el falso positivo que el proyecto existe para evitar.
     */
    @Test
    void noDebeExponerSectoresSinEstadoVerificado() throws Exception {
        given(sectores.listarTodos()).willReturn(List.of(
                new Sector(new SectorId("isla-fuerte"), "ISLA FUERTE", null, null)));

        mockMvc.perform(get("/api/v2/requests.json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
