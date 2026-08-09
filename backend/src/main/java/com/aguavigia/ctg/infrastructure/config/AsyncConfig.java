package com.aguavigia.ctg.infrastructure.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/** Habilita @Async — lo usa MailNotificacionAdapter para no bloquear el hilo HTTP en el envío de correo. */
@Configuration
@EnableAsync
public class AsyncConfig {
}
