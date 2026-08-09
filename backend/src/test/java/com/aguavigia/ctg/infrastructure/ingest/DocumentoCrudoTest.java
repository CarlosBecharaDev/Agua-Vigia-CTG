package com.aguavigia.ctg.infrastructure.ingest;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class DocumentoCrudoTest {

    @Test
    void debeGenerarElMismoHashParaElMismoContenidoAunqueCambieElEspaciado() {
        DocumentoCrudo a = DocumentoCrudo.de("acuacar", "https://x/1", Instant.now(),
                "Suspensión programada", "El servicio se restablece a las 6pm");
        DocumentoCrudo b = DocumentoCrudo.de("google-news", "https://y/2", Instant.now(),
                "Suspensión   programada", "El servicio  se restablece a las 6pm  ");

        assertThat(a.hash()).isEqualTo(b.hash());
    }

    @Test
    void debeGenerarHashesDistintosParaContenidoDistinto() {
        DocumentoCrudo a = DocumentoCrudo.de("acuacar", "https://x/1", Instant.now(),
                "Suspensión en Manga", "Texto A");
        DocumentoCrudo b = DocumentoCrudo.de("acuacar", "https://x/2", Instant.now(),
                "Suspensión en Bocagrande", "Texto B");

        assertThat(a.hash()).isNotEqualTo(b.hash());
    }

    @Test
    void debeRechazarUnDocumentoSinFuente() {
        assertThatIllegalArgumentException().isThrownBy(() ->
                new DocumentoCrudo("", "url", Instant.now(), "t", "texto", "hash"));
    }

    @Test
    void debeRechazarUnDocumentoSinTexto() {
        assertThatIllegalArgumentException().isThrownBy(() ->
                DocumentoCrudo.de("acuacar", "url", Instant.now(), "titulo", " "));
    }
}
