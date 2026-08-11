package com.aguavigia.ctg.infrastructure.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

/**
 * El filtro corre en **toda** petición, incluidas las públicas. Un token ausente, vencido o mal
 * firmado no puede romper una ruta que ni siquiera exige autenticación (RF019: el resto de la
 * plataforma es pública) — decidir eso es cosa de SecurityConfig, no de este filtro.
 */
class JwtAuthenticationFilterTest {

    private JwtProvider jwtProvider;
    private JwtAuthenticationFilter filtro;
    private MockHttpServletRequest peticion;
    private MockHttpServletResponse respuesta;
    private FilterChain cadena;

    @BeforeEach
    void montar() {
        jwtProvider = mock(JwtProvider.class);
        filtro = new JwtAuthenticationFilter(jwtProvider);
        peticion = new MockHttpServletRequest();
        respuesta = new MockHttpServletResponse();
        cadena = mock(FilterChain.class);
    }

    @AfterEach
    void limpiar() {
        SecurityContextHolder.clearContext();
    }

    private void ejecutar() throws Exception {
        filtro.doFilter(peticion, respuesta, cadena);
    }

    private Object autenticacion() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    @Test
    void debeAutenticarConUnTokenValido() throws Exception {
        peticion.addHeader("Authorization", "Bearer token-bueno");
        given(jwtProvider.validarYObtenerSujeto("token-bueno")).willReturn(Optional.of("veedor"));

        ejecutar();

        assertThat(autenticacion()).isNotNull();
        verify(cadena).doFilter(peticion, respuesta);
    }

    @Test
    void sinEncabezadoDebeSeguirLaCadenaSinAutenticar() throws Exception {
        ejecutar();

        assertThat(autenticacion()).isNull();
        verify(cadena).doFilter(peticion, respuesta);
    }

    @Test
    void conUnTokenInvalidoDebeSeguirLaCadenaSinAutenticar() throws Exception {
        peticion.addHeader("Authorization", "Bearer token-vencido");
        given(jwtProvider.validarYObtenerSujeto("token-vencido")).willReturn(Optional.empty());

        ejecutar();

        assertThat(autenticacion()).isNull();
        verify(cadena).doFilter(peticion, respuesta);
    }

    /** Sin el prefijo Bearer no hay nada que validar; la petición sigue como anónima. */
    @Test
    void debeIgnorarUnEncabezadoQueNoEsBearer() throws Exception {
        peticion.addHeader("Authorization", "Basic dXN1YXJpbzpjbGF2ZQ==");

        ejecutar();

        assertThat(autenticacion()).isNull();
        verify(cadena).doFilter(peticion, respuesta);
    }

    @Test
    void unBearerVacioNoDebeRomperLaPeticion() throws Exception {
        peticion.addHeader("Authorization", "Bearer ");
        given(jwtProvider.validarYObtenerSujeto("")).willReturn(Optional.empty());

        ejecutar();

        assertThat(autenticacion()).isNull();
        verify(cadena).doFilter(peticion, respuesta);
    }
}
