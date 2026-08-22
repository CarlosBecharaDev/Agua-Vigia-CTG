package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.CoordenadaDTO;
import com.aguavigia.ctg.api.dto.ReporteRespuesta;
import com.aguavigia.ctg.api.dto.SolicitudConfirmar;
import com.aguavigia.ctg.api.dto.SolicitudReporte;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prueba de integración contra el contexto real de Spring (no @WebMvcTest con el use case
 * mockeado): esta es la que hubiera detectado el 500 de POST /api/reportes/{id}/confirmar
 * causado por @Transactional sin TransactionManager para Mongo en el classpath.
 */
@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ReporteControllerIntegrationTest {

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer(DockerImageName.parse("mongo:7.0"));

    @Container
    @ServiceConnection
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @Autowired
    private TestRestTemplate cliente;

    @Autowired
    private SectorRepository sectores;

    @BeforeEach
    void sembrarSector() {
        sectores.guardar(new Sector(new SectorId("manga"), "Manga", 1000, EstadoServicio.CON_SERVICIO));
    }

    @Test
    void debeConfirmarUnReporteExistente() {
        SolicitudReporte solicitud = new SolicitudReporte("manga", "SIN_AGUA",
                "huella-autor-0123456789abcdef0123456789", (CoordenadaDTO) null);
        ResponseEntity<ReporteRespuesta> creado = cliente.postForEntity("/api/reportes", solicitud, ReporteRespuesta.class);
        assertThat(creado.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String reporteId = creado.getBody().id();

        SolicitudConfirmar confirmacion = new SolicitudConfirmar("huella-vecino-0123456789abcdef0123456789");
        ResponseEntity<ReporteRespuesta> confirmado = cliente.postForEntity(
                "/api/reportes/" + reporteId + "/confirmar", confirmacion, ReporteRespuesta.class);

        assertThat(confirmado.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(confirmado.getBody().confirmaciones()).isEqualTo(1);
    }
}
