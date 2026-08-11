package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.AgregadoDuraciones;
import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.PuntoAgregadoMensual;
import com.aguavigia.ctg.domain.SectorId;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface CorteAguaRepository {

    Optional<CorteAgua> buscarPorId(CorteId id);

    List<CorteAgua> listarPorSector(SectorId sectorId);

    /** Todos los cortes, sin filtrar por sector — insumo del índice global (RF021). */
    List<CorteAgua> listarTodos();

    CorteAgua guardar(CorteAgua corte);

    /**
     * Suma de duraciones (prometida/real) de los cortes cerrados, calculada por el adaptador sin
     * traer cada corte a memoria. {@code sectorId} nulo agrega todos los sectores (índice global,
     * RF021); con valor, solo los cortes que afectan ese sector.
     */
    AgregadoDuraciones agregarCerrados(SectorId sectorId);

    /**
     * La misma agregación de {@link #agregarCerrados}, agrupada por mes en hora de Cartagena
     * (RF024). {@code desde}/{@code hasta} acotan por la hora real de restablecimiento; cualquiera
     * de los dos puede ser nulo para no acotar por ese extremo. Resultado ordenado cronológicamente.
     */
    List<PuntoAgregadoMensual> agregarCerradosPorMes(SectorId sectorId, Instant desde, Instant hasta);
}
