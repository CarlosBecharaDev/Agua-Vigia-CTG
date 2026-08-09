package com.aguavigia.ctg.infrastructure.persistence.mongo;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

/**
 * Documento de la coleccion `sectores`, sembrada por scripts/sembrar-sectores.mjs (D5).
 * Los nombres de campo replican los del sembrador: cambiarlos aqui rompe la lectura de los
 * 213 barrios ya cargados.
 *
 * `geometry` se guarda como org.bson.Document y no como GeoJsonPolygon a proposito: 212 barrios
 * son Polygon pero LA BOQUILLA es MultiPolygon, y un tipo fijo fallaria al leerlo. Ademas asi
 * ningun guardado pierde la geometria, que este adaptador nunca modifica.
 */
@Getter
@Setter
@Document(collection = "sectores")
public class SectorDocumento {

    @Id
    private String id;

    /** Identidad de dominio (SectorId). El _id de Mongo no sale nunca de esta capa. */
    @Indexed(unique = true)
    private String slug;

    private String nombre;

    /** Nulo en 27 de 213 barrios sin dato censal — no se sustituye por 0. */
    private Integer poblacion;

    private Integer ucg;
    private String localidad;
    private String zona;
    private String codigoOrigen;

    @Field("geometry")
    private org.bson.Document geometry;

    /**
     * Nulo mientras nadie haya registrado un estado para el sector. El sembrador no lo escribe
     * porque es estado dinamico, no dato de referencia (ver nota de D5 en sembrar-sectores.mjs).
     */
    private String estadoActual;

    /** Cuando se registro `estadoActual`. Nulo si el sector no tiene estado todavia. */
    private Instant estadoActualizadoEn;
}
