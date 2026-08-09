package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.EstadoCorte;
import com.aguavigia.ctg.domain.EventoBitacora;
import com.aguavigia.ctg.domain.EventoId;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoEvento;
import com.aguavigia.ctg.domain.port.in.GestionarCorteOficialUseCase;
import com.aguavigia.ctg.domain.port.in.RegistrarEventoBitacoraUseCase;
import com.aguavigia.ctg.domain.port.out.CorteAguaRepository;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

/**
 * RF016-RF017 — el veedor registra un corte oficial y lo cierra con la hora real de
 * restablecimiento. `CorteAgua` llega ya construido (el `Builder` del dominio impone sus propias
 * invariantes, como `RegistrarReporteService` deja que el constructor de `ReporteCiudadano`
 * imponga las suyas); este servicio solo aporta la regla que cruza agregados: los sectores
 * afectados tienen que existir.
 *
 * RF026: cada registro y cada cierre anexan un evento a la bitácora pública — uno por sector
 * afectado, porque `EventoBitacora.sectorId` es singular y un corte puede tocar varios sectores a
 * la vez. Misma dependencia de `RegistrarEventoBitacoraUseCase` que `RegistrarReporteService` usa
 * para `EvaluarConsensoUseCase`: un caso de uso dispara a otro, no a su repositorio directamente.
 */
@Service
public class GestionarCorteOficialService implements GestionarCorteOficialUseCase {

    private final CorteAguaRepository cortes;
    private final SectorRepository sectores;
    private final RegistrarEventoBitacoraUseCase registrarEvento;
    private final RelojPort reloj;

    public GestionarCorteOficialService(CorteAguaRepository cortes,
                                         SectorRepository sectores,
                                         RegistrarEventoBitacoraUseCase registrarEvento,
                                         RelojPort reloj) {
        this.cortes = cortes;
        this.sectores = sectores;
        this.registrarEvento = registrarEvento;
        this.reloj = reloj;
    }

    @Override
    public CorteAgua registrar(CorteAgua corte) {
        for (SectorId sectorId : corte.sectoresAfectados()) {
            sectores.buscarPorId(sectorId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "No existe el sector '" + sectorId.valor() + "'"));
        }

        CorteAgua guardado = cortes.guardar(corte);
        for (SectorId sectorId : guardado.sectoresAfectados()) {
            anexarEvento(guardado, sectorId, TipoEvento.CORTE_ANUNCIADO,
                    "Corte oficial anunciado en '%s': %s".formatted(sectorId.valor(), guardado.causa()));
        }
        return guardado;
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

        CorteAgua guardado = cortes.guardar(cerrado);
        for (SectorId sectorId : guardado.sectoresAfectados()) {
            anexarEvento(guardado, sectorId, TipoEvento.CORTE_RESTABLECIDO,
                    "Corte restablecido en '%s'".formatted(sectorId.valor()));
        }
        return guardado;
    }

    private void anexarEvento(CorteAgua corte, SectorId sectorId, TipoEvento tipo, String descripcion) {
        registrarEvento.registrar(new EventoBitacora(
                new EventoId(UUID.randomUUID().toString()),
                tipo,
                sectorId,
                corte.id(),
                reloj.ahora(),
                descripcion));
    }
}
