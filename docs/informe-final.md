# Informe Final de Proyecto: Agua-Vigía

**Fecha de entrega:** 10 de agosto de 2026  
**Autores (Equipo de Desarrollo):**
- Rafael Sarmiento Peña (D1 - Documentación)
- Carlos Bechara Arias (D2 - Backend/Dominio)
- Sebastián Montes Olivera (D3 - Infraestructura/API)
- José Daniel Zambrano (D4 - Frontend)
- Yordy Pardo Pajaro (D5 - DevOps/QA)

---

## 1. Resumen Ejecutivo
Agua-Vigía es una plataforma tecnológica orientada a la veeduría descentralizada y automatizada del servicio de acueducto en la ciudad de Cartagena. Su motivación se fundamenta en los episodios de racionamiento registrados entre mayo y julio de 2026 (a raíz de problemas en la planta El Bosque). La plataforma permite monitorear de forma fidedigna los cortes de agua, cruzar automáticamente los comunicados oficiales con los reportes levantados por la ciudadanía y transparentar a través de un **Índice de Cumplimiento** el comportamiento histórico del operador (Acuacar/Veolia).

## 2. Metodología de Trabajo
El proyecto se ejecutó en una adaptación ágil compuesta por 7 Sprints (Sprint 0 de andamiaje y Sprints 1 a 6 de funcionalidad/documentación). El equipo aplicó políticas de integración rigurosas en GitHub:
- Revisiones cruzadas (Pull Requests) sin fusiones forzadas por encima de compuertas lógicas (C0 a C3).
- Registro estricto (Append-Only) en bitácoras de sesiones (`bitacora-sesiones.md`).
- Histórico transparente de bloqueos, hallazgos de pruebas y deuda técnica explícita.
- Documentación de decisiones (ADRs) ante encrucijadas técnicas importantes.

## 3. Arquitectura y Tecnologías
La plataforma se distribuyó bajo una arquitectura modular y desacoplada:
- **Backend (API):** Java 21, Spring Boot 3.4.1. Fundamentado en patrones estrictos de Arquitectura Limpia (`domain`, `application`, `infrastructure`).
- **Frontend (UI):** React 19, Vite, TypeScript, Tailwind CSS v4. Se aplicó el enfoque de PWA para permitir operabilidad offline parcial y una experiencia de usuario rápida con estilos de glassmorphism.
- **Bases de Datos:** MongoDB (ideal para la persistencia geoespacial de polígonos correspondientes a los 213 barrios) y Redis (implementado para caché veloz, rate limiting de seguridad y manejo de ventanas temporales en el sistema de consenso).
- **Despliegue e Infraestructura:** Entornos encapsulados en imágenes de Docker y orquestados mediante Docker Compose (incluyendo perfiles `dev` y `prod`), y revisión automatizada de CI mediante GitHub Actions.

## 4. Logros y Componentes Finalizados
Con el cierre técnico logrado en el Sprint 5, Agua-Vigía superó la barrera de las 200 pruebas exitosas en backend, consolidando los siguientes frentes:
1. **Mapa Base (M1):** Vista en tiempo real del suministro cruzado con la metadata poblacional (GeoJSON interactivo).
2. **Reportes y Consenso (M2, M3):** API asegurada que captura caídas de servicio reportadas por vecinos, procesadas mediante un modelo de consenso escalable para oficializar las caídas, descartando falsos positivos.
3. **Módulo Veedor e Índice (M5, M6):** Autenticación JWT y sistema de cálculo ponderado de cumplimiento para contrastar los horarios anunciados por la empresa versus el comportamiento real reportado.
4. **Comunicaciones (M4, M8):** Envío de alertas automatizadas por correo y publicación de una bitácora transparente, abierta a auditorías e imposible de alterar retrospectivamente.

## 5. Obstáculos, Desafíos y Bloqueos
- **Ingesta por IA (M9):** Las pruebas con la API de inteligencia artificial para clasificar e ingerir texto crudo de los portales de información se bloquearon (Documentado en `BL-005`) debido a la indisponibilidad de la respectiva API Key (`ANTHROPIC_API_KEY`), aunque el colector y prefiltro determinista se concluyeron con éxito.
- **Documentación Metodológica Institucional:** Al no poder acceder inicialmente al documento maestro de la plantilla del Tecnológico Comfenalco (`BL-003`), la documentación se reconstruyó basada en el estado del repositorio bajo advertencias metodológicas trazables.

## 6. Siguientes Pasos
Concluidos los frentes de ingeniería en el Sprint 5 y completada esta redacción técnica en el Sprint 6, Agua-Vigía se halla en su iteración **Release Candidate 1**. Las tareas recomendadas subsecuentes son:
1. Revisar y amoldar en su totalidad la estructura de `docs/` con el esquema institucional faltante provisto por el docente.
2. Hacer el respectivo despliegue a una instancia remota, encender los *workers* de notificaciones e IA y promover al aplicativo para pilotos cerrados en las comunidades focalizadas.
