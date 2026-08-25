package com.aguavigia.ctg.infrastructure.ingest;

import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Los nombres de este test salen del catálogo real (GeoJSON catastral de Cartagena) y de boletines
 * reales de Acuacar: son las tres discrepancias de escritura que se midieron entre ambos.
 */
class EmparejadorDeSectoresTest {

    private static final List<Sector> CATALOGO = List.of(
            sector("armenia", "ARMENIA"),
            sector("las-gaviotas", "LAS GAVIOTAS"),
            sector("las-delicias", "LAS DELICIAS"),
            sector("nueve-de-abril", "NUEVE DE ABRIL"),
            sector("siete-de-agosto", "SIETE DE AGOSTO"),
            sector("piedra-de-bolivar", "PIEDRA DE BOLIVAR"),
            sector("escallon-villa", "ESCALLON VILLA"),
            sector("la-floresta", "LA FLORESTA"));

    private final EmparejadorDeSectores emparejador = new EmparejadorDeSectores(CATALOGO);

    private static Sector sector(String id, String nombre) {
        return new Sector(new SectorId(id), nombre, null, null);
    }

    @Test
    void debeIgnorarElPrefijoDeTipoQueEscribeElBoletin() {
        var resultado = emparejador.emparejar(
                List.of("sector Las Delicias", "urbanización La Floresta"));

        assertThat(resultado.sectores())
                .containsExactlyInAnyOrder(new SectorId("las-delicias"), new SectorId("la-floresta"));
        assertThat(resultado.noReconocidos()).isEmpty();
    }

    @Test
    void debeEntenderLosNumerosEscritosConCifraYConLetra() {
        var resultado = emparejador.emparejar(List.of("9 de Abril", "7 de Agosto"));

        assertThat(resultado.sectores())
                .containsExactlyInAnyOrder(
                        new SectorId("nueve-de-abril"), new SectorId("siete-de-agosto"));
    }

    @Test
    void debeTolerarLaPreposicionIntermediaQueElBoletinOmite() {
        var resultado = emparejador.emparejar(List.of("Piedra Bolívar"));

        assertThat(resultado.sectores()).containsExactly(new SectorId("piedra-de-bolivar"));
    }

    @Test
    void debeIgnorarTildesYMayusculas() {
        var resultado = emparejador.emparejar(List.of("escallón villa"));

        assertThat(resultado.sectores()).containsExactly(new SectorId("escallon-villa"));
    }

    /**
     * El caso que prohíbe la coincidencia aproximada: «Las Gavias» y «Las Gaviotas» son barrios
     * distintos y ambos aparecen en el mismo boletín. Emparejarlos publicaría un corte en el barrio
     * equivocado, que es el daño que esta plataforma existe para evitar.
     */
    @Test
    void noDebeEmparejarUnNombreParecidoConOtroBarrio() {
        var resultado = emparejador.emparejar(List.of("Las Gavias"));

        assertThat(resultado.sectores()).isEmpty();
        assertThat(resultado.noReconocidos()).containsExactly("Las Gavias");
    }

    @Test
    void debeDejarConstanciaDeLoQueNoReconoce() {
        var resultado = emparejador.emparejar(List.of("Armenia", "Manzanares", "Andalucía"));

        assertThat(resultado.sectores()).containsExactly(new SectorId("armenia"));
        assertThat(resultado.noReconocidos()).containsExactly("Manzanares", "Andalucía");
    }

    /**
     * El catastro no guarda «Olaya Herrera» como unidad: lo tiene partido en once sectores que
     * declaran su pertenencia en el propio nombre. Es el nombre más frecuente de los boletines.
     */
    @Test
    void debeResolverUnNombrePadreEnTodosLosSectoresQueLoComponen() {
        List<Sector> conOlaya = List.of(
                sector("olaya-st-central", "OLAYA ST. CENTRAL"),
                sector("olaya-st-ricaurte", "OLAYA ST. RICAURTE"),
                sector("armenia", "ARMENIA"));
        var conAlias = new EmparejadorDeSectores(conOlaya);

        var resultado = conAlias.emparejar(List.of("Olaya Herrera"));

        assertThat(resultado.sectores())
                .containsExactlyInAnyOrder(
                        new SectorId("olaya-st-central"), new SectorId("olaya-st-ricaurte"));
        assertThat(resultado.noReconocidos()).isEmpty();
    }

    /** Una fila de alias que apunte a un sector inexistente no puede proponer ese sector. */
    @Test
    void debeIgnorarLosAliasQueApuntanASectoresQueNoEstanEnElCatalogo() {
        var soloArmenia = new EmparejadorDeSectores(List.of(sector("armenia", "ARMENIA")));

        var resultado = soloArmenia.emparejar(List.of("Olaya Herrera"));

        assertThat(resultado.sectores()).isEmpty();
        assertThat(resultado.noReconocidos()).containsExactly("Olaya Herrera");
    }

    @Test
    void noDebeRepetirUnSectorNombradoDosVeces() {
        var resultado = emparejador.emparejar(List.of("Armenia", "armenia", "ARMENIA"));

        assertThat(resultado.sectores()).containsExactly(new SectorId("armenia"));
    }
}
