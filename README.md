# AguaVigía CTG

**Plataforma ciudadana de monitoreo y trazabilidad del servicio de acueducto en Cartagena de Indias.**

AguaVigía cruza los avisos oficiales con reportes ciudadanos georreferenciados para publicar un **Índice de Cumplimiento** que compara la duración prometida de cada corte con la real.

> Proyecto de aula · Fundación Universitaria Tecnológico Comfenalco
> Tecnología en Desarrollo de Software · Cartagena de Indias D.T. y C. · 2026

**Estado actual:** Backend y Bases de Datos completos salvo RF041 (webhook real de
WhatsApp/Telegram), que depende de credenciales de terceros. **462 pruebas** de backend y **54** de
frontend en verde, con **93.0%** de cobertura en `domain/` y **98.9%** en `application/`. El detalle
requisito por requisito, con el nombre de la prueba que sostiene cada uno, está en la
[matriz de trazabilidad](docs/ingenieria/matriz-trazabilidad.md). Frontend y backend conectados de
punta a punta y verificados en local el 2026-08-12 (`docker compose up -d --build --wait`): mapa,
reportes, bitácora, estadísticas y panel del veedor completo, sin ningún endpoint sin consumir en
ninguna dirección — detalle en
[`frontend/INTEGRACION-BACKEND.md`](frontend/INTEGRACION-BACKEND.md).

📄 **¿Retomas el backend o entras nuevo al proyecto?** Empieza por
[estado-del-backend.md](docs/ingenieria/estado-del-backend.md): qué está hecho, qué falta, qué se
dejó fuera de alcance y las trampas del entorno.

---

## 🏗️ Arquitectura y Stack Tecnológico

El proyecto está construido bajo una estricta **Arquitectura Limpia (Puertos y Adaptadores)**, garantizando que la lógica de dominio (Java puro) esté totalmente aislada de la infraestructura y el framework web. El cumplimiento de las capas arquitectónicas se evalúa automáticamente mediante **ArchUnit**.

- **Backend:** Spring Boot 3.5 · Java 21 · Maven
- **Base de Datos Principal:** MongoDB (Consultas Geoespaciales `2dsphere`)
- **Caché y Seguridad:** Redis (Rate Limiting y Deduplicación)
- **Frontend:** React 19 · Vite · TypeScript · Tailwind · Leaflet
- **Pruebas de Integración:** Testcontainers (Bases de datos efímeras reales)
- **CI/CD & DevOps:** Docker · GitHub Actions (pruebas + ArchUnit, construcción de imágenes, escaneo de secretos y de vulnerabilidades)

---

## 🧩 Módulos del Sistema

| # | Módulo | Descripción |
|---|---|---|
| **M1** | Mapa en vivo | Renderización Geoespacial de los sectores afectados. |
| **M2** | Reporte ciudadano | Formulario de 2 toques sin registro con rate limiting. |
| **M3** | Consenso automático | Cambio de estado de un barrio basado en masa crítica de reportes. |
| **M4** | Alertas por correo | Notificaciones (Doble Opt-In) al cambiar el estado de un barrio. |
| **M5** | Panel del veedor | Backoffice JWT para moderación y registro de cortes. |
| **M6** | Índice de Cumplimiento | Diferencial de tiempo prometido vs real de reparación. |
| **M7** | Estadísticas | Sectores más afectados, cortes por día, duración promedio, evolución del índice mes a mes y exportación en CSV. |
| **M8** | Bitácora pública | Registro cronológico inmutable de todo lo acontecido. |
| **M9** | Ingesta automatizada | Colectores de la API oficial y RSS de prensa, con deduplicación por hash, reintentos y cortacircuitos. La clasificación por IA (RF032-036) se descartó por bloqueo de dependencias (`ADR-025`); queda una heurística por expresiones regulares que **propone** cambios de estado a una cola de revisión del veedor, sin publicar nada por su cuenta (`ADR-028`). |
| **M10** | Evidencia Multimedia | Soporte de capturas fotográficas en reportes. |
| **M11** | Validación Comunitaria | Confirmaciones de un toque para un reporte existente. |
| **M12** | API Abierta Open311 | Estándar internacional para consumo de datos cívicos. |
| **M13** | Integración IoT Pasiva | Telemetría en tiempo real desde sensores de presión locales. |
| **M14** | Alertas Push | La cadena evento → caso de uso → puerto está cableada y probada; el adaptador que llama al proveedor real (RF041) sigue pendiente porque exige credenciales de WhatsApp Business o Telegram. Hoy registra en el log. |
| **M15** | Cuentas y permisos | Cuentas individuales del panel (RF042-RF046). Registro abierto con verificación de correo y aprobación de un administrador, o invitación directa con rol asignado. Roles (ADMIN/VEEDOR/OBSERVADOR) como paquetes de permisos, con ajustes por persona; segundo factor TOTP obligatorio para ADMIN; revocación inmediata de sesiones y bitácora de auditoría. Reemplaza la credencial compartida de `ADR-016` — ver `ADR-039`. |

---

## 🚀 Cómo levantar el entorno local

El proyecto está completamente contenerizado. Solo necesitas tener un motor de **Docker** en ejecución (Ej. Docker Desktop).

1. **Configurar el entorno:**
   ```bash
   cp .env.example .env
   # Si deseas habilitar Webhooks (M14) y envío de correos, configura el .env.
   ```
   El mapa, los reportes y las estadísticas funcionan así, sin nada más. El **panel del
   veedor** (`/veedor`) necesita tres variables que `.env.example` deja vacías a propósito
   (`JWT_SECRET`, `VEEDOR_PASSWORD_HASH`, `ADMIN_INICIAL_CORREO`) — ver
   [`docs/ingenieria/entorno-local.md`](docs/ingenieria/entorno-local.md) para la clave de
   equipo lista para copiar.

   Con la base de datos vacía, al arrancar se crea **una sola cuenta**: el administrador de
   `ADMIN_INICIAL_CORREO`, con la clave cuyo hash está en `VEEDOR_PASSWORD_HASH` (`ADR-039`).
   Esa cuenta es `ADMIN`, y el rol `ADMIN` exige segundo factor: su primera sesión solo sirve
   para escanear el QR y activarlo. A partir de ahí, cada quien tiene su propio correo y clave.

2. **Levantar los servicios:**
   ```bash
   docker compose up -d --wait
   ```
   *Esto levantará MongoDB, Redis, un servidor de correo de pruebas (Mailhog), el backend y el frontend.*

3. **Interactuar con la API (Swagger UI):**
   Una vez que el backend esté arriba, toda la documentación interactiva de los endpoints y modelos de datos estará disponible en:
   👉 `http://localhost:8081/swagger-ui.html` (docker-compose mapea el backend a 8081:8080 en el host)

---

## 🔀 CORS y desarrollo del frontend

No hay configuración de CORS en el backend, y es intencional: `frontend/nginx.conf` sirve el
frontend y hace `proxy_pass /api/ → backend:8080`, así que en el contenedor todo vive bajo el mismo
origen. Si corres el frontend con `vite dev` en vez de Docker, usa el proxy de Vite (no esperes que
el backend responda con cabeceras CORS — no las manda).

---

## 🧪 Pruebas y Aseguramiento de Calidad (QA)

El backend de AguaVigía cuenta con **462 pruebas unitarias y de integración**, y la build falla si la
cobertura de `domain/` o `application/` baja del 85% (RNF017) o si se viola una capa de la
arquitectura (RNF018, ArchUnit).

Para correr la suite de pruebas localmente, asegúrate de tener Docker abierto y ejecuta:

```bash
cd backend
./mvnw clean test
```

Este comando descargará las imágenes temporales de MongoDB y Redis, levantará el ecosistema en entornos efímeros, correrá la suite y se destruirá a sí mismo garantizando cero residuos locales.

---
*Plataforma ciudadana e independiente. No está afiliada a Aguas de Cartagena S.A. E.S.P. ni a ninguna entidad distrital.*
