# Anexo 3 — Arquitectura Técnica

Este anexo describe las decisiones de diseño arquitectónico y las tecnologías elegidas para Agua-Vigía, garantizando la escalabilidad, mantenibilidad y resiliencia del sistema de veeduría.

## 1. Arquitectura del Backend

El backend está construido bajo el paradigma de **Arquitectura Limpia (Clean Architecture)** implementado en Java 21 y Spring Boot 3.4.1.

### 1.1 Capas Arquitectónicas
- **Domain (Dominio):** Contiene la lógica core del negocio, entidades inmutables (ej. `CorteAgua`, `Sector`) y los puertos (interfaces) de entrada y salida. Es independiente de cualquier framework, incluyendo Spring y dependencias externas de bases de datos.
- **Application (Aplicación):** Contiene los Casos de Uso (servicios) que orquestan el flujo de datos entre los puertos de entrada y los puertos de salida, ejecutando reglas de negocio complejas como el motor de `Consenso`.
- **Infrastructure (Infraestructura):** Implementa los puertos definidos en el dominio (Adaptadores). Aquí residen los controladores REST, repositorios de MongoDB, clientes HTTP de recolección (Acuacar/Veolia) y mecanismos de seguridad (JWT).

## 2. Bases de Datos y Caché

### 2.1 MongoDB (Persistencia Principal)
Elegida por su capacidad nativa para manejar estructuras GeoJSON (Polígonos y MultiPolígonos) vitales para el mapeo de los 213 barrios y sectores de Cartagena. Maneja también el registro *append-only* de eventos (Bitácora) de forma eficiente.

### 2.2 Redis (Caché y Eficiencia Temporal)
Redis se utiliza como almacenamiento en memoria para acelerar consultas recurrentes y manejar reglas de negocio efímeras:
- **Rate Limiting:** Prevención de saturación de reportes desde la misma IP o usuario, vital para la integridad del consenso.
- **Deduplicación:** Evita el procesamiento repetitivo de boletines de prensa oficiales, utilizando hashes SHA-256 de los contenidos ingeridos.
- **Ventana de Consenso:** Mantiene en memoria el contador temporal de reportes de cortes antes de materializarlos en la base de datos principal de MongoDB.

## 3. Arquitectura del Frontend

El cliente web (SPA) está desarrollado en **React 19** utilizando Vite como empaquetador. Su diseño está orientado a la máxima usabilidad bajo estrés (cortes de servicio).

- **Gestión de Estado:** Manejado con React Query (TanStack Query) para el estado del servidor, garantizando sincronización en tiempo real y reintentos (retries) en caso de fallos de red.
- **Geolocalización:** Integración con Leaflet.js para el renderizado del mapa base de los sectores.
- **Diseño Responsovo y Accesible:** Implementado puramente en CSS vainilla y variables CSS modernas (Tailwind CSS desactivado a favor de CSS nativo escalable), ofreciendo un sistema de diseño *glassmorphism* avanzado.

## 4. Orquestación y CI/CD

El despliegue local y en producción de estos componentes se administra mediante **Docker Compose**. La arquitectura permite escalar horizontalmente los contenedores del backend detrás de un balanceador de carga o un *Ingress Controller* en caso de migrarse a Kubernetes a futuro, gracias al manejo apátrida (stateless) de las sesiones a través de JWT firmados asimétricamente.

El ciclo de desarrollo está respaldado por **GitHub Actions**, ejecutando comprobaciones de estilo (Oxlint para UI) y la compilación completa con tests automatizados para el backend (Maven + Testcontainers).
