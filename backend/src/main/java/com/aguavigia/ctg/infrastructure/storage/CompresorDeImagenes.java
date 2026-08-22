package com.aguavigia.ctg.infrastructure.storage;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.MemoryCacheImageOutputStream;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Iterator;

/**
 * RNF021 — compresión automática y limpieza de metadatos EXIF (M10). Decodificar la imagen y
 * volver a codificarla logra las dos cosas a la vez: el escritor de ImageIO no copia el EXIF del
 * original salvo que se le entregue explícitamente como metadato, así que la recodificación lo
 * descarta sin ningún paso extra. Es lo que le devuelve al vecino la garantía de que una foto
 * subida con GPS embebido no expone una ubicación más precisa que la que autorizó en RF007.
 *
 * Limitado a JPEG y PNG: el ImageIO del JDK no trae lector de WebP sin un plugin externo
 * (p. ej. TwelveMonkeys imageio-webp). `.webp` se guarda tal cual llega — sin comprimir ni limpiar
 * metadatos —, que es preferible a romper la subida o a fingir un procesamiento que no ocurrió.
 */
final class CompresorDeImagenes {

    private static final int LADO_MAXIMO_PX = 1600;
    private static final float CALIDAD_JPEG = 0.75f;

    private CompresorDeImagenes() {
    }

    static byte[] recomprimir(String extension, byte[] original) {
        String formato = switch (extension) {
            case ".jpg" -> "jpg";
            case ".png" -> "png";
            default -> null; // .webp u otra extensión futura no soportada por ImageIO
        };
        if (formato == null) {
            return original;
        }

        try {
            BufferedImage decodificada = ImageIO.read(new ByteArrayInputStream(original));
            if (decodificada == null) {
                // No se pudo decodificar pese al content-type ya validado (AgregarEvidenciaService):
                // mejor guardar el original que romper una subida por un caso de borde de formato.
                return original;
            }
            BufferedImage redimensionada = redimensionarSiExcede(decodificada, LADO_MAXIMO_PX);
            return codificar(redimensionada, formato);
        } catch (IOException e) {
            throw new UncheckedIOException("Error al comprimir la imagen antes de guardarla", e);
        }
    }

    private static BufferedImage redimensionarSiExcede(BufferedImage original, int ladoMaximo) {
        int ancho = original.getWidth();
        int alto = original.getHeight();
        if (ancho <= ladoMaximo && alto <= ladoMaximo) {
            return original;
        }

        double escala = ladoMaximo / (double) Math.max(ancho, alto);
        int nuevoAncho = Math.max(1, (int) Math.round(ancho * escala));
        int nuevoAlto = Math.max(1, (int) Math.round(alto * escala));

        BufferedImage redimensionada = new BufferedImage(nuevoAncho, nuevoAlto, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = redimensionada.createGraphics();
        try {
            g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g2d.drawImage(original.getScaledInstance(nuevoAncho, nuevoAlto, Image.SCALE_SMOOTH), 0, 0, null);
        } finally {
            g2d.dispose();
        }
        return redimensionada;
    }

    private static byte[] codificar(BufferedImage imagen, String formato) throws IOException {
        if ("jpg".equals(formato)) {
            return codificarJpegConCalidad(imagen, CALIDAD_JPEG);
        }
        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        ImageIO.write(imagen, formato, salida);
        return salida.toByteArray();
    }

    private static byte[] codificarJpegConCalidad(BufferedImage imagen, float calidad) throws IOException {
        Iterator<ImageWriter> escritores = ImageIO.getImageWritersByFormatName("jpg");
        ImageWriter escritor = escritores.next();
        ImageWriteParam parametros = escritor.getDefaultWriteParam();
        parametros.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        parametros.setCompressionQuality(calidad);

        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        try (MemoryCacheImageOutputStream flujo = new MemoryCacheImageOutputStream(salida)) {
            escritor.setOutput(flujo);
            // El escritor JPEG no acepta canal alfa ("Bogus input colorspace"); una imagen PNG
            // decodificada como ARGB necesita aplanarse antes de codificar, aunque no se haya
            // redimensionado (redimensionarSiExcede solo normaliza a RGB cuando sí redimensiona).
            escritor.write(null, new IIOImage(aRgbSinAlfa(imagen), null, null), parametros);
        } finally {
            escritor.dispose();
        }
        return salida.toByteArray();
    }

    private static BufferedImage aRgbSinAlfa(BufferedImage imagen) {
        if (imagen.getType() == BufferedImage.TYPE_INT_RGB) {
            return imagen;
        }
        BufferedImage rgb = new BufferedImage(imagen.getWidth(), imagen.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = rgb.createGraphics();
        try {
            g2d.drawImage(imagen, 0, 0, null);
        } finally {
            g2d.dispose();
        }
        return rgb;
    }
}
