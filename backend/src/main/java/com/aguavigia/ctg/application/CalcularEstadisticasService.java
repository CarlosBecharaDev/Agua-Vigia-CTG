package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.CalcularEstadisticasUseCase;
import com.aguavigia.ctg.domain.port.out.CorteAguaRepository;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CalcularEstadisticasService implements CalcularEstadisticasUseCase {

    private final CorteAguaRepository cortesRepository;
    private final SectorRepository sectorRepository;
    private static final ZoneId ZONA_CARTAGENA = ZoneId.of("America/Bogota");

    public CalcularEstadisticasService(CorteAguaRepository cortesRepository, SectorRepository sectorRepository) {
        this.cortesRepository = cortesRepository;
        this.sectorRepository = sectorRepository;
    }

    @Override
    public EstadisticasGlobales calcularGlobales() {
        List<CorteAgua> todos = cortesRepository.listarTodos();
        if (todos.isEmpty()) {
            return new EstadisticasGlobales(List.of(), Map.of(), 0.0);
        }

        Map<SectorId, Integer> cortesPorSector = new HashMap<>();
        Map<String, Integer> cortesPorDia = new HashMap<>();
        long totalDuracionSegundos = 0;
        int cortesCerrados = 0;

        for (CorteAgua corte : todos) {
            for (SectorId s : corte.sectoresAfectados()) {
                cortesPorSector.merge(s, 1, Integer::sum);
            }

            DayOfWeek dia = corte.ventana().inicio().atZone(ZONA_CARTAGENA).getDayOfWeek();
            String nombreDia = dia.getDisplayName(TextStyle.FULL, new Locale("es", "CO"));
            String diaCapitalizado = nombreDia.substring(0, 1).toUpperCase() + nombreDia.substring(1);
            cortesPorDia.merge(diaCapitalizado, 1, Integer::sum);

            if (corte.ventana().estaCerrada()) {
                long segundos = java.time.Duration.between(corte.ventana().inicio(), corte.ventana().finReal()).getSeconds();
                totalDuracionSegundos += segundos;
                cortesCerrados++;
            }
        }

        List<EstadisticaSector> topSectores = cortesPorSector.entrySet().stream()
                .sorted(Map.Entry.<SectorId, Integer>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    String nombre = sectorRepository.buscarPorId(e.getKey())
                            .map(s -> s.nombre())
                            .orElse("Desconocido");
                    return new EstadisticaSector(e.getKey(), nombre, e.getValue());
                })
                .collect(Collectors.toList());

        double duracionPromedioHoras = cortesCerrados > 0
                ? (double) totalDuracionSegundos / cortesCerrados / 3600.0
                : 0.0;

        return new EstadisticasGlobales(topSectores, cortesPorDia, Math.round(duracionPromedioHoras * 10.0) / 10.0);
    }
}
