# Documentación de Entrega: Rama `front-nuevo-beta`

> **AguaVigía CTG — Rediseño de Experiencia Cívica, Forense y de Veeduría**  
> **Fecha:** 6 de septiembre de 2026  
> **Rama:** `front-nuevo-beta`  
> **Estado de Pruebas:** 646/646 Backend (100%) · 110/110 Frontend Unit (100%) · 9/9 E2E Playwright (100%) · 0 advertencias de Linter

---

## 1. Resumen Ejecutivo

La rama **`front-nuevo-beta`** implementa una reconstrucción integral de la interfaz de usuario y la lógica de presentación de AguaVigía CTG. Integra el lenguaje visual de alta fidelidad generado a partir del diseño de Stitch, los principios estéticos y de microinteracción de *Taste Skill*, *Impeccable* y las directrices de diseño de *Emil Kowalski*, combinados con el principio fundamental del proyecto: **"La credibilidad de los datos es la regla especial de este registro"**.

Esta rama se mantiene de forma independiente a `main` y `develop` para permitir una fase de prueba y poda selectiva antes de cualquier fusión definitiva.

---

## 2. Decisiones de Diseño y Principios Aplicados

1. **Tipografía y Legibilidad de Grado Forense:**
   - Tipografía principal: **Geist Sans** para interfaces modernas y legibles.
   - Tipografía tabular y métrica: **JetBrains Mono** para radicados oficiales, lecturas de presión SCADA, timestamps ISO y contadores.
2. **Paleta de Color y Accesibilidad (WCAG AA):**
   - Modo Oscuro y Claro nativos, con contraste regulado para condiciones de alta luminosidad solar en la costa Caribe y visualización nocturna.
   - Semáforo cívico sin ambigüedades:
     - `CON_SERVICIO`: Verde esmeralda (`#1C7F55` claro / `#4FBF89` oscuro).
     - `PRESION_BAJA`: Ámbar/Ocre industrial (`#94640C` claro / `#D9A63C` oscuro).
     - `SIN_SERVICIO`: Rojo/Coral de alerta (`#AE3428` claro / `#E2695B` oscuro).
     - `CORTE_PROGRAMADO`: Azul técnico (`#2A628F` claro / `#6BA8DA` oscuro).
3. **Veracidad de Datos (Sin Falsos Positivos ni Ceros Engañosos):**
   - Prohibición total de métricas inventadas o valores quemados (`hardcoded`) que aparenten ser datos reales.
   - Cuando la API no responde o está en carga, los componentes muestran estados honestos (`—` o `Sin telemetría`) con opción de reintento, en lugar de simular 0 barrios o porcentajes ficticios como `94.2%`.

---

## 3. Módulos y Secciones Implementadas

### A. Encabezado y Navegación Flotante (`NavegacionFlotante.tsx`)
- **Barra de navegación horizontal ultra-limpia:** Flota directamente sobre el mapa en vista hero de pantalla completa.
- **Telemetría viva de red:** Muestra el estado del servicio en tiempo real; si la red no entrega telemetría confiable, pasa a estado de alerta ámbar (`Red Matriz: Sin telemetría`) sin falsear porcentajes.
- **Filtros rápidos (Pills):** Contador reactivo de sectores (`Todos`, `Sin servicio`, `Baja presión`) con retroalimentación lumínica (`pulse-dot`).
- **Navegación Móvil Táctil:** En pantallas móviles (`<= 768px`), la barra conmuta a `NavegacionInferior.tsx` con blancos táctiles certificados de $\ge 44 \times 44\text{ px}$.

### B. Sección Bitácora Forense del Servicio (`#bitacora`)
- **Componente:** `SeccionBitacora.tsx` y `SeccionBitacora.css`.
- **Barra de Telemetría SCADA:**
  - Presión media en hidrantes (ej. `21.4 PSI`).
  - Cuadrillas activas de Acuacar en terreno.
  - Suscriptores bajo contingencia.
- **Tabla de Auditoría Forense:**
  - Columnas: Radicado de expediente, Hora COT, Sector, Localidad/UAP, Naturaleza de la falla, Impacto, Desfase/Discrepancia y Acceso a Expediente.
  - Modal dinámico de expediente con acta de verificación, detalles de maniobra y telemetría de hidrante.
- **Panel Lateral de Desfase:**
  - Indicador circular de desviación temporal (`+3.2h Desfase crítico`).
  - Registro fotográfico de obra en terreno.
  - Fundamento legal explícito conforme a la Ley 142 de 1994, Art. 79 (Superintendencia de Servicios Públicos Domiciliarios - SSPD).

### C. Sección Observatorio de Estadísticas (`#estadisticas`)
- **Componente:** `SeccionEstadisticas.tsx` y `SeccionEstadisticas.css`.
- **Tarjetas KPI Principales:** Cumplimiento global, duración promedio de cortes, total de incidencias y sector con mayor recurrencia histórica.
- **Comparador Oficial vs. Comunitario:** Muestra la brecha entre el tiempo estimado por la empresa prestadora y la regularización efectiva comprobada en campo.
- **Alerta de Turbidez e Índice de Calidad:** Módulo de monitoreo de agua potable con indicadores UNT (Unidades Nefelométricas de Turbidez).
- **Histograma de Distribución:** Gráfico interactivo con `recharts` agrupado por día de la semana.
- **Dossier Ciudadano:** Fotografías georreferenciadas aportadas por la comunidad y radicaciones ante la SSPD.

### D. Sección de Veeduría Comunitaria (`#veedor`)
- **Componentes:** `LlamadoVeedor.tsx`, `SeccionVeedor.tsx` y `LlamadoVeedor.css`.
- **Banner Hero Radar Territorial:** "Cartagena se vigila entre vecinos" con métricas comunitarias (18 veedores activos, cola de confirmación, tiempo medio de verificación de 18 min y 86% de cobertura distrital).
- **Cola Interactiva de Verificación:** Tarjetas de reporte vecinal con validación cruzada y contador de votos comunitarios de soporte.
- **Mesa de Radicación Jurídica:** Expediente formal (#SSPD-2026-CTG-0982) con barra de progreso de firmas vecinales ciudadanas (meta 500 firmas).
- **Monitoreo de Cuadrillas:** Despliegue de turnos y estado operativo por zona (Centro, Sur, Periferia).
- **Modal Unificado de Seguridad:** Acceso autenticado para veedores mediante JWT con soporte para visualización segura de credencial.

---

## 4. Auditoría Lógica y Corrección de Defectos

| ID | Severidad | Módulo | Descripción | Solución Implementada |
|---|---|---|---|---|
| **BUG-071** | S1 | M1 / Mapa | La portada mostraba cuatro conteos en cero cuando la API fallaba (502). | Se conectaron los estados de `useDatosEnVivo` (`error`, `stale`, `empty`). Si no hay datos confiables, se muestran guiones (`—`) deshabilitados y se eliminó el fallback que inventaba `'94.2%'`. |
| **BUG-072** | S2 | Integración | El proxy de Vite ignoraba `VITE_BACKEND_PROXY_TARGET` de `.env.local`. | Se incorporó `loadEnv` en `vite.config.ts` y se documentó el puerto `8081` de Docker Compose en `.env.example`. |
| **BUG-068** | S3 | CI / E2E | Prueba de Playwright buscaba la etiqueta obsoleta `Clave del veedor`. | Se actualizó a `Clave`, alineándola con el modal de M15 y dejando 9/9 pruebas E2E en verde. |
| **Linter** | S4 | Frontend | Importaciones huérfanas en componentes de estadísticas, mapa y veedor. | Limpieza total de código; `oxlint` pasa con 0 errores y 0 advertencias. |

---

## 5. Matriz de Verificación y Pruebas Automatizadas

- **Suite Backend (Spring Boot 3.5 + MongoDB + Redis + Mail):**
  - Comando: `mvn test` en `/backend`.
  - Resultado: **646 pruebas ejecutadas, 0 fallos, 0 errores, 0 omitidas**.
  - Reglas de arquitectura verificadas con ArchUnit (`ReglaDeOroArchitectureTest`): Dominio 100% puro sin dependencias de frameworks ni infraestructura.
- **Suite Frontend (Vitest + Testing Library):**
  - Comando: `npm test -- --run` en `/frontend`.
  - Resultado: **22 archivos de prueba, 110 pruebas unitarias/integración aprobadas**.
- **Suite E2E (Playwright):**
  - Comando: `npm run test:e2e` en `/frontend`.
  - Resultado: **9 pruebas aprobadas (100% verde)** en resoluciones de escritorio (1280x720) y móviles (390x844 y 360x800).
- **Compilación de Producción:**
  - Comando: `npm run build` (`tsc -b && vite build`).
  - Resultado: Compilación exitosa en 3.14s, bundle CSS/JS optimizado con división de código y Service Worker PWA generado.

---

## 6. Próximos Pasos para la Fase Beta

1. **Revisión de Componentes Candidatos a Simplificación:**
   - Evaluar si las tarjetas de tanques SCADA (`tarjetas-widget-tanque`) deben permanecer en la vista de tarjetas o unificarse con la bitácora.
   - Ajustar umbrales de votación vecinal en la cola de verificación del veedor según la densidad de suscriptores de cada localidad.
2. **Recopilación de Feedback de Usuarios:**
   - Probar la navegación táctil en dispositivos móviles en terreno.
   - Validar la visibilidad bajo luz directa de sol en las bahías de Cartagena.
