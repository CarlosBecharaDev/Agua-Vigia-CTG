package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.Coordenada;
import com.aguavigia.ctg.domain.EstadoModeracion;
import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.ReporteId;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoReporte;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@DataMongoTest
@Import({ReporteCiudadanoMongoAdapter.class, ReporteCiudadanoMongoAdapterTest.RelojFijo.class})
class ReporteCiudadanoMongoAdapterTest {

    private static final Instant AHORA = Instant.parse("2026-08-08T15:30:00Z");

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7.0");

    static class RelojFijo {
        @Bean
        RelojPort reloj() {
            return () -> AHORA;
        }
    }

    @Autowired
    private ReporteCiudadanoMongoAdapter adaptador;

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void limpiar() {
        mongoTemplate.getDb().getCollection("reportes").drop();
    }

    @Test
    void debeGuardarUnReporteConCoordenada() {
        ReporteCiudadano reporte = new ReporteCiudadano(
                new ReporteId("r1"), new SectorId("bocagrande"), TipoReporte.SIN_AGUA,
                new Coordenada(10.39, -75.48), new HuellaDispositivo("hash-1"), AHORA);

        adaptador.guardar(reporte);

        org.bson.Document guardado = mongoTemplate.getDb().getCollection("reportes")
                .find(new org.bson.Document("_id", "r1")).first();
        assertThat(guardado.getString("sectorId")).isEqualTo("bocagrande");
        assertThat(guardado.getString("tipo")).isEqualTo("SIN_AGUA");
        assertThat(guardado.getDouble("latitud")).isEqualTo(10.39);
    }

    @Test
    void debeGuardarUnReporteSinCoordenada() {
        ReporteCiudadano reporte = new ReporteCiudadano(
                new ReporteId("r2"), new SectorId("bocagrande"), TipoReporte.PRESION_BAJA,
                null, new HuellaDispositivo("hash-2"), AHORA);

        adaptador.guardar(reporte);

        org.bson.Document guardado = mongoTemplate.getDb().getCollection("reportes")
                .find(new org.bson.Document("_id", "r2")).first();
        assertThat(guardado.get("latitud")).isNull();
    }

    @Test
    void debeListarSoloLosReportesDentroDeLaVentana() {
        guardarConTimestamp("r3", AHORA.minus(Duration.ofMinutes(10)));
        guardarConTimestamp("r4", AHORA.minus(Duration.ofHours(2)));

        List<ReporteCiudadano> recientes = adaptador.listarRecientesPorSector(
                new SectorId("bocagrande"), Duration.ofMinutes(30));

        assertThat(recientes).extracting(r -> r.id().valor()).containsExactly("r3");
    }

    private void guardarConTimestamp(String id, Instant timestamp) {
        ReporteCiudadanoDocumento documento = new ReporteCiudadanoDocumento();
        documento.setId(id);
        documento.setSectorId("bocagrande");
        documento.setTipo("SIN_AGUA");
        documento.setHuella("hash");
        documento.setTimestamp(timestamp);
        mongoTemplate.save(documento);
    }

    @Test
    void debeNacerPendienteDeModeracion() {
        ReporteCiudadano reporte = new ReporteCiudadano(
                new ReporteId("r5"), new SectorId("bocagrande"), TipoReporte.SIN_AGUA,
                null, new HuellaDispositivo("hash-5"), AHORA);

        adaptador.guardar(reporte);

        ReporteCiudadano recuperado = adaptador.buscarPorId(new ReporteId("r5")).orElseThrow();
        assertThat(recuperado.estadoModeracion()).isEqualTo(EstadoModeracion.PENDIENTE);
    }

    @Test
    void debeTratarUnDocumentoSinEstadoModeracionComoPendiente() {
        // Documento sembrado antes de RF018 (ADR-023): sin el campo, no ya moderado.
        guardarConTimestamp("r6", AHORA);

        ReporteCiudadano recuperado = adaptador.buscarPorId(new ReporteId("r6")).orElseThrow();

        assertThat(recuperado.estadoModeracion()).isEqualTo(EstadoModeracion.PENDIENTE);
    }

    @Test
    void debeListarPendientesIncluyendoLosSinCampoDeModeracion() {
        adaptador.guardar(new ReporteCiudadano(new ReporteId("r7"), new SectorId("bocagrande"),
                TipoReporte.SIN_AGUA, null, new HuellaDispositivo("hash-7"), AHORA));
        guardarConTimestamp("r8", AHORA);
        adaptador.guardar(new ReporteCiudadano(new ReporteId("r9"), new SectorId("bocagrande"),
                TipoReporte.SIN_AGUA, null, new HuellaDispositivo("hash-9"), AHORA).aprobar());

        List<ReporteCiudadano> pendientes = adaptador.listarPendientes();

        assertThat(pendientes).extracting(r -> r.id().valor()).containsExactlyInAnyOrder("r7", "r8");
    }

    @Test
    void noDebeSustentarElConsensoConUnReporteDescartado() {
        adaptador.guardar(new ReporteCiudadano(new ReporteId("r11"), new SectorId("bocagrande"),
                TipoReporte.SIN_AGUA, null, new HuellaDispositivo("hash-11"), AHORA));
        ReporteCiudadano descartado = adaptador.buscarPorId(new ReporteId("r11")).orElseThrow().descartar();
        adaptador.guardar(descartado);
        adaptador.guardar(new ReporteCiudadano(new ReporteId("r12"), new SectorId("bocagrande"),
                TipoReporte.SIN_AGUA, null, new HuellaDispositivo("hash-12"), AHORA));

        List<ReporteCiudadano> recientes = adaptador.listarRecientesPorSector(
                new SectorId("bocagrande"), Duration.ofMinutes(30));

        assertThat(recientes).extracting(r -> r.id().valor()).containsExactly("r12");
    }

    @Test
    void debeContarReportesDescartadosParaElCupoDelDispositivo() {
        HuellaDispositivo huella = new HuellaDispositivo("hash-abusador");
        adaptador.guardar(new ReporteCiudadano(new ReporteId("r13"), new SectorId("bocagrande"),
                TipoReporte.SIN_AGUA, null, huella, AHORA));
        ReporteCiudadano descartado = adaptador.buscarPorId(new ReporteId("r13")).orElseThrow().descartar();
        adaptador.guardar(descartado);

        long conteo = adaptador.contarRecientesPorSectorYDispositivo(
                new SectorId("bocagrande"), Duration.ofMinutes(30), huella);

        assertThat(conteo).isEqualTo(1);
    }

    @Test
    void debeSacarUnReporteDeLaColaAlModerarlo() {
        adaptador.guardar(new ReporteCiudadano(new ReporteId("r10"), new SectorId("bocagrande"),
                TipoReporte.SIN_AGUA, null, new HuellaDispositivo("hash-10"), AHORA));

        ReporteCiudadano recuperado = adaptador.buscarPorId(new ReporteId("r10")).orElseThrow();
        adaptador.guardar(recuperado.descartar());

        assertThat(adaptador.listarPendientes()).isEmpty();
        assertThat(adaptador.buscarPorId(new ReporteId("r10")).orElseThrow().estadoModeracion())
                .isEqualTo(EstadoModeracion.DESCARTADO);
    }

    @Test
    void listarNombresDeFotoReferenciados_debeExtraerElNombreDeArchivoDeCadaFotoUrl() {
        adaptador.guardar(new ReporteCiudadano(new ReporteId("r14"), new SectorId("bocagrande"),
                TipoReporte.SIN_AGUA, null, new HuellaDispositivo("hash-14"), AHORA,
                EstadoModeracion.PENDIENTE, "/fotos/abc123.jpg"));
        // Un reporte DESCARTADO sigue siendo dueño legitimo de su foto: no es huerfana.
        adaptador.guardar(new ReporteCiudadano(new ReporteId("r15"), new SectorId("bocagrande"),
                TipoReporte.SIN_AGUA, null, new HuellaDispositivo("hash-15"), AHORA,
                EstadoModeracion.DESCARTADO, "/fotos/def456.png"));
        adaptador.guardar(new ReporteCiudadano(new ReporteId("r16"), new SectorId("bocagrande"),
                TipoReporte.SIN_AGUA, null, new HuellaDispositivo("hash-16"), AHORA));

        assertThat(adaptador.listarNombresDeFotoReferenciados())
                .containsExactlyInAnyOrder("abc123.jpg", "def456.png");
    }

    @Test
    void listarConFotoAnterioresA_debeExcluirReportesSinFotoOMasRecientesQueElLimite() {
        adaptador.guardar(new ReporteCiudadano(new ReporteId("r17"), new SectorId("bocagrande"),
                TipoReporte.SIN_AGUA, null, new HuellaDispositivo("hash-17"),
                AHORA.minus(Duration.ofDays(400)), EstadoModeracion.APROBADO, "/fotos/vieja.jpg"));
        adaptador.guardar(new ReporteCiudadano(new ReporteId("r18"), new SectorId("bocagrande"),
                TipoReporte.SIN_AGUA, null, new HuellaDispositivo("hash-18"),
                AHORA.minus(Duration.ofDays(1)), EstadoModeracion.APROBADO, "/fotos/reciente.jpg"));
        adaptador.guardar(new ReporteCiudadano(new ReporteId("r19"), new SectorId("bocagrande"),
                TipoReporte.SIN_AGUA, null, new HuellaDispositivo("hash-19"),
                AHORA.minus(Duration.ofDays(400))));

        List<ReporteCiudadano> vencidos = adaptador.listarConFotoAnterioresA(AHORA.minus(Duration.ofDays(365)));

        assertThat(vencidos).extracting(r -> r.id().valor()).containsExactly("r17");
    }
}
