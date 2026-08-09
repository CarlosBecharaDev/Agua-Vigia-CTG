package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.SectorId;

import java.util.List;
import java.util.Optional;

public interface CorteAguaRepository {

    Optional<CorteAgua> buscarPorId(CorteId id);

    List<CorteAgua> listarPorSector(SectorId sectorId);

    /** Todos los cortes, sin filtrar por sector — insumo del índice global (RF021). */
    List<CorteAgua> listarTodos();

    CorteAgua guardar(CorteAgua corte);
}
