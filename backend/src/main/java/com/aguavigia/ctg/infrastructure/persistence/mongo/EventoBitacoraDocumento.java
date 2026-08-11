package com.aguavigia.ctg.infrastructure.persistence.mongo;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Documento de la bitácora pública (RF026-RF028).
 *
 * La inmutabilidad no la impone este documento sino la forma del puerto:
 * {@code EventoBitacoraRepository} declara solo `guardar` y `listarTodos`, sin editar ni eliminar,
 * así que no hay manera de romperla desde la aplicación aunque se quisiera.
 */
@Getter
@Setter
@Document(collection = "eventos_bitacora")
public class EventoBitacoraDocumento {

    @Id
    private String id;

    private String tipo;
    private String sectorId;
    private String corteId;
    private Instant timestamp;
    private String descripcion;
}
