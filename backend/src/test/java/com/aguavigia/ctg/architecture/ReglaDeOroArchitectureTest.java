package com.aguavigia.ctg.architecture;

import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.EventoBitacora;
import com.aguavigia.ctg.domain.EventoId;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoEvento;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * CLAUDE.md — Regla de Oro: si domain/ importa algo que empiece por org.springframework o
 * com.mongodb, la arquitectura está rota. Esta build lo verifica, no un acuerdo verbal.
 */
class ReglaDeOroArchitectureTest {

    private static final JavaClasses CLASES = new ClassFileImporter().importPackages("com.aguavigia.ctg");

    /** Solo producción — construir objetos de dominio a mano en un test es un patrón normal de
     * fixture, no una violación del Factory Method (que existe para proteger invariantes de
     * negocio, no para restringir cómo se arman datos de prueba). */
    private static final JavaClasses CLASES_PRODUCCION = new ClassFileImporter()
            .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
            .importPackages("com.aguavigia.ctg");

    @Test
    void dominioNoDebeImportarSpring() {
        ArchRule regla = noClasses()
                .that().resideInAPackage("..domain..")
                .should().dependOnClassesThat().resideInAnyPackage("org.springframework..");

        regla.check(CLASES);
    }

    @Test
    void dominioNoDebeImportarMongoDB() {
        ArchRule regla = noClasses()
                .that().resideInAPackage("..domain..")
                .should().dependOnClassesThat().resideInAnyPackage("com.mongodb..");

        regla.check(CLASES);
    }

    @Test
    void applicationNoDebeDependerDeInfrastructure() {
        ArchRule regla = noClasses()
                .that().resideInAPackage("..application..")
                .should().dependOnClassesThat().resideInAnyPackage("..infrastructure..");

        regla.check(CLASES);
    }

    /**
     * CalcularEstadisticasService inyectaba MongoTemplate directamente: ni domain ni
     * infrastructure lo detectaban, porque org.springframework.data.mongodb no es
     * ..infrastructure.. ni el paquete propio del proyecto. La capa de aplicación no debe conocer
     * el motor de persistencia, solo los puertos de domain/port/out.
     */
    @Test
    void applicationNoDebeDependerDeSpringDataNiDeMongoDB() {
        ArchRule regla = noClasses()
                .that().resideInAPackage("..application..")
                .should().dependOnClassesThat().resideInAnyPackage("org.springframework.data..", "com.mongodb..");

        regla.check(CLASES);
    }

    /**
     * RF026 — EventoBitacora solo se crea de negocio vía EventoBitacoraFactory; la única excepción
     * es EventoBitacoraMongoAdapter, que rehidrata eventos ya existentes desde Mongo, no crea
     * eventos nuevos (ver Javadoc de EventoBitacora).
     */
    @Test
    void eventoBitacoraSoloDebeCrearseDesdeLaFactoryODesdeElAdaptadorMongo() {
        ArchRule regla = noClasses()
                .that().resideOutsideOfPackages("com.aguavigia.ctg.domain",
                        "com.aguavigia.ctg.infrastructure.persistence.mongo")
                .should().callConstructor(EventoBitacora.class,
                        EventoId.class, TipoEvento.class, SectorId.class, CorteId.class, Instant.class, String.class);

        regla.check(CLASES_PRODUCCION);
    }
}
