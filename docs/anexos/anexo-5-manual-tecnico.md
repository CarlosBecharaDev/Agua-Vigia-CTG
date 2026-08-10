# Anexo 5 — Manual Técnico y Plan de Despliegue

Este documento funge como el Manual Técnico de la plataforma Agua-Vigía, destinado a los administradores del sistema, DevOps y futuros mantenedores. Cubre la infraestructura, el ciclo de despliegue y las instrucciones de pruebas E2E.

## 1. Arquitectura de Despliegue

Agua-Vigía está contenerizada utilizando **Docker** para asegurar paridad entre el entorno de desarrollo y producción, encapsulando los siguientes servicios:
- **`ctg-backend`**: Aplicación Spring Boot (Java 21). Expone el API REST en el puerto `8080`.
- **`ctg-frontend`**: SPA construida en React 19 y servida a través de NGINX en el puerto `80`.
- **`mongodb`**: Base de datos NoSQL documental y geoespacial. Puerto `27017`.
- **`redis`**: Almacén clave-valor en memoria utilizado para caché, deduplicación de ingesta y Rate Limiting. Puerto `6379`.

### 1.1 Estructura del Orquestador
El orquestador principal es Docker Compose. Existen dos perfiles de despliegue principales:
- `docker-compose.yml`: Para desarrollo local. Incluye mapeo de volúmenes en caliente y variables de entorno permisivas.
- `docker-compose.prod.yml`: Para producción. Excluye volúmenes de código fuente, refuerza las políticas de reinicio (`restart: always`), y acopla NGINX con compresión GZIP y cabeceras de seguridad.

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
   # Edite el archivo .env e ingrese JWT_SECRET, ANTHROPIC_API_KEY, correo SMTP, etc.
   nano .env
   ```

3. **Construcción y arranque de los contenedores:**
   Se utiliza el flag de orquestación combinado para usar el perfil productivo:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```

4. **Verificación de salud (Healthchecks):**
   Asegúrese de que el backend superó su fase de inicialización:
   ```bash
   curl -s http://localhost:8080/actuator/health | grep '"status":"UP"'
   ```

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
