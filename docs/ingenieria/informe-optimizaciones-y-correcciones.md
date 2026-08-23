# Informe de Diagnóstico, Correcciones de Entorno y Optimizaciones de Rendimiento

**Proyecto:** AguaVigía CTG — Monitoreo del Servicio de Acueducto en Cartagena de Indias  
**Fecha de Elaboración:** 2026-08-22  
**Autor:** Equipo de Ingeniería / Pair Programming Assistant  

---

## 1. Resumen Ejecutivo

Este documento detalla los hallazgos, correcciones de configuración, modernizaciones de interfaz y optimizaciones de rendimiento realizadas sobre el repositorio de AguaVigía CTG para garantizar:
1. Puesta en marcha local inmediata y libre de fricción desde GitHub.
2. Estados reales y dinámicos en el mapa en vivo y registro completo de la bitácora pública ciudadana.
3. Modernización completa del módulo "Avisos de tu barrio" (suscripciones con fondo morado en movimiento, glassmorphism y envío funcional de correos con Mailhog).
4. Optimización integral del rendimiento en dispositivos móviles y de bajo consumo (RNF001).

---

## 2. Diagnóstico de Errores Frecuentes y Correcciones Aplicadas

### 2.1. Autenticación y Variables de Entorno (`.env`)
* **Problema Encontrado:** Al clonar de GitHub, el archivo `.env` no existe (ignorado por `.gitignore`). Quien iniciaba el proyecto sufría errores `503 Service Unavailable` al acceder al módulo del Veedor por falta de `JWT_SECRET` y `VEEDOR_PASSWORD_HASH`. Además, en Docker Compose, si los signos `$` del hash BCrypt no se escapan como `$$`, Docker trunca la cadena y genera errores `401 Unauthorized` silenciosos.
* **Corrección:**
  * Se actualizó `.env.example` con credenciales de desarrollo listas para usar (`AguaVigia-Dev-2026`).
  * Se documentó el requisito del doble signo `$$`.
  * Se generó el archivo `.env` local activo y funcional.

### 2.2. CORS y Enrutamiento del Proxy en Desarrollo Local
* **Problema Encontrado:** El backend Java carecía de soporte CORS (ya que en producción todo se sirve tras Nginx bajo el mismo origen). Al trabajar en local con Vite o herramientas de API en puertos distintos (`5173`, `8080`, `8081`), las solicitudes a veces eran bloqueadas o fallaban sin indicación clara.
* **Corrección:**
  * Se implementó un bean `CorsConfigurationSource` en `backend/.../SecurityConfig.java` permitiendo `localhost:*` y `127.0.0.1:*` para todos los métodos HTTP (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`).
  * Se añadió un manejador de error en el proxy de `frontend/vite.config.ts` para reportar en consola si el backend está caído o en un puerto alternativo (`VITE_BACKEND_PROXY_TARGET`).
  * Se actualizó `frontend/.env.example`.

### 2.3. Control de Puertos y Procesos Fantasma
* **Problema Encontrado:** Al interrumpir la ejecución de Maven con `Ctrl + C`, la JVM hija de Spring Boot continuaba ejecutándose en segundo plano, bloqueando los puertos `8080` / `8081`.
* **Corrección:**
  * Se crearon los scripts `scripts/limpiar-puertos.ps1` (Windows PowerShell) y `scripts/limpiar-puertos.sh` (Linux/macOS) para liberar puertos tomados de forma automática.

### 2.4. Siembra de Base de Datos y Datos Dinámicos en Vivo
* **Problema Encontrado:** La base de datos no registraba estados dinámicos en los sectores (`estado: null`) ni eventos en la bitácora pública (`eventos_bitacora` vacía), lo que provocaba que el mapa se mostrara apagado/sin clasificar y la sección de bitácora no listara novedades.
* **Corrección:**
  * Se creó y ejecutó el script `scripts/sembrar-demo.mjs` que puebla la base de datos con:
    * 169 barrios con servicio (`CON_SERVICIO` - Verde).
    * 16 barrios con baja presión (`PRESION_BAJA` - Amarillo).
    * 15 barrios sin servicio (`SIN_SERVICIO` - Rojo).
    * 11 barrios con cortes programados (`CORTE_PROGRAMADO` - Azul).
    * 59 eventos cronológicos e inmutables en la bitácora pública con descripciones realistas de incidencias y restablecimientos.

### 2.5. Estandarización de Saltos de Línea (CRLF vs LF)
* **Problema Encontrado:** En entornos Windows, Git convertía scripts `.sh` a `CRLF`, provocando fallos `/bin/sh^M: bad interpreter` dentro de contenedores Linux.
* **Corrección:**
  * Se amplió `.gitattributes` para forzar `eol=lf` en todos los archivos de código fuente, scripts, configuraciones y Dockerfiles.

---

## 3. Rediseño y Funcionalidad de "Avisos de tu barrio" (Suscripciones)

* **Fondo Morado en Movimiento:** Se incorporó un efecto dinámico de orbes púrpuras/rosas/índigo fluidos en movimiento continuo (`ModalSuscripcion.css`) con desenfoque gaussiano y glassmorphism (`backdrop-filter: blur(14px)`).
* **Corrección de Dimensiones y Bugs Visuales:** Se eliminó la duplicación de títulos/cabeceras, se rediseñó el contenedor a un ancho óptimo (`max-width: 520px`), se añadieron chips interactivos para los pasos y un buscador rápido de barrios con selector estilo chip/pill y botón para limpiar selección.
* **Envío de Correos Funcional:** Se verificó el flujo completo de doble opt-in: al ingresar el correo y elegir barrios, `POST /api/suscripciones` registra la solicitud y despacha el correo de confirmación a Mailhog (`http://localhost:8025/`).
* **Pantalla de Éxito Modernizada:** Mensaje de confirmación animado con icono `CheckCircle2` y texto personalizado.

---

## 4. Rediseño Integral de Experiencia de Usuario (Diseño Premium Apple Pro)

### 4.1. Centrado Urbano del Mapa y Aislamiento de Territorios Insulares
* **Problema:** Al hacer clic en "Sin servicio", el mapa calculaba el bounding box incluyendo territorios remotos como `ISLA FUERTE` (a 150 km al sur) y `BAYUNCA` (a 30 km al norte), desplazando la cámara al mar Caribe y dejando el casco urbano fuera de vista.
* **Corrección:** Se acotó el encuadre en `MapaCartagena.tsx` estrictamente al núcleo urbano de Cartagena (`10.365 <= lat <= 10.465` y `-75.565 <= lng <= -75.440`), garantizando que al filtrar cualquier estado la cámara se centre de forma nítida en los barrios urbanos.
* **Ocultamiento de etiquetas flotantes:** Los nombres de los barrios ya no saturan la vista; se muestran limpiamente al interactuar o hacer clic sobre el sector.

### 4.2. Rediseño de "Reportar Ahora" y Modal de Incidencias
* Se unificó la vista `/reportar` y el modal interactivo con fondo animado morado/rosa, tarjetas táctiles de selección de estado (Sin Agua 🔴, Presión Baja 🟡, Con Agua 🟢), buscador con autocompletado y validaciones de campo.

### 4.3. Bitácora Pública Ciudadana estilo Apple Bento
* Reemplazo de ilustraciones infantiles por un feed de eventos de alta fidelidad: tarjetas de vidrio oscuro (`backdrop-filter: blur(16px)`), insignias luminosas de estado, marcas temporales relativas (`hace X min`), badges de origen verificado y control segmentado de filtros.

### 4.4. Panel de Estadísticas y Cumplimiento de Horarios
* Tarjetas KPI Bento con conteo dinámico, selector de ventana temporal (Hoy, 7 días, 30 días, Histórico), gráficos Recharts oscuros de alto contraste y cuadrícula de índice de cumplimiento horario por sector.

### 4.5. Centro Operativo y Moderación del Veedor
* **Pantalla de Ingreso:** Tarjeta de autenticación blindada con orbes morados, indicador de seguridad y visor de contraseña.
* **Panel de Control Bento:** Grid responsivo con 4 áreas operativas: moderación de reportes con acciones rápidas (Aprobar/Descartar), gestión de cortes oficiales con cálculo de cumplimiento horario en vivo, registro de nuevos cortes con selector filtrable de barrios, y radar de ingesta automatizada (IA/IoT) con medidor de nivel de confianza.

### 4.6. Integración Unificada del Veedor en la SPA Principal (`/#veedor`)
* **Navegación Fluida sin Salto de Pestaña:** Se eliminó la recarga o cambio de ruta al ingresar a la veeduría; ahora vive al final de la página principal (`/#veedor`), permitiendo transiciones suaves mediante *smooth scroll*.
* **Acceso Condicional Integrado:** Si no hay sesión activa, muestra la tarjeta de acceso con orbes morados fluidos; una vez autenticado, despliega inmediatamente el Centro Operativo Bento completo.

### 4.7. Gráficas Interactivas con Animaciones de Carga y Micro-interacciones
* **Animaciones Tipo Carga (Skeletons):** Barras de carga con gradiente shimmer que se muestran mientras se cargan los datos.
* **Filtros Interactivos de Unidad:** Conmutador en píldora (*pill-switch*) para alternar entre "Cantidad de Cortes" y "% del Total de Afectación".
* **Tooltips Apple Pro:** Cuadros emergentes en vidrio esmerilado con insignias de severidad ("Día con mayor actividad", "Sector más crítico") y cálculo de impacto relativo.
* **Foco Interactivo por Barra:** Posibilidad de hacer clic en cualquier barra para seleccionarla y fijar su detalle visual.

### 4.8. Optimización y Organización de la Vista Móvil / Celulares
* **Navbar Flotante Compacto:** Reorganización de la barra superior en celulares (`<= 768px` y `<= 480px`) con objetivos táctiles de 44px, píldoras reducidas de GooeyNav y botón circular de reporte rápido con megáfono.
* **Hero Map y Tarjetas de Estado sin Scroll Anidado:** En dispositivos móviles, el lienzo del mapa ocupa `34vh` y las 4 tarjetas de estado se reorganizan en una cuadrícula 2x2 compacta y proporcionada, eliminando los desbordamientos y dobles scrolls internos.
* **Bento Grid Responsivo:** Cuadrículas de Bitácora, Estadísticas (KPIs 2x2 en tablet/móvil) y Panel del Veedor (columna única con acciones a todo el ancho) adaptadas a pantallas de 375px a 768px.

### 4.9. Estabilización de Geometría en PC y Refinamiento de Cabecera de Barrios
* **Eliminación de Jitter / Deslizamiento en Redimensionamiento:** Se eliminaron las transiciones de ancho retardadas (`transition: width 460ms`) que competían con el redimensionamiento nativo del navegador, y se ancló rígidamente la geometría de `.panel-mapa-unificado` y `.panel-proyecto`. Al cambiar el tamaño de la ventana en PC, el mapa y los paneles responden de forma inmediata y sólida.
* **Corrección de "¿Cómo está el agua en tu barrio?":** Reducción de la cabecera en pantallas móviles a `0.96rem` con subtítulo ligero, eliminación del hint redundante que robaba espacio vertical y ajuste de las pestañas de selección rápida (*Por estado* / *Por sector*) a `32px`.

### 4.10. Tipografía Apple San Francisco (SF Pro) y Tarjeta Bento Hero Estable
* **Sistema Tipográfico Apple Pro:** Sustitución de tipografías serif antiguas por la pila nativa de Apple: **SF Pro Display** (`--font-display`) para encabezados con interletraje ajustado (`-0.035em`), **SF Pro Text** (`--font-cuerpo`) para lectura clara y **SF Mono** (`--font-util`) para etiquetas técnicas y datos tabulares.
* **Antialiasing y Renderizado Subpíxel:** Activación global de `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility;` con ligaduras contextuales (`cv02`, `cv03`, `cv04`, `cv11`).
* **Tarjeta Bento Hero Estable (PanelProyecto):** Se reemplazó el antiguo bloque SVG interactivo por una **Tarjeta Bento de Vidrio Esmerilado** (`backdrop-filter: blur(24px) saturate(180%)`), con caja de logotipo sólida, distintivo pulsante de veeduría en vivo y botón de suscripción con micro-interacción, fijando su posición y eliminando oscilaciones al redimensionar la ventana.
* **Directivas Anti-Caché en Servidor Nginx:** Se añadieron encabezados `Cache-Control: no-cache, no-store, must-revalidate` para `index.html` y `sw.js`, asegurando que cualquier cambio desplegado se refleje inmediatamente en el navegador del usuario.

---

## 5. Auditoría de Seguridad y Privacidad (Privacy by Design)

1. **Privacidad No-PII:** Cero almacenamiento de cédulas, nombres o teléfonos en reportes ciudadanos.
2. **Autenticación Veedor:** Cifrado de contraseñas con hash **BCrypt** de alto costo y tokens **JWT (HMAC-SHA256)** con expiración estricta a las 8 horas.
3. **Inmunidad a Inyecciones:** Repositorios Spring Data MongoDB tipados y validación estricta con **Jakarta Bean Validation** en todos los endpoints.
4. **Protección Anti-Spam / Fuerza Bruta:** **Redis Rate Limiting** en el inicio de sesión del veedor y en el formulario de reportes ciudadanos.
5. **Bitácora Inmutable (Append-Only):** Registro público y no modificable de incidencias y moderaciones.
6. **Aislamiento en Contenedores:** Procesos de backend ejecutados con usuario sin privilegios `aguavigia:aguavigia`.

---

## 6. Estado de Verificación y Métricas

| Suite de Pruebas | Alcance | Resultado |
| :--- | :--- | :--- |
| **Pruebas Backend (JUnit + Testcontainers)** | Casos de uso, dominio, persistencia, seguridad | ✅ **461 / 461 pasadas (100% verde)** |
| **Arquitectura Limpia (ArchUnit)** | Aislamiento de capas de dominio y puertos | ✅ **5 / 5 reglas cumplidas** |
| **Pruebas Frontend (Vitest)** | Componentes, formularios, hooks y flujos | ✅ **54 / 54 pasadas (100% verde)** |
| **Compilación Frontend (Vite + TypeScript)** | Build de producción optimizado | ✅ **0 errores, 0 warnings (719 ms)** |
| **Envío de Correos (Mailhog)** | `POST /api/suscripciones` -> Servidor SMTP | ✅ **Verificado y recibido en :8025** |
| **Datos en Vivo** | Sectores activos y Bitácora | ✅ **169 Con Servicio, 16 Presión Baja, 15 Sin Servicio, 11 Corte Programado, 59 eventos** |
| **Despliegue Contenedores Docker** | Nginx + Spring Boot + Mongo + Redis + Mailhog | ✅ **5 / 5 contenedores en estado Healthy / Running** |
