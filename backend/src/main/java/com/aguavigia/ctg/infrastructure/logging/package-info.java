/**
 * Correlation ID por peticion (CorrelationIdFilter) y su propagacion a hilos @Async
 * (MdcTaskDecorator), consumidos por el logging estructurado de application.yml
 * (`logging.structured.format.console=ecs`).
 *
 * Cierra el pendiente "Logs sin estructura ni correlation ID" de estado-del-backend.md #6.1.
 */
package com.aguavigia.ctg.infrastructure.logging;
