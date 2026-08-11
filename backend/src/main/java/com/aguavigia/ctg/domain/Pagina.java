package com.aguavigia.ctg.domain;

import java.util.List;

/**
 * Un tramo de una lista que crece sin cota, con lo necesario para pedir el siguiente.
 *
 * Existe en domain/ y no se usa `Page` de Spring Data porque los puertos de salida no pueden
 * depender del framework de persistencia (Regla de Oro, verificada por ArchUnit).
 *
 * La bitácora es el caso que lo hace obligatorio: RF028 la define de solo anexado, así que crece
 * monotónicamente y nunca se poda. Devolverla entera en cada consulta materializa toda la colección
 * en memoria de la JVM antes de serializarla — no es una optimización prematura, es aritmética.
 */
public record Pagina<T>(List<T> contenido, int pagina, int tamano, long totalElementos) {

    /** Tope duro: un cliente no puede pedir una página tan grande que anule la paginación. */
    public static final int TAMANO_MAXIMO = 200;
    public static final int TAMANO_POR_DEFECTO = 50;

    public Pagina {
        if (contenido == null) {
            throw new IllegalArgumentException("La página debe tener contenido, aunque sea vacío");
        }
        if (pagina < 0) {
            throw new IllegalArgumentException("El número de página no puede ser negativo: " + pagina);
        }
        if (tamano <= 0) {
            throw new IllegalArgumentException("El tamaño de página debe ser mayor que cero: " + tamano);
        }
        if (totalElementos < 0) {
            throw new IllegalArgumentException("El total no puede ser negativo: " + totalElementos);
        }
        contenido = List.copyOf(contenido);
    }

    /**
     * Normaliza lo que llega por query string. Un tamaño ausente o absurdo no debe ser un 400: el
     * cliente pidió una lista, y devolvérsela acotada es más útil que un error.
     */
    public static int tamanoValido(Integer solicitado) {
        if (solicitado == null || solicitado <= 0) {
            return TAMANO_POR_DEFECTO;
        }
        return Math.min(solicitado, TAMANO_MAXIMO);
    }

    public static int paginaValida(Integer solicitada) {
        return solicitada == null || solicitada < 0 ? 0 : solicitada;
    }

    public int totalPaginas() {
        return (int) Math.ceil((double) totalElementos / tamano);
    }

    public boolean hayMas() {
        return (long) (pagina + 1) * tamano < totalElementos;
    }
}
