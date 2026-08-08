package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;

import java.util.List;
import java.util.Optional;

public interface SectorRepository {

    Optional<Sector> buscarPorId(SectorId id);

    List<Sector> listarTodos();

    Sector guardar(Sector sector);
}
