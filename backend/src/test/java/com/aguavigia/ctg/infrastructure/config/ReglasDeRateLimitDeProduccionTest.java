package com.aguavigia.ctg.infrastructure.config;

import com.aguavigia.ctg.infrastructure.ratelimit.RateLimitProperties;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.env.StandardEnvironment;

import java.io.IOException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * RateLimitConfigTest prueba el mecanismo con reglas inventadas; esta prueba el contenido real de
 * application.yml. Sin ella, borrar el bloque `aguavigia.rate-limit` dejaria el login del veedor
 * sin freno contra fuerza bruta y ninguna prueba se daria cuenta: la lista vacia es un valor
 * valido por diseno (opt-in, ADR-018).
 */
class ReglasDeRateLimitDeProduccionTest {

    private static RateLimitProperties cargarDeApplicationYml() throws IOException {
        StandardEnvironment entorno = new StandardEnvironment();
        List<PropertySource<?>> fuentes = new YamlPropertySourceLoader()
                .load("application.yml", new ClassPathResource("application.yml"));
        fuentes.forEach(fuente -> entorno.getPropertySources().addFirst(fuente));

        return Binder.get(entorno)
                .bind("aguavigia.rate-limit", RateLimitProperties.class)
                .orElseThrow(() -> new AssertionError(
                        "application.yml no declara el bloque aguavigia.rate-limit"));
    }

    @Test
    void debeProtegerElLoginDelVeedorContraFuerzaBruta() throws IOException {
        RateLimitProperties.Regla regla = cargarDeApplicationYml().reglas().stream()
                .filter(r -> r.ruta().equals("/api/veedor/sesion"))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Sin regla para /api/veedor/sesion"));

        assertThat(regla.limite()).isLessThanOrEqualTo(10);
        assertThat(regla.ventanaSegundos()).isGreaterThanOrEqualTo(60);
    }

    @Test
    void debeLimitarElFloodDeReportesDejandoMargenAUnEdificioEntero() throws IOException {
        RateLimitProperties.Regla regla = cargarDeApplicationYml().reglas().stream()
                .filter(r -> r.ruta().equals("/api/reportes"))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Sin regla para /api/reportes"));

        // Holgado a proposito: muchos vecinos comparten IP. Un limite bajo aqui censuraria
        // reportes legitimos, que es peor que dejar pasar unos cuantos de mas (RF006 ya limita
        // por dispositivo dentro del caso de uso).
        assertThat(regla.limite()).isGreaterThanOrEqualTo(20);
    }
}
