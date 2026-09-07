## Context

Véase `proposal.md` para la motivación. La SPA ya contiene todas las rutas y operaciones; el trabajo se concentra en su jerarquía visual y en la representación fiable de estados degradados. `frontend/src/index.css` acumula 7.372 líneas de varias etapas de rediseño, hay 145 estilos en línea y 358 referencias a gradientes, neón, glass, morado o efectos afines. La captura real muestra el mapa detrás de una portada en móvil, formularios morados ajenos a los tokens oficiales y contadores iguales a cero mientras las llamadas `/api/*` responden 502.

La implementación debe conservar React 19, TanStack Query, Leaflet, las rutas actuales, los DTO generados y los cuatro colores de estado definidos en `DESIGN.md`. El trabajo de D4 puede modificar `frontend/`; cualquier cambio de MongoDB, Redis, Spring Security o Docker requiere entrega al titular D3/D5.

## Goals / Non-Goals

**Goals:**

- Convertir la primera vista en una herramienta de consulta, no en una portada promocional.
- Construir una identidad visual propia con tipografía de sistema, superficies serenas, bordes precisos y jerarquía editorial.
- Hacer que todos los estados de red, carga, vacío y error sean verdaderos y accionables.
- Reducir CSS contradictorio y estilos en línea en los componentes intervenidos.
- Mantener equivalencia funcional en ambos temas y desde 360 px hasta escritorio.

**Non-Goals:**

- Cambiar reglas de negocio, contratos OpenAPI, documentos MongoDB o controles de autorización.
- Añadir bibliotecas visuales, fuentes web, imágenes decorativas o nuevos servicios externos.
- Convertir la página en un dashboard corporativo o una landing de mercadeo.
- Resolver desde D4 la indisponibilidad actual del motor Docker.

## Decisions

### El mapa vuelve a ser la primera pantalla

Se retirarán `SplashScreen` y la portada móvil que obliga a desplazarse antes de ver el mapa. `PanelProyecto` se reducirá a contexto y acciones dentro del mismo primer viewport; búsqueda, estado de conexión y acceso a reporte tendrán prioridad.

Se descartó conservar la portada y solo reducir su altura: seguiría interponiendo la marca entre la persona preocupada y la respuesta. También se descartó un hero ilustrado porque añade peso y no informa sobre el servicio.

### Una composición cívica, no futurista

La base serán los tokens canónicos de `DESIGN.md`: fondo azul verdoso muy claro, superficies sólidas, acento turquesa y tinta oscura; el tema oscuro usará las parejas ya definidas. Se eliminarán los gradientes morados, nebulosas, orbes, neón, partículas y efecto líquido. La profundidad se expresará con borde, separación, escala tipográfica y una sombra tenue.

Se descartó crear una nueva paleta “premium” porque ADR-041 archivó ese camino y porque duplicaría la fuente de verdad. Se conservarán animaciones breves solo donde indiquen cambio de estado y siempre bajo `prefers-reduced-motion`.

### Los colores del servicio no decoran la interfaz

Rojo, ámbar, azul programado y verde se usarán únicamente junto a información de estado. Botones, validaciones genéricas, métricas y llamadas a la acción usarán acento turquesa o tinta. Los emojis se sustituirán por iconos Lucide con texto accesible.

### La ausencia de respuesta es un estado propio

`PaginaMapa` consumirá `estado`, `error` y `recargar` que `useDatosEnVivo` ya expone. Los contadores solo se renderizarán con una respuesta válida. Una consulta inicial fallida mostrará una franja de indisponibilidad y un botón de reintento; un fallo posterior conservará los datos y mostrará su frescura. Leaflet escuchará `tileerror`/`load` para separar la caída del mapa base de la disponibilidad de la geometría local.

Se descartó convertir el error en ceros o usar datos de muestra: ambas alternativas contradicen la regla de credibilidad del proyecto.

### La configuración de desarrollo carga `.env` de forma explícita

`vite.config.ts` usará `defineConfig(({ mode }) => ...)` y `loadEnv(mode, process.cwd(), '')` para resolver `VITE_BACKEND_PROXY_TARGET`. La configuración actual lee `process.env`, pero Vite carga `.env*` después de resolver el archivo de configuración; por eso la instrucción de `INTEGRACION-BACKEND.md` para usar `.env.local` no cambia realmente el proxy. El valor por defecto y la documentación distinguirán backend Maven (`8080`) de backend Docker (`8081`) sin exponer secretos al cliente.

Se descartó detectar puertos automáticamente en cada petición porque complica el proxy y oculta una configuración incorrecta. La dirección se resuelve una vez al arrancar Vite y se imprime en su diagnóstico.

### La limpieza se hace sobre componentes existentes

Se mantendrán las fronteras y props de las pantallas para no mezclar rediseño con reglas de negocio. Los estilos de mapa/página se consolidarán; las hojas específicas de reporte, suscripción, cuentas, estadísticas y veedor se ajustarán a los mismos tokens. Se eliminará CSS muerto comprobando uso de clases y capturas antes/después, no mediante un override nuevo al final del archivo.

## Risks / Trade-offs

- **[Una limpieza amplia de CSS cambia pantallas secundarias sin intención]** → capturas y pruebas por ruta en ambos temas; cambios por bloque con `git diff` revisable.
- **[Sin teselas externas la captura visual puede parecer incompleta]** → validar por separado geometría local, lista textual y aviso de mapa base.
- **[El mapa primero deja menos espacio para explicar el proyecto]** → mover la explicación extensa bajo el pliegue y conservar una frase breve junto a las acciones.
- **[El backend seguirá inaccesible si Docker no arranca]** → mostrar diagnóstico honesto y documentar el comando de verificación; no fingir datos locales.
- **[Una CSP estricta puede bloquear Leaflet, SSE o portadas]** → D5 deberá probar la allowlist sobre Nginx con todos los orígenes reales antes de activarla.

## Migration Plan

1. Corregir y probar estados de datos antes del rediseño para que las capturas no oculten errores funcionales.
2. Simplificar primera vista y navegación conservando selectores y contratos de componentes.
3. Aplicar el sistema visual a pantallas secundarias y retirar estilos muertos.
4. Ejecutar lint, pruebas unitarias, build, sincronización OpenAPI, Playwright y axe.
5. Levantar el stack Docker completo cuando el motor esté disponible y verificar API, SSE, MongoDB, Redis y cabeceras.
6. Si una pantalla pierde funcionalidad, revertir el bloque afectado; no hay migración de datos ni cambio de contrato.
