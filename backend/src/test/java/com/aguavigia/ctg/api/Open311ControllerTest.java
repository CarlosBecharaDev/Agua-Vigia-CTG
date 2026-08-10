package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.error.ManejadorGlobalDeErrores;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import com.aguavigia.ctg.infrastructure.config.SecurityConfig;
import com.aguavigia.ctg.infrastructure.security.JwtProvider;
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
}
