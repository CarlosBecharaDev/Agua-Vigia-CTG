package com.aguavigia.ctg.infrastructure.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utilidad manual para generar VEEDOR_PASSWORD_HASH (.env, ver .env.example). No es una prueba
 * automatizada a proposito: sin @Test ni sufijo "Test", Surefire no la ejecuta en `mvnw verify`.
 *
 * Uso: click derecho > Run en el IDE, con args[0] = tu clave. Corre localmente, contra las mismas
 * clases de Spring Security que usa el backend — nada sale de tu maquina.
 */
public final class GenerarHashVeedor {

    private GenerarHashVeedor() {
    }

    public static void main(String[] args) {
        if (args.length != 1) {
            System.err.println("Uso: pasa la clave del veedor como unico argumento del programa.");
            System.exit(1);
        }
        System.out.println(new BCryptPasswordEncoder().encode(args[0]));
    }
}
