# MEMORY.md — Memoria persistente del proyecto

> Contexto acumulado que **no** se deduce leyendo el código ni el historial de Git. El agente lee
> este archivo al iniciar. Escribe aquí lo que costó descubrir y sería caro volver a descubrir.
>
> **Qué SÍ va aquí:** hallazgos verificados, restricciones externas, correcciones de errores de
> entendimiento, acuerdos del equipo, callejones sin salida ya explorados.
> **Qué NO va aquí:** decisiones de arquitectura (van en `docs/design-decisions.md`), estado de
> tareas (va en GitHub Projects), documentación de producto (va en `docs/`).

---

## Hallazgos verificados

### 2026-08-06 — Acuacar expone una API REST pública y estable
`acuacar.com` corre WordPress con la API REST habilitada.

- `GET /wp-json/wp/v2/posts` → **HTTP 200**, JSON, **307 boletines**, paginado vía `X-WP-Total` y
  `X-WP-TotalPages`.
- Campos útiles: `id`, `date`, `modified`, `link`, `title.rendered`, `content.rendered`,
  `excerpt.rendered`, `categories`.
- Soporta `?after=`, `?modified_after=`, `?_fields=` → solo hace falta traer lo nuevo.
- `/feed/` (RSS) y `/sitemap_index.xml` también responden 200.

**Por qué importa:** elimina la necesidad de scraping frágil de HTML. Es la fuente autoritativa del
proyecto y su formato es estable.

### 2026-08-06 — CORRECCIÓN: el `robots.txt` de Acuacar NO prohíbe el acceso automatizado
Una versión temprana del plan afirmó que sí lo prohibía y construyó sobre eso una "decisión ética de
no scrapear". **Era falso.** El archivo real solo contiene:

```
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php
Sitemap: https://www.acuacar.com/sitemap_index.xml
```

**Lección que el equipo acordó conservar:** verificar antes de afirmar. La afirmación no verificada
casi cuesta la mejor fuente de datos del proyecto. Esto va en las conclusiones del informe final.

### 2026-08-06 — Varios medios bloquean explícitamente a los rastreadores de IA
`El Universal`, `El Tiempo`, `El Heraldo` y `Blu Radio` incluyen en su `robots.txt` reglas
`Disallow: /` dirigidas por nombre a `anthropic-ai`, `Claude-Web`, `ClaudeBot`, `GPTBot` y `CCBot`.
El Tiempo además bloquea los agentes de Meta.

**Decisión del equipo: se respeta sin excepción**, aunque un colector con `User-Agent` propio no
caería bajo esos nombres. No se disfraza el origen. La cobertura de esos medios llega igualmente,
de forma indirecta, vía Google News RSS.

**Medios con `robots.txt` abierto** (solo bloquean bots agresivos tipo PetalBot): RCN Radio, Caracol
Radio, W Radio, Zona Cero.

### 2026-08-06 — Fuentes estatales no accesibles por programa
- **SUI / Superservicios**: protegido por Incapsula/Imperva con desafío JavaScript. No automatizable.
  Se usa como referencia humana para el marco legal.
- **Alcaldía de Cartagena** (`cartagena.gov.co`): devuelve **HTTP 403** incluso con `User-Agent` de
  navegador. Sus comunicados sí aparecen indexados en Google News.

### 2026-08-06 — GDELT quedó sin verificar
La API pública de GDELT devolvió `429 Too Many Requests` durante la auditoría (límite compartido de
su infraestructura, no un bloqueo dirigido). **No está descartada: está pendiente de reintentar** con
throttling propio en el Sprint 0.

---

## Restricciones externas

- **Meta (Facebook/Instagram):** CrowdTangle cerró en agosto de 2024. La Instagram Basic Display API
  se descontinuó en diciembre de 2024. Leer contenido público de páginas de terceros vía Graph API
  exige *Page Public Content Access* → revisión de app + verificación de empresa. **Inviable.**
  Vía legítima: **Meta Content Library**, acceso académico vía ICPSR, requiere afiliación
  institucional (que el equipo tiene). Se solicita en Sprint 0; puede tardar semanas y puede no
  aprobarse.
- **X/Twitter:** el nivel gratuito de la API no permite búsqueda de publicaciones. El plan pagado
  excede el presupuesto de un proyecto de aula. Fuera de alcance, documentado.

---

## Acuerdos del equipo

| Fecha | Acuerdo |
|---|---|
| 2026-08-06 | La fase de documentación va primero. No se escribe código de la aplicación hasta autorización explícita del equipo. |
| 2026-08-06 | Se respetan los bloqueos de `robots.txt` a agentes de IA aunque sean técnicamente evadibles. Es coherencia con la tesis del proyecto, no una limitación. |
| 2026-08-06 | Nada extraído por IA llega al mapa público sin que el modelo cite la frase textual del boletín que lo respalda. Verificable automáticamente. |
| 2026-08-06 | Falsos positivos son peores que falsos negativos: un corte inventado destruye la credibilidad; uno omitido lo reporta la comunidad. El umbral de confianza se calibra sesgado hacia la precisión. |
| 2026-08-07 | Toda implementación, bug y sesión de trabajo con IA se registra en `docs/gestion/`. Es parte de la definición de terminado y es el insumo del Capítulo IV. Ver `ADR-008`. |
| 2026-08-07 | Una información vive en **un solo archivo**. Los archivos permanentes tienen presupuesto: `CLAUDE.md` ≤ 200 líneas, `MEMORY.md` ≤ 150, `DESIGN.md` ≤ 200. Ver `docs/gestion/protocolo-de-contexto.md`. |
| 2026-08-07 | El Scrum Master rota cada sprint (D1→D2→D3→D4→D5). Cierra el sprint y rota los registros. |
| 2026-08-07 | Roles asignados por nombre: **D2** Carlos Bechara Arias · **D3** Sebastián Montes Olivera · **D4** José Daniel Zambrano · **D5** Yordy Pardo Pajaro. **D1 sigue sin titular.** Fuente única: `docs/equipo/roles-y-tareas.md`. |
| 2026-08-07 | La secuencia **D5 → D2 → D3 y D1 → D4 → D5 (QA)** es obligatoria y se controla con **4 compuertas verificables** (C0–C3). Un rol bloqueado se detiene, registra en `docs/gestion/registro-de-bloqueos.md` y **avisa en el chat**; nunca rodea el bloqueo inventando el insumo que falta. |
| 2026-08-07 | **El agente nunca figura como colaborador del repositorio**: sin `Co-Authored-By`, sin firmas en commits o PRs. La autoría es de las 5 personas. Forzado con `includeCoAuthoredBy: false`. Ver `CLAUDE.md` § Convenciones de Git. |

---

## Contexto del problema (fuentes citables)

- **Mayo–julio 2026:** racionamientos sectorizados en Cartagena, hasta **15%** de la población
  afectada en el pico.
- **Planta El Bosque:** abastece cerca del **90%** del agua potable de la ciudad. Proliferación de
  algas obligó a aumentar la frecuencia de lavado de filtros, reduciendo el volumen disponible.
- **Junio 2026:** el **Tribunal Administrativo de Bolívar** dictó medidas cautelares ordenando a
  Acuacar socializar previamente cada interrupción, con tiempos exactos y condiciones. Es el hecho
  que fundamenta el módulo del Índice de Cumplimiento.
- **Concesión Acuacar–Veolia** vigente hasta **2034**.

---

## Callejones sin salida ya explorados

*(No repetir estos caminos.)*

- Buscar RSS de El Universal en rutas estándar (`/rss.xml`, `/feed/`, `/seccion/local/rss.xml`) →
  404 o conexión cerrada. Usa Arc Publishing y su API `/pf/api/v3/*` está deshabilitada en
  `robots.txt`. **Además el sitio bloquea agentes de IA: no insistir.**
- **Servidor MCP de git en npm**: `@modelcontextprotocol/server-git` **no existe** (npm devuelve E404,
  verificado 2026-08-07). El oficial es de Python (`uvx mcp-server-git`). No se agrega: el historial
  ya está disponible vía `Bash(git log/diff/show)`, permitidos en `.claude/settings.json`.
- `datos.gov.co`: el endpoint `/api/views/metadata/v1` agota el tiempo de espera. **Usar en su lugar
  la API de catálogo de Socrata:** `https://api.us.socrata.com/api/catalog/v1?q=...` (responde bien).
  La búsqueda genérica por "acueducto" da 322 datasets nacionales, ninguno específico de
  Cartagena/Acuacar — falta refinar con términos de Bolívar.
