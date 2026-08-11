/**
 * Adaptadores de los puertos {@code domain.port.out.*Repository} sobre MongoDB.
 *
 * Cada adaptador traduce entre el documento de Mongo y el objeto de dominio, y ninguno deja salir
 * de aqui un tipo de Spring Data: lo que cruza hacia application/ son siempre tipos de domain/.
 *
 * {@code IndicesMongo} asegura los indices al arrancar, incluido el 2dsphere de las consultas
 * geoespaciales: Spring Data no los crea solo desde la version 3.0 y el sembrador de D5 solo corre
 * a mano, asi que sin eso un despliegue limpio queda sin ellos.
 */
package com.aguavigia.ctg.infrastructure.persistence.mongo;
