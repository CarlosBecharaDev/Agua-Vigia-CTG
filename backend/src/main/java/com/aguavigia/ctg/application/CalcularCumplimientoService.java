package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.CorteId;
import com.aguavigia.ctg.domain.IndiceCumplimiento;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.VentanaTiempo;
import com.aguavigia.ctg.domain.port.in.CalcularCumplimientoUseCase;
import com.aguavigia.ctg.domain.port.out.CorteAguaRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

/**
 * RF020-RF022 — el diferencial del proyecto: compara la duración prometida de cada corte contra
 * la real.
 *
 * `porSector` y `global` agregan por **suma de duraciones**, no por promedio del porcentaje de
 * cada corte (`ADR-022`): un corte largo incumplido pesa más que varios cortes cortos cumplidos,
 * que es la lectura correcta para la ciudadanía y coincide con el ejemplo de `DESIGN.md`
 * ("Prometieron 2 horas · Fueron 8"). Solo se agregan cortes **cerrados** (RF020: "por cada corte
 * cerrado") — uno abierto no tiene duración real todavía.
 */
@Service
public class CalcularCumplimientoService implements CalcularCumplimientoUseCase {

    private final CorteAguaRepository cortes;

    public CalcularCumplimientoService(CorteAguaRepository cortes) {
        this.cortes = cortes;
    }

    @Override
    public IndiceCumplimiento porCorte(CorteId corteId) {
        CorteAgua corte = cortes.buscarPorId(corteId)
                .orElseThrow(() -> new IllegalArgumentException("No existe el corte '" + corteId.valor() + "'"));

        if (!corte.ventana().estaCerrada()) {
            throw new IllegalStateException("El corte '" + corteId.valor() + "' todavía no está cerrado");
        }

        // Sin sectorId: un corte puede afectar varios sectores a la vez, y quien pregunta por un
        // corteId concreto ya sabe cuál es — repetirlo aquí no aporta información nueva.
        return indiceDe(null, List.of(corte.ventana()));
    }

    @Override
    public IndiceCumplimiento porSector(SectorId sectorId) {
        List<VentanaTiempo> ventanasCerradas = cortes.listarPorSector(sectorId).stream()
                .map(CorteAgua::ventana)
                .filter(VentanaTiempo::estaCerrada)
                .toList();

        if (ventanasCerradas.isEmpty()) {
            throw new IllegalArgumentException(
                    "No hay cortes cerrados para el sector '" + sectorId.valor() + "'");
        }

        return indiceDe(sectorId, ventanasCerradas);
    }

    @Override
    public IndiceCumplimiento global() {
        List<VentanaTiempo> ventanasCerradas = cortes.listarTodos().stream()
                .map(CorteAgua::ventana)
                .filter(VentanaTiempo::estaCerrada)
                .toList();

        if (ventanasCerradas.isEmpty()) {
            throw new IllegalArgumentException("No hay cortes cerrados todavía");
        }

        return indiceDe(null, ventanasCerradas);
    }

    private static IndiceCumplimiento indiceDe(SectorId sectorId, List<VentanaTiempo> ventanas) {
        Duration duracionPrometida = ventanas.stream()
                .map(v -> Duration.between(v.inicio(), v.finPrometido()))
                .reduce(Duration.ZERO, Duration::plus);
        Duration duracionReal = ventanas.stream()
                .map(v -> Duration.between(v.inicio(), v.finReal()))
                .reduce(Duration.ZERO, Duration::plus);
        Duration desviacion = duracionReal.minus(duracionPrometida);

        double porcentajeCumplimiento = duracionReal.isZero()
                ? 100.0
                : Math.min(100.0, (duracionPrometida.toSeconds() * 100.0) / duracionReal.toSeconds());

        return new IndiceCumplimiento(sectorId, duracionPrometida, duracionReal, desviacion, porcentajeCumplimiento);
    }
}
