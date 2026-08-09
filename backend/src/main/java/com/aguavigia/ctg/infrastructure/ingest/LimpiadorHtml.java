package com.aguavigia.ctg.infrastructure.ingest;

import org.springframework.web.util.HtmlUtils;

/** Boletines y notas de prensa llegan como HTML renderizado; DocumentoCrudo quiere texto plano. */
final class LimpiadorHtml {

    private LimpiadorHtml() {
    }

    static String limpiar(String html) {
        if (html == null) {
            return "";
        }
        String sinEtiquetas = html.replaceAll("<[^>]+>", " ");
        return HtmlUtils.htmlUnescape(sinEtiquetas).replaceAll("\\s+", " ").trim();
    }
}
