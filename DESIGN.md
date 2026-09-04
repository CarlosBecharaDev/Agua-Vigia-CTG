# DESIGN.md — Sistema de diseño de AguaVigía CTG

> Guía de diseño de producto e interfaz. El agente lee este archivo antes de generar cualquier
> pantalla, componente o pieza visual. Si una propuesta contradice algo de aquí, gana este archivo.

---

## 1. Principio rector

**La gente entra a esta plataforma preocupada.** No hay agua en su casa, tiene que decidir si compra
botellones, si manda a los niños a la escuela, si abre el negocio. Entra desde el celular, con datos
móviles, probablemente de pie.

Todo el diseño responde a eso:

> **Una persona debe poder responder "¿tengo agua o no, y hasta cuándo?" en menos de 5 segundos,
> sin leer, sin registrarse y sin hacer scroll.**

Cualquier elemento que compita con esa respuesta sobra. Cualquier elemento que la acelere gana.

---

## 2. Los cuatro estados — el núcleo del lenguaje visual

Todo el producto gira alrededor de cuatro estados. Son la única jerarquía cromática que importa.

| Estado | Claro | Oscuro | Uso | Nunca |
|---|---|---|---|---|
| **Con servicio** | `#1c7f55` | `#4fbf89` | Sector operando normal | No usar verde para "éxito" genérico de la interfaz |
| **Sin servicio** | `#ae3428` | `#e2695b` | Corte confirmado | No usar rojo para errores de formulario |
| **Presión baja** | `#94640c` | `#d9a63c` | Servicio degradado | No usar ámbar para advertencias de la interfaz |
| **Corte programado** | `#2a628f` | `#6ba8da` | Anunciado, aún no iniciado | No usar este gris para texto secundario genérico |

Los cuatro son más oscuros en el tema claro que la paleta viva de la que salieron (`#34c759`,
`#ff453a`, `#ff9f0a`, `#98989d`): esa versión daba entre 2.0:1 y 3.3:1 sobre superficie clara y no
pasaba el AA que exige §7. Medido y decidido en `ADR-042`.

**Una sola fuente por token.** Estos valores viven en `--color-estado-*` de `frontend/src/index.css`
y en `COLOR_POR_ESTADO` de `frontend/src/types/tipos-dominio.ts` — el CSS pinta la leyenda y el TS
pinta los polígonos del mapa. **Si divergen, el mismo estado sale de un color en el mapa y de otro
en la leyenda, y el color deja de significar algo.** Cambiarlos es cambiar los dos a la vez.

**Regla estricta:** estos cuatro colores están reservados para el estado del servicio. La interfaz
usa el acento turquesa para todo lo demás. Si un botón de "guardar" es verde, el mapa pierde su
lenguaje.

**El color nunca va solo.** Cada estado se acompaña de forma o texto — un punto con etiqueta, un
patrón, un icono. En Cartagena hay gente con daltonismo y hay pantallas quemadas por el sol; el color
solo es un refuerzo, no el mensaje.

---

## 3. Paleta base

```
Acento turquesa   #087f8c  (claro)   #54c6ca  (oscuro)
Acento vivo       #0796a5            #78d9db
Acento suave      #dcefee            #153f44
Tinta             #102f39            #eef8f7
Tinta secundaria  #526a70            #aac0c0
Tinta terciaria   #789095            #789296
Línea             #d8e5e3            #24454b
Superficie        #fbfdfc            #0c2830
Fondo             #f2f7f6            #061c23
```

Fuente única: `:root` de `frontend/src/index.css`. Esta tabla es su copia legible — si difieren,
manda el CSS y esta tabla es el defecto.

Los neutros tienen un sesgo azulado sutil, no son grises puros. Es una decisión: el gris neutro se lee
como plantilla sin criterio; un neutro con temperatura se lee como elegido.

**Ambos temas son obligatorios.** Se definen como custom properties en `:root`, se redefinen bajo
`@media (prefers-color-scheme: dark)` y de nuevo bajo `:root[data-theme="dark"]` /
`:root[data-theme="light"]` para que el interruptor del usuario gane en las dos direcciones.

---

## 4. Tipografía

| Rol | Familia | Uso |
|---|---|---|
| Display | `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif` | Titulares, cifras grandes |
| Cuerpo | `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif` | Todo el texto corrido |
| Utilidad | `ui-monospace, "SF Mono", Menlo, Monaco, Consolas, monospace` | Códigos (RF001), horas, etiquetas, datos tabulares |

**Ninguna familia se nombra si no se carga.** El proyecto no trae webfonts, así que un token que
diga `Inter` cae en silencio a la siguiente de la pila: se lee como una decisión tipográfica que en
realidad nunca ocurre. Solo pilas de sistema.

**Nada de webfonts por CDN.** La política de seguridad de contenido las bloquea y caen en silencio a
una fuente de sistema. Se usan pilas de fuentes locales.

Reglas: texto corrido a ~65 caracteres de ancho · `text-wrap: balance` en titulares ·
`font-variant-numeric: tabular-nums` en cualquier columna de cifras · mayúsculas siempre con
`letter-spacing`.

---

## 5. Cómo se escribe

El texto es material de diseño, no relleno.

- **Desde el lado del usuario, no del sistema.** El vecino gestiona *avisos de su barrio*, no
  "suscripciones a notificaciones por sector".
- **Voz activa y concreta.** Un botón dice exactamente qué pasa: `Reportar que no tengo agua`, y el
  aviso posterior dice `Reporte enviado`.
- **Los errores explican qué pasó y cómo salir.** Nada de "Ha ocurrido un error". Mejor:
  `No pudimos enviar tu reporte. Revisa tu conexión e inténtalo otra vez.`
- **Sin disculpas ni floritura.** Específico le gana a ingenioso.
- **Español de Colombia, tuteo.** Cercano sin ser informal. Nunca "usted" — distancia innecesaria.
- **Cifras con contexto.** No `4.5h`, sino `4 horas y media sin agua`.

---

## 6. Componentes clave y su comportamiento

### Mapa (M1) — la pantalla principal
Ocupa la vista completa al entrar. Sin carrusel, sin banner de bienvenida, sin modal de cookies
tapando la respuesta. Los sectores se colorean por estado. Un toque abre el detalle.

### Reporte ciudadano (M2)
Máximo **dos toques** desde el mapa hasta el reporte enviado. Sin registro, sin captcha visible, sin
campos opcionales. El sector se infiere de la ubicación o del sector que el usuario tenía abierto.

### Índice de Cumplimiento (M6) — el diferencial
Es la pieza que define el proyecto: compara lo prometido con lo cumplido. Se presenta como
**comparación, no como puntaje aislado** — la barra de "prometido" y la de "real" una al lado de la
otra. Un `87%` sin referencia no comunica nada; `Prometieron 2 horas · Fueron 8` sí.

### Estados de carga y vacío
- **Nunca un spinner solo.** Esqueleto con la forma del contenido que viene.
- **El vacío explica.** `Todavía nadie ha reportado en este sector` + acción para ser el primero.
- **Frescura siempre visible.** Cada sector muestra `actualizado hace X`. Si una fuente lleva horas
  muda, se marca como degradada. Un mapa congelado mostrando datos viejos como actuales es peor que
  un mapa que admite que no sabe.

---

## 7. Accesibilidad — mínimos exigidos

No es una fase final; es criterio de aceptación de cada historia.

- Contraste **AA mínimo** (4.5:1 en texto normal) en **ambos** temas.
- Todo operable por teclado, con foco visible (`:focus-visible` con contorno de 2px).
- Objetivos táctiles de **44×44 px como mínimo** — se usa con una mano, caminando.
- `prefers-reduced-motion` respetado en toda animación.
- El mapa necesita **alternativa no visual**: una lista de sectores con su estado en texto. Un mapa
  sin lista es inaccesible para lector de pantalla.
- Etiquetas reales en formularios, no solo `placeholder`.

---

## 8. Rendimiento — restricciones del contexto real

El usuario está en datos móviles, posiblemente en un barrio con mala señal, en un celular de gama
media con 3 años de uso.

- El mapa carga **primero el estado**, después la geometría detallada.
- Imágenes con `max-width: 100%`; nada de fondos decorativos pesados.
- Contenido ancho (tablas, diagramas) hace scroll **dentro de su propio contenedor**; el cuerpo de la
  página **nunca** hace scroll horizontal.
- Objetivo: primera respuesta útil en menos de 3 segundos en 3G.

---

## 9. Lo que este producto no es

Restricciones deliberadas, para que el agente no las proponga:

- **No es un dashboard corporativo.** Nada de KPIs decorativos ni medidores tipo velocímetro.
- **No es una red social.** No hay perfiles, ni likes, ni comentarios, ni gamificación. Reportar no
  da puntos.
- **No es una app de emergencias.** No compite con la línea de atención de Acuacar ni la sustituye.
- **No usa estética de IA genérica.** Nada de gradiente morado sobre blanco, ni Inter/Space Grotesk
  como opción "segura", ni emoji como marcadores de sección, ni tarjetas redondeadas con barrita de
  color al costado. Si una propuesta se parece a cualquier landing generada por IA, se rehace.

---

## 10. Checklist antes de dar por terminada una pantalla

- [ ] ¿Se responde "¿tengo agua?" en menos de 5 segundos?
- [ ] ¿Funciona en 360px de ancho?
- [ ] ¿Los dos temas están diseñados, no solo invertidos?
- [ ] ¿El color va acompañado de forma o texto?
- [ ] ¿Contraste AA verificado en ambos temas?
- [ ] ¿Navegable solo con teclado, con foco visible?
- [ ] ¿Hay estado de carga, de vacío y de error diseñados?
- [ ] ¿Los textos están escritos desde el lado del usuario?
- [ ] ¿Se ve la frescura del dato?
