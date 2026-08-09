package com.aguavigia.ctg.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Publica el contrato que consume D4 (compuerta C2). El archivo versionado
 * backend/openapi.yaml se genera desde aqui con la app corriendo — no se escribe a mano, para
 * que no pueda desviarse de lo que el backend responde de verdad.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI apiDeAguaVigia() {
        return new OpenAPI()
                // Servidor relativo y no http://localhost:8080: el archivo se versiona, y la URL
                // que springdoc deduce sola es la de la maquina que lo genero.
                .servers(List.of(new Server().url("/").description("Mismo origen que sirve la API")))
                .info(new Info()
                .title("AguaVigia CTG — API publica")
                .version("0.1.0")
                .description("""
                        Monitoreo ciudadano del acueducto de Cartagena de Indias.

                        Plataforma ciudadana e independiente: no esta afiliada a Aguas de Cartagena
                        S.A. E.S.P. ni a ninguna entidad distrital.""")
                .contact(new Contact().name("Equipo AguaVigia CTG — Tecnologico Comfenalco"))
                .license(new License().name("Proyecto de aula")));
    }
}
