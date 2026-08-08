package com.aguavigia.ctg.domain.port.in;

import com.aguavigia.ctg.domain.Coordenada;
import com.aguavigia.ctg.domain.HuellaDispositivo;
import com.aguavigia.ctg.domain.ReporteCiudadano;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoReporte;

/** RF005-RF007 — reportar sin registro, en máximo dos toques. */
public interface RegistrarReporteUseCase {

    ReporteCiudadano registrar(SectorId sectorId, TipoReporte tipo, Coordenada coordenada, HuellaDispositivo huella);
}
