package com.aguavigia.ctg.infrastructure.storage;

import com.aguavigia.ctg.domain.port.out.AlmacenamientoPort;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class AlmacenamientoLocalAdapter implements AlmacenamientoPort {

    private final Path directorioRaiz;
    private final RelojPort reloj;

    public AlmacenamientoLocalAdapter(
            @Value("${aguavigia.almacenamiento.directorio-fotos:data/fotos}") String directorioFotos,
            RelojPort reloj) {
        this.directorioRaiz = Paths.get(directorioFotos);
        this.reloj = reloj;
        try {
            Files.createDirectories(directorioRaiz);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo inicializar la carpeta de almacenamiento", e);
        }
    }

    /**
     * {@code extension} debe venir ya validada contra la lista blanca de tipos de imagen
     * (AgregarEvidenciaService) — este adaptador no decide qué se puede subir, solo dónde queda.
     *
     * RNF021: antes de escribir a disco, CompresorDeImagenes recodifica jpg/png (comprime y
     * descarta EXIF de paso); `.webp` se guarda tal cual por la limitación documentada ahí.
     */
    @Override
    public String guardar(String extension, byte[] contenido) {
        try {
            byte[] contenidoProcesado = CompresorDeImagenes.recomprimir(extension, contenido);
            String nuevoNombre = UUID.randomUUID() + extension;
            Path destino = directorioRaiz.resolve(nuevoNombre);
            Files.write(destino, contenidoProcesado);
            return "/fotos/" + nuevoNombre;
        } catch (IOException e) {
            throw new RuntimeException("Error al guardar archivo", e);
        }
    }

    @Override
    public Set<String> listarNombresConAntiguedadMinima(Duration antiguedadMinima) {
        // RelojPort y no Instant.now(): la ventana de antigüedad mínima es justo lo que evita
        // borrar una foto recién escrita cuyo reporte sigue en vuelo, y probar eso sin un reloj
        // inyectado exige dormir el hilo de la prueba.
        Instant limite = reloj.ahora().minus(antiguedadMinima);
        try (var archivos = Files.list(directorioRaiz)) {
            return archivos
                    .filter(Files::isRegularFile)
                    .filter(archivo -> ultimaModificacion(archivo).isBefore(limite))
                    .map(archivo -> archivo.getFileName().toString())
                    .collect(Collectors.toSet());
        } catch (IOException e) {
            throw new RuntimeException("Error al listar la carpeta de almacenamiento", e);
        }
    }

    private static Instant ultimaModificacion(Path archivo) {
        try {
            return Files.getLastModifiedTime(archivo).toInstant();
        } catch (IOException e) {
            throw new RuntimeException("Error al leer la fecha de modificacion de " + archivo, e);
        }
    }

    @Override
    public void eliminar(String nombre) {
        // nombre viene de nuestra propia reconciliacion (listado en disco o fotoUrl guardada en
        // Mongo), nunca de un cliente — igual se valida por defensa en profundidad.
        if (nombre.contains("/") || nombre.contains("\\") || nombre.contains("..")) {
            throw new IllegalArgumentException("Nombre de archivo invalido: " + nombre);
        }
        try {
            Files.deleteIfExists(directorioRaiz.resolve(nombre));
        } catch (IOException e) {
            throw new RuntimeException("Error al borrar archivo", e);
        }
    }
}
