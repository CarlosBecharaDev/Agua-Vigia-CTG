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
import static org.assertj.core.api.Assertions.entry;

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

    /**
     * NO se fija el `_id`: scripts/sembrar-sectores.mjs inserta los 213 barrios sin el, asi que en
     * produccion es un ObjectId y la identidad de dominio vive en `slug`. Este fixture lo ponia
     * igual al slug y con eso el $lookup roto (que cruzaba `_id` contra `_id`) pasaba la prueba
     * mientras en produccion devolvia "Desconocido" en los cinco sectores.
     */
    private void sembrarSector(String slug, String nombre) {
        SectorDocumento documento = new SectorDocumento();
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

    /**
     * El top cuenta menciones en avisos aprobados, no cortes con ventana medida: un `CorteAgua`
     * exige rango horario declarado y solo ~5 de cada 100 boletines de Acuacar lo traen, así que
     * contra `cortes` este top se calculaba sobre un puñado de registros y no representaba la
     * ciudad. Las propuestas aprobadas cubren los cinco años de boletines.
     */
    @Test
    void debeCalcularElTopDeSectoresMasAfectados() {
        sembrarSector("manga", "Manga");
        sembrarSector("bocagrande", "Bocagrande");
        sembrarPropuestaAprobada("p1", "manga");
        sembrarPropuestaAprobada("p2", "manga");
        sembrarPropuestaAprobada("p3", "bocagrande");
        sembrarPropuestaPendiente("p4", "bocagrande");

        EstadisticasGlobales resultado = adaptador.calcularGlobales();

        assertThat(resultado.sectoresMasAfectados()).hasSize(2);
        assertThat(resultado.sectoresMasAfectados().get(0).sectorId()).isEqualTo(new SectorId("manga"));
        assertThat(resultado.sectoresMasAfectados().get(0).nombre()).isEqualTo("Manga");
        assertThat(resultado.sectoresMasAfectados().get(0).cantidadCortes()).isEqualTo(2);
    }

    private void sembrarPropuestaAprobada(String id, String sectorId) {
        sembrarPropuesta(id, sectorId, "APROBADA");
    }

    /** Una propuesta sin aprobar no cuenta: nadie ha confirmado que ese aviso sea real. */
    private void sembrarPropuestaPendiente(String id, String sectorId) {
        sembrarPropuesta(id, sectorId, "PENDIENTE");
    }

    private void sembrarPropuesta(String id, String sectorId, String estadoRevision) {
        PropuestaIngestaDocumento documento = new PropuestaIngestaDocumento();
        documento.setId(id);
        documento.setSectorId(sectorId);
        documento.setEstadoPropuesto("SIN_SERVICIO");
        documento.setFuente("acuacar");
        documento.setConfianza(0.85);
        documento.setDetectadaEn(Instant.parse("2026-08-01T10:00:00Z"));
        documento.setEstadoRevision(estadoRevision);
        mongoTemplate.save(documento);
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
    void debeDevolverLosSieteDiasEnOrdenAunqueNoTenganCortes() {
        sembrarSector("manga", "Manga");
        // 2026-08-05 es miercoles en America/Bogota.
        sembrarCorte("c1", List.of("manga"),
                Instant.parse("2026-08-05T15:00:00Z"), Instant.parse("2026-08-05T19:00:00Z"));

        EstadisticasGlobales resultado = adaptador.calcularGlobales();

        assertThat(resultado.cortesPorDiaDeSemana()).containsExactly(
                entry("Lunes", 0), entry("Martes", 0), entry("Miércoles", 1), entry("Jueves", 0),
                entry("Viernes", 0), entry("Sábado", 0), entry("Domingo", 0));
    }

    @Test
    void debeIgnorarCortesAunAbiertosParaLaDuracionPromedio() {
        sembrarSector("manga", "Manga");
        sembrarCorte("c1", List.of("manga"), Instant.parse("2026-08-01T10:00:00Z"), null);

        EstadisticasGlobales resultado = adaptador.calcularGlobales();

        assertThat(resultado.duracionPromedioHoras()).isEqualTo(0.0);
    }
}
