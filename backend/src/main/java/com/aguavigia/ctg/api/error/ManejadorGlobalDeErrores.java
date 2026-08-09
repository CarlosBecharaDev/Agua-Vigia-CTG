package com.aguavigia.ctg.api.error;

import com.aguavigia.ctg.domain.LimiteReportesExcedidoException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.net.URI;

/**
 * Errores de la API en formato RFC 7807, centralizados (CLAUDE.md § Arquitectura).
 *
 * Ningun manejador devuelve el mensaje de la excepcion original salvo cuando ese mensaje lo
 * escribimos nosotros: un fallo de Mongo puede traer host, puerto y nombre de base de datos, y
 * eso no viaja al cliente.
 */
@RestControllerAdvice
public class ManejadorGlobalDeErrores {

    private static final Logger log = LoggerFactory.getLogger(ManejadorGlobalDeErrores.class);
    private static final String BASE_TIPO = "https://aguavigia.example/errores/";

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ProblemDetail noEncontrado(RecursoNoEncontradoException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
        problema.setTitle("Recurso no encontrado");
        problema.setType(URI.create(BASE_TIPO + "recurso-no-encontrado"));
        return problema;
    }

    /** Las invariantes de los objetos de valor del dominio se rompen con datos de entrada malos. */
    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail peticionInvalida(IllegalArgumentException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, e.getMessage());
        problema.setTitle("Peticion invalida");
        problema.setType(URI.create(BASE_TIPO + "peticion-invalida"));
        return problema;
    }

    /** RF006 — el dispositivo superó el límite de reportes en la ventana vigente. */
    @ExceptionHandler(LimiteReportesExcedidoException.class)
    public ProblemDetail limiteExcedido(LimiteReportesExcedidoException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS, e.getMessage());
        problema.setTitle("Límite de reportes excedido");
        problema.setType(URI.create(BASE_TIPO + "limite-reportes-excedido"));
        return problema;
    }

    /** `@Valid` en un DTO de entrada rechaza el cuerpo antes de que el controlador lo vea. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail camposInvalidos(MethodArgumentNotValidException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "Uno o mas campos no son validos.");
        problema.setTitle("Peticion invalida");
        problema.setType(URI.create(BASE_TIPO + "peticion-invalida"));
        problema.setProperty("errores", e.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .toList());
        return problema;
    }

    /**
     * Sin esto, una ruta sin controlador (ej. "/api/veedor/x" protegida sin handler todavia)
     * caeria en el catch-all de abajo y responderia 500 en vez del 404 que le corresponde.
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ProblemDetail rutaNoEncontrada(NoResourceFoundException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND,
                "El recurso solicitado no existe.");
        problema.setTitle("Recurso no encontrado");
        problema.setType(URI.create(BASE_TIPO + "recurso-no-encontrado"));
        return problema;
    }

    /**
     * Mongo caido o inalcanzable. Se responde 503 y no 500: el servicio no esta roto, esta sin
     * su base de datos, y un cliente puede reintentar. DoD de D3: fallar sin mentir.
     */
    @ExceptionHandler(DataAccessException.class)
    public ProblemDetail baseDeDatosNoDisponible(DataAccessException e) {
        log.error("Fallo de acceso a datos", e);
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE,
                "No se pudo consultar la informacion en este momento. Intenta de nuevo en unos minutos.");
        problema.setTitle("Servicio no disponible");
        problema.setType(URI.create(BASE_TIPO + "base-de-datos-no-disponible"));
        return problema;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail errorInesperado(Exception e) {
        log.error("Error no controlado", e);
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
                "Ocurrio un error inesperado.");
        problema.setTitle("Error interno");
        problema.setType(URI.create(BASE_TIPO + "error-interno"));
        return problema;
    }
}
