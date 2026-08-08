package com.aguavigia.ctg.infrastructure.config;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Controlador solo para RateLimitConfigTest — no hay controladores reales en esta rama. */
@RestController
public class ControladorDePruebaRateLimit {

    @GetMapping("/protegida")
    public String protegida() {
        return "ok";
    }

    @GetMapping("/sin-proteger")
    public String sinProteger() {
        return "ok";
    }
}
