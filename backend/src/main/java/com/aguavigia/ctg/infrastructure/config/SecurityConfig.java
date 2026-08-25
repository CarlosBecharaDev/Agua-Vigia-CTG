package com.aguavigia.ctg.infrastructure.config;

import com.aguavigia.ctg.infrastructure.security.JwtAuthenticationFilter;
import com.aguavigia.ctg.infrastructure.security.JwtProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * RF019: el panel del veedor exige token; el resto de la plataforma es publico. Por eso la regla
 * por defecto es permitAll y solo /api/veedor/** (menos el login) exige autenticacion — así
 * cualquier endpoint publico que D2/D1/D3 agreguen despues queda publico sin tocar este archivo.
 */
@Configuration
@EnableConfigurationProperties(CorsProperties.class)
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Sin esto el preflight nunca llegaba a resolverse: Spring Security responde 403 a un
     * OPTIONS sin credenciales antes de que MVC lo vea, asi que un frontend en otro origen no
     * podia ni siquiera preguntar.
     *
     * El bean existe siempre — devolver `null` desde un @Bean deja un NullBean que la cadena de
     * seguridad no sabe resolver — pero sin origenes declarados no registra ningun mapeo, con lo
     * que no se emite ninguna cabecera CORS y el comportamiento queda igual que antes.
     */
    @Bean
    public CorsConfigurationSource fuenteDeConfiguracionCors(CorsProperties propiedades) {
        UrlBasedCorsConfigurationSource fuente = new UrlBasedCorsConfigurationSource();
        if (!propiedades.habilitado()) {
            return fuente;
        }

        CorsConfiguration configuracion = new CorsConfiguration();
        configuracion.setAllowedOrigins(propiedades.origenesPermitidos());
        configuracion.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        configuracion.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-IoT-Key"));
        // El token del veedor viaja en la cabecera Authorization, no en cookie: no hace falta
        // permitir credenciales, y no permitirlas evita el combo prohibido con origenes amplios.
        configuracion.setAllowCredentials(false);
        configuracion.setMaxAge(3600L);

        fuente.registerCorsConfiguration("/api/**", configuracion);
        return fuente;
    }

    @Bean
    public SecurityFilterChain cadenaDeSeguridad(HttpSecurity http,
                                                 JwtProvider jwtProvider,
                                                 // Con @Qualifier porque Spring MVC registra otro
                                                 // CorsConfigurationSource propio (el
                                                 // mvcHandlerMappingIntrospector) y por tipo la
                                                 // inyeccion queda ambigua.
                                                 @Qualifier("fuenteDeConfiguracionCors")
                                                 CorsConfigurationSource fuenteCors) throws Exception {
        http
                // Se pasa la fuente explicitamente en vez de Customizer.withDefaults(): ese
                // atajo solo recoge un bean que se llame literalmente "corsConfigurationSource",
                // asi que con el nombre en espanol la configuracion se ignoraba en silencio y
                // el preflight seguia respondiendo 403.
                .cors(cors -> cors.configurationSource(fuenteCors))
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(sesion -> sesion.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(rutas -> rutas
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/veedor/sesion").permitAll()
                        .requestMatchers("/api/veedor/**").authenticated()
                        .anyRequest().permitAll())
                .exceptionHandling(manejo -> manejo
                        .authenticationEntryPoint((request, response, ex) ->
                                response.sendError(HttpStatus.UNAUTHORIZED.value()))
                        .accessDeniedHandler((request, response, ex) ->
                                response.sendError(HttpStatus.FORBIDDEN.value())))
                .addFilterBefore(new JwtAuthenticationFilter(jwtProvider), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
