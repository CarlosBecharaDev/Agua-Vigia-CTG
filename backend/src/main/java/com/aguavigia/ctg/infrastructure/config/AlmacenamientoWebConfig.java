package com.aguavigia.ctg.infrastructure.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

/**
 * M10 — sin esto, AlmacenamientoLocalAdapter.guardar() devuelve una URL "/fotos/<uuid>.jpg" que
 * nadie sirve: cualquier evidencia subida responde 404 al leerla. Mismo directorio configurable
 * que AlmacenamientoLocalAdapter (aguavigia.almacenamiento.directorio-fotos).
 */
@Configuration
public class AlmacenamientoWebConfig implements WebMvcConfigurer {

    private final String directorioFotos;

    public AlmacenamientoWebConfig(
            @Value("${aguavigia.almacenamiento.directorio-fotos:data/fotos}") String directorioFotos) {
        this.directorioFotos = directorioFotos;
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // No se usa Path.toUri(): en Windows solo agrega la barra final si el directorio ya
        // existe en disco, y el orden de creación de beans no garantiza que
        // AlmacenamientoLocalAdapter ya lo haya creado.
        String rutaAbsoluta = Path.of(directorioFotos).toAbsolutePath().toString().replace('\\', '/');
        registry.addResourceHandler("/fotos/**").addResourceLocations("file:" + rutaAbsoluta + "/");
    }

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        // La whitelist de AgregarEvidenciaService confía en el Content-Type que manda el cliente:
        // un HTML subido como image/png se guarda y se sirve como .png. Los navegadores actuales no
        // lo esnifan como HTML, pero nosniff cierra la puerta del todo.
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(@NonNull HttpServletRequest request,
                                      @NonNull HttpServletResponse response, @NonNull Object handler) {
                response.setHeader("X-Content-Type-Options", "nosniff");
                return true;
            }
        }).addPathPatterns("/fotos/**");
    }
}
