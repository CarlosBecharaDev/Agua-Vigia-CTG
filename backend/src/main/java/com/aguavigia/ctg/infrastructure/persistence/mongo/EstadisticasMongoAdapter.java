package com.aguavigia.ctg.infrastructure.persistence.mongo;

import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.CalcularEstadisticasUseCase.EstadisticaSector;
import com.aguavigia.ctg.domain.port.in.CalcularEstadisticasUseCase.EstadisticasGlobales;
import com.aguavigia.ctg.domain.port.out.EstadisticasRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.format.TextStyle;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/** M7 — RF023. Sale de application/ (Regla de Oro): la capa de casos de uso no debe conocer Mongo. */
@Component
public class EstadisticasMongoAdapter implements EstadisticasRepository {

    private static final Locale LOCALE_CO = Locale.forLanguageTag("es-CO");

    private final MongoTemplate mongoTemplate;

    public EstadisticasMongoAdapter(MongoTemplate mongoTemplate) {
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
                // Contra `slug`, no contra `_id`: `cortes.sectoresAfectados` guarda el SectorId de
                // dominio, que es el slug, mientras que `sectores._id` es el ObjectId que genera
                // Mongo — scripts/sembrar-sectores.mjs inserta los 213 barrios sin fijar `_id` y
                // SectorMongoAdapter tampoco lo hace. Cruzarlos por `_id` no empataba nunca y los
                // cinco sectores salian como "Desconocido".
                Aggregation.lookup("sectores", "_id", "slug", "sectorInfo"),
                Aggregation.unwind("sectorInfo", true),
                Aggregation.project("cantidadCortes")
                        .and("_id").as("sectorId")
                        .and("sectorInfo.nombre").as("nombre")
        );

        AggregationResults<Map> topSectoresResults =
                mongoTemplate.aggregate(topSectoresAgg, CorteAguaDocumento.class, Map.class);
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
        AggregationResults<Map> diasResults = mongoTemplate.aggregate(diasAgg, CorteAguaDocumento.class, Map.class);

        // LinkedHashMap sembrado con los siete dias en cero, de lunes a domingo: un HashMap dejaba
        // el orden a merced del hashing y los dias sin cortes ni siquiera aparecian, asi que el
        // cliente tenia que adivinar si un dia faltaba por ser cero o por un fallo de la consulta.
        Map<String, Integer> cortesPorDia = new LinkedHashMap<>();
        for (DayOfWeek dia : DayOfWeek.values()) {
            cortesPorDia.put(nombreDe(dia), 0);
        }
        for (Map m : diasResults.getMappedResults()) {
            Number num = (Number) m.get("_id");
            if (num != null) {
                // MongoDB dayOfWeek: 1 (domingo) a 7 (sabado)
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
                    cortesPorDia.put(nombreDe(day), ((Number) m.get("cantidad")).intValue());
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
        AggregationResults<Map> avgResults = mongoTemplate.aggregate(avgAgg, CorteAguaDocumento.class, Map.class);
        double duracionPromedioHoras = 0.0;
        if (!avgResults.getMappedResults().isEmpty()) {
            Number avg = (Number) avgResults.getMappedResults().get(0).get("duracionPromedio");
            if (avg != null) {
                duracionPromedioHoras = Math.round(avg.doubleValue() * 10.0) / 10.0;
            }
        }

        return new EstadisticasGlobales(topSectores, cortesPorDia, duracionPromedioHoras);
    }

    /** "Lunes", "Martes"... Locale.forLanguageTag y no new Locale(...), deprecado desde Java 19. */
    private static String nombreDe(DayOfWeek dia) {
        String nombre = dia.getDisplayName(TextStyle.FULL, LOCALE_CO);
        return nombre.substring(0, 1).toUpperCase(LOCALE_CO) + nombre.substring(1);
    }
}
