## 1. Trazabilidad antes de editar

- [x] 1.1 Registrar el conteo falso durante indisponibilidad y la carga ineficaz de `.env.local` como bugs separados, con reproducción y pruebas de regresión definidas en `docs/gestion/registro-de-bugs.md`.
- [x] 1.2 Registrar en `docs/design-decisions.md` el ADR que elige mapa primero, composición cívica con tokens existentes y degradación explícita frente a conservar la portada/efectos actuales; verificar numeración y formato.

## 2. Datos fiables y conexión local

- [ ] 2.1 Escribir pruebas de `PaginaMapa` para consulta inicial fallida, reintento y datos previos con SSE interrumpido; verificar que nunca aparecen cuatro contadores cero como sustituto del error.
- [ ] 2.2 Conectar `estado`, `error` y `recargar` de `useDatosEnVivo` a la primera vista y verificar mediante las pruebas que carga, vacío, error y stale tienen texto y acción propios.
- [ ] 2.3 Detectar `tileerror`/recuperación de la capa base sin desmontar la geometría local y verificar el escenario con una prueba del mapa más una captura con las teselas bloqueadas.
- [ ] 2.4 Cargar la configuración del proxy con `loadEnv`, documentar los valores para Maven (`8080`) y Docker (`8081`), y verificar que una variable en `.env.local` cambia el target mostrado por Vite sin exponerla al bundle.

## 3. Primera vista y navegación

- [ ] 3.1 Retirar la pantalla de entrada y la portada móvil bloqueante; verificar en una captura de 390×844 que mapa, búsqueda o estado de indisponibilidad aparecen sin hacer scroll.
- [ ] 3.2 Simplificar navegación superior/inferior y controles del mapa, conservando rutas, anclas, teclado y objetivos de 44×44 px; verificar pruebas de navegación y foco.
- [ ] 3.3 Rehacer el panel de consulta por barrio y las tarjetas de estado con superficies sólidas, jerarquía legible y los colores reservados; verificar selección, filtro y detalle de sector en pruebas existentes.
- [ ] 3.4 Ajustar la composición de escritorio para que mapa y contexto quepan en el primer viewport a 1280×720; verificar que no hay scroll horizontal ni contenido oculto.

## 4. Lenguaje visual compartido

- [ ] 4.1 Consolidar los estilos de la página principal en los tokens canónicos y retirar nebulosas, neón, partículas, glassmorphism y reglas muertas; verificar que no se agrega un bloque de overrides duplicado al final de `index.css`.
- [ ] 4.2 Rediseñar bitácora y estadísticas como evidencia editorial, no como tablero decorativo; verificar estados vacío/error, cifras tabulares, CSV y responsividad con sus pruebas.
- [ ] 4.3 Rediseñar llamado del veedor, sección del proyecto y pie de página con la misma composición sobria; verificar anclas y llamadas a reporte/suscripción/panel.
- [ ] 4.4 Sustituir todos los emojis visibles por iconos Lucide o texto y verificar con `rg --pcre2` que no queda ningún emoji en `frontend/src`.

## 5. Formularios y área protegida

- [ ] 5.1 Aplicar el sistema visual a reporte, suscripción y sus modales sin cambiar el flujo de dos toques, geolocalización, foto ni contratos; verificar las pruebas de ambos formularios.
- [ ] 5.2 Aplicar el sistema visual al ingreso, registro, recuperación, TOTP y gestión de cuentas sin cambiar almacenamiento de sesión ni permisos; verificar todas las pruebas de cuentas y panel.
- [ ] 5.3 Retirar colores morados y estilos en línea de los componentes intervenidos, manteniendo contraste AA en claro/oscuro; verificar con axe y capturas de las rutas `/`, `/reportar`, `/veedor` y `/cuentas/registro`.

## 6. Seguridad, API, Docker y datos

- [ ] 6.1 Ejecutar `npm audit` después de los cambios y verificar cero vulnerabilidades altas o críticas; cualquier excepción debe quedar documentada con dependencia, CVE y mitigación.
- [ ] 6.2 Revisar CSP y cabeceras de Nginx contra los orígenes reales de API, SSE, OpenStreetMap/Esri y portadas; entregar a D5 un hallazgo reproducible si hace falta modificar infraestructura, sin editar su capa desde D4.
- [ ] 6.3 Con el motor disponible, ejecutar `docker compose up -d --build --wait`, consultar health/API/SSE y revisar logs de backend, MongoDB y Redis; registrar cualquier defecto con su titular sin cambiar capas ajenas.
- [ ] 6.4 Verificar que los índices Mongo declarados pasan `IndicesMongoTest` y que el contrato vivo coincide con `backend/openapi.yaml`; entregar divergencias a D3 con endpoint, respuesta y prueba exactos.

## 7. Cierre verificable

- [ ] 7.1 Ejecutar `npm run lint`, `npm test -- --run`, `npm run build` y `npm run api:check`; resolver toda regresión del frontend.
- [ ] 7.2 Ejecutar Playwright en 360 px, móvil y escritorio, comprobar ambos temas y guardar capturas comparables de las rutas principales sin añadirlas al repositorio.
- [ ] 7.3 Ejecutar `openspec validate refinar-experiencia-civica-frontend --strict`, revisar `git diff --check` y confirmar que no hay commits ni push.
- [ ] 7.4 Registrar la sesión en `docs/gestion/bitacora-sesiones.md` con referencias a ADR/bugs y dejar el siguiente paso concreto para revisión local del equipo.
