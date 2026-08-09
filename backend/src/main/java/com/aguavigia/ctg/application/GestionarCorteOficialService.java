package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.EstadoCorte;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.GestionarCorteOficialUseCase;
import com.aguavigia.ctg.domain.port.out.CorteAguaRepository;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * RF016-RF017 — el veedor registra un corte oficial y lo cierra con la hora real de
 * restablecimiento. `CorteAgua` llega ya construido (el `Builder` del dominio impone sus propias
 * invariantes, como `RegistrarReporteService` deja que el constructor de `ReporteCiudadano`
 * imponga las suyas); este servicio solo aporta la regla que cruza agregados: los sectores
 * afectados tienen que existir.
 */
@Service
public class GestionarCorteOficialService implements GestionarCorteOficialUseCase {

    private final CorteAguaRepository cortes;
    private final SectorRepository sectores;

    public GestionarCorteOficialService(CorteAguaRepository cortes, SectorRepository sectores) {
        this.cortes = cortes;
        this.sectores = sectores;
    }

    @Override
    public CorteAgua registrar(CorteAgua corte) {
        for (SectorId sectorId : corte.sectoresAfectados()) {
            sectores.buscarPorId(sectorId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "No existe el sector '" + sectorId.valor() + "'"));
        }
        return cortes.guardar(corte);
    }

    @Override
    public CorteAgua cerrar(CorteId corteId, Instant horaReal) {
        CorteAgua corte = cortes.buscarPorId(corteId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No existe el corte '" + corteId.valor() + "'"));

        if (corte.ventana().estaCerrada()) {
            throw new IllegalStateException("El corte '" + corteId.valor() + "' ya está cerrado");
        }

        CorteAgua cerrado = CorteAgua.builder()
                .id(corte.id())
                .sectoresAfectados(corte.sectoresAfectados())
                .inicio(corte.ventana().inicio())
                .finPrometido(corte.ventana().finPrometido())
                .finReal(horaReal)
                .causa(corte.causa())
                .origen(corte.origen())
                .estado(EstadoCorte.RESTABLECIDO)
                .build();

        return cortes.guardar(cerrado);
    }
}
