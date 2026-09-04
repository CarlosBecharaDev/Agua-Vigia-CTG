package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.EstadoRevision;
import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.EventoBitacora;
import com.aguavigia.ctg.domain.PropuestaId;
import com.aguavigia.ctg.domain.PropuestaIngesta;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.TipoEvento;
import com.aguavigia.ctg.domain.port.in.RegistrarEventoBitacoraUseCase;
import com.aguavigia.ctg.domain.CorteAgua;
import com.aguavigia.ctg.domain.OrigenCorte;
import com.aguavigia.ctg.domain.EstadoCorte;
import com.aguavigia.ctg.domain.port.out.CorteAguaRepository;
import com.aguavigia.ctg.domain.port.out.PropuestaIngestaRepository;
import com.aguavigia.ctg.domain.port.out.RelojPort;
import com.aguavigia.ctg.domain.port.out.SectorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class RevisarPropuestaIngestaServiceTest {

    private static final Instant AHORA = Instant.parse("2026-08-09T15:30:00Z");
    private static final PropuestaId ID = new PropuestaId("p-1");
    private static final SectorId MANGA = new SectorId("manga");

    private PropuestaIngestaRepository propuestas;
    private SectorRepository sectores;
    private RegistrarEventoBitacoraUseCase registrarEvento;
    private CorteAguaRepository cortes;
    private RevisarPropuestaIngestaService servicio;

    @BeforeEach
    void montar() {
        propuestas = mock(PropuestaIngestaRepository.class);
        sectores = mock(SectorRepository.class);
        registrarEvento = mock(RegistrarEventoBitacoraUseCase.class);
        cortes = mock(CorteAguaRepository.class);
        given(cortes.buscarPorId(any())).willReturn(Optional.empty());
        given(cortes.guardar(any())).willAnswer(i -> i.getArgument(0));
        RelojPort reloj = () -> AHORA;
        servicio = new RevisarPropuestaIngestaService(propuestas, sectores, registrarEvento, cortes, reloj);

        given(propuestas.guardar(any())).willAnswer(invocacion -> invocacion.getArgument(0));
        given(propuestas.buscarPorId(ID)).willReturn(Optional.of(propuestaPendiente()));
    }

    /** Con ventana declarada: es lo único que puede fijar el estado actual de un barrio. */
    private PropuestaIngesta propuestaPendiente() {
        return new PropuestaIngesta(ID, MANGA, EstadoServicio.SIN_SERVICIO, "acuacar",
                "https://acuacar.com/x", "cita", 0.6, AHORA,
                INICIO_DECLARADO, INICIO_DECLARADO.plusSeconds(9 * 3600));
    }

    private static final Instant INICIO_DECLARADO = Instant.parse("2026-08-09T14:00:00Z");

    private void sectorEsta(EstadoServicio estado) {
        given(sectores.buscarPorId(MANGA)).willReturn(Optional.of(new Sector(MANGA, "Manga", 1000, estado)));
    }

    @Test
    void aprobarDebeAplicarElEstadoAlSectorYAnexarloALaBitacora() {
        sectorEsta(EstadoServicio.CON_SERVICIO);

        PropuestaIngesta resultado = servicio.aprobar(ID);

        assertThat(resultado.estadoRevision()).isEqualTo(EstadoRevision.APROBADA);
        verify(sectores).guardar(new Sector(MANGA, "Manga", 1000, EstadoServicio.SIN_SERVICIO));

        ArgumentCaptor<EventoBitacora> captor = ArgumentCaptor.forClass(EventoBitacora.class);
        verify(registrarEvento).registrar(captor.capture());
        assertThat(captor.getValue().tipo()).isEqualTo(TipoEvento.CORTE_DETECTADO_POR_INGESTA);
        assertThat(captor.getValue().sectorId()).isEqualTo(MANGA);
        // La bitácora fecha el hecho cuando el boletín dice que ocurre, no cuando corrió el colector:
        // sin eso, recuperar el histórico sella cientos de eventos con la hora de la recuperación.
        assertThat(captor.getValue().timestamp()).isEqualTo(INICIO_DECLARADO);
        // Redactado para un vecino: nombre del barrio, no su identificador, y sin el nombre del enum.
        assertThat(captor.getValue().descripcion())
                .isEqualTo("Suspensión del servicio en Manga, según Acuacar");
        assertThat(captor.getValue().estado()).isEqualTo(EstadoServicio.SIN_SERVICIO);
        assertThat(captor.getValue().urlOriginal()).isEqualTo("https://acuacar.com/x");
    }

    /**
     * Un boletín que no dice cuándo ocurre el corte no puede afirmar que el barrio está sin agua
     * hoy. Al recuperar el histórico, boletines de meses atrás sin ventana dejaron 128 barrios
     * pintados como sin servicio por cortes ya terminados.
     */
    @Test
    void noDebeFijarElEstadoActualSiElBoletinNoDeclaraCuandoOcurreElCorte() {
        sectorEsta(EstadoServicio.CON_SERVICIO);
        given(propuestas.buscarPorId(ID)).willReturn(Optional.of(
                new PropuestaIngesta(ID, MANGA, EstadoServicio.SIN_SERVICIO, "acuacar",
                        "https://acuacar.com/x", "cita", 0.6, AHORA)));

        PropuestaIngesta resultado = servicio.aprobar(ID);

        assertThat(resultado.estadoRevision()).isEqualTo(EstadoRevision.APROBADA);
        verify(sectores, never()).guardar(any());
        verify(registrarEvento, never()).registrar(any());
    }

    /**
     * Sin corte no hay estadísticas: `sectoresMasAfectados` y `cortesPorDiaDeSemana` agregan sobre
     * la colección de cortes, y la ingesta nunca la alimentaba.
     */
    @Test
    void debeRegistrarElCorteDelBoletinCuandoDeclaraVentana() {
        sectorEsta(EstadoServicio.CON_SERVICIO);

        servicio.aprobar(ID);

        ArgumentCaptor<CorteAgua> captor = ArgumentCaptor.forClass(CorteAgua.class);
        verify(cortes).guardar(captor.capture());
        CorteAgua corte = captor.getValue();
        assertThat(corte.sectoresAfectados()).containsExactly(MANGA);
        assertThat(corte.ventana().inicio()).isEqualTo(INICIO_DECLARADO);
        assertThat(corte.origen()).isEqualTo(OrigenCorte.INGESTA_IA);
        // La hora real de restablecimiento NO se inventa con la prometida: eso daría un Índice de
        // Cumplimiento del 100% permanente, que es la afirmación que el proyecto existe para medir.
        assertThat(corte.ventana().finReal()).isNull();
        assertThat(corte.estado()).isEqualTo(EstadoCorte.ANUNCIADO);
    }

    /** Sin ventana declarada no hay corte que registrar: no se sabe cuándo empieza ni cuánto dura. */
    @Test
    void noDebeRegistrarCorteSiElBoletinNoDeclaraVentana() {
        sectorEsta(EstadoServicio.SIN_SERVICIO);
        given(propuestas.buscarPorId(ID)).willReturn(Optional.of(
                new PropuestaIngesta(ID, MANGA, EstadoServicio.CON_SERVICIO, "acuacar",
                        "https://acuacar.com/x", "cita", 0.6, AHORA)));

        servicio.aprobar(ID);

        verify(cortes, never()).guardar(any());
    }

    /** Restablecer sí falla hacia el lado seguro: afirmar que hay agua no inventa una emergencia. */
    @Test
    void debeFijarConServicioAunSinVentanaDeclarada() {
        sectorEsta(EstadoServicio.SIN_SERVICIO);
        given(propuestas.buscarPorId(ID)).willReturn(Optional.of(
                new PropuestaIngesta(ID, MANGA, EstadoServicio.CON_SERVICIO, "acuacar",
                        "https://acuacar.com/x", "cita", 0.6, AHORA)));

        servicio.aprobar(ID);

        verify(sectores).guardar(new Sector(MANGA, "Manga", 1000, EstadoServicio.CON_SERVICIO));
    }

    @Test
    void aprobarUnaPropuestaCuyoEstadoYaRigeNoDebeDuplicarElEventoDeBitacora() {
        sectorEsta(EstadoServicio.SIN_SERVICIO);

        PropuestaIngesta resultado = servicio.aprobar(ID);

        assertThat(resultado.estadoRevision()).isEqualTo(EstadoRevision.APROBADA);
        verify(sectores, never()).guardar(any());
        verify(registrarEvento, never()).registrar(any());
    }

    @Test
    void descartarNoDebeTocarElSectorNiLaBitacora() {
        PropuestaIngesta resultado = servicio.descartar(ID);

        assertThat(resultado.estadoRevision()).isEqualTo(EstadoRevision.DESCARTADA);
        verify(sectores, never()).guardar(any());
        verify(registrarEvento, never()).registrar(any());
    }

    @Test
    void debeRechazarRevisarUnaPropuestaQueNoExiste() {
        given(propuestas.buscarPorId(any())).willReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.aprobar(new PropuestaId("no-existe")))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> servicio.descartar(new PropuestaId("no-existe")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    /** 409 y no 500: la petición está bien formada, es el estado del sistema lo que la impide. */
    @Test
    void aprobarDebeFallarConConflictoSiElSectorYaNoExiste() {
        given(sectores.buscarPorId(MANGA)).willReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.aprobar(ID)).isInstanceOf(IllegalStateException.class);
        verify(propuestas, never()).guardar(any());
    }
}
