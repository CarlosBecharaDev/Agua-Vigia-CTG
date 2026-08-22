# Anexo 5 — Manual Técnico y Plan de Despliegue

Este documento funge como el Manual Técnico de la plataforma Agua-Vigía, destinado a los administradores del sistema, DevOps y futuros mantenedores. Cubre la infraestructura, el ciclo de despliegue y las instrucciones de pruebas E2E.

## 1. Arquitectura de Despliegue

Agua-Vigía está contenerizada utilizando **Docker** para asegurar paridad entre el entorno de desarrollo y producción, encapsulando los siguientes servicios:
- **`ctg-backend`**: Aplicación Spring Boot (Java 21). Expone el API REST en el puerto `8080`.
- **`ctg-frontend`**: SPA construida en React 19 y servida a través de NGINX en el puerto `80`.
- **`mongodb`**: Base de datos NoSQL documental y geoespacial. Puerto `27017`.
- **`redis`**: Almacén clave-valor en memoria utilizado para caché, deduplicación de ingesta y Rate Limiting. Puerto `6379`.

### 1.1 Estructura del Orquestador

El orquestador principal es Docker Compose. Hay **dos archivos completos e independientes**, no un
archivo base con una superposición:

- `docker-compose.yml` — desarrollo local. Publica en el host los puertos de Mongo (`27017`), Redis
  (`6379`), Mailhog (`1025`/`8025`) y el backend (`8081`), para poder inspeccionarlos desde la
  máquina de quien desarrolla. Levanta además Mailhog como SMTP de pruebas.
- `docker-compose.prod.yml` — producción. `restart: always`, exige el `.env`, y **no publica ningún
  puerto de base de datos ni el del backend**: solo el `80` del frontend. Todo el tráfico entra por
  nginx, que es lo que hace fiable el `X-Forwarded-For` del que depende el rate limiting por IP.

> ⚠️ **Los dos archivos no se combinan.** `docker compose -f docker-compose.yml -f
> docker-compose.prod.yml` fusiona las secciones `ports:` de ambos y vuelve a publicar `27017`,
> `6379` y `8081` en producción — con Mongo y Redis sin autenticación y con el backend accesible
> saltándose nginx. Usar **solo** el archivo de producción (ver §3.3).

## 2. Requisitos Previos (Infraestructura)
- Servidor Linux (Ubuntu 22.04 LTS o superior recomendado).
- Mínimo 2 vCPU y 4 GB de memoria RAM (debido al footprint de la JVM).
- Motor de contenedores Docker (v24+) y Docker Compose V2.
- Dominio apuntando a la IP pública del servidor (Ej. `aguavigia.cartagena.gov.co`).

## 3. Instrucciones de Despliegue a Producción

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/CarlosBecharaDev/Agua-Vigia-CTG.git
   cd Agua-Vigia-CTG
   ```

2. **Configuración de variables de entorno:**
   Copie el archivo de ejemplo y provea los valores productivos reales:
   ```bash
   cp .env.example .env
   nano .env
   ```

   El perfil `prod` **aborta el arranque** si falta alguna de estas (ver
   `ValidacionDeSecretosProd`), en vez de levantar un despliegue que se ve sano con el panel del
   veedor respondiendo 503 en silencio:

   | Variable | Para qué | Cómo se obtiene |
   |---|---|---|
   | `JWT_SECRET` | Firma del token del veedor (RNF011). Mínimo 32 bytes | `openssl rand -base64 32` |
   | `VEEDOR_PASSWORD_HASH` | Clave del panel, en BCrypt. Nunca en texto plano | `GenerarHashVeedor` en `backend/src/test/.../infrastructure/security` |
   | `MONGODB_URI`, `REDIS_HOST`, `REDIS_PORT` | Almacenes | Los del `docker-compose.prod.yml` |
   | `MAIL_HOST`, `MAIL_PORT` | SMTP real (M4) | Del proveedor de correo |
   | `COLLECTOR_USER_AGENT` | Identificación del colector (M9) | Correo de contacto real del equipo |

   `IOT_KEY` es opcional: sin ella, `/api/iot/presion` responde 503 y M13 queda deshabilitado.

3. **Construcción y arranque de los contenedores:**
   Solo el archivo de producción — combinarlo con el de desarrollo reexpone las bases de datos
   (ver el aviso de §1.1):
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. **Verificación de salud (Healthchecks):**
   El backend **no publica su puerto** en producción, así que la verificación se hace dentro de la
   red de Docker:
   ```bash
   docker compose -f docker-compose.prod.yml exec backend curl -sf http://localhost:8080/actuator/health
   ```

   Debe responder `{"status":"UP"}`. Si algún colector de la ingesta lleva 3 ciclos seguidos
   fallando, el estado global pasa a `DOWN` (RNF007); el detalle por colector está en
   `GET /api/veedor/ingesta/salud`, que exige el token del veedor.

5. **Comprobación de que no quedó nada expuesto:**
   ```bash
   docker compose -f docker-compose.prod.yml ps --format 'table {{.Service}}\t{{.Ports}}'
   ```

   Solo `frontend` debe mostrar un puerto publicado (`0.0.0.0:80->80/tcp`). Si aparecen `27017`,
   `6379` u `8081`, se arrancó con los dos archivos combinados: bajar y repetir el paso 3.

## 4. Pruebas y Aseguramiento de Calidad (QA)

El proyecto incluye dos suites principales de pruebas para garantizar regresión cero.

### 4.1 Pruebas Unitarias e Integración (Backend)
Ejecutadas con JUnit 5, Mockito y Testcontainers. Validan la lógica del dominio, inmutabilidad de la bitácora y contratos API.
**Comando:**
```bash
cd backend
./mvnw clean test
```
*Nota:* Requiere el motor de Docker encendido en el host para instanciar las bases de datos temporales (Mongo/Redis).

### 4.2 Pruebas E2E / UI (Frontend)
El frontend implementa pruebas de componentes con Vitest y pruebas *End-to-End* con Playwright.
**Comando Vitest (lógica UI):**
```bash
cd frontend
npm run test
```
**Comando Playwright (flujos de usuario completos):**
```bash
npx playwright test
```

## 5. Respaldo y Restauración (Backups)

La base de datos MongoDB está mapeada al volumen `mongodb_data`. Para generar un backup lógico sin detener el servicio:
```bash
docker exec -it ctg-mongodb mongodump --uri="mongodb://localhost:27017/aguavigia" --archive=/data/db/backup_aguavigia.archive
docker cp ctg-mongodb:/data/db/backup_aguavigia.archive ./backups/
```
Para restaurar en caso de desastre:
```bash
docker cp ./backups/backup_aguavigia.archive ctg-mongodb:/data/db/
docker exec -it ctg-mongodb mongorestore --uri="mongodb://localhost:27017/aguavigia" --archive=/data/db/backup_aguavigia.archive --drop
```

## 6. Casos de Prueba (QA Manual)

A continuación se presentan los Casos de Prueba (CP) correspondientes a los Requisitos Funcionales, ejecutados de manera manual o verificados en el CI.

### M1 — Mapa en vivo
| ID | Descripción | Resultado Esperado | Estado |
|---|---|---|---|
| CP001 | Visualizar mapa con colores por estado | Los sectores se renderizan con los colores designados (verde, amarillo, rojo, gris). | ✅ |
| CP002 | Seleccionar sector | Al hacer clic en un sector, se muestra un tooltip con su estado y detalles. | ✅ |
| CP003 | Ver antigüedad de dato | El tooltip muestra la etiqueta de frescura (hace X minutos). | ✅ |
| CP004 | Usar lista textual | La vista alternativa muestra todos los sectores en una lista ordenada y accesible. | ✅ |

### M2 — Reporte ciudadano
| ID | Descripción | Resultado Esperado | Estado |
|---|---|---|---|
| CP005 | Enviar reporte sin cuenta | El usuario puede reportar el estado de un sector sin login previo, recibiendo confirmación. | ✅ |
| CP006 | Límite por dispositivo | Al enviar múltiples reportes rápidos, el sistema responde 429 Too Many Requests. | ✅ |
| CP007 | Inferencia por coordenada | Al aceptar geolocalización, el sistema detecta el sector actual del usuario. | ✅ |
| CP008 | Reporte ágil | El usuario completa el flujo en máximo dos clics desde el mapa. | ✅ |

### M3 — Consenso automático
| ID | Descripción | Resultado Esperado | Estado |
|---|---|---|---|
| CP009 | Cambio por umbral | Al llegar a N reportes coincidentes, el sector cambia de estado. | ✅ |
| CP010 | Cambio de estrategia | Modificar configuración permite variar entre umbral fijo o porcentual. | ✅ |
| CP011 | Trazabilidad de reportes | El evento de bitácora asocia los IDs de los reportes que desencadenaron el cambio. | ✅ |

### M4 — Alertas por correo
| ID | Descripción | Resultado Esperado | Estado |
|---|---|---|---|
| CP012 | Suscribirse a sector | Al ingresar el correo, se envía un mensaje con token de validación. | ✅ |
| CP013 | Confirmación doble opt-in | Al hacer clic en el token, la suscripción pasa a activa. | ✅ |
| CP014 | Notificación de corte | Un cambio de estado de servicio activa el envío asíncrono de un correo al suscriptor. | ✅ |
| CP015 | Baja sin credenciales | El enlace en el footer del correo desactiva la suscripción inmediatamente. | ✅ |

### M5 — Panel del veedor
| ID | Descripción | Resultado Esperado | Estado |
|---|---|---|---|
| CP016 | Registrar corte oficial | El veedor logueado puede registrar un corte con inicio, fin prometido y causa. | ✅ |
| CP017 | Cerrar corte oficial | El veedor puede marcar la hora real de restablecimiento de un corte activo. | ✅ |
| CP018 | Moderar reportes | Los reportes ciudadanos en estado PENDIENTE pueden ser APROBADOS o DESCARTADOS. | ✅ |
| CP019 | Proteger panel | Intentar acceder sin token (o con token expirado) redirige al login o devuelve 401. | ✅ |

### M6 — Índice de Cumplimiento
| ID | Descripción | Resultado Esperado | Estado |
|---|---|---|---|
| CP020 | Cálculo de desviación | El sistema calcula correctamente la diferencia entre fin prometido y fin real de los cortes cerrados. | ✅ |
| CP021 | Índice global | La API retorna el promedio de cumplimiento global para la ciudad. | ✅ |
| CP022 | UI del índice | El frontend muestra explícitamente el tiempo prometido vs. el real en gráficas. | ✅ |

### M7 — Estadísticas
| ID | Descripción | Resultado Esperado | Estado |
|---|---|---|---|
| CP023 | Sectores más afectados | El dashboard muestra los sectores con mayor tiempo acumulado sin servicio. | ✅ |
| CP024 | Evolución temporal | Se presenta una gráfica histórica del índice de cumplimiento mes a mes. | ✅ |
| CP025 | Exportar CSV | El botón de exportación genera un archivo CSV válido con la data actual del dashboard. | ✅ |

### M8 — Bitácora pública
| ID | Descripción | Resultado Esperado | Estado |
|---|---|---|---|
| CP026 | Registro inmutable | Cada cambio de estado genera un evento visible en la bitácora cronológica. | ✅ |
| CP027 | Acceso público | La página de bitácora carga los eventos correctamente sin requerir sesión activa. | ✅ |
| CP028 | Ausencia de edición | No existe endpoint (ni UI) para modificar un evento de bitácora una vez guardado. | ✅ |

### M9 — Ingesta automática (Heurística determinista)
| ID | Descripción | Resultado Esperado | Estado |
|---|---|---|---|
| CP029 | API Acuacar | El colector extrae correctamente los boletines desde el origen oficial (WordPress). | ✅ |
| CP030 | RSS Prensa | El colector procesa el RSS de agregadores (Google News). | ✅ |
| CP031 | Deduplicación | Un aviso que ingresa dos veces es descartado por el filtro SHA-256 en Redis. | ✅ |

> **Nota:** CP032 a CP036 fueron descartados (Fuera de Alcance) por la eliminación de la integración con Anthropic SDK en el Módulo 9.

### M10 — Evidencia Multimedia (Fase 2)
| ID | Descripción | Resultado Esperado | Estado |
|---|---|---|---|
| CP037 | Adjuntar fotografía | Al enviar una imagen JPG/PNG al reporte, la API guarda la evidencia y responde con la URL generada. | ✅ |

### M11 — Validación Comunitaria Rápida (Fase 2)
| ID | Descripción | Resultado Esperado | Estado |
|---|---|---|---|
| CP038 | Confirmar con un clic | Al pulsar en validar, se incrementa el contador de confirmaciones para el reporte, sin necesidad de formularios. | ✅ |

### M12 — API Abierta Open311 (Fase 2)
| ID | Descripción | Resultado Esperado | Estado |
|---|---|---|---|
| CP039 | Exposición Open311 | La petición a `/api/v2/requests.json` retorna los reportes de agua formateados según el estándar cívico internacional. | ✅ |

### M13 — Integración IoT Pasiva (Fase 2)
| ID | Descripción | Resultado Esperado | Estado |
|---|---|---|---|
| CP040 | Alerta de presión IoT | Al recibir telemetría con `presionPsi < 15.0` y un API Key válido, se genera automáticamente un reporte de PRESION_BAJA. | ✅ |

### M14 — Alertas Push Instantáneas (Fase 2)
| ID | Descripción | Resultado Esperado | Estado |
|---|---|---|---|
| CP041 | Notificación Push | Al confirmarse un corte de agua, el sistema despacha una petición al webhook configurado para notificar a los suscriptores vía Telegram/WhatsApp. | ✅ |
