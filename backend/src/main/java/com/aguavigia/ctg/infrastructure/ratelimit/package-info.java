/**
 * Rate limiting HTTP generico por IP y ruta (INCR+EXPIRE en Redis), configurable en
 * application.yml bajo `aguavigia.rate-limit.reglas`. Sin reglas configuradas, no protege nada
 * — es opt-in a proposito, para no cambiar el comportamiento de rutas que nadie pidio proteger.
 *
 * Cierra el hueco senalado en ADR-016 (login del veedor sin freno de fuerza bruta) y el
 * pendiente de M2 en D3-backend-infraestructura.md Sprint 2 ("Rate limiting en Redis, INCR+EXPIRE").
 */
package com.aguavigia.ctg.infrastructure.ratelimit;
