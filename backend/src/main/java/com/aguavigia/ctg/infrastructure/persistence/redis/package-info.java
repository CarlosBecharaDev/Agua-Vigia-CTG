/**
 * Adaptadores sobre Redis.
 *
 * Aqui vive {@code RedisContadorReportesAdapter}, la ventana deslizante de reportes que sostiene el
 * consenso (RF009-RF011) sobre un ZSET.
 *
 * Los otros dos usos de Redis del proyecto viven en sus propios paquetes porque son piezas
 * distintas, no adaptadores de un puerto de dominio: el cache del mapa en
 * {@code infrastructure.cache} y el rate limiting HTTP en {@code infrastructure.ratelimit}.
 */
package com.aguavigia.ctg.infrastructure.persistence.redis;
