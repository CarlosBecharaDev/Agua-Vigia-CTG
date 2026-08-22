package com.aguavigia.ctg.infrastructure.ingest;

import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Convierte los nombres sueltos que se leyeron de un boletín en sectores del catálogo oficial.
 *
 * El sentido de la operación es el que importa: no se extraen nombres para después inventarles un
 * sector, se recorre lo mencionado y <b>solo sobrevive lo que ya existe en el GeoJSON catastral</b>.
 * Así el pipeline no puede publicar un barrio que no está en el mapa, que era el modo de fallo de
 * `contains` (un artículo largo contenía como substring decenas de los 211 nombres y pintaba media
 * Cartagena).
 *
 * Lo que no se reconoce no se descarta en silencio: viaja en {@link Resultado#noReconocidos()} hasta
 * la propuesta que revisa el veedor. Sobre 37 boletines reales, buena parte de esos nombres son
 * urbanizaciones y conjuntos —«Quintas de Alta Lucía», «Portal de Los Alpes»— que son una unidad más
 * fina que el barrio catastral y por eso nunca casarán; el resto son barrios que el GeoJSON no trae
 * («Manzanares», «Andalucía», «La Gloria»). Tenerlos a la vista es lo que permite decidir después si
 * el catálogo se amplía, en vez de que la brecha quede invisible (RNF006: sin descarte silencioso).
 */
public class EmparejadorDeSectores {

    public record Resultado(List<SectorId> sectores, List<String> noReconocidos) {
    }

    private final Map<String, SectorId> indice;

    public EmparejadorDeSectores(List<Sector> catalogo) {
        this.indice = new HashMap<>();
        for (Sector sector : catalogo) {
            for (String variante : NormalizadorDeNombres.variantes(sector.nombre())) {
                // El primero gana: si dos barrios colapsan a la misma forma normalizada, quedarse
                // con uno arbitrario es preferible a emparejar el nombre con los dos.
                indice.putIfAbsent(variante, sector.id());
            }
        }
    }

    public Resultado emparejar(List<String> mencionados) {
        Set<SectorId> encontrados = new LinkedHashSet<>();
        List<String> sinReconocer = new ArrayList<>();
        for (String mencion : mencionados) {
            SectorId sector = buscar(mencion);
            if (sector != null) {
                encontrados.add(sector);
            } else if (!mencion.isBlank()) {
                sinReconocer.add(mencion.trim());
            }
        }
        return new Resultado(List.copyOf(encontrados), List.copyOf(sinReconocer));
    }

    private SectorId buscar(String mencion) {
        for (String variante : NormalizadorDeNombres.variantes(mencion)) {
            SectorId sector = indice.get(variante);
            if (sector != null) {
                return sector;
            }
        }
        return null;
    }
}
