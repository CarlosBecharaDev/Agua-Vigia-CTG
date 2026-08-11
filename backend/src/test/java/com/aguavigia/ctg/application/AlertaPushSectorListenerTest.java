package com.aguavigia.ctg.application;

import com.aguavigia.ctg.domain.EstadoServicio;
import com.aguavigia.ctg.domain.Sector;
import com.aguavigia.ctg.domain.SectorId;
import com.aguavigia.ctg.domain.port.in.EnviarAlertaPushUseCase;
import com.aguavigia.ctg.domain.port.out.NotificadorPushPort;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

/**
 * M14 — el canal push todavía no envía a ningún proveedor real (RF041 sigue pendiente: exige
 * credenciales de WhatsApp Business o Telegram que no dependen del backend). Lo que sí está
 * cableado y hay que proteger es la cadena evento → caso de uso → puerto: el día que exista un
 * adaptador real, tiene que recibir el sector y el mensaje correctos.
 */
class AlertaPushSectorListenerTest {

    private static final SectorId MANGA = new SectorId("manga");

    @Test
    void debeEnviarLaAlertaAlSectorDelEvento() {
        EnviarAlertaPushUseCase enviarAlerta = mock(EnviarAlertaPushUseCase.class);
        AlertaPushSectorListener listener = new AlertaPushSectorListener(enviarAlerta);

        listener.onSectorActualizado(new SectorActualizadoEvent(
                new Sector(MANGA, "Manga", 5000, EstadoServicio.SIN_SERVICIO)));

        ArgumentCaptor<String> mensaje = ArgumentCaptor.forClass(String.class);
        verify(enviarAlerta).enviar(org.mockito.ArgumentMatchers.eq(MANGA), mensaje.capture());
        assertThat(mensaje.getValue()).contains("Manga", "SIN_SERVICIO");
    }

    @Test
    void elCasoDeUsoDebeDelegarEnElPuertoDeSalida() {
        NotificadorPushPort puerto = mock(NotificadorPushPort.class);
        EnviarAlertaPushService servicio = new EnviarAlertaPushService(puerto);

        servicio.enviar(MANGA, "Alerta de prueba");

        verify(puerto).enviarAlerta(MANGA, "Alerta de prueba");
    }
}
