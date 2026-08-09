package com.aguavigia.ctg.domain.port.out;

import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.Suscripcion;

import java.util.List;

public interface NotificacionPort {

    /**
     * No bloquea al invocador: la implementación decide cómo enviar (RNF de Sprint 1 pide
     * async con JavaMailSender), pero el puerto no lo exige — es detalle de adaptador, no
     * contrato de dominio.
     */
    void enviarConfirmacionSuscripcion(Suscripcion suscripcion, List<Sector> sectoresSuscritos);
}
