package com.aguavigia.ctg.infrastructure.ingest;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;
import io.github.resilience4j.springboot3.circuitbreaker.autoconfigure.CircuitBreakerAutoConfiguration;
import io.github.resilience4j.springboot3.retry.autoconfigure.RetryAutoConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * RNF005 — "ante fallo de una fuente externa, el sistema debe reintentar con retroceso exponencial
 * y abrir un cortacircuitos tras 3 fallos consecutivos".
 *
 * Se prueba contra las instancias que Spring construye desde `application.yml`, no contra una
 * configuración escrita en el test: lo que puede estar mal es *nuestra* configuración, no la
 * librería. Antes de esto, `resilience4j` estaba en el `pom.xml` sin un solo uso mientras la matriz
 * de trazabilidad daba el RNF por cumplido.
 */
@SpringBootTest(classes = ResilienciaDeColectoresTest.ContextoMinimo.class)
@ImportAutoConfiguration({CircuitBreakerAutoConfiguration.class, RetryAutoConfiguration.class})
class ResilienciaDeColectoresTest {

    /**
     * @Configuration y no @TestConfiguration: una @TestConfiguration nunca es la configuración
     * primaria, así que Spring seguiría buscando hacia arriba, encontraría CtgApplication y
     * levantaría la aplicación entera — con su scheduler llamando a acuacar.com y a un Redis que en
     * la máquina de pruebas no existe. Aquí solo hacen falta los dos registros de resilience4j.
     */
    @Configuration
    static class ContextoMinimo {
    }

    @Autowired
    private CircuitBreakerRegistry cortacircuitos;

    @Autowired
    private RetryRegistry reintentos;

    @Test
    void elReintentoDeLosColectoresDebeSerExponencialYDeTresIntentos() {
        RetryConfig config = reintentos.retry("colectores").getRetryConfig();

        assertThat(config.getMaxAttempts()).isEqualTo(3);
        // El intervalo del segundo intento duplica al del primero: 2s, 4s.
        assertThat(config.getIntervalBiFunction().apply(1, null)).isEqualTo(2000L);
        assertThat(config.getIntervalBiFunction().apply(2, null)).isEqualTo(4000L);
    }

    @Test
    void cadaColectorDebeTenerSuPropioCortacircuitos() {
        assertThat(cortacircuitos.circuitBreaker("acuacar")).isNotNull();
        assertThat(cortacircuitos.circuitBreaker("rss")).isNotNull();
        // Instancias separadas: que acuacar.com este caido no debe cerrarle la puerta al RSS.
        assertThat(cortacircuitos.circuitBreaker("acuacar"))
                .isNotSameAs(cortacircuitos.circuitBreaker("rss"));
    }

    @Test
    void debeAbrirElCortacircuitosAlTercerFalloConsecutivo() {
        CircuitBreaker acuacar = cortacircuitos.circuitBreaker("acuacar");
        acuacar.reset();

        acuacar.onError(0, TimeUnit.MILLISECONDS, new RuntimeException("503"));
        assertThat(acuacar.getState()).isEqualTo(CircuitBreaker.State.CLOSED);
        acuacar.onError(0, TimeUnit.MILLISECONDS, new RuntimeException("503"));
        assertThat(acuacar.getState()).isEqualTo(CircuitBreaker.State.CLOSED);
        acuacar.onError(0, TimeUnit.MILLISECONDS, new RuntimeException("503"));

        assertThat(acuacar.getState()).isEqualTo(CircuitBreaker.State.OPEN);
        // Abierto, deja de dejar pasar: el ciclo siguiente no vuelve a golpear un sitio ya caido.
        assertThat(acuacar.tryAcquirePermission()).isFalse();
    }

    @Test
    void unCortacircuitosAbiertoDebeEsperarCincoMinutosAntesDeReintentar() {
        assertThat(cortacircuitos.circuitBreaker("acuacar").getCircuitBreakerConfig()
                .getWaitIntervalFunctionInOpenState().apply(1))
                .isEqualTo(Duration.ofMinutes(5).toMillis());
    }
}
