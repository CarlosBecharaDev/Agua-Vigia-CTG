package com.aguavigia.ctg.infrastructure.storage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AlmacenamientoLocalAdapterTest {

    private static final com.aguavigia.ctg.domain.port.out.RelojPort RELOJ =
            java.time.Instant::now;

    @TempDir
    Path tempDir;

    @Test
    void debeGuardarElArchivoYDevolverUnaUrlBajoFotos() throws Exception {
        AlmacenamientoLocalAdapter adaptador = new AlmacenamientoLocalAdapter(tempDir.toString(), RELOJ);

        String url = adaptador.guardar(".jpg", new byte[]{1, 2, 3});

        assertThat(url).startsWith("/fotos/").endsWith(".jpg");
        String nombreArchivo = url.substring("/fotos/".length());
        Path guardado = tempDir.resolve(nombreArchivo);
        assertThat(Files.exists(guardado)).isTrue();
        assertThat(Files.readAllBytes(guardado)).containsExactly(1, 2, 3);
    }

    @Test
    void noDebeUsarNombreDeArchivoDelCliente_soloLaExtensionValidada() throws Exception {
        AlmacenamientoLocalAdapter adaptador = new AlmacenamientoLocalAdapter(tempDir.toString(), RELOJ);

        String url = adaptador.guardar(".png", new byte[]{1});

        assertThat(url).doesNotContain("<script>").endsWith(".png");
    }

    @Test
    void listarNombresConAntiguedadMinima_soloDebeIncluirArchivosMasViejosQueElUmbral() throws Exception {
        AlmacenamientoLocalAdapter adaptador = new AlmacenamientoLocalAdapter(tempDir.toString(), RELOJ);
        Path viejo = tempDir.resolve("viejo.jpg");
        Path nuevo = tempDir.resolve("nuevo.jpg");
        Files.write(viejo, new byte[]{1});
        Files.write(nuevo, new byte[]{2});
        Files.setLastModifiedTime(viejo, FileTime.from(Instant.now().minus(Duration.ofDays(2))));

        Set<String> candidatos = adaptador.listarNombresConAntiguedadMinima(Duration.ofHours(24));

        assertThat(candidatos).containsExactly("viejo.jpg");
    }

    @Test
    void eliminar_debeBorrarElArchivo() throws Exception {
        AlmacenamientoLocalAdapter adaptador = new AlmacenamientoLocalAdapter(tempDir.toString(), RELOJ);
        Path archivo = tempDir.resolve("borrar-este.jpg");
        Files.write(archivo, new byte[]{1});

        adaptador.eliminar("borrar-este.jpg");

        assertThat(Files.exists(archivo)).isFalse();
    }

    @Test
    void eliminar_esIdempotenteSiElArchivoYaNoExiste() {
        AlmacenamientoLocalAdapter adaptador = new AlmacenamientoLocalAdapter(tempDir.toString(), RELOJ);

        assertThatCode(() -> adaptador.eliminar("nunca-existio.jpg")).doesNotThrowAnyException();
    }

    @Test
    void eliminar_debeRechazarNombresQueIntentenEscaparDelDirectorio() {
        AlmacenamientoLocalAdapter adaptador = new AlmacenamientoLocalAdapter(tempDir.toString(), RELOJ);

        assertThatThrownBy(() -> adaptador.eliminar("../fuera.jpg"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
