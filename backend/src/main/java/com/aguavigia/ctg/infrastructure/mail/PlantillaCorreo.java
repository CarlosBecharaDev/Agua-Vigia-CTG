package com.aguavigia.ctg.infrastructure.mail;

import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Sustitución de {{marcador}} por String.replace, no un motor de plantillas (Thymeleaf,
 * Freemarker...): con dos correos y marcadores fijos, un motor completo es la abstracción
 * prematura que CLAUDE.md pide evitar. Ver ADR de motor de plantillas de correo.
 */
final class PlantillaCorreo {

    private final String contenido;

    private PlantillaCorreo(String contenido) {
        this.contenido = contenido;
    }

    static PlantillaCorreo desdeClasspath(String rutaClasspath) {
        try {
            byte[] bytes = new ClassPathResource(rutaClasspath).getContentAsByteArray();
            return new PlantillaCorreo(new String(bytes, StandardCharsets.UTF_8));
        } catch (IOException noSeEncontro) {
            throw new UncheckedIOException("No se pudo cargar la plantilla de correo: " + rutaClasspath, noSeEncontro);
        }
    }

    String renderizar(Map<String, String> valores) {
        String resultado = contenido;
        for (Map.Entry<String, String> valor : valores.entrySet()) {
            resultado = resultado.replace("{{" + valor.getKey() + "}}", valor.getValue());
        }
        return resultado;
    }
}
