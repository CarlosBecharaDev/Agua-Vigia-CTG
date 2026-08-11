package com.aguavigia.ctg.infrastructure.logging;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static com.aguavigia.ctg.infrastructure.logging.CorrelationIdFilter.CABECERA;
import static com.aguavigia.ctg.infrastructure.logging.CorrelationIdFilter.CLAVE_MDC;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class CorrelationIdFilterTest {

    private CorrelationIdFilter filtro;
    private MockHttpServletRequest peticion;
    private MockHttpServletResponse respuesta;
    private FilterChain cadena;

    @BeforeEach
    void montar() {
        filtro = new CorrelationIdFilter();
        peticion = new MockHttpServletRequest();
        respuesta = new MockHttpServletResponse();
        cadena = mock(FilterChain.class);
    }

    @AfterEach
    void limpiar() {
        MDC.clear();
    }

    private void ejecutar() throws Exception {
        filtro.doFilter(peticion, respuesta, cadena);
    }

    @Test
    void sinCabeceraGeneraUnCorrelationIdYLoDevuelveEnLaRespuesta() throws Exception {
        ejecutar();

        String generado = respuesta.getHeader(CABECERA);
        assertThat(generado).isNotBlank();
        verify(cadena).doFilter(peticion, respuesta);
    }

    @Test
    void reutilizaElCorrelationIdRecibidoDelCliente() throws Exception {
        peticion.addHeader(CABECERA, "abc-123-def");

        ejecutar();

        assertThat(respuesta.getHeader(CABECERA)).isEqualTo("abc-123-def");
    }

    /**
     * Un cliente podría meter cualquier texto en la cabecera para inyectarlo en cada línea de log
     * de su propia petición: se descarta y se genera uno propio en vez de confiar en el valor.
     */
    @Test
    void ignoraUnCorrelationIdConCaracteresNoPermitidosYGeneraUnoNuevo() throws Exception {
        peticion.addHeader(CABECERA, "valor\ncon salto de línea");

        ejecutar();

        assertThat(respuesta.getHeader(CABECERA)).isNotEqualTo("valor\ncon salto de línea");
    }

    @Test
    void dejaElMdcLimpioDespuesDeResponder() throws Exception {
        ejecutar();

        assertThat(MDC.get(CLAVE_MDC)).isNull();
    }

    @Test
    void elMdcContieneElCorrelationIdMientrasCorreLaCadena() throws Exception {
        cadena = (req, res) -> assertThat(MDC.get(CLAVE_MDC)).isNotBlank();

        filtro.doFilter(peticion, respuesta, cadena);
    }
}
