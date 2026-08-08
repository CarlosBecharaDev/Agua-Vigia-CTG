/**
 * Configuracion de cache sobre Redis (Spring Cache abstraction). Pendiente de Sprint 2
 * ("Caching de respuestas del mapa en Redis") y Sprint 5 ("Decorador de cache sobre servicios de
 * consulta") de D3-backend-infraestructura.md — es la misma pieza de infraestructura para ambos.
 *
 * Cualquier metodo de infrastructure/ o application/ se cachea con @Cacheable("nombre-del-cache"),
 * sin tocar este paquete. El TTL por defecto y los TTL especificos por nombre de cache se
 * configuran en application.yml bajo `aguavigia.cache`.
 */
package com.aguavigia.ctg.infrastructure.cache;
