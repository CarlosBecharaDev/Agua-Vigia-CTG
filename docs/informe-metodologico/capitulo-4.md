> ESTRUCTURA SIN VALIDAR CONTRA LA PLANTILLA OFICIAL

# Capítulo IV — Resultados

Este capítulo presenta los resultados obtenidos tras la ejecución de los cinco primeros sprints de desarrollo del proyecto Agua-Vigía, estructurados según los objetivos específicos, las métricas del sistema, el análisis de las metodologías empleadas y las lecciones aprendidas.

## 4.1 Resultados por objetivo específico

1. **Desarrollar un mapa interactivo para la visualización en tiempo real del estado del servicio de acueducto (M1).**
   Se implementó exitosamente el componente `MapaCartagena` utilizando Leaflet y el GeoJSON oficial de los 213 barrios de Cartagena. El mapa refleja en vivo el estado del servicio, consumiendo la API construida en el backend (`GET /api/sectores`). 

2. **Implementar un mecanismo de reporte ciudadano y consenso automatizado (M2 y M3).**
   Se desarrolló el formulario de reporte de cortes (`POST /api/reportes`), incluyendo una huella anónima generada criptográficamente (SHA-256) y límite de peticiones HTTP (Rate Limiting) para mitigar el spam. El servicio de consenso (`EvaluarConsensoService`) evalúa los reportes recientes empleando el patrón *Strategy* y, al superar el umbral, confirma de manera automática el corte, registrando el cambio en la bitácora pública sin necesidad de intervención de un moderador humano.

3. **Construir el Índice de Cumplimiento (M6) y módulo de estadísticas (M7).**
   Se implementó el motor de cálculo (`CalcularCumplimientoService`) que suma las duraciones de los cortes oficiales anunciados y las contrasta con las interrupciones reales experimentadas. Adicionalmente, en el Sprint 5 se finalizó la integración de tuberías de agregación (Pipelines de Mongo) para extraer los sectores más afectados y las fechas pico.

4. **Incorporar IA para la ingesta de avisos oficiales (M9).**
   Se construyó con éxito el pipeline de ingesta técnica, que abarca la normalización, un colector API y un prefiltro determinista capaz de descartar avisos irrelevantes sin incurrir en costos de procesamiento. La integración final con el LLM de Anthropic (Claude) quedó preparada y estructurada, pausada únicamente a la espera de un token de API productivo (`BL-005`).

## 4.2 Métricas del sistema y cobertura

Al cierre del Sprint 5, la plataforma alcanzó un estado maduro y un grado de completitud funcional destacado:
- **Cobertura de requisitos:** Se cubrieron los módulos funcionales del M1 al M8 casi en su totalidad. La cobertura certificada de requerimientos subió notoriamente por encima del 78% (reportado a mediados del Sprint 1), finalizando exitosamente componentes críticos como el envío asíncrono de correos (M4) y el dashboard de analítica de datos (M7).
- **Calidad de software:** El código cuenta con robustez comprobada, superando holgadamente las 200 pruebas unitarias y de integración en verde, incluyendo validaciones estrictas de diseño de dominio (`ArchUnit`) y elevando de forma consistente la cobertura del código (JaCoCo).
- **Despliegue (DevOps):** Todo el sistema quedó encapsulado en un `docker-compose.prod.yml` que facilita su puesta en producción como contenedores independientes de forma aislada y segura.

## 4.3 Análisis y lecciones aprendidas

Durante el reconocimiento inicial de fuentes de datos, se cometió el error de asumir (sin revisión empírica) que el portal web oficial de la empresa prestadora prohibía la extracción automatizada mediante su archivo `robots.txt`. Esta afirmación, que condicionó algunas decisiones arquitectónicas iniciales, resultó ser **falsa** tras la respectiva auditoría real de la URL. 

El equipo acordó dejar esta corrección documentada en la memoria persistente del sistema (`ADR-004` y `MEMORY.md`), internalizando una valiosa lección académica y profesional: **una corrección fundamentada, probada y documentada tiene un valor enormemente superior a sostener una certeza inventada**. En concordancia, se acataron de manera estricta los bloqueos legítimos a rastreadores de IA presentes en medios locales (El Tiempo, El Heraldo, etc.).

## 4.4 Conclusiones

Agua-Vigía ha demostrado la viabilidad técnica de articular un sistema de veeduría ciudadana empleando cartografía digital precisa cruzada con inteligencia colectiva en tiempo real. La adopción estricta de una Arquitectura Limpia facilitó el trabajo asíncrono y en paralelo de todos los frentes, minimizando sobremanera los conflictos técnicos. La interfaz (Frontend), diseñada con principios de experiencia moderna (React, Vite, PWA, glassmorphism), permite una participación inclusiva y sin fricciones.

## 4.5 Recomendaciones

- **Suministro de Credenciales:** Es vital proveer al entorno de producción de la clave `ANTHROPIC_API_KEY` para encender la validación semántica del módulo de IA, y configurar debidamente un proveedor de correo oficial (SMTP) para la capa de notificaciones.
- **Validación en campo (Piloto):** Someter el aplicativo (ya en etapa de Release Candidate) a pruebas de estrés con actores comunitarios de Cartagena y Juntas de Acción Local, de cara a perfeccionar en la práctica los umbrales del algoritmo de consenso ciudadano.
