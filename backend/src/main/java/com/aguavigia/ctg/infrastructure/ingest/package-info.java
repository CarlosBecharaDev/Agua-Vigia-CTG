/**
 * Pipeline de ingesta M9 (docs/ingenieria/pipeline-ingesta-datos.md).
 *
 * Etapas: colectores HTTP ({@code AcuacarApiCollector}, {@code RssCollector}), normalizacion
 * ({@code DocumentoCrudo}), deduplicacion reciente en Redis, prefiltro determinista y extraccion
 * por heuristica ({@code HeuristicaExtractor}). La capa de IA quedo fuera de alcance en ADR-025.
 *
 * {@code PipelineOrquestador} **no publica: propone**. Registra una {@code PropuestaIngesta}
 * PENDIENTE y el mapa no cambia hasta que un veedor la aprueba (ADR-028) — una expresion regular
 * sobre una nota de prensa no puede cambiar sola el estado publico de un barrio.
 *
 * {@code EstadoColectorRegistry} y {@code ColectorHealthIndicator} exponen la salud de cada
 * colector (RNF007); los reintentos y cortacircuitos son de resilience4j, configurados en
 * application.yml bajo `resilience4j` (RNF005).
 */
package com.aguavigia.ctg.infrastructure.ingest;
