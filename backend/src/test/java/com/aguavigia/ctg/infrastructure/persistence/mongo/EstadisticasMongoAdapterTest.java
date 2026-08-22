package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.CalcularEstadisticasUseCase.EstadisticasGlobales;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * La versión original de esta agregación apuntaba a colecciones "corteAguaDocumento" /
 * "sectorDocumento" que nunca existieron (los documentos reales viven en "cortes" / "sectores"),
 * así que /api/estadisticas siempre devolvía listas vacías sin que ningún test lo notara.
 */
@Testcontainers
@DataMongoTest
@Import(EstadisticasMongoAdapter.class)
class EstadisticasMongoAdapterTest {

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7.0");

    @Autowired
    private EstadisticasMongoAdapter adaptador;

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void limpiar() {
        mongoTemplate.getDb().getCollection("cortes").drop();
        mongoTemplate.getDb().getCollection("sectores").drop();
    }

    private void sembrarSector(String slug, String nombre) {
        SectorDocumento documento = new SectorDocumento();
        documento.setId(slug);
        documento.setSlug(slug);
        documento.setNombre(nombre);
        mongoTemplate.save(documento);
    }

    private void sembrarCorte(String id, List<String> sectoresAfectados, Instant inicio, Instant finReal) {
        CorteAguaDocumento documento = new CorteAguaDocumento();
        documento.setId(id);
        documento.setSectoresAfectados(sectoresAfectados);
        documento.setInicio(inicio);
        documento.setFinReal(finReal);
        mongoTemplate.save(documento);
    }

    @Test
    void debeCalcularElTopDeSectoresMasAfectados() {
        sembrarSector("manga", "Manga");
        sembrarSector("bocagrande", "Bocagrande");
        Instant inicio = Instant.parse("2026-08-01T10:00:00Z");
        Instant fin = Instant.parse("2026-08-01T14:00:00Z");
        sembrarCorte("c1", List.of("manga"), inicio, fin);
        sembrarCorte("c2", List.of("manga"), inicio, fin);
        sembrarCorte("c3", List.of("bocagrande"), inicio, fin);

        EstadisticasGlobales resultado = adaptador.calcularGlobales();

        assertThat(resultado.sectoresMasAfectados()).hasSize(2);
        assertThat(resultado.sectoresMasAfectados().get(0).sectorId()).isEqualTo(new SectorId("manga"));
        assertThat(resultado.sectoresMasAfectados().get(0).nombre()).isEqualTo("Manga");
        assertThat(resultado.sectoresMasAfectados().get(0).cantidadCortes()).isEqualTo(2);
    }

    @Test
    void debeCalcularLaDuracionPromedioEnHoras() {
        sembrarSector("manga", "Manga");
        sembrarCorte("c1", List.of("manga"),
                Instant.parse("2026-08-01T10:00:00Z"), Instant.parse("2026-08-01T14:00:00Z"));

        EstadisticasGlobales resultado = adaptador.calcularGlobales();

        assertThat(resultado.duracionPromedioHoras()).isEqualTo(4.0);
    }

    @Test
    void debeIgnorarCortesAunAbiertosParaLaDuracionPromedio() {
        sembrarSector("manga", "Manga");
        sembrarCorte("c1", List.of("manga"), Instant.parse("2026-08-01T10:00:00Z"), null);

        EstadisticasGlobales resultado = adaptador.calcularGlobales();

        assertThat(resultado.duracionPromedioHoras()).isEqualTo(0.0);
    }
}
