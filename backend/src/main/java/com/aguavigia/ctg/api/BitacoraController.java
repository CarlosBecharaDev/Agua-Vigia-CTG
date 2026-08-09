package com.aguavigia.ctg.api;

import com.aguavigia.ctg.api.dto.EventoBitacoraRespuesta;
import com.aguavigia.ctg.api.mapper.EventoBitacoraApiMapper;
import com.aguavigia.ctg.domain.port.out.EventoBitacoraRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * M8 — RF026-RF028: bitácora pública, de solo lectura y sin autenticación (RF027). Va directo al
 * puerto de salida, sin caso de uso intermedio (ADR-015): no hay regla de negocio en leer, solo en
 * anexar — eso lo hace `RegistrarEventoBitacoraUseCase`, que ningún controlador expone: nadie
 * externo debería poder anexar un evento arbitrario a la bitácora.
 *
 * La inmutabilidad de RF028 no depende de este controlador: `EventoBitacoraRepository` no declara
 * ni editar ni eliminar, así que no hay manera de romperla desde la API aunque se quisiera.
 */
@Tag(name = "Bitácora", description = "Bitácora pública de eventos, de solo anexado (RF026-RF028)")
@RestController
@RequestMapping(value = "/api/bitacora", produces = MediaType.APPLICATION_JSON_VALUE)
public class BitacoraController {

    private final EventoBitacoraRepository eventos;
    private final EventoBitacoraApiMapper mapper;

    public BitacoraController(EventoBitacoraRepository eventos, EventoBitacoraApiMapper mapper) {
        this.eventos = eventos;
        this.mapper = mapper;
    }

    @Operation(summary = "Listar los eventos de la bitácora, más recientes primero")
    @ApiResponse(responseCode = "200", description = "Listado generado")
    @GetMapping
    public List<EventoBitacoraRespuesta> listar() {
        return mapper.aRespuestas(eventos.listarTodos());
    }
}
