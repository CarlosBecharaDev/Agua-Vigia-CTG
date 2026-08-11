/**
 * Configuracion de cache sobre Redis (Spring Cache abstraction).
 *
 * Cualquier metodo de infrastructure/ o application/ se cachea con @Cacheable("nombre-del-cache"),
 * sin tocar este paquete. El TTL por defecto y los TTL especificos por nombre de cache se
 * configuran en application.yml bajo `aguavigia.cache`.
 *
 * Hoy lo usa {@code SectorMongoAdapter.listarTodos()} — el listado que pide el mapa completo, con
 * TTL de 15s e invalidacion explicita al cambiar el estado de un sector (RNF003).
 */
package com.aguavigia.ctg.infrastructure.cache;
