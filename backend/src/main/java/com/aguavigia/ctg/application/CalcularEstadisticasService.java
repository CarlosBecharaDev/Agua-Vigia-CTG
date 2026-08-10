package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.CalcularEstadisticasUseCase;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.format.TextStyle;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CalcularEstadisticasService implements CalcularEstadisticasUseCase {

    private final MongoTemplate mongoTemplate;

    public CalcularEstadisticasService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public EstadisticasGlobales calcularGlobales() {

        // 1. Top 5 sectores mas afectados
        Aggregation topSectoresAgg = Aggregation.newAggregation(
                Aggregation.unwind("sectoresAfectados"),
                Aggregation.group("sectoresAfectados").count().as("cantidadCortes"),
                Aggregation.sort(Sort.Direction.DESC, "cantidadCortes"),
                Aggregation.limit(5),
                Aggregation.lookup("sectorDocumento", "_id", "_id", "sectorInfo"),
                Aggregation.unwind("sectorInfo", true),
                Aggregation.project("cantidadCortes")
                        .and("_id").as("sectorId")
                        .and("sectorInfo.nombre").as("nombre")
        );

        AggregationResults<Map> topSectoresResults = mongoTemplate.aggregate(topSectoresAgg, "corteAguaDocumento", Map.class);
        List<EstadisticaSector> topSectores = topSectoresResults.getMappedResults().stream()
                .map(m -> new EstadisticaSector(
                        new SectorId((String) m.get("sectorId")),
                        m.get("nombre") != null ? (String) m.get("nombre") : "Desconocido",
                        ((Number) m.get("cantidadCortes")).intValue()
                ))
                .collect(Collectors.toList());

        // 2. Cortes por dia de la semana
        Aggregation diasAgg = Aggregation.newAggregation(
                Aggregation.project()
                        .andExpression("dayOfWeek(inicio, 'America/Bogota')").as("diaSemana"),
                Aggregation.group("diaSemana").count().as("cantidad")
        );
        AggregationResults<Map> diasResults = mongoTemplate.aggregate(diasAgg, "corteAguaDocumento", Map.class);
        Map<String, Integer> cortesPorDia = new HashMap<>();
        for (Map m : diasResults.getMappedResults()) {
            Number num = (Number) m.get("_id");
            if (num != null) {
                // MongoDB dayOfWeek: 1 (Sunday) to 7 (Saturday)
                DayOfWeek day = switch (num.intValue()) {
                    case 1 -> DayOfWeek.SUNDAY;
                    case 2 -> DayOfWeek.MONDAY;
                    case 3 -> DayOfWeek.TUESDAY;
                    case 4 -> DayOfWeek.WEDNESDAY;
                    case 5 -> DayOfWeek.THURSDAY;
                    case 6 -> DayOfWeek.FRIDAY;
                    case 7 -> DayOfWeek.SATURDAY;
                    default -> null;
                };
                if (day != null) {
                    String nombreDia = day.getDisplayName(TextStyle.FULL, new Locale("es", "CO"));
                    String diaCapitalizado = nombreDia.substring(0, 1).toUpperCase() + nombreDia.substring(1);
                    cortesPorDia.put(diaCapitalizado, ((Number) m.get("cantidad")).intValue());
                }
            }
        }

        // 3. Duracion promedio (horas)
        Aggregation avgAgg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("finReal").exists(true).ne(null)),
                Aggregation.project()
                        .andExpression("divide(subtract(finReal, inicio), 3600000)").as("duracionHoras"),
                Aggregation.group().avg("duracionHoras").as("duracionPromedio")
        );
        AggregationResults<Map> avgResults = mongoTemplate.aggregate(avgAgg, "corteAguaDocumento", Map.class);
        double duracionPromedioHoras = 0.0;
        if (!avgResults.getMappedResults().isEmpty()) {
            Number avg = (Number) avgResults.getMappedResults().get(0).get("duracionPromedio");
            if (avg != null) {
                duracionPromedioHoras = Math.round(avg.doubleValue() * 10.0) / 10.0;
            }
        }

        return new EstadisticasGlobales(topSectores, cortesPorDia, duracionPromedioHoras);
    }
}
