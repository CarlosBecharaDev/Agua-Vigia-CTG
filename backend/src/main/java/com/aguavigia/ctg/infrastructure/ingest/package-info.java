/**
 * Pipeline de ingesta M9 (docs/ingenieria/pipeline-ingesta-datos.md).
 *
 * Etapas presentes: normalizacion (DocumentoCrudo), deduplicacion reciente (Redis) y prefiltro
 * determinista. Los colectores HTTP (AcuacarApiCollector, RssCollector) y la capa de IA quedan
 * fuera a proposito — ver BL-004 y BL-005 en registro-de-bloqueos.md.
 */
package com.aguavigia.ctg.infrastructure.ingest;
