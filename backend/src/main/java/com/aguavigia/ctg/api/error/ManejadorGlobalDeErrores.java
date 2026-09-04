package com.aguavigia.ctg.api.error;

import com.aguavigia.ctg.domain.CredencialInvalidaException;
import com.aguavigia.ctg.domain.CuentaBloqueadaException;
import com.aguavigia.ctg.domain.CuentaNoHabilitadaException;
import com.aguavigia.ctg.domain.LimiteReportesExcedidoException;
import com.aguavigia.ctg.domain.SegundoFactorRequeridoException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.net.URI;
import java.util.List;
import java.util.Set;

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

    /**
     * Un caso de uso rechaza una transición de estado inválida (p. ej. RF017: cerrar un corte que
     * ya estaba cerrado; o RF020: pedir el índice de un corte que sigue abierto). 409 y no 400:
     * la petición está bien formada, es el estado actual del recurso el que la vuelve inaplicable.
     */
    @ExceptionHandler(IllegalStateException.class)
    public ProblemDetail conflicto(IllegalStateException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, e.getMessage());
        problema.setTitle("Conflicto de estado");
        problema.setType(URI.create(BASE_TIPO + "conflicto-de-estado"));
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

    /**
     * Correo inexistente, clave equivocada o codigo TOTP invalido. Los tres dan el mismo 401 y el
     * mismo texto: distinguirlos convertiria el login en un oraculo de que correos tienen cuenta.
     */
    @ExceptionHandler(CredencialInvalidaException.class)
    public ProblemDetail credencialInvalida(CredencialInvalidaException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, e.getMessage());
        problema.setTitle("Credencial invalida");
        problema.setType(URI.create(BASE_TIPO + "credencial-invalida"));
        return problema;
    }

    /**
     * 401 con `type` propio, no 400: la clave era correcta y falta el segundo paso. El frontend
     * distingue por ese type para pedir el codigo en vez de acusar de clave incorrecta.
     */
    @ExceptionHandler(SegundoFactorRequeridoException.class)
    public ProblemDetail segundoFactorRequerido(SegundoFactorRequeridoException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, e.getMessage());
        problema.setTitle("Segundo factor requerido");
        problema.setType(URI.create(BASE_TIPO + "segundo-factor-requerido"));
        return problema;
    }

    /**
     * 403 y no 401: la credencial era correcta, lo que falla es el estado de la cuenta. Aqui si se
     * explica el motivo — solo se llega tras acertar la clave, asi que quien lo lee ya demostro ser
     * el dueno de la cuenta.
     */
    @ExceptionHandler(CuentaNoHabilitadaException.class)
    public ProblemDetail cuentaNoHabilitada(CuentaNoHabilitadaException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, e.getMessage());
        problema.setTitle("Cuenta no habilitada");
        problema.setType(URI.create(BASE_TIPO + "cuenta-no-habilitada"));
        problema.setProperty("estado", e.estado().name());
        return problema;
    }

    /**
     * 423 Locked y no el 429 del limite por IP: son dos frenos distintos y el frontend tiene que
     * poder decirlos con palabras distintas. 429 es "esta maquina va muy rapido"; esto es "esta
     * cuenta esta cerrada un rato".
     */
    @ExceptionHandler(CuentaBloqueadaException.class)
    public ProblemDetail cuentaBloqueada(CuentaBloqueadaException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.LOCKED, e.getMessage());
        problema.setTitle("Cuenta bloqueada temporalmente");
        problema.setType(URI.create(BASE_TIPO + "cuenta-bloqueada"));
        problema.setProperty("segundosRestantes", e.esperaRestante().toSeconds());
        return problema;
    }

    /**
     * Sin esto, un `@PreAuthorize` que no se cumple sale por el catch-all de abajo y responde 500:
     * el `accessDeniedHandler` de SecurityConfig solo cubre lo que rechaza la cadena de filtros, no
     * lo que rechaza la seguridad a nivel de metodo.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail accesoDenegado(AccessDeniedException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN,
                "Tu cuenta no tiene permiso para esta accion.");
        problema.setTitle("Acceso denegado");
        problema.setType(URI.create(BASE_TIPO + "acceso-denegado"));
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
     * BUG-062 — sin esto, pedir una ruta con el verbo equivocado caia en el catch-all: 405 nunca se
     * emitia y el log guardaba un stack trace de «Error no controlado» por una peticion que el
     * cliente formo mal. La cabecera `Allow` no es decorativa: es lo unico que le dice a quien
     * integra cual era el verbo correcto sin tener que abrir el contrato.
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ProblemDetail> metodoNoPermitido(HttpRequestMethodNotSupportedException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.METHOD_NOT_ALLOWED,
                "El metodo " + e.getMethod() + " no esta permitido en esta ruta.");
        problema.setTitle("Metodo no permitido");
        problema.setType(URI.create(BASE_TIPO + "metodo-no-permitido"));

        HttpHeaders cabeceras = new HttpHeaders();
        Set<HttpMethod> permitidos = e.getSupportedHttpMethods();
        if (permitidos != null && !permitidos.isEmpty()) {
            cabeceras.setAllow(permitidos);
            problema.setProperty("metodosPermitidos", permitidos.stream().map(HttpMethod::name).toList());
        }
        return new ResponseEntity<>(problema, cabeceras, HttpStatus.METHOD_NOT_ALLOWED);
    }

    /** Cuerpo enviado con un `Content-Type` que la ruta no sabe leer: 415, no 500. */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ProblemDetail> tipoDeContenidoNoSoportado(HttpMediaTypeNotSupportedException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "El tipo de contenido enviado no es compatible con esta ruta.");
        problema.setTitle("Tipo de contenido no soportado");
        problema.setType(URI.create(BASE_TIPO + "tipo-de-contenido-no-soportado"));

        HttpHeaders cabeceras = new HttpHeaders();
        List<MediaType> soportados = e.getSupportedMediaTypes();
        if (!soportados.isEmpty()) {
            cabeceras.setAccept(soportados);
            problema.setProperty("tiposSoportados", soportados.stream().map(MediaType::toString).toList());
        }
        return new ResponseEntity<>(problema, cabeceras, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }

    /** Falta un parametro de consulta declarado obligatorio. */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ProblemDetail parametroFaltante(MissingServletRequestParameterException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "Falta el parametro obligatorio '" + e.getParameterName() + "'.");
        problema.setTitle("Peticion invalida");
        problema.setType(URI.create(BASE_TIPO + "peticion-invalida"));
        return problema;
    }

    /** M10 — un multipart sin la parte esperada (subir evidencia sin adjuntar el archivo). */
    @ExceptionHandler(MissingServletRequestPartException.class)
    public ProblemDetail parteFaltante(MissingServletRequestPartException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "Falta la parte '" + e.getRequestPartName() + "' en el formulario enviado.");
        problema.setTitle("Peticion invalida");
        problema.setType(URI.create(BASE_TIPO + "peticion-invalida"));
        return problema;
    }

    /**
     * JSON mal formado, vacio o con un valor que ningun convertidor acepta. El mensaje original no
     * viaja al cliente: trae nombres de clases y rutas del paquete interno.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail cuerpoIlegible(HttpMessageNotReadableException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "El cuerpo de la peticion no se pudo leer: se espera un JSON valido.");
        problema.setTitle("Peticion invalida");
        problema.setType(URI.create(BASE_TIPO + "peticion-invalida"));
        return problema;
    }

    /** Un valor de ruta o de consulta que no encaja con su tipo declarado (`?pagina=abc`). */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail tipoDeParametroInvalido(MethodArgumentTypeMismatchException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "El valor de '" + e.getName() + "' no tiene el formato esperado.");
        problema.setTitle("Peticion invalida");
        problema.setType(URI.create(BASE_TIPO + "peticion-invalida"));
        return problema;
    }

    /** M10 — sin esto, una foto que excede spring.servlet.multipart.max-file-size caía en el catch-all y respondía 500 en vez de 413. */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ProblemDetail archivoDemasiadoGrande(MaxUploadSizeExceededException e) {
        ProblemDetail problema = ProblemDetail.forStatusAndDetail(HttpStatus.PAYLOAD_TOO_LARGE,
                "El archivo supera el tamaño máximo permitido.");
        problema.setTitle("Archivo demasiado grande");
        problema.setType(URI.create(BASE_TIPO + "archivo-demasiado-grande"));
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
