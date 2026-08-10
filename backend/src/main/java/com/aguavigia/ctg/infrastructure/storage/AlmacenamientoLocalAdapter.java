package com.aguavigia.ctg.infrastructure.storage;

import com.aguavigia.ctg.domain.port.out.AlmacenamientoPort;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Component
public class AlmacenamientoLocalAdapter implements AlmacenamientoPort {

    private final Path directorioRaiz = Paths.get("data", "fotos");

    public AlmacenamientoLocalAdapter() {
        try {
            Files.createDirectories(directorioRaiz);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo inicializar la carpeta de almacenamiento", e);
        }
    }

    @Override
    public String guardar(String nombreArchivo, byte[] contenido) {
        try {
            String extension = "";
            if (nombreArchivo != null && nombreArchivo.contains(".")) {
                extension = nombreArchivo.substring(nombreArchivo.lastIndexOf("."));
            }
            String nuevoNombre = UUID.randomUUID().toString() + extension;
            Path destino = directorioRaiz.resolve(nuevoNombre);
            Files.write(destino, contenido);
            return "/fotos/" + nuevoNombre;
        } catch (IOException e) {
            throw new RuntimeException("Error al guardar archivo", e);
        }
    }
}
