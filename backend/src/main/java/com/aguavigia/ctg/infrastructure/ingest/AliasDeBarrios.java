package com.aguavigia.ctg.infrastructure.ingest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Equivalencias curadas entre el nombre que escribe la fuente y los sectores del catálogo, leídas
 * de {@code alias-barrios.csv}.
 *
 * Existe porque hay un desajuste que ninguna normalización resuelve: Acuacar habla de «Olaya
 * Herrera» y el catastro no guarda ese barrio como unidad, sino partido en once sectores
 * («OLAYA ST. CENTRAL», «OLAYA ST. RICAURTE», …). No es un problema de cómo está escrito el nombre
 * —que es lo de {@link NormalizadorDeNombres}— sino de que un nombre abarca varios polígonos.
 *
 * <b>Es un archivo de datos, no de código, y a propósito.</b> Quién contiene a quién en Cartagena
 * es conocimiento del equipo, no algo que el pipeline deba deducir: la norma para admitir una fila
 * está escrita en la cabecera del CSV y exige prueba, no parecido. Un alias equivocado publica un
 * corte en el barrio equivocado.
 *
 * Un slug que no exista en el catálogo se ignora con aviso en el log en vez de tumbar el arranque:
 * el archivo lo edita el equipo y una errata de tipeo no puede dejar el backend sin levantar.
 */
final class AliasDeBarrios {

    private static final Logger log = LoggerFactory.getLogger(AliasDeBarrios.class);
    private static final String RECURSO = "/alias-barrios.csv";

    private final Map<String, List<String>> porNombreNormalizado;

    private AliasDeBarrios(Map<String, List<String>> porNombreNormalizado) {
        this.porNombreNormalizado = porNombreNormalizado;
    }

    static AliasDeBarrios cargar() {
        Map<String, List<String>> alias = new LinkedHashMap<>();
        try (InputStream recurso = AliasDeBarrios.class.getResourceAsStream(RECURSO)) {
            if (recurso == null) {
                log.warn("No se encontró {}: la ingesta sigue sin equivalencias curadas", RECURSO);
                return new AliasDeBarrios(Map.of());
            }
            try (BufferedReader lector = new BufferedReader(
                    new InputStreamReader(recurso, StandardCharsets.UTF_8))) {
                String linea;
                while ((linea = lector.readLine()) != null) {
                    agregar(alias, linea);
                }
            }
        } catch (IOException fallo) {
            log.warn("No se pudo leer {}, la ingesta sigue sin equivalencias: {}", RECURSO, fallo.toString());
            return new AliasDeBarrios(Map.of());
        }
        log.info("Equivalencias de barrios cargadas: {} nombre(s)", alias.size());
        return new AliasDeBarrios(alias);
    }

    private static void agregar(Map<String, List<String>> alias, String linea) {
        String limpia = linea.strip();
        if (limpia.isEmpty() || limpia.startsWith("#")) {
            return;
        }
        String[] partes = limpia.split(";", 2);
        if (partes.length != 2) {
            log.warn("Línea ignorada en {} (falta el separador ';'): {}", RECURSO, limpia);
            return;
        }
        String clave = NormalizadorDeNombres.normalizar(partes[0]);
        String slug = partes[1].strip();
        if (clave.isEmpty() || slug.isEmpty()) {
            return;
        }
        alias.computeIfAbsent(clave, sinUsar -> new ArrayList<>()).add(slug);
    }

    /** Nombres tal como se declararon en el archivo, para poder resolverlos contra el catálogo. */
    java.util.Set<String> nombresDeclarados() {
        return porNombreNormalizado.keySet();
    }

    /** Slugs declarados para ese nombre, o lista vacía si no hay equivalencia curada. */
    List<String> slugsPara(String nombreMencionado) {
        return porNombreNormalizado.getOrDefault(
                NormalizadorDeNombres.normalizar(nombreMencionado), List.of());
    }
}
