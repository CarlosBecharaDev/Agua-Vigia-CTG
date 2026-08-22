package com.aguavigia.ctg.infrastructure.ingest;

import java.time.Instant;
import java.util.List;

public record EventoExtraido(
        boolean esInterrupcionDeAcueducto,
        String tipo,
        List<String> sectoresMencionados,
        Instant inicioDeclarado,
        Instant finPrometido,
        String causaDeclarada,
        double confianza,
        List<String> camposInferidos,
        String citaTextual
) {}
