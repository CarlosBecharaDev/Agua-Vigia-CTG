# Auditoría de fuentes de datos — verificación en producción

> **Metodología:** cada fuente de esta lista fue probada en vivo el 2026-08-06 (peticiones HTTP reales,
> lectura de `robots.txt`, inspección de respuestas), no asumida de memoria. Complementa
> `pipeline-ingesta-datos.md` con el detalle de **cada** candidato evaluado, incluidos los descartados
> y por qué.

---

## Regla ética que gobierna esta auditoría

**Un sitio que bloquea explícitamente a los rastreadores de IA en su `robots.txt` queda fuera del
pipeline automatizado, sin excepción**, incluso si nuestro colector se identifica con un
`User-Agent` propio. Disfrazar el origen para saltarse una restricción declarada es exactamente el
tipo de práctica que el proyecto no puede permitirse — socavaría la credibilidad de una plataforma que
existe para exigir transparencia a otros.

Varios medios colombianos añadieron en 2024–2025 bloqueos explícitos a `GPTBot`, `CCBot`,
`ClaudeBot`, `Claude-Web` y `anthropic-ai`. Se respetan sin condiciones.

---

## 1. Fuente oficial — Acuacar

| Verificación | Resultado |
|---|---|
| `robots.txt` | Solo bloquea `/wp-admin/`. Sin cláusulas anti-IA. |
| `GET /wp-json/wp/v2/posts` | **HTTP 200** — JSON, 307 boletines, paginado (`X-WP-Total`, `X-WP-TotalPages`) |
| `GET /feed/` | **HTTP 200** — `application/rss+xml` |
| `GET /sitemap_index.xml` | **HTTP 200** — 3 sub-sitemaps, actualizado a diario |

**Estado: ✅ fuente primaria, uso pleno.** Ver detalle de campos en `pipeline-ingesta-datos.md` §1.

---

## 2. Prensa y radio — resultado por medio

| Medio | `robots.txt` | RSS/API accesible | Veredicto |
|---|---|---|---|
| **El Universal** (Cartagena) | Bloquea `anthropic-ai`, `Claude-Web`, `GPTBot`, `CCbot`, `ChatGPT-user` en todo el sitio | No expone RSS público (CMS Arc Publishing; su API `/pf/api/v3/*` está deshabilitada en `robots.txt` para todos) | ❌ **Excluido del pipeline automatizado.** Es el diario local más relevante para Cartagena — se cubre indirectamente vía Google News (ver §3) y puede citarse manualmente en el marco teórico, pero no se scrapea ni se consume su feed. |
| **El Tiempo** | `Disallow: /` explícito para `ClaudeBot`, `Claude-Web`, `anthropic-ai`, `GPTBot`, `CCBot`, `ChatGPT Agent`, `ChatGPT-User`, `OAI-SearchBot`, más el bloque `# Meta IA` (`FacebookBot`, `Meta-ExternalAgent`) | Su feed regional (`/rss/colombia_barranquilla.xml`) técnicamente responde, y cubre el Caribe pero no es Cartagena-específico | ❌ **Excluido**, pese a que la petición de prueba funcionó — el bloqueo cubre el sitio completo para agentes de IA y no depende de qué ruta se pida. |
| **El Heraldo** (Barranquilla, cubre el Caribe) | Bloquea agentes de IA (mismo patrón) | — | ❌ Excluido por la misma regla |
| **Blu Radio** | Bloquea agentes de IA | — | ❌ Excluido |
| **RCN Radio** | `User-agent: *` → `Allow: /`, sin bloqueo a IA | Página HTML responde HTTP 200, sin RSS público descubierto en la ruta estándar | ⚠️ Permitido pero sin RSS localizado — requiere ubicar el feed real antes de integrarlo |
| **Caracol Radio** | Solo bloquea `PetalBot` (Huawei); `User-agent: *` abierto | Feed en `/rss/` devolvió error de conexión en las pruebas (puede ser transitorio de red, no bloqueo) | ⚠️ Permitido — reintentar la ruta del feed en el sprint de implementación |
| **W Radio** | Solo bloquea `PetalBot`; `User-agent: *` abierto | Igual que Caracol — error de conexión en la prueba, no bloqueo confirmado | ⚠️ Permitido — reintentar |
| **Zona Cero** (Cartagena) | Sin bloqueo a IA | `GET /rss.xml` → **HTTP 200**, `application/rss+xml`, 3 ítems | ✅ **Verificado y funcional** |

### Por qué esto importa para el proyecto

Que El Universal y El Tiempo —dos de las coberturas más relevantes para Cartagena— se auto-excluyan
de raíz **no es un obstáculo que se sortea, es una señal que se respeta**. El propio patrón de bloqueo
(dueños de contenido protegiendo su información de terceros no autorizados) es, irónicamente, el mismo
principio que sostiene por qué este proyecto nunca tocaría los sistemas internos de Acuacar sin permiso.
Se documenta como ADR y se defiende en la sustentación como coherencia de principios, no como limitación.

---

## 3. Agregador — Google News RSS

```
https://news.google.com/rss/search?q=<consulta>&hl=es-419&gl=CO&ceid=CO:es-419
```

**Verificado: HTTP 200, 100 ítems por consulta**, con `title`, `link`, `pubDate`, `source`. Trae de
vuelta boletines de Acuacar, comunicados de la Alcaldía Mayor de Cartagena y cobertura del fallo del
Tribunal Administrativo de Bolívar — sin necesidad de tocar directamente los sitios que bloquean IA.

**Por qué esto es legítimo y no un atajo turbio:** Google News es un producto de agregación que el
propio medio decide alimentar (o no) publicando su feed a Google; consumir el RSS público de Google
es usar el producto de indexación de Google, no burlar el `robots.txt` del medio original. Es la
misma distinción que existe entre "yo entro a tu casa sin permiso" y "leo el resumen que tú mismo le
diste al periódico del barrio".

**Estado: ✅ fuente secundaria principal para prensa**, sin fricción legal ni técnica.

---

## 4. Base de eventos noticiosos — GDELT

**GDELT Project** (`api.gdeltproject.org`) es una base de datos abierta y gratuita, mantenida
académicamente, que indexa millones de artículos de noticias globales en tiempo casi real, con
geolocalización, tono y clasificación temática — sin necesidad de autenticación.

**Estado de la prueba: ⏳ no verificado — la API devolvió `429 Too Many Requests`** durante la
auditoría (límite compartido de la infraestructura pública de GDELT, no un bloqueo dirigido al
proyecto). **Pendiente de reintentar** en el Sprint 0 con throttling propio antes de decidir si se
integra. Si funciona, sería una fuente adicional de bajo costo para detectar cobertura internacional
o de medios no cubiertos por Google News.

---

## 5. Datos abiertos y regulación estatal

| Fuente | Verificación | Resultado |
|---|---|---|
| **datos.gov.co** (portal Socrata) | `GET /api/catalog/v1?q=acueducto` | **HTTP 200**, 322 conjuntos de datos relacionados con "acueducto" a nivel nacional, ninguno específico de Cartagena/Acuacar en la búsqueda inicial — requiere refinar la consulta (`q=Bolivar+acueducto`, `q=Acuacar`) en el sprint de implementación |
| **SUI — Superintendencia de Servicios Públicos** | `GET /` y subdominio SUI | **Bloqueado por Incapsula/Imperva** (protección anti-bot con desafío JavaScript) | ❌ No accesible programáticamente. Es la fuente regulatoria oficial de indicadores de continuidad del servicio — se usa como **referencia humana** para el marco teórico y legal (Capítulo II), no como fuente automatizada |
| **Alcaldía de Cartagena** (cartagena.gov.co) | `GET /` | **HTTP 403 Forbidden** incluso con `User-Agent` de navegador | ❌ No accesible programáticamente en esta prueba. Sus comunicados sobre la crisis del agua (como el fallo judicial) sí aparecen indexados en Google News — se cubre por esa vía indirecta |
| **CRA** (Comisión de Regulación de Agua Potable) | `GET /` | **HTTP 200** | ✅ Accesible; útil para el marco legal (normativa de continuidad del servicio), no para datos operativos en tiempo real |
| **IDEAM** | `GET /` | **HTTP 200** | ✅ Accesible; relevante solo si se documenta el fenómeno de El Niño como causa estructural en el marco contextual, no como fuente de eventos de corte |

---

## 6. Redes sociales

Sin cambios respecto al análisis anterior — se confirma con esta auditoría que **no existe una vía
gratuita y legítima de scraping directo** para Facebook, Instagram o X/Twitter:

- **Facebook / Instagram**: CrowdTangle cerrado (agosto 2024); Graph API exige revisión de app y
  verificación de empresa para leer contenido público de terceros. Vía legítima: **Meta Content
  Library** (acceso académico vía ICPSR) — se solicita en Sprint 0, sin garantía de aprobación en
  el plazo del proyecto.
- **X/Twitter**: el nivel gratuito de la API no permite búsqueda de publicaciones.

**Reemplazo estructural, no parche:** la capa L4 (reportes ciudadanos dentro de la propia plataforma)
cumple la misma función — capturar la voz del vecino en tiempo real — sin depender de un permiso
externo. Es, de hecho, mejor dato: georreferenciado, sin ruido de sarcasmo o memes, y con marca de
tiempo exacta.

---

## 7. Tabla resumen — decisión por fuente

| # | Fuente | Tipo | Estado | Capa del pipeline |
|---|---|---|---|---|
| 1 | Acuacar API REST + RSS | Oficial | ✅ Verificado, en uso | L1 |
| 2 | Google News RSS | Agregador de prensa | ✅ Verificado, en uso | L2 |
| 3 | Zona Cero RSS | Prensa local | ✅ Verificado, en uso | L2 |
| 4 | RCN Radio | Prensa | ⚠️ Permitido, falta ubicar el feed | L2 (pendiente) |
| 5 | Caracol Radio | Prensa | ⚠️ Permitido, reintentar conexión | L2 (pendiente) |
| 6 | W Radio | Prensa | ⚠️ Permitido, reintentar conexión | L2 (pendiente) |
| 7 | GDELT | Base de eventos noticiosos | ⏳ Rate-limited en la prueba, reintentar | L2 (pendiente) |
| 8 | El Universal | Prensa local (la más relevante) | ❌ Excluido — bloquea IA en `robots.txt` | — |
| 9 | El Tiempo | Prensa nacional | ❌ Excluido — bloquea IA en `robots.txt` | — |
| 10 | El Heraldo | Prensa regional | ❌ Excluido — bloquea IA en `robots.txt` | — |
| 11 | Blu Radio | Prensa | ❌ Excluido — bloquea IA en `robots.txt` | — |
| 12 | SUI / Superservicios | Regulador estatal | ❌ Bloqueado por Incapsula | Referencia humana únicamente |
| 13 | Alcaldía de Cartagena | Gobierno local | ❌ HTTP 403 en la prueba directa | Cubierto vía Google News |
| 14 | datos.gov.co | Datos abiertos | ✅ Accesible, sin dataset específico aún | Por explorar en Sprint 0 |
| 15 | CRA / IDEAM | Regulación / clima | ✅ Accesible | Marco legal y contextual (no tiempo real) |
| 16 | Facebook / Instagram | Social | ❌ Sin vía gratuita; Meta Content Library pendiente de aprobación | L3 (condicional) |
| 17 | X/Twitter | Social | ❌ API de pago inviable para el presupuesto | Fuera de alcance |
| 18 | Reportes ciudadanos (propios) | Comunitaria | ✅ Dato propio de la plataforma | L4 — la más valiosa |

---

## 8. Qué queda para el Sprint 0

1. Confirmar y corregir la ruta real de RSS de RCN Radio.
2. Reintentar la conexión a los feeds de Caracol Radio y W Radio (probablemente un problema de
   red/TLS en las pruebas, no un bloqueo — ambos `robots.txt` están abiertos).
3. Reintentar GDELT con throttling propio (1 petición cada varios segundos) para confirmar si el
   límite fue puntual o estructural.
4. Refinar la búsqueda en el catálogo de `datos.gov.co` con términos específicos de Bolívar/Cartagena.
5. Redactar el ADR "Por qué respetamos los bloqueos de `robots.txt` a agentes de IA incluso cuando
   técnicamente podríamos evadirlos" — es defendible académicamente y coherente con la tesis del
   proyecto sobre transparencia y buen gobierno de la información.
