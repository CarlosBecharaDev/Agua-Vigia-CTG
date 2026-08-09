package com.aguavigia.ctg.architecture;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/**
 * CLAUDE.md — Regla de Oro: si domain/ importa algo que empiece por org.springframework o
 * com.mongodb, la arquitectura está rota. Esta build lo verifica, no un acuerdo verbal.
 */
class ReglaDeOroArchitectureTest {

    private static final JavaClasses CLASES = new ClassFileImporter().importPackages("com.aguavigia.ctg");

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
}
